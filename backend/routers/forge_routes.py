"""
FastAPI Router for ForgeAI: B2C AI-Powered Metal 3D Printing Customizer.
Provides endpoints for:
- IP & copyright safety checks
- Presets & organic mesh generation
- Stateful session management & feature tree operations (Undo/Redo)
- Natural language CAD commands
- 3D GLB/STL generation & streaming
- Live metal pricing & ordering
"""

import os
import re
import uuid
import json
import shutil
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from services.ip_guard import IPGuardService
from services.organic_generator import OrganicGeneratorService
from services.hybrid_cad import HybridCadEngine, FeatureItem
from services.gemini_cad import GeminiCadService
from services.ai_text_to_3d import AITextTo3DService
import trimesh
from cad_engine import analyze_cad_file
from database import (
    get_connection,
    get_tripo_config,
    hold_wallet_funds_for_task,
    complete_wallet_task,
    refund_wallet_task
)
from auth import get_optional_current_user

router = APIRouter(prefix="/api/forge", tags=["ForgeAI Customizer"])

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "forge")
os.makedirs(UPLOADS_DIR, exist_ok=True)

FORGE_PROJECTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "forge_projects")
os.makedirs(FORGE_PROJECTS_DIR, exist_ok=True)


class SaveProjectRequest(BaseModel):
    session_id: str
    name: str
    material_id: Optional[str] = "bronze_infused_steel"
    project_id: Optional[str] = None


class PromptCheckRequest(BaseModel):
    prompt: str


class ApplyFeatureRequest(BaseModel):
    feature_type: str
    params: Dict[str, Any]


class ChatCommandRequest(BaseModel):
    command: str
    gemini_api_key: Optional[str] = None
    tripo_api_key: Optional[str] = None
    engine_preference: Optional[str] = "auto"


class CreateSessionRequest(BaseModel):
    mode: Optional[str] = "ai_organic"
    prompt: Optional[str] = None
    preset_key: Optional[str] = None
    height_mm: Optional[float] = 60.0
    shape: Optional[str] = "Cylinder"
    gemini_api_key: Optional[str] = None
    tripo_api_key: Optional[str] = None
    engine_preference: Optional[str] = "auto"


@router.get("/ai-status")
def get_ai_status(gemini_api_key: Optional[str] = None, tripo_api_key: Optional[str] = None):
    """Returns the active AI Generative CAD & 3D Mesh status (Tripo3D, Gemini, or Procedural)."""
    gemini_active = GeminiCadService.is_available(gemini_api_key)
    tripo_active = AITextTo3DService.is_available(tripo_api_key)

    active_engine = "procedural"
    if tripo_active and gemini_active:
        active_engine = "dual_engine"
    elif tripo_active:
        active_engine = "tripo3d"
    elif gemini_active:
        active_engine = "gemini_cad"

    return {
        "engine": active_engine,
        "dual_engine_active": tripo_active and gemini_active,
        "tripo3d": {
            "active": tripo_active,
            "name": "Tripo3D Neural Generative AI (3D Mesh/PBR)"
        },
        "gemini_cad": {
            "active": gemini_active,
            "name": "Google Gemini 2.5 Flash LLM-to-CAD (build123d)"
        },
        "procedural": {
            "active": True,
            "name": "TitanForge Built-in Parametric CAD Engine"
        }
    }


@router.post("/ip-guard/check")
def check_ip_guard(req: PromptCheckRequest):
    """Evaluates a text prompt against copyright safety gatekeeper."""
    return IPGuardService.inspect_and_sanitize(req.prompt)


@router.get("/presets")
def get_presets():
    """Returns available organic figurine and bespoke metal object presets."""
    return {
        "presets": OrganicGeneratorService.PRESETS,
        "parametric_shapes": [
            {"id": "box", "name": "B-Rep Precision Box", "default_params": {"width_mm": 30, "depth_mm": 30, "height_mm": 30}},
            {"id": "cylinder", "name": "B-Rep Precision Cylinder", "default_params": {"radius_mm": 15, "height_mm": 30}},
            {"id": "ring", "name": "B-Rep Comfort Fit Ring", "default_params": {"outer_radius_mm": 12, "inner_radius_mm": 9.5, "height_mm": 8}},
            {"id": "hexagon", "name": "B-Rep Hexagonal Mount", "default_params": {"radius_mm": 18, "height_mm": 20}}
        ]
    }


