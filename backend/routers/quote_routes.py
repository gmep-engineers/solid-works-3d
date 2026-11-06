from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uuid
import json
import os
from datetime import datetime, timezone
from database import (
    get_connection, get_active_legal_disclaimer, compute_file_sha256,
    create_worm_ledger_entry, get_worm_ledger_by_quote_id
)
from auth import get_current_user
from pricing_engine import MATERIALS, SURFACE_FINISHES, HEAT_TREATMENTS, DISPLAY_ACCESSORIES, LEAD_TIMES, calculate_quote, get_db_materials, get_db_services
from services.worm_storage_service import WormStorageService
from services.certificate_generator import generate_completion_certificate

router = APIRouter(prefix="/api/quote", tags=["Quoting Engine"])

class QuoteCalculateRequest(BaseModel):
    model_id: str
    material_id: str
    quantity: int = 1
    finish_id: str = "as_printed"
    machining_options: Dict[str, Any] = {}
    lead_time_id: str = "standard"

class SaveQuoteRequest(QuoteCalculateRequest):
    ip_terms_accepted: Optional[bool] = False
    ip_terms_version: Optional[str] = "1.0"
    ip_terms_accepted_at: Optional[str] = None
    cad_thumbnail_data_url: Optional[str] = None
    cadThumbnailDataUrl: Optional[str] = None

@router.get("/config")
def get_quote_config():
    db_mats = get_db_materials(active_only=True)
    db_svcs = get_db_services(active_only=True)
    
    # Predefined surface finishes from pricing engine
    finishes_map = {f["id"]: dict(f) for f in SURFACE_FINISHES.values()}
    
    # Query database post_processing_techniques table
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM post_processing_techniques WHERE is_active = 1 AND category != 'Metallurgical'")
        for row in cursor.fetchall():
            row_dict = dict(row)
            finishes_map[row_dict["id"]] = {
                "id": row_dict["id"],
                "name": row_dict["name"],
                "price": row_dict["base_price"],
                "roughness_ra": row_dict["category"],
                "description": row_dict["description"],
                "technology": "sla_optical" if "Resin" in row_dict["category"] or "Optical" in row_dict["category"] else "dmls_metal"
            }
        conn.close()
    except Exception as e:
        print("Note loading post_processing_techniques:", e)
        
    for s in db_svcs.values():
        if s.get("category") == "surface_finish":
            finishes_map[s["id"]] = {
                "id": s["id"],
                "name": s["name"],
                "price": s["base_price"],
                "roughness_ra": s.get("spec_detail", "Standard"),
                "description": s.get("description", ""),
                "technology": s.get("technology", "dmls_metal")
            }
            
    return {
        "materials": list(db_mats.values()),
        "finishes": list(finishes_map.values()),
        "heat_treatments": HEAT_TREATMENTS,
        "display_accessories": DISPLAY_ACCESSORIES,
        "lead_times": list(LEAD_TIMES.values()),
        "legal_disclaimer": get_active_legal_disclaimer()
    }

@router.get("/disclaimer")
def get_public_legal_disclaimer():
    disc = get_active_legal_disclaimer()
    if not disc:
        raise HTTPException(status_code=404, detail="No active legal disclaimer found")
    return disc

