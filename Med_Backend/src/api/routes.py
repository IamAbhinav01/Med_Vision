"""
FastAPI routes:

  POST /analyze-scan   — two-stage only (legacy, kept for compatibility)
  POST /analyze        — full 3-stage + GradCAM + NLP pipeline
  POST /ask            — medical Q&A over a report
  GET  /health         — liveness check
"""

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import io

from src.pipeline.two_stage    import run_two_stage
from src.pipeline.full_pipeline import run_full_pipeline
from src.pipeline.nlp_pipeline  import answer_question

router = APIRouter()


# ── Legacy two-stage endpoint ─────────────────────────────────────────────────
@router.post("/analyze-scan")
async def analyze_scan(image: UploadFile = File(...)):
    """Accepts a multipart image and returns Stage 1 + 2 results."""
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded file is not an image (got {image.content_type}).",
        )
    try:
        raw       = await image.read()
        pil_image = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Cannot read image: {exc}")

    try:
        result = run_two_stage(pil_image)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {exc}")

    if "error" in result and result["error"]:
        return JSONResponse(status_code=422, content={"detail": result["error"]})

    return result


# ── Full pipeline endpoint ────────────────────────────────────────────────────
@router.post("/analyze")
async def analyze_full(
    image        : UploadFile = File(...),
    symptom_text : str = Form(""),
    patient_name : str = Form("Anonymous"),
    run_nlp      : bool = Form(False),   # NLP models are large; opt-in
):
    """
    Full 3-stage pipeline: scan detection → body part → disease classification
    + GradCAM heatmap + (optional) NLP report generation.
    """
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded file is not an image (got {image.content_type}).",
        )
    try:
        raw       = await image.read()
        pil_image = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Cannot read image: {exc}")

    try:
        result = run_full_pipeline(
            pil_image,
            symptom_text = symptom_text,
            patient_name = patient_name,
            run_nlp      = run_nlp,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {exc}")

    if not result.get("valid", True) and result.get("stage") == 1:
        return JSONResponse(status_code=422, content={"detail": result.get("error")})

    return result


# ── Medical Q&A endpoint ──────────────────────────────────────────────────────
@router.post("/ask")
async def ask(
    question : str = Form(...),
    context  : str = Form(...),
):
    """Answer a free-text medical question given a report context."""
    result = answer_question(question, context)
    return result


# ── Health check ──────────────────────────────────────────────────────────────
@router.get("/health")
def health():
    return {
        "status"  : "ok",
        "service" : "MedVision AI Backend",
        "stages"  : ["scan_detector", "body_part_detector",
                     "disease_classifier", "gradcam", "nlp"],
    }