@router.get("/pricing")
def get_forge_pricing(user: Optional[dict] = Depends(get_optional_current_user)):
    """Returns the admin-configured fee structure and active user wallet balance."""
    cfg = get_tripo_config()
    balance = float(user.get("wallet_balance", 0.0)) if user else 0.0
    return {
        "provider": cfg.get("provider", "TRIPO_3D"),
        "is_enabled": cfg.get("isEnabled", True),
        "fee_structure": cfg.get("feeStructure", {}),
        "user_balance": balance,
        "user_id": user.get("id") if user else None,
        "user_email": user.get("email") if user else None
    }


@router.post("/sessions/create")
def create_session(req: CreateSessionRequest, user: Optional[dict] = Depends(get_optional_current_user)):
    """Initializes a new stateful CAD session with an initial base geometry."""
    session_id = str(uuid.uuid4())
    # IP check prompt
    sanitized = IPGuardService.inspect_and_sanitize(req.prompt or "")
    effective_prompt = sanitized["clean_prompt"]

    # Secure Wallet Escrow Hold for Tripo3D Neural Generation
    wallet_tx_id = None
    held_amount = 0.0
    tripo_cfg = get_tripo_config()
    is_tripo_active = tripo_cfg.get("isEnabled", True) and AITextTo3DService.is_available(req.tripo_api_key)

    if (req.mode or "ai_organic") == "ai_organic" and is_tripo_active and effective_prompt:
        fee_rules = tripo_cfg.get("feeStructure", {})
        task_cost = float(fee_rules.get("textTo3dDraftCost", 0.50))
        if user and user.get("id"):
            user_balance = float(user.get("wallet_balance", 0.0))
            if user_balance < task_cost:
                raise HTTPException(
                    status_code=402,
                    detail=f"Insufficient wallet balance (${user_balance:.2f}). Generating a 3D model with Tripo3D costs ${task_cost:.2f}. Please top up your wallet."
                )
            try:
                hold = hold_wallet_funds_for_task(
                    user["id"],
                    task_cost,
                    task_type="TEXT_TO_3D",
                    description=f"TitanForge 3D: '{effective_prompt[:30]}'"
                )
                wallet_tx_id = hold["tx_id"]
                held_amount = task_cost
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

    params = {
        "mode": req.mode or "ai_organic",
        "prompt": effective_prompt,
        "preset_key": req.preset_key,
        "height_mm": req.height_mm or 60.0,
        "shape": req.shape,
        "ip_guard": sanitized,
        "gemini_api_key": req.gemini_api_key,
        "tripo_api_key": req.tripo_api_key,
        "engine_preference": req.engine_preference or "auto",
        "wallet_tx_id": wallet_tx_id
    }

    try:
        state = HybridCadEngine.execute_feature(session_id, "create_base", params)
    except Exception as e:
        if wallet_tx_id:
            refund_wallet_task(wallet_tx_id, reason=str(e))
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    state["ip_guard_notice"] = sanitized.get("notice")
    state["wallet_held_amount"] = held_amount
    state["wallet_tx_id"] = wallet_tx_id

    # Refresh user balance
    if user and user.get("id"):
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT wallet_balance FROM users WHERE id = ?", (user["id"],))
        u_row = c.fetchone()
        conn.close()
        state["user_wallet_balance"] = float(u_row["wallet_balance"]) if u_row else 0.0

    return state


@router.get("/sessions/{session_id}")
def get_session(session_id: str):
    """Retrieves session state, feature tree, dimensions, and live quotes."""
    return HybridCadEngine.get_session_state(session_id)


@router.post("/sessions/{session_id}/apply-feature")
def apply_feature(session_id: str, req: ApplyFeatureRequest):
    """Applies a feature to the model in the current session."""
    try:
        return HybridCadEngine.execute_feature(session_id, req.feature_type, req.params)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Failed to apply {req.feature_type}: {str(e)}")


