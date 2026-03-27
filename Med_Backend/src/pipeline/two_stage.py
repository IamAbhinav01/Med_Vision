"""
Two-stage pipeline orchestrator.
Loads both models once at startup and exposes run_two_stage().
"""

import os
import torch
from PIL import Image

from src.models.scan_detector import load_scan_detector, run_scan_detector
from src.models.body_part_detector import load_body_part_detector, run_body_part_detector

# ── Resolve model weights relative to project root ───────────────────────────
_BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCAN_WEIGHTS = os.path.join(_BASE, "Models__Trained", "scan_detector_best.pth")
BODY_WEIGHTS = os.path.join(_BASE, "Models__Trained", "body_part_detector_best.pth")

# ── Device selection ──────────────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── Global model instances (loaded once) ─────────────────────────────────────
_scan_model = None
_body_model = None


def get_models():
    global _scan_model, _body_model
    if _scan_model is None:
        print(f"[Pipeline] Loading scan detector from {SCAN_WEIGHTS} ...")
        _scan_model = load_scan_detector(SCAN_WEIGHTS, device)
        print("[Pipeline] Scan detector loaded.")
    if _body_model is None:
        print(f"[Pipeline] Loading body-part detector from {BODY_WEIGHTS} ...")
        _body_model = load_body_part_detector(BODY_WEIGHTS, device)
        print("[Pipeline] Body-part detector loaded.")
    return _scan_model, _body_model


def run_two_stage(image: Image.Image) -> dict:
    """
    Run the two-stage pipeline on a PIL image.

    Returns:
        {
            "stage1_modality": str,
            "stage1_confidence": float,
            "stage2_body_part": str | None,
            "stage2_confidence": float | None,
            "stage2_all_probs": dict | None,
            "routing_key": str,
            "ready_for_stage3": bool,
            "error": str | None
        }
    """
    scan_model, body_model = get_models()

    # ── Stage 1 ───────────────────────────────────────────────────────────────
    s1 = run_scan_detector(image, scan_model, device)
    if not s1["valid"] and "modality" not in s1:
        # This handles cases where modality detection completely failed (e.g. no medical scan)
        return {"error": s1.get("error", "Stage 1 failed")}

    # ── Stage 2 ───────────────────────────────────────────────────────────────
    s2 = run_body_part_detector(image, body_model, device)

    routing_key = f"{s1['modality_short'] if 'modality_short' in s1 else 'unknown'}_{s2.get('body_part', 'unknown')}"

    return {
        "stage1_modality": s1.get("modality"),
        "stage1_confidence": s1.get("confidence"),
        "stage1_all_probs": s1.get("all_probs"),
        "stage2_body_part": s2.get("body_part"),
        "stage2_confidence": s2.get("confidence"),
        "stage2_all_probs": s2.get("all_probs"),
        "routing_key": routing_key,
        "ready_for_stage3": s1.get("valid", False) and s2.get("valid", False),
        "error": s1.get("error") if not s1.get("valid") else (s2.get("error") if not s2.get("valid") else None),
    }
