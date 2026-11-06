"""
Gemini LLM-to-CAD Engine for ForgeAI.
Uses Google Gemini (gemini-2.5-flash) to translate natural language prompts into
executable parametric OpenCASCADE B-Rep Python code via build123d.
Includes self-healing execution sandbox and automatic tessellation to watertight 3D meshes.
"""

import os
import re
import math
import uuid
import numpy as np
import trimesh
from typing import Optional, Dict, Any, Tuple

try:
    import build123d as bd
except ImportError:
    bd = None

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None


class GeminiCadService:
    """Translates arbitrary prompts into solid build123d B-Rep CAD geometry via Gemini."""

    SYSTEM_PROMPT = """You are an elite Senior Parametric CAD Engineer and Computational Geometry expert.
Your mission is to translate natural language descriptions of objects, figurines, hardware mounts, EDC items, containers, or mechanisms into clean, robust, executable Python code using the `build123d` library (OpenCASCADE B-Rep).

CRITICAL REQUIREMENTS:
1. Output ONLY a valid Python code block enclosed in ```python and ```. Do NOT include markdown explanations, chit-chat, or greetings.
2. The code must import `build123d as bd` and `math`.
3. Construct the entire part as a watertight, physically printable 3D Solid or Compound.
4. Assign the final 3D geometry to a variable strictly named `result_solid` (e.g. `result_solid = part.part` or `result_solid = solid_union`).
5. All dimensions must be in millimeters (mm). Normal range is 20mm to 100mm.
6. Use reliable, robust build123d primitives and boolean operations:
   - Functional / CSG syntax: `bd.Box(...)`, `bd.Cylinder(...)`, `bd.Sphere(...)`, `bd.Cone(...)`, `bd.Torus(...)`.
   - Booleans: `solid1 + solid2` (union), `solid1 - solid2` (cut / subtract), `solid1 & solid2` (intersection).
   - Transforms: `bd.Pos(x, y, z) * solid`, `bd.Rot(rx, ry, rz) * solid`.
   - Builder mode: `with bd.BuildPart() as p:` blocks are also supported.
7. Ensure parts are solid with realistic wall thicknesses (at least 2.0mm). Avoid zero-thickness walls or unbonded coincident faces.

FEW-SHOT EXAMPLES:

Example 1: "Coffee mug with curved handle"
```python
import build123d as bd
import math

# Outer cup body
outer = bd.Cylinder(radius=20.0, height=50.0)
# Hollow inner core (leave 2.5mm bottom and 2.5mm walls)
inner = bd.Pos(0, 0, 2.5) * bd.Cylinder(radius=17.5, height=50.0)
cup = outer - inner

# Handle: torus cut in half and attached to side
handle_ring = bd.Pos(20.0, 0, 25.0) * bd.Rot(0, 90, 0) * bd.Torus(major_radius=12.0, minor_radius=3.5)
cutter = bd.Pos(10.0, 0, 25.0) * bd.Box(30.0, 30.0, 30.0)
handle = handle_ring - cutter

result_solid = cup + handle
```

Example 2: "Hexagonal desk pen holder with tapered pencil slots"
```python
import build123d as bd
import math

# Outer hexagonal body
with bd.BuildPart() as holder:
    with bd.BuildSketch():
        bd.RegularPolygon(radius=30.0, side_count=6)
    bd.extrude(amount=60.0)
    
    # Central pocket
    with bd.BuildSketch():
        bd.Circle(radius=16.0)
    bd.extrude(amount=-55.0, mode=bd.Mode.SUBTRACT)
    
    # 6 surrounding pen holes
    for i in range(6):
        ang = i * (math.pi / 3.0)
        hx = 21.0 * math.cos(ang)
        hy = 21.0 * math.sin(ang)
        with bd.BuildSketch(bd.Plane.XY.offset(60.0)):
            with bd.Locations((hx, hy)):
                bd.Circle(radius=5.5)
        bd.extrude(amount=-50.0, mode=bd.Mode.SUBTRACT)

result_solid = holder.part
```

Example 3: "Dovetail mounting bracket with counterbored screw holes"
```python
import build123d as bd

# Base block
base = bd.Box(50.0, 40.0, 15.0)

# Dovetail groove on top face
groove_outer = bd.Pos(0, 0, 7.5) * bd.Box(18.0, 45.0, 8.0)
groove_wedge = bd.Pos(0, 0, 10.0) * bd.Box(24.0, 45.0, 6.0)
bracket = base - groove_outer - groove_wedge

# Screw holes
h1 = bd.Pos(-16.0, 0, 0) * bd.Cylinder(radius=2.5, height=20.0)
h2 = bd.Pos(16.0, 0, 0) * bd.Cylinder(radius=2.5, height=20.0)
result_solid = bracket - h1 - h2
```
"""

    @classmethod
    def get_api_key(cls, user_key: Optional[str] = None) -> Optional[str]:
        """Resolves Gemini API key from user parameter or environment."""
        if user_key and len(user_key.strip()) > 10:
            return user_key.strip()
        return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    @classmethod
    def is_available(cls, user_key: Optional[str] = None) -> bool:
        """Checks if Gemini SDK and API key are available."""
        return genai is not None and cls.get_api_key(user_key) is not None

    @classmethod
    def generate_cad_code(
        cls,
        prompt: str,
        api_key: Optional[str] = None,
        target_height_mm: float = 60.0,
        model_name: str = "gemini-2.5-flash"
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Uses Gemini to generate build123d Python CAD code from user's prompt.
        Returns (code_str, error_message).
        """
        key = cls.get_api_key(api_key)
        if not key:
            return None, "No Gemini API Key configured. Please enter your Gemini API Key in AI Settings."

        if not genai:
            return None, "google-genai SDK is not installed."

        try:
            client = genai.Client(api_key=key)
            user_msg = f"""User Request: "{prompt}"
Target finished height: approximately {target_height_mm:.1f} mm.
Generate clean build123d Python code that constructs a watertight solid for this exact request.
Assign the final solid to `result_solid`."""

            candidates = [model_name, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite"]
            last_err = None
            response = None

            for m_name in candidates:
                try:
                    response = client.models.generate_content(
                        model=m_name,
                        contents=user_msg,
                        config=types.GenerateContentConfig(
                            system_instruction=cls.SYSTEM_PROMPT,
                            temperature=0.2,
                            top_p=0.95,
                            max_output_tokens=2048,
                        )
                    )
                    if response and response.text:
                        break
                except Exception as m_err:
                    last_err = str(m_err)
                    continue

            if not response or not response.text:
                return None, f"Gemini API error: {last_err or 'No response generated.'}"

            code = cls._extract_python_code(response.text)
            if not code:
                return None, "Gemini did not return a valid Python code block."

            return code, None
        except Exception as e:
            print("[GeminiCadService] API error:", e)
            return None, f"Gemini API error: {str(e)}"

    @classmethod
    def execute_cad_code_to_mesh(
        cls,
        code_str: str,
        prompt: str = "",
        api_key: Optional[str] = None,
        max_retries: int = 1
    ) -> Tuple[Optional[trimesh.Trimesh], Optional[str], str]:
        """
        Executes build123d Python CAD code in a sandbox, extracting `result_solid`
        and tessellating to a clean, watertight trimesh.
        Includes a self-healing retry loop back to Gemini if syntax/CAD errors occur.
        Returns (mesh, error_msg, final_executed_code).
        """
        if not bd:
            return None, "build123d library is not available on this server.", code_str

        current_code = code_str
        last_error = None

        for attempt in range(max_retries + 1):
            # Sandbox namespace
            local_vars = {
                "bd": bd,
                "math": math,
                "np": np,
                "trimesh": trimesh,
                "result_solid": None
            }

            try:
                exec(current_code, local_vars)
                result = local_vars.get("result_solid")

                if result is None:
                    # Look for fallback variable names
                    for k in ["part", "solid", "cup", "holder", "model", "mesh"]:
                        if k in local_vars and local_vars[k] is not None:
                            result = local_vars[k]
                            break

                if result is None:
                    raise ValueError("Code executed successfully but `result_solid` was not defined.")

                # If result is already a trimesh
                if isinstance(result, trimesh.Trimesh):
                    return result, None, current_code

                # Convert build123d Solid/Compound/Part to trimesh
                mesh = cls._build123d_to_trimesh(result)
                if mesh is not None and len(mesh.faces) > 0:
                    return mesh, None, current_code
                else:
                    raise ValueError("Tessellation produced empty mesh faces.")

            except Exception as exc:
                last_error = str(exc)
                print(f"[GeminiCadService] Attempt {attempt + 1} execution error: {last_error}")

                # If we have retries left and an API key, ask Gemini to self-heal
                if attempt < max_retries and api_key and genai:
                    print("[GeminiCadService] Requesting Gemini self-healing fix...")
                    fixed_code = cls._request_gemini_fix(current_code, last_error, prompt, api_key)
                    if fixed_code:
                        current_code = fixed_code
                        continue

        return None, f"CAD Execution Error: {last_error}", current_code

    @classmethod
    def _request_gemini_fix(
        cls,
        broken_code: str,
        error_msg: str,
        original_prompt: str,
        api_key: str
    ) -> Optional[str]:
        """Self-healing loop: asks Gemini to fix the build123d error."""
        try:
            client = genai.Client(api_key=api_key)
            fix_prompt = f"""The following build123d Python code for "{original_prompt}" failed during execution.

BROKEN CODE:
```python
{broken_code}
```

ERROR ENCOUNTERED:
{error_msg}

Please fix the build123d syntax or geometry logic so it runs cleanly without errors.
Output ONLY the corrected Python code inside a ```python block. Ensure `result_solid` is defined."""

            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=fix_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=cls.SYSTEM_PROMPT,
                    temperature=0.1,
                    max_output_tokens=2048,
                )
            )
            return cls._extract_python_code(resp.text or "")
        except Exception as e:
            print("[GeminiCadService] Self-healing error:", e)
            return None

    @classmethod
    def generate_mesh_from_prompt(
        cls,
        prompt: str,
        api_key: Optional[str] = None,
        target_height_mm: float = 60.0
    ) -> Tuple[Optional[trimesh.Trimesh], Optional[str], Optional[str]]:
        """
        High-level orchestrator: Prompt -> Gemini -> Python CAD code -> Watertight Mesh.
        Returns (mesh, generated_code, error_message).
        """
        code, err = cls.generate_cad_code(prompt, api_key=api_key, target_height_mm=target_height_mm)
        if err or not code:
            return None, None, err

        mesh, exec_err, final_code = cls.execute_cad_code_to_mesh(code, prompt=prompt, api_key=api_key)
        if exec_err or mesh is None:
            return None, final_code, exec_err

        # Ground bottom at Z=0, center XY on origin, scale to target height
        bounds = mesh.bounds
        extents = bounds[1] - bounds[0]
        max_dim = np.max(extents)
        if max_dim > 1e-4 and target_height_mm > 0:
            scale = target_height_mm / max_dim
            mesh.apply_scale(scale)

        new_bounds = mesh.bounds
        center_x = (new_bounds[0][0] + new_bounds[1][0]) / 2.0
        center_y = (new_bounds[0][1] + new_bounds[1][1]) / 2.0
        min_z = new_bounds[0][2]
        mesh.apply_translation([-center_x, -center_y, -min_z])

        return mesh, final_code, None

    @staticmethod
    def _extract_python_code(text: str) -> Optional[str]:
        """Extracts python code from markdown block or raw text."""
        match = re.search(r"```python\s*(.*?)\s*```", text, re.DOTALL)
        if match:
            return match.group(1).strip()
        match_generic = re.search(r"```\s*(.*?)\s*```", text, re.DOTALL)
        if match_generic:
            return match_generic.group(1).strip()
        # Fallback if raw python returned
        if "import build123d" in text:
            return text.strip()
        return None

    @staticmethod
    def _build123d_to_trimesh(bd_obj) -> Optional[trimesh.Trimesh]:
        """Tessellates a build123d Solid, Compound, or Part into a trimesh."""
        temp_stl = f"temp_gemini_{uuid.uuid4().hex[:8]}.stl"
        try:
            # Handle BuildPart object
            if hasattr(bd_obj, "part") and bd_obj.part is not None:
                bd_obj = bd_obj.part

            bd.export_stl(bd_obj, temp_stl, tolerance=0.015, angular_tolerance=0.12)
            mesh = trimesh.load(temp_stl, file_type="stl")
            return mesh
        finally:
            if os.path.exists(temp_stl):
                try:
                    os.remove(temp_stl)
                except Exception:
                    pass