@router.post("/sessions/{session_id}/undo")
def undo_feature(session_id: str):
    """Rolls back the last feature in the feature tree."""
    try:
        return HybridCadEngine.undo(session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Undo failed: {str(e)}")


@router.post("/sessions/{session_id}/redo")
def redo_feature(session_id: str):
    """Redoes the previously rolled-back feature."""
    try:
        return HybridCadEngine.redo(session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Redo failed: {str(e)}")


def parse_dimension_in_mm(text: str, default: float = 60.0) -> float:
    """Parses length dimensions from natural language text with unit conversion (cm, mm, in, m)."""
    text_lower = text.lower()

    # 1. Match number with explicit unit (e.g. '10 cm', '100 mm', '2.5 in', '10cm')
    unit_match = re.search(
        r'(\d+(?:\.\d+)?)\s*(cm|centimeter(?:s)?|mm|millimeter(?:s)?|in(?:ch(?:es)?)?|m|meter(?:s)?)\b',
        text_lower
    )
    if unit_match:
        val = float(unit_match.group(1))
        unit = unit_match.group(2).lower()
        if unit.startswith('c'):
            return val * 10.0
        elif unit.startswith('i'):
            return val * 25.4
        elif unit.startswith('m') and ('meter' in unit or unit == 'm'):
            return val * 1000.0
        else:
            return val

    # 2. Match number near dimension words (e.g. 'diameter 100' or 'radius 50')
    dim_match = re.search(
        r'(?:diameter|diam|radius|rad|size|height|width|depth|side|thick|thickness|gauge)\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)',
        text_lower
    )
    if dim_match:
        val = float(dim_match.group(1))
        if 'cm' in text_lower:
            return val * 10.0
        return val

    # 3. Match any number if 'cm' is mentioned anywhere in the prompt
    if 'cm' in text_lower:
        num_match = re.search(r'(\d+(?:\.\d+)?)', text_lower)
        if num_match:
            return float(num_match.group(1)) * 10.0

    # 4. Fallback to first standalone number
    num_match = re.search(r'(\d+(?:\.\d+)?)', text_lower)
    if num_match:
        return float(num_match.group(1))

    return default


@router.post("/sessions/{session_id}/chat-command")
def process_chat_command(session_id: str, req: ChatCommandRequest):
    """
    Parses natural language commands to automatically invoke the corresponding CAD tools.
    e.g. 'draw a ball with 10 cm diameter', 'Cut 3mm off bottom', 'Add a 32mm round base with text VICTORY'.
    """
    cmd = (req.command or "").strip()
    cmd_lower = cmd.lower()

    action_taken = ""
    feature_type = None
    params = {}

    # 1. Planar slice / cut
    if any(k in cmd_lower for k in ["cut", "slice", "flatten", "trim", "shave"]):
        # Extract mm number if present
        mm_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:mm|millimeters)?", cmd_lower)
        cut_height = float(mm_match.group(1)) if mm_match else 2.5
        feature_type = "slice_plane"
        params = {
            "origin": [0.0, 0.0, cut_height],
            "normal": [0.0, 0.0, 1.0],
            "keep_side": "positive"
        }
        action_taken = f"Executed planar cut at Z={cut_height:.1f} mm to create a precision flat mounting surface."

    # 2. Attach Pedestal / Base
    elif any(k in cmd_lower for k in ["pedestal", "base", "plinth", "stand"]):
        shape = "octagonal" if ("oct" in cmd_lower or "hex" in cmd_lower) else ("square" if "square" in cmd_lower else "round")
        diam_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:diameter|diam|round|base)", cmd_lower)
        diameter = float(diam_match.group(1)) if diam_match else 32.0

        # Extract text if quoted
        text_match = re.search(r"['\"]([^'\"]+)['\"]", cmd) or re.search(r"text\s+([A-Za-z0-9_-]+)", cmd, flags=re.IGNORECASE)
        emboss_text = text_match.group(1) if text_match else ""

        has_magnet = any(k in cmd_lower for k in ["magnet", "hole", "recess"])
        mag_diam = 5.2 if has_magnet else 0.0

        feature_type = "attach_pedestal"
        params = {
            "shape": shape,
            "diameter_mm": diameter,
            "height_mm": 6.0,
            "front_emboss_text": emboss_text,
            "magnet_hole_diameter_mm": mag_diam
        }
        action_taken = f"Attached {shape.capitalize()} Ø{diameter:.0f}mm pedestal with embossed text '{emboss_text}' and {mag_diam:.1f}mm magnet recess."

    # 3. Hardware Loop / Keychain
    elif any(k in cmd_lower for k in ["loop", "keychain", "ring", "pendant", "eyelet", "mount"]):
        pos = "back" if "back" in cmd_lower else "top"
        feature_type = "hardware_loop"
        params = {
            "position": pos,
            "inner_diam_mm": 4.5,
            "wall_thickness_mm": 2.0
        }
        action_taken = f"Welded high-strength Ø4.5mm hardware loop to model {pos} for keychain/mount attachment."

    # 4. Auto-Hollow
    elif any(k in cmd_lower for k in ["hollow", "drain", "powder", "save"]):
        wall_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:mm)?\s*wall", cmd_lower)
        wall_t = float(wall_match.group(1)) if wall_match else 2.0
        feature_type = "auto_hollow"
        params = {
            "wall_thickness_mm": wall_t,
            "drain_hole_diam_mm": 4.0
        }
        action_taken = f"Executed SLM auto-hollowing with {wall_t:.1f}mm walls and Ø4.0mm powder drainage port."

    # 5. Face feature / hole
    elif any(k in cmd_lower for k in ["hole", "drill", "pocket", "extrude"]):
        diam_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:mm)?", cmd_lower)
        diam = float(diam_match.group(1)) if diam_match else 5.0
        feature_type = "feature_on_face"
        params = {
            "face_id": "BOTTOM" if "bottom" in cmd_lower else "TOP",
            "sketch_type": "CIRCLE",
            "dimensions": {"radius_mm": diam / 2.0},
            "operation": "CUT",
            "depth": 4.0
        }
        action_taken = f"Drilled Ø{diam:.1f}mm x 4.0mm pocket into bottom face."

    # 6. Geometric Primitives: Ball / Sphere / Orb
    elif any(k in cmd_lower for k in ["ball", "sphere", "orb", "globe"]):
        is_radius = "radius" in cmd_lower or "rad" in cmd_lower
        parsed_dim = parse_dimension_in_mm(cmd, default=50.0)
        if is_radius:
            radius = parsed_dim
            diameter = radius * 2.0
        else:
            diameter = parsed_dim
            radius = diameter / 2.0

        gemini_key = GeminiCadService.get_api_key(req.gemini_api_key)
        cad_code = None
        if gemini_key:
            # Connect to Gemini LLM-to-CAD if API key is active
            cad_mesh, code_str, _ = GeminiCadService.generate_mesh_from_prompt(
                cmd, api_key=gemini_key, target_height_mm=diameter
            )
            if cad_mesh is not None and len(cad_mesh.faces) > 0:
                cad_code = code_str

        if not cad_code:
            cad_code = f"""import build123d as bd

# Parametric B-Rep Sphere generated via build123d
# Prompt: "{cmd}"
radius_mm = {radius:.2f}
model = bd.Sphere(radius=radius_mm)
"""
        feature_type = "create_base"
        params = {
            "mode": "parametric",
            "shape": "sphere",
            "radius_mm": radius,
            "diameter_mm": diameter,
            "height_mm": diameter,
            "generated_cad_code": cad_code
        }
        action_taken = f"Generated precision build123d B-Rep Sphere with Ø{diameter:.1f}mm diameter ({radius:.1f}mm radius, {diameter/10.0:.1f}cm)."

    # 7. Geometric Primitives: Cube / Box / Block
    elif any(k in cmd_lower for k in ["cube", "box", "block", "brick"]):
        xyz_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:x|\*)\s*(\d+(?:\.\d+)?)\s*(?:x|\*)\s*(\d+(?:\.\d+)?)', cmd_lower)
        if xyz_match:
            unit_mult = 10.0 if "cm" in cmd_lower else 1.0
            sx = float(xyz_match.group(1)) * unit_mult
            sy = float(xyz_match.group(2)) * unit_mult
            sz = float(xyz_match.group(3)) * unit_mult
        else:
            dim = parse_dimension_in_mm(cmd, default=40.0)
            sx = sy = sz = dim

        gemini_key = GeminiCadService.get_api_key(req.gemini_api_key)
        cad_code = None
        if gemini_key:
            cad_mesh, code_str, _ = GeminiCadService.generate_mesh_from_prompt(
                cmd, api_key=gemini_key, target_height_mm=sz
            )
            if cad_mesh is not None and len(cad_mesh.faces) > 0:
                cad_code = code_str

        if not cad_code:
            cad_code = f"""import build123d as bd

# Parametric B-Rep Box generated via build123d
# Prompt: "{cmd}"
model = bd.Box(length={sx:.1f}, width={sy:.1f}, height={sz:.1f})
"""
        feature_type = "create_base"
        params = {
            "mode": "parametric",
            "shape": "box",
            "width_mm": sx,
            "depth_mm": sy,
            "height_mm": sz,
            "generated_cad_code": cad_code
        }
        action_taken = f"Generated precision build123d B-Rep Box ({sx:.1f}mm x {sy:.1f}mm x {sz:.1f}mm)."

    # 8. Geometric Primitives: Cylinder / Disc / Rod
    elif any(k in cmd_lower for k in ["cylinder", "disc", "rod", "column"]):
        dim = parse_dimension_in_mm(cmd, default=30.0)
        height_match = re.search(r'(?:height|tall|h|length|len)\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)', cmd_lower)
        height = float(height_match.group(1)) * (10.0 if "cm" in cmd_lower else 1.0) if height_match else max(dim, 40.0)
        radius = dim / 2.0

        gemini_key = GeminiCadService.get_api_key(req.gemini_api_key)
        cad_code = None
        if gemini_key:
            cad_mesh, code_str, _ = GeminiCadService.generate_mesh_from_prompt(
                cmd, api_key=gemini_key, target_height_mm=height
            )
            if cad_mesh is not None and len(cad_mesh.faces) > 0:
                cad_code = code_str

        if not cad_code:
            cad_code = f"""import build123d as bd

# Parametric B-Rep Cylinder generated via build123d
# Prompt: "{cmd}"
model = bd.Cylinder(radius={radius:.1f}, height={height:.1f})
"""
        feature_type = "create_base"
        params = {
            "mode": "parametric",
            "shape": "cylinder",
            "radius_mm": radius,
            "height_mm": height,
            "generated_cad_code": cad_code
        }
        action_taken = f"Generated precision build123d B-Rep Cylinder (Ø{radius*2:.1f}mm x {height:.1f}mm)."

    # 9. Natural Language Concept / Generative 3D prompt
    else:
        sanitized = IPGuardService.inspect_and_sanitize(cmd)
        target_h = parse_dimension_in_mm(cmd, default=60.0)

        feature_type = "create_base"
        params = {
            "mode": "ai_organic",
            "prompt": sanitized["clean_prompt"],
            "height_mm": target_h,
            "gemini_api_key": req.gemini_api_key,
            "tripo_api_key": req.tripo_api_key,
            "engine_preference": getattr(req, "engine_preference", "auto") or "auto"
        }
        action_taken = f"Synthesizing 3D geometry for '{sanitized['clean_prompt']}' ({target_h:.1f}mm)..."

    state = HybridCadEngine.execute_feature(session_id, feature_type, params)

    engine_used = state.get("engine_used")
    engine_err = state.get("engine_error")
    clean_p = sanitized.get("clean_prompt", cmd) if "sanitized" in locals() else cmd
    if engine_used == "tripo3d":
        action_taken = f"✨ Tripo3D Neural AI successfully synthesized organic 3D mesh for '{clean_p}' ({target_h:.1f}mm)."
    elif engine_err:
        action_taken = f"⚠️ Tripo3D: {engine_err} (Fallback geometry generated for '{clean_p}')."
    elif engine_used == "gemini_cad":
        action_taken = f"Google Gemini LLM synthesized build123d CAD solid for '{clean_p}' ({target_h:.1f}mm)."
    elif not action_taken or action_taken.startswith("Synthesizing"):
        action_taken = f"TitanForge Engine synthesized base geometry for '{clean_p}' ({target_h:.1f}mm)."

    state["assistant_message"] = action_taken
    state["tripo_error"] = engine_err
    return state


