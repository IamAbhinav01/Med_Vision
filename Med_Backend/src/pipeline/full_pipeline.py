"""
Full 3-stage pipeline orchestrator.

  Stage 1 — Scan type detection (EfficientNet-B4, 6 classes)
  Stage 2 — Body part detection (EfficientNet-B3, 8 classes)
  Stage 3 — Disease classification (EfficientNet-B4, per-routing-key)
  +  GradCAM attention heatmap
  +  NLP: symptom extraction, report generation, summarization
"""

import os
import torch
from PIL import Image

from src.models.scan_detector       import load_scan_detector,        run_scan_detector
from src.models.body_part_detector  import load_body_part_detector,   run_body_part_detector
from src.models.disease_classifier  import (
    load_disease_classifier, run_disease_classifier, DISEASE_LABELS
)
from src.pipeline.gradcam           import run_gradcam
from src.pipeline.nlp_pipeline      import (
    extract_symptoms, generate_report, summarize_report
)

# ── Resolve weights relative to project root ──────────────────────────────────
_BASE           = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCAN_WEIGHTS    = os.path.join(_BASE, "Models__Trained", "scan_detector_best.pth")
BODY_WEIGHTS    = os.path.join(_BASE, "Models__Trained", "body_part_detector_best.pth")
DISEASE_WEIGHTS = os.path.join(_BASE, "Models__Trained", "disease_classifier_best.pth")

# ── Modality short-name map ───────────────────────────────────────────────────
MODALITY_MAP = {
    "chest_xray": "xray",
    "brain_mri" : "mri",
    "ct_scan"   : "ct",
    "ultrasound": "us",
    "pet"       : "pet",
}

# ── Global singletons ─────────────────────────────────────────────────────────
_device          = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_scan_model      = None
_body_model      = None
_disease_model   = None


def _load_all():
    global _scan_model, _body_model, _disease_model

    if _scan_model is None:
        print(f"[Pipeline] Loading Stage-1 scan detector …")
        _scan_model = load_scan_detector(SCAN_WEIGHTS, _device)

    if _body_model is None:
        print(f"[Pipeline] Loading Stage-2 body-part detector …")
        _body_model = load_body_part_detector(BODY_WEIGHTS, _device)

    if _disease_model is None:
        print(f"[Pipeline] Loading Stage-3 disease classifier …")
        _disease_model = load_disease_classifier(DISEASE_WEIGHTS, _device)

    return _scan_model, _body_model, _disease_model


def run_full_pipeline(
    image: Image.Image,
    symptom_text: str = "",
    patient_name: str = "Anonymous",
    run_nlp: bool     = True,
) -> dict:
    """
    Execute all three stages and optionally the NLP layer.

    Returns a dict compatible with the frontend schema.
    """
    scan_model, body_model, disease_model = _load_all()

    # ── Stage 1 ───────────────────────────────────────────────────────────────
    s1 = run_scan_detector(image, scan_model, _device)
    if not s1.get("valid"):
        return {
            "valid"          : False,
            "stage"          : 1,
            "error"          : s1.get("error", "Scan type detection failed"),
            "stage1_modality": s1.get("modality"),
            "stage1_confidence": s1.get("confidence"),
            "stage1_all_probs" : s1.get("all_probs"),
        }

    # ── Stage 2 ───────────────────────────────────────────────────────────────
    s2 = run_body_part_detector(image, body_model, _device)

    mod         = MODALITY_MAP.get(s1["modality"], "unknown")
    routing_key = f"{mod}_{s2.get('body_part', 'unknown')}"

    base_result = {
        "valid"            : True,
        "stage1_modality"  : s1["modality"],
        "stage1_confidence": s1["confidence"],
        "stage1_all_probs" : s1.get("all_probs"),
        "stage2_body_part" : s2.get("body_part"),
        "stage2_confidence": s2.get("confidence"),
        "stage2_all_probs" : s2.get("all_probs"),
        "routing_key"      : routing_key,
        "ready_for_stage3" : s1.get("valid", False) and s2.get("valid", False),
    }

    # If Stage 2 confidence is low, still proceed but flag it
    if not s2.get("valid"):
        base_result["stage2_warning"] = s2.get("error")

    # ── Stage 3 ───────────────────────────────────────────────────────────────
    if routing_key not in DISEASE_LABELS:
        base_result["stage3_supported"] = False
        base_result["stage3_message"]   = (
            f"Routing key '{routing_key}' has no trained disease head. "
            f"Available: {list(DISEASE_LABELS.keys())}"
        )
        return base_result

    s3 = run_disease_classifier(image, routing_key, disease_model, _device)
    base_result.update({
        "stage3_supported": True,
        "diagnosis"       : s3["diagnosis"],
        "confidence"      : s3["confidence"],
        "severity"        : s3["severity"],
        "all_findings"    : s3["all_probs"],
        "task_type"       : s3["task_type"],
    })

    # ── GradCAM ───────────────────────────────────────────────────────────────
    try:
        cam_result = run_gradcam(
            image, routing_key, s3["pred_idx"], disease_model, _device
        )
        base_result["heatmap_b64"]  = cam_result["heatmap_b64"]
        base_result["original_b64"] = cam_result["original_b64"]
    except Exception as exc:
        base_result["gradcam_error"] = str(exc)

    # ── NLP ───────────────────────────────────────────────────────────────────
    if run_nlp:
        try:
            symptoms_result = (
                extract_symptoms(symptom_text) if symptom_text.strip()
                else {"symptoms": []}
            )
            symptoms = symptoms_result.get("symptoms", [])

            report = generate_report(
                scan_type    = s1["modality"],
                body_part    = s2.get("body_part", "unknown"),
                diagnosis    = s3["diagnosis"],
                confidence   = s3["confidence"],
                severity     = s3["severity"],
                symptoms     = symptoms,
                patient_name = patient_name,
            )
            summary = summarize_report(report)

            base_result.update({
                "symptoms"        : symptoms,
                "report"          : report,
                "report_summary"  : summary,
            })
        except Exception as exc:
            base_result["nlp_error"] = str(exc)

    return base_result
