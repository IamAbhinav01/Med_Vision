"""
Stage 2 — Body Part Detector
EfficientNet-B3 backbone trained to classify 8 anatomical regions.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import timm
import numpy as np
from PIL import Image
import albumentations as A
from albumentations.pytorch import ToTensorV2

BODY_PARTS = [
    "chest",    # 0
    "brain",    # 1
    "abdomen",  # 2
    "spine",    # 3
    "knee",     # 4
    "breast",   # 5
    "hand",     # 6
    "eye",      # 7
]

# Transform must exactly match training
_transform = A.Compose(
    [
        A.Resize(224, 224),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ]
)


class BodyPartDetector(nn.Module):
    def __init__(self, num_classes: int = 8):
        super().__init__()
        self.backbone = timm.create_model(
            "efficientnet_b3", pretrained=False, num_classes=0, drop_rate=0.3
        )
        self.head = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(1536, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(512, 8),
        )

    def forward(self, x):
        return self.head(self.backbone(x))


def load_body_part_detector(
    weights_path: str, device: torch.device
) -> BodyPartDetector:
    model = BodyPartDetector(num_classes=8).to(device)
    model.load_state_dict(torch.load(weights_path, map_location=device))
    model.eval()
    return model


def run_body_part_detector(
    image: Image.Image,
    model: BodyPartDetector,
    device: torch.device,
    confidence_threshold: float = 0.65,
) -> dict:
    """Return dict with keys: valid, body_part, confidence, all_probs, error (optional)."""
    img_np = np.array(image.convert("RGB"))
    tensor = _transform(image=img_np)["image"].unsqueeze(0).to(device)

    with torch.no_grad():
        probs = F.softmax(model(tensor), dim=1)[0]
        conf, idx = probs.max(dim=0)

    predicted = BODY_PARTS[idx.item()]
    conf_val = conf.item()

    all_probs = {
        BODY_PARTS[i]: round(probs[i].item() * 100, 1)
        for i in range(len(BODY_PARTS))
    }

    if conf_val < confidence_threshold:
        return {
            "valid": False,
            "body_part": predicted,
            "confidence": round(conf_val * 100, 1),
            "all_probs": all_probs,
            "error": f"Confidence too low: {conf_val * 100:.1f}%",
        }

    return {
        "valid": True,
        "body_part": predicted,
        "confidence": round(conf_val * 100, 1),
        "all_probs": all_probs,
    }