class TripoKeyRequest(BaseModel):
    api_key: str


@router.post("/tripo-key")
def set_tripo_api_key(req: TripoKeyRequest):
    """Saves and validates the Tripo3D API Key persistently."""
    key = (req.api_key or "").strip()
    if key:
        AITextTo3DService.save_api_key(key)
    return {
        "success": True,
        "is_active": AITextTo3DService.is_available(),
        "masked_key": f"{key[:8]}...{key[-4:]}" if len(key) > 12 else ("****" if key else "")
    }


@router.get("/tripo-key")
def get_tripo_api_key_status():
    """Checks server-side Tripo3D API status and returns masked key."""
    key = AITextTo3DService.get_api_key()
    return {
        "is_active": bool(key and len(key) > 5),
        "masked_key": f"{key[:8]}...{key[-4:]}" if (key and len(key) > 12) else ("****" if key else "")
    }


@router.get("/sessions/{session_id}/model.glb")
def get_session_glb(session_id: str):
    """Exports and streams the session 3D model in GLB format for Three.js."""
    out_file = os.path.join(UPLOADS_DIR, f"{session_id}.glb")
    HybridCadEngine.export_session_glb(session_id, out_file)
    return FileResponse(
        out_file,
        media_type="model/gltf-binary",
        filename=f"forgeai_{session_id[:8]}.glb"
    )


