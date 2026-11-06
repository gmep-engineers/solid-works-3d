import os
import shutil
import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_connection
from auth import get_current_user
from cad_engine import analyze_cad_file, auto_thicken_model

router = APIRouter(prefix="/api/cad", tags=["CAD Analysis"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_models")

@router.post("/upload")
async def upload_cad_model(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    original_filename = file.filename
    ext = os.path.splitext(original_filename)[1].lower()
    
    allowed_exts = [".sldprt", ".sldasm", ".step", ".stp", ".stl", ".obj", ".3mf", ".ply", ".iges", ".igs"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: SolidWorks (.sldprt, .sldasm), STEP (.step, .stp), STL (.stl), OBJ, 3MF."
        )

    file_id = str(uuid.uuid4())
    stored_filename = f"{file_id}_{original_filename}"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Perform geometry and DFM analysis
    try:
        analysis = analyze_cad_file(file_path, original_filename, UPLOAD_DIR)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CAD analysis failed: {str(e)}")

    # Store in database
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO cad_models (
        id, user_id, filename, file_path, web_model_path,
        volume_cm3, surface_area_cm2, bbox_x, bbox_y, bbox_z,
        is_watertight, min_thickness_mm, thin_features_count,
        dfm_status, dfm_details, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        file_id,
        current_user["id"],
        original_filename,
        file_path,
        analysis["web_model_path"],
        analysis["volume_cm3"],
        analysis["surface_area_cm2"],
        analysis["bbox_x"],
        analysis["bbox_y"],
        analysis["bbox_z"],
        1 if analysis["is_watertight"] else 0,
        analysis["min_thickness_mm"],
        analysis["thin_features_count"],
        analysis["dfm_status"],
        json.dumps({
            "warnings": analysis["dfm_warnings"],
            "thin_features": analysis["thin_features"],
            "vertex_count": analysis.get("vertex_count", 0),
            "face_count": analysis.get("face_count", 0),
            "is_solidworks": analysis.get("is_solidworks", False)
        }),
        now_iso
    ))
    conn.commit()
    conn.close()

    return {
        "id": file_id,
        "filename": original_filename,
        "volume_cm3": analysis["volume_cm3"],
        "surface_area_cm2": analysis["surface_area_cm2"],
        "bbox": [analysis["bbox_x"], analysis["bbox_y"], analysis["bbox_z"]],
        "is_watertight": analysis["is_watertight"],
        "min_thickness_mm": analysis["min_thickness_mm"],
        "thin_features_count": analysis["thin_features_count"],
        "thin_features": analysis["thin_features"],
        "dfm_status": analysis["dfm_status"],
        "dfm_warnings": analysis["dfm_warnings"],
        "web_model_path": analysis["web_model_path"],
        "is_solidworks": analysis.get("is_solidworks", False),
        "created_at": now_iso
    }

@router.post("/load-sample")
def load_sample_model(
    sample_key: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    sample_mapping = {
        "bracket": ("aerospace_bracket.stl", "aerospace_mounting_bracket.sldprt"),
        "thin_fin": ("thin_fin_heat_sink.stl", "microchannel_heat_sink.sldprt"),
        "manifold": ("manifold_housing.stl", "hydraulic_manifold_block.sldprt"),
        "step_part": ("turbine_flange.stl", "turbine_flange_assembly.step")
    }

    if sample_key not in sample_mapping:
        raise HTTPException(status_code=400, detail="Invalid sample key. Options: bracket, thin_fin, manifold, step_part")


    source_stl, target_display_name = sample_mapping[sample_key]
    source_path = os.path.join(SAMPLE_DIR, source_stl)

    if not os.path.exists(source_path):
        raise HTTPException(status_code=404, detail="Sample model source file not found")

    file_id = str(uuid.uuid4())
    stored_filename = f"{file_id}_{source_stl}"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)
    shutil.copyfile(source_path, file_path)

    analysis = analyze_cad_file(file_path, target_display_name, UPLOAD_DIR)

    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO cad_models (
        id, user_id, filename, file_path, web_model_path,
        volume_cm3, surface_area_cm2, bbox_x, bbox_y, bbox_z,
        is_watertight, min_thickness_mm, thin_features_count,
        dfm_status, dfm_details, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        file_id,
        current_user["id"],
        target_display_name,
        file_path,
        analysis["web_model_path"],
        analysis["volume_cm3"],
        analysis["surface_area_cm2"],
        analysis["bbox_x"],
        analysis["bbox_y"],
        analysis["bbox_z"],
        1 if analysis["is_watertight"] else 0,
        analysis["min_thickness_mm"],
        analysis["thin_features_count"],
        analysis["dfm_status"],
        json.dumps({
            "warnings": analysis["dfm_warnings"],
            "thin_features": analysis["thin_features"],
            "vertex_count": analysis.get("vertex_count", 0),
            "face_count": analysis.get("face_count", 0),
            "is_solidworks": True
        }),
        now_iso
    ))
    conn.commit()
    conn.close()

    return {
        "id": file_id,
        "filename": target_display_name,
        "volume_cm3": analysis["volume_cm3"],
        "surface_area_cm2": analysis["surface_area_cm2"],
        "bbox": [analysis["bbox_x"], analysis["bbox_y"], analysis["bbox_z"]],
        "is_watertight": analysis["is_watertight"],
        "min_thickness_mm": analysis["min_thickness_mm"],
        "thin_features_count": analysis["thin_features_count"],
        "thin_features": analysis["thin_features"],
        "dfm_status": analysis["dfm_status"],
        "dfm_warnings": analysis["dfm_warnings"],
        "web_model_path": analysis["web_model_path"],
        "is_solidworks": True,
        "created_at": now_iso
    }

@router.get("/models")
def get_user_models(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, filename, volume_cm3, surface_area_cm2, bbox_x, bbox_y, bbox_z,
           is_watertight, min_thickness_mm, thin_features_count, dfm_status, dfm_details, web_model_path, created_at
    FROM cad_models WHERE user_id = ? ORDER BY created_at DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        d["dfm_details"] = json.loads(d["dfm_details"])
        results.append(d)
    return results

@router.get("/models/{model_id}")
def get_model_by_id(model_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, user_id, filename, volume_cm3, surface_area_cm2, bbox_x, bbox_y, bbox_z,
           is_watertight, min_thickness_mm, thin_features_count, dfm_status, dfm_details, web_model_path, created_at
    FROM cad_models WHERE id = ?
    """, (model_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Model not found")

    d = dict(row)
    if d["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    d["dfm_details"] = json.loads(d["dfm_details"])
    return d

class AutoThickenRequest(BaseModel):
    target_thickness_mm: Optional[float] = 0.80

@router.post("/models/{model_id}/auto-thicken")
def auto_thicken_cad_model(
    model_id: str,
    req: Optional[AutoThickenRequest] = None,
    current_user: dict = Depends(get_current_user)
):
    target_th = req.target_thickness_mm if req and req.target_thickness_mm else 0.80
    try:
        result = auto_thicken_model(model_id, target_thickness_mm=target_th, upload_dir=UPLOAD_DIR)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-thickening failed: {str(e)}")

