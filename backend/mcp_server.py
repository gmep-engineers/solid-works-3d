"""
FastMCP Server for ForgeAI: Hybrid CAD & Mesh-to-Metal Tools.
Exposes the 7 core tools defined in the B2C customizer architecture:
1. create_or_import_base
2. slice_by_plane
3. solidworks_feature_on_face
4. attach_custom_pedestal
5. attach_hardware_loop
6. auto_hollow_for_metal_slm
7. export_interactive_scene_and_quote
"""

import os
from typing import Dict, Any, List, Optional
from fastmcp import FastMCP
from services.hybrid_cad import HybridCadEngine
from services.ip_guard import IPGuardService

mcp = FastMCP("ForgeAI-Metal-3D-Printing-Customizer")


@mcp.tool()
def create_or_import_base(
    session_id: str,
    mode: str = "ai_organic",
    prompt: str = "Heroic Paladin Figurine",
    height_mm: float = 60.0,
    preset_key: Optional[str] = None,
    shape: Optional[str] = "Cylinder"
) -> Dict[str, Any]:
    """
    Creates or imports the base 3D geometry for a session.
    mode: 'ai_organic' (text/preset to organic sculpture) or 'parametric' (Box, Cylinder, Ring, Hexagon).
    Checks prompt with IP-Guard to prevent commercial copyright violations.
    """
    sanitized = IPGuardService.inspect_and_sanitize(prompt)
    effective_prompt = sanitized["clean_prompt"]

    params = {
        "mode": mode,
        "prompt": effective_prompt,
        "height_mm": height_mm,
        "preset_key": preset_key,
        "shape": shape,
        "ip_guard": sanitized
    }
    res = HybridCadEngine.execute_feature(session_id, "create_base", params)
    res["ip_guard_notice"] = sanitized.get("notice")
    return res


@mcp.tool()
def slice_by_plane(
    session_id: str,
    origin: List[float] = [0.0, 0.0, 2.0],
    normal: List[float] = [0.0, 0.0, 1.0],
    keep_side: str = "positive"
) -> Dict[str, Any]:
    """
    Executes a planar cut across the mesh (e.g. flattening figurine feet, bevel cut, statue bust).
    origin: 3D point on the cutting plane [X, Y, Z].
    normal: Plane normal vector [nX, nY, nZ].
    keep_side: 'positive' or 'negative'.
    """
    params = {
        "origin": origin,
        "normal": normal,
        "keep_side": keep_side
    }
    return HybridCadEngine.execute_feature(session_id, "slice_plane", params)


@mcp.tool()
def solidworks_feature_on_face(
    session_id: str,
    face_id: str = "BOTTOM",
    sketch_type: str = "CIRCLE",
    dimensions: Optional[Dict[str, float]] = None,
    operation: str = "CUT",
    depth: float = 4.0
) -> Dict[str, Any]:
    """
    Executes a SolidWorks-style sketch & extrude/cut on a chosen face.
    sketch_type: 'CIRCLE', 'RECTANGLE', 'SLOT', 'POLYGON'.
    operation: 'ADD' (Boss-Extrude) or 'SUBTRACT' / 'CUT' (Pocket / Hole).
    depth: Extrusion/cut depth in mm.
    """
    if dimensions is None:
        dimensions = {"radius_mm": 3.0}
    params = {
        "face_id": face_id,
        "sketch_type": sketch_type,
        "dimensions": dimensions,
        "operation": operation,
        "depth": depth
    }
    return HybridCadEngine.execute_feature(session_id, "feature_on_face", params)


@mcp.tool()
def attach_custom_pedestal(
    session_id: str,
    shape: str = "round",
    diameter_mm: float = 32.0,
    height_mm: float = 6.0,
    front_emboss_text: str = "",
    magnet_hole_diameter_mm: float = 5.2
) -> Dict[str, Any]:
    """
    Attaches a precision build123d pedestal (tabletop base or trophy plinth) with optional
    front embossed text and bottom recess for a neodymium magnet.
    """
    params = {
        "shape": shape,
        "diameter_mm": diameter_mm,
        "height_mm": height_mm,
        "front_emboss_text": front_emboss_text,
        "magnet_hole_diameter_mm": magnet_hole_diameter_mm
    }
    return HybridCadEngine.execute_feature(session_id, "attach_pedestal", params)


@mcp.tool()
def attach_hardware_loop(
    session_id: str,
    position: str = "top",
    inner_diam_mm: float = 4.5,
    wall_thickness_mm: float = 2.0
) -> Dict[str, Any]:
    """
    Welds a high-strength eyelet torus loop onto model top or rear for keychains, pendants, or mounts.
    """
    params = {
        "position": position,
        "inner_diam_mm": inner_diam_mm,
        "wall_thickness_mm": wall_thickness_mm
    }
    return HybridCadEngine.execute_feature(session_id, "hardware_loop", params)


@mcp.tool()
def auto_hollow_for_metal_slm(
    session_id: str,
    wall_thickness_mm: float = 2.0,
    drain_hole_diam_mm: float = 4.0
) -> Dict[str, Any]:
    """
    Hollows internal solid geometry to reduce metal powder volume and prints vertical drainage hole
    through the bottom base to allow un-sintered metal powder to escape. Saves up to 60% of manufacturing cost.
    """
    params = {
        "wall_thickness_mm": wall_thickness_mm,
        "drain_hole_diam_mm": drain_hole_diam_mm
    }
    return HybridCadEngine.execute_feature(session_id, "auto_hollow", params)


@mcp.tool()
def export_interactive_scene_and_quote(session_id: str) -> Dict[str, Any]:
    """
    Exports scene metadata, bounding box, solid vs hollowed volume, and real-time metal pricing tiers
    (Antique Bronze Infused Steel, 316L Stainless Steel, Ti6Al4V Titanium) with shared build-plate discounts.
    """
    return HybridCadEngine.get_session_state(session_id)


if __name__ == "__main__":
    mcp.run()