@router.get("/sessions/{session_id}/download/{file_format}")
def download_model(session_id: str, file_format: str):
    """Downloads the manufacturing-ready STL or GLB file."""
    fmt = file_format.lower()
    if fmt == "stl":
        out_file = os.path.join(UPLOADS_DIR, f"{session_id}.stl")
        HybridCadEngine.export_session_stl(session_id, out_file)
        return FileResponse(
            out_file,
            media_type="application/octet-stream",
            filename=f"forgeai_metal_print_{session_id[:8]}.stl"
        )
    else:
        out_file = os.path.join(UPLOADS_DIR, f"{session_id}.glb")
        HybridCadEngine.export_session_glb(session_id, out_file)
        return FileResponse(
            out_file,
            media_type="model/gltf-binary",
            filename=f"forgeai_model_{session_id[:8]}.glb"
        )


@router.post("/sessions/{session_id}/order")
def place_forge_order(session_id: str, data: Dict[str, Any]):
    """Creates a custom metal 3D printing manufacturing order."""
    state = HybridCadEngine.get_session_state(session_id)
    quote = state.get("quote", {})
    material_id = data.get("material_id", "bronze_infused_steel")
    delivery_mode = data.get("delivery_mode", "shared_batch") # 'shared_batch' (30% off) | 'express'

    tier = quote.get("tiers", {}).get(material_id, {})
    price = tier.get("shared_batch_price_usd" if delivery_mode == "shared_batch" else "express_price_usd", 45.0)

    order_id = f"FORGE-{uuid.uuid4().hex[:8].upper()}"

    return {
        "order_id": order_id,
        "status": "QUEUED_FOR_FOUNDRY",
        "material": tier.get("name", material_id),
        "total_price_usd": price,
        "delivery_mode": "Shared Build-Plate Batch (12 days, 30% discount applied)" if delivery_mode == "shared_batch" else "Express Dedicated Run (4 days)",
        "solid_volume_cm3": state.get("solid_volume_cm3"),
        "hollowed_volume_cm3": state.get("hollowed_volume_cm3"),
        "powder_saved_percent": quote.get("volume_reduction_percent", 0),
        "created_at": "Just now",
        "message": "Order successfully routed to direct metal laser sintering manufacturing queue."
    }


