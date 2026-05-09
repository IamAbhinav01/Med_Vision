"""
Stage 3 — Universal Disease Classifier
EfficientNet-B4 backbone with a task-specific routing head.
Supports multilabel (chest X-ray) and multiclass (brain MRI, etc.) tasks.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import timm
import numpy as np
from PIL import Image
import albumentations as A
from albumentations.pytorch import ToTensorV2

# ── Disease labels per routing key ───────────────────────────────────────────
# Class counts match the trained model heads exactly.
DISEASE_LABELS: dict[str, list[str]] = {
    # xray_chest  → 14 classes (CheXpert/NIH-style multilabel)
    "xray_chest": [
        "No Finding",
        "Atelectasis",
        "Cardiomegaly",
        "Consolidation",
        "Edema",
        "Enlarged Cardiomediastinum",
        "Fracture",
        "Lung Lesion",
        "Lung Opacity",
        "Pleural Effusion",
        "Pleural Other",
        "Pneumonia",
        "Pneumothorax",
        "Support Devices",
    ],
    # mri_brain → 4 classes
    "mri_brain": [
        "Normal",
        "Glioma",
        "Meningioma",
        "Pituitary Adenoma",
    ],
    # ct_chest → 2 classes
    "ct_chest": [
        "Normal",
        "Abnormal",
    ],
    # us_breast → 3 classes
    "us_breast": [
        "Normal",
        "Benign",
        "Malignant",
    ],
    # mri_spine → 3 classes
    "mri_spine": [
        "Normal",
        "Disc Herniation",
        "Spinal Stenosis",
    ],
    # xray_knee → 5 classes (KL grading 0-4)
    "xray_knee": [
        "KL Grade 0 (Normal)",
        "KL Grade 1 (Doubtful)",
        "KL Grade 2 (Mild)",
        "KL Grade 3 (Moderate)",
        "KL Grade 4 (Severe)",
    ],
    # fundus_eye → 5 classes (diabetic retinopathy)
    "fundus_eye": [
        "No DR",
        "Mild DR",
        "Moderate DR",
        "Severe DR",
        "Proliferative DR",
    ],
}

# Task type per routing key
TASK_TYPE: dict[str, str] = {
    "xray_chest" : "multilabel",   # sigmoid per class
    "mri_brain"  : "multiclass",
    "ct_chest"   : "multiclass",
    "us_breast"  : "multiclass",
    "mri_spine"  : "multiclass",
    "xray_knee"  : "multiclass",
    "fundus_eye" : "multiclass",
}

# Albumentations transform (matches training)
_transform = A.Compose(
    [
        A.Resize(224, 224),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ]
)


class UniversalDiseaseClassifier(nn.Module):
    """
    EfficientNet-B4 backbone with per-routing-key heads.

    Head architecture (reconstructed from saved weights):
        Linear(1792, 256)  → BatchNorm1d(256)  → ReLU  → Dropout  → Linear(256, n)
    """

    def __init__(self):
        super().__init__()
        self.backbone = timm.create_model(
            "efficientnet_b4", pretrained=False, num_classes=0
        )
        # Per-task heads — architecture must match trained checkpoint exactly
        self.heads = nn.ModuleDict(
            {
                key: nn.Sequential(
                    nn.Linear(1792, 256),        # 0
                    nn.BatchNorm1d(256),         # 1
                    nn.ReLU(),                   # 2
                    nn.Dropout(0.3),             # 3
                    nn.Linear(256, len(labels)), # 4
                )
                for key, labels in DISEASE_LABELS.items()
            }
        )

    def forward(self, x: torch.Tensor, routing_key: str) -> torch.Tensor:
        features = self.backbone(x)
        return self.heads[routing_key](features)


def load_disease_classifier(
    weights_path: str, device: torch.device
) -> UniversalDiseaseClassifier:
    model = UniversalDiseaseClassifier().to(device)
    state = torch.load(weights_path, map_location=device)
    model.load_state_dict(state)
    model.eval()
    return model


def run_disease_classifier(
    image: Image.Image,
    routing_key: str,
    model: UniversalDiseaseClassifier,
    device: torch.device,
) -> dict:
    """
    Returns dict:
        valid, diagnosis, confidence, severity, pred_idx, all_probs, task_type
    """
    if routing_key not in DISEASE_LABELS:
        return {
            "valid"   : False,
            "error"   : f"Routing key '{routing_key}' is not supported.",
            "supported": list(DISEASE_LABELS.keys()),
        }

    diseases  = DISEASE_LABELS[routing_key]
    task_type = TASK_TYPE[routing_key]

    img_np = np.array(image.convert("RGB"))
    tensor = _transform(image=img_np)["image"].unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(tensor, routing_key)
        if task_type == "multilabel":
            probs    = torch.sigmoid(logits)[0].cpu().numpy()
        else:
            probs    = F.softmax(logits, dim=1)[0].cpu().numpy()

    pred_idx   = int(np.argmax(probs))
    confidence = round(float(probs[pred_idx]) * 100, 1)

    severity = (
        "HIGH"     if probs[pred_idx] > 0.80 else
        "MODERATE" if probs[pred_idx] > 0.60 else
        "LOW"
    )

    all_probs = {
        diseases[i]: round(float(probs[i]) * 100, 1)
        for i in range(len(diseases))
    }

    return {
        "valid"      : True,
        "diagnosis"  : diseases[pred_idx],
        "confidence" : confidence,
        "severity"   : severity,
        "pred_idx"   : pred_idx,
        "all_probs"  : all_probs,
        "task_type"  : task_type,
        "routing_key": routing_key,
    }
