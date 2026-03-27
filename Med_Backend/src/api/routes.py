"""
FastAPI routes — /analyze-scan
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import io

from src.pipeline.two_stage import run_two_stage

router = APIRouter()


@router.post("/analyze-scan")
async def analyze_scan(image: UploadFile = File(...)):
    """
    Accepts a multipart/form-data upload with key 'image'.
    Returns the two-stage pipeline result as JSON.
    """
    # Validate content type
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded file is not an image (got {image.content_type}).",
        )

    # Read and decode image
    try:
        raw = await image.read()
        pil_image = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Cannot read image: {exc}")

    # Run pipeline
    try:
        result = run_two_stage(pil_image)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {exc}")

    if "error" in result and result["error"]:
        # Return 422 with a structured error the frontend can display
        return JSONResponse(status_code=422, content={"detail": result["error"]})

    return result