@router.post("/sessions/{session_id}/transfer-to-quote")
def transfer_session_to_quote(session_id: str):
    """
    Transfers the generated ForgeAI model directly into the primary Quote & DFM workspace.
    Exports the binary STL, runs full engineering DFM & wall-thickness analysis,
    and returns CAD geometry parameters ready for Three.js viewer and material quoting.
    """
    session = HybridCadEngine.get_or_create_session(session_id)
    if session.current_mesh is None:
        HybridCadEngine.execute_feature(session_id, "create_base", {"prompt": "Bespoke Model", "height_mm": 60.0})

    # 1. Export session STL
    stl_path = os.path.join(UPLOADS_DIR, f"{session_id}.stl")
    HybridCadEngine.export_session_stl(session_id, stl_path)

    # 2. Copy into primary uploads directory for CAD quoting engine
    main_uploads_dir = os.path.dirname(UPLOADS_DIR)
    file_id = str(uuid.uuid4())

    base_name = "ForgeAI_Model"
    if session.feature_tree and len(session.feature_tree) > 0:
        raw_prompt = session.feature_tree[0].params.get("prompt", "")
        if raw_prompt:
            clean = re.sub(r'[^a-zA-Z0-9_-]', '_', raw_prompt[:25]).strip('_')
            if clean:
                base_name = f"ForgeAI_{clean}"

    target_filename = f"{base_name}.stl"
    stored_filename = f"{file_id}_{target_filename}"
    dest_path = os.path.join(main_uploads_dir, stored_filename)
    shutil.copyfile(stl_path, dest_path)

    # 3. Perform geometry & DFM analysis
    try:
        analysis = analyze_cad_file(dest_path, target_filename, main_uploads_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CAD analysis failed: {str(e)}")

    # 4. Store in cad_models table for project library
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE role = 'user' LIMIT 1")
    user_row = cursor.fetchone()
    user_id = user_row["id"] if user_row else "default-user"
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
        user_id,
        target_filename,
        dest_path,
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
        json.dumps(analysis["dfm_warnings"]),
        now_iso
    ))
    conn.commit()
    conn.close()

    return {
        "id": file_id,
        "filename": target_filename,
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
        "is_solidworks": False,
        "created_at": now_iso
    }