@router.post("/calculate")
def calculate_live_quote(req: QuoteCalculateRequest, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT volume_cm3, surface_area_cm2, dfm_status FROM cad_models WHERE id = ?", (req.model_id,))
    model = cursor.fetchone()
    conn.close()

    if not model:
        raise HTTPException(status_code=404, detail="CAD model not found")

    if model["dfm_status"] == "FAIL":
        raise HTTPException(
            status_code=400,
            detail="Model has critical DFM errors (e.g. wall thickness < 0.4mm). Please revise the CAD model before quoting."
        )

    quote = calculate_quote(
        volume_cm3=model["volume_cm3"],
        surface_area_cm2=model["surface_area_cm2"],
        material_id=req.material_id,
        quantity=req.quantity,
        finish_id=req.finish_id,
        machining_options=req.machining_options,
        lead_time_id=req.lead_time_id
    )

    return quote

@router.post("/save")
def save_quote(req: SaveQuoteRequest, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT volume_cm3, surface_area_cm2, dfm_status FROM cad_models WHERE id = ?", (req.model_id,))
    model = cursor.fetchone()

    if not model:
        conn.close()
        raise HTTPException(status_code=404, detail="CAD model not found")

    if model["dfm_status"] == "FAIL":
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot save quote for a model with critical DFM failure")

    quote = calculate_quote(
        volume_cm3=model["volume_cm3"],
        surface_area_cm2=model["surface_area_cm2"],
        material_id=req.material_id,
        quantity=req.quantity,
        finish_id=req.finish_id,
        machining_options=req.machining_options,
        lead_time_id=req.lead_time_id
    )

    quote_id = f"QTE-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()
    ip_accepted_at = req.ip_terms_accepted_at or (now_iso if req.ip_terms_accepted else "")

    cursor.execute("""
    INSERT INTO quotes (
        id, model_id, user_id, material_id, material_name, quantity,
        finish_type, machining_options, lead_time_option, unit_price,
        total_price, breakdown, estimated_ship_date, ip_terms_accepted,
        ip_terms_version, ip_terms_accepted_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        quote_id,
        req.model_id,
        current_user["id"],
        req.material_id,
        quote["material_name"],
        req.quantity,
        req.finish_id,
        json.dumps(req.machining_options),
        req.lead_time_id,
        quote["unit_price"],
        quote["total_price"],
        json.dumps(quote["breakdown"]),
        quote["lead_time"]["estimated_ship_date"],
        1 if req.ip_terms_accepted else 0,
        req.ip_terms_version or "1.0",
        ip_accepted_at,
        now_iso
    ))
    conn.commit()

    # Create WORM ledger record for submitted quote
    cad_thumb = req.cadThumbnailDataUrl or req.cad_thumbnail_data_url or ""
    cursor.execute("SELECT * FROM cad_models WHERE id = ?", (req.model_id,))
    cad_row = cursor.fetchone()
    cursor.execute("SELECT * FROM materials WHERE id = ?", (req.material_id,))
    mat_row = cursor.fetchone()
    conn.close()

    cad_path = cad_row["file_path"] if cad_row else ""
    cad_sha256 = compute_file_sha256(cad_path) if cad_path and os.path.isfile(cad_path) else ("0" * 64)
    cad_size = os.path.getsize(cad_path) if cad_path and os.path.isfile(cad_path) else 0

    dfm_metrics = {
        "bbox_x": cad_row["bbox_x"] if cad_row else 0.0,
        "bbox_y": cad_row["bbox_y"] if cad_row else 0.0,
        "bbox_z": cad_row["bbox_z"] if cad_row else 0.0,
        "volume_cm3": cad_row["volume_cm3"] if cad_row else 0.0,
        "surface_area_cm2": cad_row["surface_area_cm2"] if cad_row else 0.0,
        "is_watertight": bool(cad_row["is_watertight"]) if cad_row else True,
        "dfm_status": cad_row["dfm_status"] if cad_row else "PASS",
        "min_thickness_mm": cad_row["min_thickness_mm"] if cad_row else 0.8
    }

    frozen_dict = {
        "quote_id": quote_id,
        "material_name": quote["material_name"],
        "material_id": req.material_id,
        "optical_type": mat_row["optical_type"] if mat_row and "optical_type" in mat_row.keys() else "OPAQUE",
        "transmission_factor": mat_row["transmission_factor"] if mat_row and "transmission_factor" in mat_row.keys() else 0.0,
        "quantity": req.quantity,
        "finish_type": req.finish_id,
        "machining_options": req.machining_options,
        "total_price": quote["total_price"],
        "breakdown": quote["breakdown"],
        "ip_terms_accepted": bool(req.ip_terms_accepted),
        "ip_terms_version": req.ip_terms_version or "1.0",
        "ip_terms_accepted_at": ip_accepted_at
    }

    active_disclaimer = get_active_legal_disclaimer()
    worm_years = active_disclaimer.get("wormRetentionYears", 7) if active_disclaimer else 7
    cad_days = active_disclaimer.get("cadRetentionDays", 90) if active_disclaimer else 90

    try:
        ledger_entry = create_worm_ledger_entry(
            event_type="QUOTE_SUBMITTED",
            quote_id=quote_id,
            actor_id=current_user["id"],
            actor_email=current_user["email"],
            cad_file_name=cad_row["filename"] if cad_row else "model.stl",
            cad_file_size=cad_size,
            cad_file_sha256=cad_sha256,
            cad_thumbnail_data_url=cad_thumb,
            dfm_geometry_metrics=dfm_metrics,
            frozen_snapshot_dict=frozen_dict,
            worm_retention_years=worm_years,
            cad_retention_days=cad_days
        )
        WormStorageService.archive_transaction(ledger_entry, cad_path)
        cert_id = ledger_entry["id"]
    except Exception as e:
        print(f"[Quote] Error recording WORM ledger entry: {e}")
        cert_id = None

    quote["id"] = quote_id
    quote["model_id"] = req.model_id
    quote["certificate_id"] = cert_id
    quote["created_at"] = now_iso
    quote["ip_terms_accepted"] = bool(req.ip_terms_accepted)
    quote["ip_terms_version"] = req.ip_terms_version or "1.0"
    quote["ip_terms_accepted_at"] = ip_accepted_at
    return quote

@router.get("/{quote_id}/certificate")
def download_quote_certificate(quote_id: str, current_user: dict = Depends(get_current_user)):
    """Downloads the official cryptographic Certificate of Completion PDF for this quote."""
    entry = get_worm_ledger_by_quote_id(quote_id)
    if not entry:
        raise HTTPException(status_code=404, detail="WORM ledger certificate not found for this quote.")

    pdf_path = entry.get("pdf_certificate_path")
    if not pdf_path or not os.path.isfile(pdf_path):
        pdf_path = generate_completion_certificate(entry)

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"TitanForge_Certificate_{quote_id}.pdf"
    )

@router.get("/{quote_id}")
def get_quote_details(quote_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT q.*, m.filename, m.volume_cm3, m.bbox_x, m.bbox_y, m.bbox_z, m.web_model_path, m.dfm_status
    FROM quotes q
    JOIN cad_models m ON q.model_id = m.id
    WHERE q.id = ?
    """, (quote_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Quote not found")

    d = dict(row)
    if d["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    d["machining_options"] = json.loads(d["machining_options"])
    d["breakdown"] = json.loads(d["breakdown"])
    return d


class SaveQuoteProjectRequest(BaseModel):
    id: Optional[str] = None
    name: str
    model_id: Optional[str] = None
    model_data: Dict[str, Any]
    material_id: str = "ti_6al_4v"
    finish_id: str = "as_printed"
    machining_options: Dict[str, Any] = {}
    quantity: int = 1
    lead_time_id: str = "standard"
    quote_summary: Optional[Dict[str, Any]] = None
    notes: Optional[str] = ""

@router.post("/projects/save")
def save_quote_project(req: SaveQuoteProjectRequest, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    project_id = req.id if req.id else f"PRJ-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO quote_projects (
        id, user_id, name, model_id, model_data_json, material_id, finish_id,
        machining_options_json, quantity, lead_time_id, quote_summary_json, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        model_id=excluded.model_id,
        model_data_json=excluded.model_data_json,
        material_id=excluded.material_id,
        finish_id=excluded.finish_id,
        machining_options_json=excluded.machining_options_json,
        quantity=excluded.quantity,
        lead_time_id=excluded.lead_time_id,
        quote_summary_json=excluded.quote_summary_json,
        notes=excluded.notes,
        updated_at=excluded.updated_at
    """, (
        project_id,
        current_user["id"],
        req.name.strip() or "Untitled 3D Metal Project",
        req.model_id,
        json.dumps(req.model_data),
        req.material_id,
        req.finish_id,
        json.dumps(req.machining_options),
        req.quantity,
        req.lead_time_id,
        json.dumps(req.quote_summary or {}),
        req.notes or "",
        now_iso,
        now_iso
    ))
    conn.commit()
    conn.close()

    return {
        "id": project_id,
        "name": req.name.strip() or "Untitled 3D Metal Project",
        "model_id": req.model_id,
        "material_id": req.material_id,
        "finish_id": req.finish_id,
        "machining_options": req.machining_options,
        "quantity": req.quantity,
        "lead_time_id": req.lead_time_id,
        "quote_summary": req.quote_summary,
        "notes": req.notes,
        "updated_at": now_iso,
        "message": "Project saved successfully"
    }

@router.get("/projects")
def list_quote_projects(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, user_id, name, model_id, model_data_json, material_id, finish_id,
           machining_options_json, quantity, lead_time_id, quote_summary_json, notes, created_at, updated_at
    FROM quote_projects
    WHERE user_id = ?
    ORDER BY updated_at DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()
    conn.close()

    projects = []
    for r in rows:
        d = dict(r)
        d["model_data"] = json.loads(d["model_data_json"]) if d["model_data_json"] else None
        d["machining_options"] = json.loads(d["machining_options_json"]) if d["machining_options_json"] else {}
        d["quote_summary"] = json.loads(d["quote_summary_json"]) if d["quote_summary_json"] else None
        projects.append(d)
    return projects

@router.get("/projects/{project_id}")
def get_quote_project(project_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quote_projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Project not found")

    d = dict(row)
    if d["user_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    d["model_data"] = json.loads(d["model_data_json"]) if d["model_data_json"] else None
    d["machining_options"] = json.loads(d["machining_options_json"]) if d["machining_options_json"] else {}
    d["quote_summary"] = json.loads(d["quote_summary_json"]) if d["quote_summary_json"] else None
    return d

@router.delete("/projects/{project_id}")
def delete_quote_project(project_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM quote_projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    if row["user_id"] != current_user["id"] and current_user.get("role") != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Access denied")

    cursor.execute("DELETE FROM quote_projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return {"message": "Project deleted successfully", "id": project_id}
