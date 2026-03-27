"""
Stage 1 — Scan Type Detector
EfficientNet-B4 backbone trained to classify 6 modalities.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import timm
from torchvision import transforms
from PIL import Image

SCAN_LABELS = [
    "chest_xray",
    "brain_mri",
    "ct_scan",
    "ultrasound",
    "pet",
    "NOT_MEDICAL",
]

MODALITY_SHORT = {
    "chest_xray": "xray",
    "brain_mri": "mri",
    "ct_scan": "ct",
    "ultrasound": "us",
    "pet": "pet",
}

# Transform must exactly match training
_transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ]
)


class ScanTypeDetector(nn.Module):
    def __init__(self, num_classes: int = 6):
        super().__init__()
        self.backbone = timm.create_model(
            "efficientnet_b4", pretrained=False, num_classes=0
        )
        self.head = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(1792, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        return self.head(self.backbone(x))


def load_scan_detector(weights_path: str, device: torch.device) -> ScanTypeDetector:
    model = ScanTypeDetector(num_classes=6).to(device)
    model.load_state_dict(torch.load(weights_path, map_location=device))
    model.eval()
    return model


def run_scan_detector(
    image: Image.Image,
    model: ScanTypeDetector,
    device: torch.device,
    confidence_threshold: float = 0.40,
) -> dict:
    """Return dict with keys: valid, modality, confidence, all_probs, error (optional)."""
    # Use standard RGB conversion (more consistent with EfficientNet training)
    img_rgb = image.convert("RGB")
    tensor = _transform(img_rgb).unsqueeze(0).to(device)
    
    with torch.no_grad():
        logits = model(tensor)
        probs = F.softmax(logits, dim=1)[0]
        conf, idx = probs.max(dim=0)

    label = SCAN_LABELS[idx.item()]
    conf_val = conf.item()
    
    # Return all probabilities for debugging
    all_probs = {
        SCAN_LABELS[i]: round(probs[i].item() * 100, 1)
        for i in range(len(SCAN_LABELS))
    }

    if label == "NOT_MEDICAL":
        return {
            "valid": False,
            "modality": "Not Medical",
            "confidence": round(conf_val * 100, 1),
            "all_probs": all_probs,
            "error": "Not a medical scan image"
        }

    if conf_val < confidence_threshold:
        return {
            "valid": False,
            "modality": label,
            "confidence": round(conf_val * 100, 1),
            "all_probs": all_probs,
            "error": f"Cannot reliably identify scan type — {conf_val * 100:.1f}%",
        }

    return {
        "valid": True,
        "modality": label,
        "modality_short": MODALITY_SHORT.get(label, label),
        "confidence": round(conf_val * 100, 1),
        "all_probs": all_probs,
    }