@router.post("/projects/save")
def save_forge_project(req: SaveProjectRequest):
    """Saves the current ForgeAI studio session as a reusable project."""
    session = HybridCadEngine.get_or_create_session(req.session_id)
    if session.current_mesh is None:
        raise HTTPException(status_code=400, detail="Cannot save an empty project without 3D geometry.")

    project_id = req.project_id if (req.project_id and req.project_id.strip()) else f"PRJ-{uuid.uuid4().hex[:8].upper()}"
    name = (req.name or "").strip() or "Untitled ForgeAI Design"

    # Export STL and GLB for persistent project storage
    stl_file = os.path.join(UPLOADS_DIR, f"{req.session_id}.stl")
    HybridCadEngine.export_session_stl(req.session_id, stl_file)
    glb_file = os.path.join(UPLOADS_DIR, f"{req.session_id}.glb")
    HybridCadEngine.export_session_glb(req.session_id, glb_file)

    proj_stl = os.path.join(FORGE_PROJECTS_DIR, f"{project_id}.stl")
    proj_glb = os.path.join(FORGE_PROJECTS_DIR, f"{project_id}.glb")
    shutil.copyfile(stl_file, proj_stl)
    shutil.copyfile(glb_file, proj_glb)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE role = 'user' LIMIT 1")
    user_row = cursor.fetchone()
    user_id = user_row["id"] if user_row else "default-user"
    now_iso = datetime.now(timezone.utc).isoformat()

    mesh = session.current_mesh
    extents = [0.0, 0.0, 0.0]
    if mesh is not None:
        extents = [round(float(x), 2) for x in (mesh.bounds[1] - mesh.bounds[0])]

    feature_tree_data = [f.to_dict() for f in session.feature_tree]

    cursor.execute("SELECT id FROM forge_projects WHERE id = ?", (project_id,))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
        UPDATE forge_projects SET
            name = ?,
            session_id = ?,
            feature_tree_json = ?,
            history_index = ?,
            material_id = ?,
            solid_volume_cm3 = ?,
            hollowed_volume_cm3 = ?,
            is_hollowed = ?,
            bbox_x = ?,
            bbox_y = ?,
            bbox_z = ?,
            glb_path = ?,
            stl_path = ?,
            engine_used = ?,
            updated_at = ?
        WHERE id = ?
        """, (
            name, req.session_id, json.dumps(feature_tree_data), session.history_index,
            req.material_id, session.solid_volume_cm3, session.hollowed_volume_cm3,
            1 if session.is_hollowed else 0, extents[0], extents[1], extents[2],
            proj_glb, proj_stl, getattr(session, "engine_used", "procedural"), now_iso,
            project_id
        ))
    else:
        cursor.execute("""
        INSERT INTO forge_projects (
            id, user_id, name, session_id, feature_tree_json, history_index,
            material_id, solid_volume_cm3, hollowed_volume_cm3, is_hollowed,
            bbox_x, bbox_y, bbox_z, glb_path, stl_path, engine_used, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            project_id, user_id, name, req.session_id, json.dumps(feature_tree_data), session.history_index,
            req.material_id, session.solid_volume_cm3, session.hollowed_volume_cm3,
            1 if session.is_hollowed else 0, extents[0], extents[1], extents[2],
            proj_glb, proj_stl, getattr(session, "engine_used", "procedural"), now_iso, now_iso
        ))

    conn.commit()
    conn.close()

    return {
        "project_id": project_id,
        "name": name,
        "material_id": req.material_id,
        "message": f"Project '{name}' saved successfully!"
    }


