"""
GradCAM for EfficientNet-B4 (UniversalDiseaseClassifier).
Hooks into the last convolutional block to generate attention heatmaps.
"""

import io
import base64
import numpy as np
import cv2
import torch
import albumentations as A
from albumentations.pytorch import ToTensorV2
from PIL import Image

from src.models.disease_classifier import (
    UniversalDiseaseClassifier,
    DISEASE_LABELS,
    TASK_TYPE,
)

_transform = A.Compose(
    [
        A.Resize(224, 224),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ]
)


class GradCAM:
    """Gradient-weighted Class Activation Mapping for EfficientNet-B4."""

    def __init__(self, model: UniversalDiseaseClassifier):
        self.model      = model
        self.gradients  = None
        self.activations= None

        # Hook the last block of the EfficientNet backbone
        target = model.backbone.blocks[-1]
        target.register_forward_hook(
            lambda m, i, o: setattr(self, "activations", o.detach())
        )
        target.register_full_backward_hook(
            lambda m, gi, go: setattr(self, "gradients", go[0].detach())
        )

    def generate(
        self,
        tensor: torch.Tensor,
        routing_key: str,
        class_idx: int,
    ) -> np.ndarray:
        """Return a (224, 224) float32 CAM array in [0, 1]."""
        self.model.eval()
        logits = self.model(tensor, routing_key)
        self.model.zero_grad()
        logits[0, class_idx].backward()

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam     = torch.relu((weights * self.activations).sum(dim=1)).squeeze()

        cam = cam.cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cv2.resize(cam, (224, 224))


def overlay_heatmap(
    img_array: np.ndarray,
    cam: np.ndarray,
    alpha: float = 0.40,
) -> np.ndarray:
    """Blend the original image with a JET heatmap."""
    img     = cv2.resize(img_array, (224, 224))
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    overlay = (img * (1 - alpha) + heatmap * alpha).astype(np.uint8)
    return overlay


def ndarray_to_base64_png(arr: np.ndarray) -> str:
    """Encode an RGB uint8 numpy array as a base64 PNG data URI."""
    pil = Image.fromarray(arr.astype(np.uint8))
    buf = io.BytesIO()
    pil.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{b64}"


def run_gradcam(
    image: Image.Image,
    routing_key: str,
    pred_idx: int,
    model: UniversalDiseaseClassifier,
    device: torch.device,
) -> dict:
    """
    Run GradCAM on *image* for the given routing key and predicted class.

    Returns:
        heatmap_b64   — base64 PNG data-URI (overlay image)
        cam_b64       — base64 PNG data-URI (raw CAM greyscale)
    """
    orig_np = np.array(image.convert("RGB"))

    tensor = _transform(image=orig_np)["image"].unsqueeze(0).to(device)
    tensor.requires_grad_(True)

    gradcam = GradCAM(model)
    cam     = gradcam.generate(tensor, routing_key, pred_idx)

    overlay  = overlay_heatmap(orig_np, cam)
    orig_224 = cv2.resize(orig_np, (224, 224))

    return {
        "heatmap_b64": ndarray_to_base64_png(overlay),
        "original_b64": ndarray_to_base64_png(orig_224),
    }