@router.get("/projects")
def list_forge_projects():
    """Lists all saved ForgeAI projects."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, name, session_id, feature_tree_json, history_index, material_id,
           solid_volume_cm3, hollowed_volume_cm3, is_hollowed,
           bbox_x, bbox_y, bbox_z, engine_used, created_at, updated_at
    FROM forge_projects
    ORDER BY updated_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    projects = []
    for r in rows:
        d = dict(r)
        try:
            tree = json.loads(d["feature_tree_json"])
            d["feature_count"] = len(tree)
            base_prompt = ""
            if tree and len(tree) > 0:
                base_prompt = tree[0].get("params", {}).get("prompt", "")
            d["base_prompt"] = base_prompt
        except Exception:
            d["feature_count"] = 0
            d["base_prompt"] = ""
        del d["feature_tree_json"]
        d["bbox"] = [d["bbox_x"], d["bbox_y"], d["bbox_z"]]
        projects.append(d)

    return projects


@router.post("/projects/{project_id}/load")
def load_forge_project(project_id: str):
    """Loads a saved ForgeAI project into a fresh active studio session."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM forge_projects WHERE id = ?
    """, (project_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Project not found")

    d = dict(row)
    tree_data = json.loads(d["feature_tree_json"])

    # Create a new active session ID for editing
    new_session_id = str(uuid.uuid4())
    session = HybridCadEngine.get_or_create_session(new_session_id)

    # Restore feature tree
    session.feature_tree = [
        FeatureItem(item["feature_type"], item["params"], item.get("label"))
        for item in tree_data
    ]
    session.history_index = d["history_index"]
    session.solid_volume_cm3 = d["solid_volume_cm3"]
    session.hollowed_volume_cm3 = d["hollowed_volume_cm3"]
    session.is_hollowed = bool(d["is_hollowed"])
    session.engine_used = d.get("engine_used", "procedural")

    # Restore geometry files
    session_stl = os.path.join(UPLOADS_DIR, f"{new_session_id}.stl")
    session_glb = os.path.join(UPLOADS_DIR, f"{new_session_id}.glb")

    proj_stl = d["stl_path"]
    proj_glb = d["glb_path"]

    if proj_stl and os.path.exists(proj_stl):
        shutil.copyfile(proj_stl, session_stl)
        try:
            session.current_mesh = trimesh.load(session_stl)
        except Exception as e:
            print("Failed to load mesh from saved stl:", e)

    if proj_glb and os.path.exists(proj_glb):
        shutil.copyfile(proj_glb, session_glb)
    elif session.current_mesh is not None:
        HybridCadEngine.export_session_glb(new_session_id, session_glb)

    state = HybridCadEngine.get_session_state(new_session_id)
    return {
        "project_id": project_id,
        "name": d["name"],
        "material_id": d["material_id"],
        "session_state": state,
        "message": f"Successfully loaded project '{d['name']}'"
    }


@router.delete("/projects/{project_id}")
def delete_forge_project(project_id: str):
    """Deletes a saved ForgeAI project."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT glb_path, stl_path FROM forge_projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    if row:
        for p in [row["glb_path"], row["stl_path"]]:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass
    cursor.execute("DELETE FROM forge_projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()

    return {"message": "Project deleted successfully", "project_id": project_id}

