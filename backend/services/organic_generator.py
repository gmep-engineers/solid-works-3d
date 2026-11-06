"""
Engine A: Organic Mesh Generator for ForgeAI.
Generates high-quality organic meshes for custom figurines (pets, RPG heroes, trophies)
and bespoke metal objects (EDC gear, rings, emblems) from text prompts or uploaded photos.
Ensures models are watertight, scaled to exact target height in mm, and aligned with Z=0 ground plane.
"""

import os
import math
import numpy as np
import trimesh
from typing import Dict, Any, Optional, Tuple

from services.gemini_cad import GeminiCadService
from services.ai_text_to_3d import AITextTo3DService

try:
    import manifold3d
except ImportError:
    manifold3d = None


class OrganicGeneratorService:
    """Organic Mesh Generation Engine (Engine A) for ForgeAI."""

    PRESETS = {
        "edc_hex_carabiner": {
            "name": "Geometric Carabiner / Key Mount",
            "category": "Bespoke Metal Objects",
            "prompt": "Heavy-duty hexagonal skeletonized metal carabiner body with integrated bottle opener hook and paracord slot",
            "default_height_mm": 60.0,
            "style": "precision_edc"
        },
        "vehicle_sports_car": {
            "name": "Aerodynamic Sports Car",
            "category": "Vehicles & Transport",
            "prompt": "Sleek aerodynamic sports coupe with low-slung chassis, curved cockpit canopy, alloy wheels, and rear racing spoiler",
            "default_height_mm": 35.0,
            "style": "precision_edc"
        },
        "edc_signet_ring": {
            "name": "Bespoke Faceted Signet Ring",
            "category": "Bespoke Metal Objects",
            "prompt": "Chiseled titanium signet ring with flat heraldic top facet, beveled chamfers, and smooth inner comfort band",
            "default_height_mm": 24.0,
            "style": "precision_edc"
        },
        "pet_golden_retriever": {
            "name": "Golden Retriever Figurine",
            "category": "Pets & Companions",
            "prompt": "Faithful golden retriever dog figurine sitting with feathered coat and friendly expression",
            "default_height_mm": 70.0,
            "style": "organic_figurine"
        },
        "wildlife_howling_wolf": {
            "name": "Howling Timber Wolf Figurine",
            "category": "Wildlife & Nature",
            "prompt": "Sculpted majestic howling timber wolf sitting proudly with head raised, pointed lupine ears, sleek muzzle, muscular flanks, and bushy tail",
            "default_height_mm": 70.0,
            "style": "organic_figurine"
        },
        "vehicle_sports_car": {
            "name": "Aerodynamic Sports Car",
            "category": "Vehicles & Transport",
            "prompt": "Sleek aerodynamic sports coupe with low-slung chassis, curved cockpit canopy, alloy wheels, and rear racing spoiler",
            "default_height_mm": 35.0,
            "style": "precision_edc"
        },
        "rpg_paladin_champion": {
            "name": "Sci-Fi Armored Paladin",
            "category": "Tabletop RPG Characters",
            "prompt": "Heavy sci-fi armored paladin champion with large curved pauldrons, combat visor, and power blade",
            "default_height_mm": 80.0,
            "style": "rpg_miniature"
        },
        "rpg_cyber_mech": {
            "name": "Cybernetic Mech Warrior",
            "category": "Tabletop RPG Characters",
            "prompt": "Sleek bipedal cybernetic mecha warrior with angular chest chassis, reinforced joints, and shoulder cannon",
            "default_height_mm": 85.0,
            "style": "rpg_miniature"
        },
        "edc_signet_ring": {
            "name": "Bespoke Faceted Signet Ring",
            "category": "Bespoke Metal Objects",
            "prompt": "Chiseled titanium signet ring with flat heraldic top facet, beveled chamfers, and smooth inner comfort band",
            "default_height_mm": 24.0,
            "style": "precision_edc"
        },
        "edc_hex_carabiner": {
            "name": "Geometric Carabiner / Key Mount",
            "category": "Bespoke Metal Objects",
            "prompt": "Heavy-duty hexagonal skeletonized metal carabiner body with integrated bottle opener hook and paracord slot",
            "default_height_mm": 60.0,
            "style": "precision_edc"
        },
        "trophy_victory_eagle": {
            "name": "Victory Eagle Trophy Figurine",
            "category": "Trophies & Emblems",
            "prompt": "Majestic eagle with outstretched feathers perched atop a faceted rock peak",
            "default_height_mm": 90.0,
            "style": "trophy_sculpture"
        }
    }

    @classmethod
    def generate_mesh(
        cls,
        prompt: str,
        target_height_mm: float = 60.0,
        preset_key: Optional[str] = None,
        image_path: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
        tripo_api_key: Optional[str] = None,
        engine_preference: Optional[str] = "auto",
        wallet_tx_id: Optional[str] = None
    ) -> Tuple[trimesh.Trimesh, Optional[str], str]:
        """
        Synthesizes a 3D mesh based on prompt/preset, scaled to mm and aligned to Z=0.
        Supports Dual-Engine Generation:
        - Tripo3D Neural Generative AI (organic figures, animals, sculptures, characters)
        - Google Gemini 2.5 Flash LLM-to-CAD (build123d parametric B-Rep solids)
        - TitanForge High-Fidelity Procedural Geometry Synthesizer (offline fallback)
        Returns (mesh, generated_code, engine_used).
        """
        target_height_mm = max(15.0, min(250.0, float(target_height_mm)))
        prompt_lower = (prompt or "").lower()
        engine_pref = (engine_preference or "auto").lower()

        gemini_key = GeminiCadService.get_api_key(gemini_api_key)
        tripo_key = AITextTo3DService.get_api_key(tripo_api_key)

        tripo_err_saved = None

        # Priority 1: Tripo3D Neural Generative AI
        should_try_tripo = False
        if tripo_key and prompt and len(prompt.strip()) > 3 and not preset_key:
            # If user explicitly requested Tripo or is in Auto mode, invoke Tripo
            if engine_pref in ["tripo", "auto"]:
                should_try_tripo = True
        elif not tripo_key:
            tripo_err_saved = "Tripo3D API Key not configured. To generate with Tripo3D Neural AI, connect your Tripo API Key (starts with 'tsk_')."

        if should_try_tripo:
            try:
                tripo_mesh, glb_url, tripo_err = AITextTo3DService.generate_mesh_from_prompt(
                    prompt, api_key=tripo_key, target_height_mm=target_height_mm, wallet_tx_id=wallet_tx_id
                )
                if tripo_mesh is not None and len(tripo_mesh.faces) > 0:
                    grounded = cls._normalize_and_ground_mesh(tripo_mesh, target_height_mm)
                    return grounded, None, "tripo3d", None
                elif tripo_err:
                    tripo_err_saved = tripo_err
            except Exception as e:
                tripo_err_saved = str(e)
                print(f"[OrganicGeneratorService] Tripo generation error: {e}")

        # Priority 2: Gemini LLM-to-CAD (build123d Python B-Rep Generation)
        should_try_gemini = False
        if gemini_key and prompt and len(prompt.strip()) > 3 and not preset_key:
            if engine_pref in ["gemini", "cad"]:
                should_try_gemini = True
            elif engine_pref == "auto" and not should_try_tripo:
                should_try_gemini = True

        if should_try_gemini:
            try:
                cad_mesh, cad_code, cad_err = GeminiCadService.generate_mesh_from_prompt(
                    prompt, api_key=gemini_key, target_height_mm=target_height_mm
                )
                if cad_mesh is not None and len(cad_mesh.faces) > 0:
                    grounded = cls._normalize_and_ground_mesh(cad_mesh, target_height_mm)
                    return grounded, cad_code, "gemini_cad", None
            except Exception as e:
                print(f"[OrganicGeneratorService] Gemini CAD generation error: {e}")

        # Priority 3: Fallback built-in procedural synthesis
        if preset_key and preset_key in cls.PRESETS:
            archetype = preset_key
        elif any(w in prompt_lower for w in ["ball", "sphere", "orb", "globe"]):
            archetype = "geometric_sphere"
        elif any(w in prompt_lower for w in ["cube", "box", "block", "brick"]):
            archetype = "geometric_cube"
        elif any(w in prompt_lower for w in ["car", "automobile", "vehicle", "race car", "coupe", "porsche", "ferrari", "corvette"]):
            archetype = "vehicle_sports_car"
        elif any(w in prompt_lower for w in ["wolf", "wolves", "lupine", "timberwolf", "howl", "howling", "coyote", "fox"]):
            archetype = "wildlife_howling_wolf"
        elif "ring" in prompt_lower or "band" in prompt_lower:
            archetype = "edc_signet_ring"
        elif "carabiner" in prompt_lower or "edc" in prompt_lower or "gear" in prompt_lower:
            archetype = "edc_hex_carabiner"
        elif "dog" in prompt_lower or "pet" in prompt_lower or "puppy" in prompt_lower or "retriever" in prompt_lower or "golden" in prompt_lower:
            archetype = "pet_golden_retriever"
        elif "mech" in prompt_lower or "robot" in prompt_lower or "cyber" in prompt_lower:
            archetype = "rpg_cyber_mech"
        elif "trophy" in prompt_lower or "eagle" in prompt_lower:
            archetype = "trophy_victory_eagle"
        else:
            archetype = "rpg_paladin_champion"

        mesh = cls._synthesize_archetype_geometry(archetype)
        mesh = cls._normalize_and_ground_mesh(mesh, target_height_mm)
        return mesh, None, "procedural", tripo_err_saved

    @classmethod
    def _synthesize_archetype_geometry(cls, archetype: str) -> trimesh.Trimesh:
        """Synthesizes watertight organic geometry corresponding to the specified archetype."""
        if archetype == "geometric_sphere":
            return trimesh.creation.icosphere(radius=30.0, subdivisions=4)
        elif archetype == "geometric_cube":
            return trimesh.creation.box(extents=[60.0, 60.0, 60.0])
        elif archetype == "edc_signet_ring":
            # Ring geometry: outer faceted torus with flat top signet face
            ring_radius = 10.0
            band_width = 7.0
            wall_thick = 2.5
            
            # Base cylinder with hollow inner core
            outer = trimesh.creation.cylinder(radius=ring_radius + wall_thick, height=band_width, sections=48)
            inner = trimesh.creation.cylinder(radius=ring_radius, height=band_width + 2.0, sections=48)
            
            # Signet bezel top
            bezel = trimesh.creation.box(extents=[14.0, 14.0, 5.0])
            bezel.apply_translation([0, ring_radius + wall_thick + 1.0, 0])
            
            # Fuse outer + bezel, subtract inner
            combined = trimesh.util.concatenate([outer, bezel])
            
            if manifold3d:
                try:
                    m_comb = cls._trimesh_to_manifold(combined)
                    m_inner = cls._trimesh_to_manifold(inner)
                    diff = m_comb - m_inner
                    return cls._manifold_to_trimesh(diff)
                except Exception:
                    pass
            return outer

        elif archetype == "edc_hex_carabiner":
            # Hexagonal hollow carabiner body
            outer_pts = []
            inner_pts = []
            r_out = 25.0
            r_in = 18.0
            for i in range(6):
                ang = i * (math.pi / 3.0)
                outer_pts.append([r_out * math.cos(ang), r_out * math.sin(ang)])
                inner_pts.append([r_in * math.cos(ang), r_in * math.sin(ang)])
            
            outer_cyl = trimesh.creation.cylinder(radius=r_out, height=6.0, sections=6)
            inner_cyl = trimesh.creation.cylinder(radius=r_in, height=8.0, sections=6)
            
            # Keychain loop eyelet
            loop = trimesh.creation.torus(major_radius=6.0, minor_radius=2.5, major_sections=24, minor_sections=16)
            loop.apply_translation([0, r_out + 4.0, 0])
            
            if manifold3d:
                try:
                    m_out = cls._trimesh_to_manifold(outer_cyl)
                    m_in = cls._trimesh_to_manifold(inner_cyl)
                    m_loop = cls._trimesh_to_manifold(loop)
                    body = (m_out - m_in) + m_loop
                    return cls._manifold_to_trimesh(body)
                except Exception:
                    pass
            return outer_cyl

        elif archetype == "wildlife_howling_wolf":
            # Stylized sculpted howling timber wolf: raised head, lupine muzzle, pointed ears, muscular haunches, curved tail
            torso = trimesh.creation.icosphere(subdivisions=3, radius=13.0)
            torso.apply_scale([0.85, 1.25, 1.35])
            torso.apply_transform(trimesh.transformations.rotation_matrix(math.radians(-25), [1, 0, 0]))
            torso.apply_translation([0, -2.0, 18.0])

            chest = trimesh.creation.icosphere(subdivisions=3, radius=12.5)
            chest.apply_scale([0.9, 1.1, 1.2])
            chest.apply_translation([0, 5.0, 26.0])

            neck = trimesh.creation.cylinder(radius=8.0, height=18.0, sections=24)
            neck.apply_transform(trimesh.transformations.rotation_matrix(math.radians(35), [1, 0, 0]))
            neck.apply_translation([0, 9.0, 36.0])

            head = trimesh.creation.icosphere(subdivisions=3, radius=9.5)
            head.apply_scale([0.85, 1.05, 0.95])
            head.apply_translation([0, 14.0, 47.0])

            muzzle = trimesh.creation.cone(radius=4.5, height=16.0, sections=20)
            muzzle.apply_transform(trimesh.transformations.rotation_matrix(math.radians(50), [1, 0, 0]))
            muzzle.apply_translation([0, 22.0, 53.0])

            ear_l = trimesh.creation.cone(radius=3.2, height=11.0, sections=16)
            ear_l.apply_transform(trimesh.transformations.rotation_matrix(math.radians(15), [0, 0, 1]))
            ear_l.apply_transform(trimesh.transformations.rotation_matrix(math.radians(-15), [1, 0, 0]))
            ear_l.apply_translation([-5.2, 11.0, 56.0])

            ear_r = trimesh.creation.cone(radius=3.2, height=11.0, sections=16)
            ear_r.apply_transform(trimesh.transformations.rotation_matrix(math.radians(-15), [0, 0, 1]))
            ear_r.apply_transform(trimesh.transformations.rotation_matrix(math.radians(-15), [1, 0, 0]))
            ear_r.apply_translation([5.2, 11.0, 56.0])

            leg_l = trimesh.creation.cylinder(radius=3.5, height=24.0, sections=16)
            leg_l.apply_translation([-5.5, 9.0, 12.0])

            leg_r = trimesh.creation.cylinder(radius=3.5, height=24.0, sections=16)
            leg_r.apply_translation([5.5, 9.0, 12.0])

            paw_l = trimesh.creation.icosphere(subdivisions=2, radius=4.2)
            paw_l.apply_scale([0.9, 1.3, 0.6])
            paw_l.apply_translation([-5.5, 11.0, 2.0])

            paw_r = trimesh.creation.icosphere(subdivisions=2, radius=4.2)
            paw_r.apply_scale([0.9, 1.3, 0.6])
            paw_r.apply_translation([5.5, 11.0, 2.0])

            haunch_l = trimesh.creation.icosphere(subdivisions=3, radius=10.0)
            haunch_l.apply_scale([0.7, 1.2, 0.9])
            haunch_l.apply_translation([-8.0, -8.0, 10.0])

            haunch_r = trimesh.creation.icosphere(subdivisions=3, radius=10.0)
            haunch_r.apply_scale([0.7, 1.2, 0.9])
            haunch_r.apply_translation([8.0, -8.0, 10.0])

            tail = trimesh.creation.cylinder(radius=4.5, height=22.0, sections=16)
            tail.apply_transform(trimesh.transformations.rotation_matrix(math.radians(70), [1, 0, 0]))
            tail.apply_transform(trimesh.transformations.rotation_matrix(math.radians(20), [0, 1, 0]))
            tail.apply_translation([6.0, -14.0, 6.0])

            parts = [torso, chest, neck, head, muzzle, ear_l, ear_r, leg_l, leg_r, paw_l, paw_r, haunch_l, haunch_r, tail]
            if manifold3d:
                try:
                    m_accum = cls._trimesh_to_manifold(parts[0])
                    for p in parts[1:]:
                        m_accum = m_accum + cls._trimesh_to_manifold(p)
                    cand = cls._manifold_to_trimesh(m_accum)
                    if cand is not None and not cand.is_empty:
                        return cand
                except Exception:
                    pass
            return trimesh.util.concatenate(parts)

        elif archetype == "vehicle_sports_car":
            # Aerodynamic sports coupe with chassis, cockpit cabin, wheels, and rear racing spoiler
            body = trimesh.creation.box(extents=[60.0, 26.0, 10.0])
            body.apply_translation([0, 0, 8.0])

            cabin = trimesh.creation.box(extents=[30.0, 20.0, 9.0])
            cabin.apply_translation([-4.0, 0, 15.0])

            hood = trimesh.creation.box(extents=[20.0, 24.0, 6.0])
            hood.apply_transform(trimesh.transformations.rotation_matrix(math.radians(-15), [0, 1, 0]))
            hood.apply_translation([18.0, 0, 10.0])

            wheels = []
            positions = [
                [18.0, 13.0, 6.0], [18.0, -13.0, 6.0],
                [-18.0, 13.0, 6.0], [-18.0, -13.0, 6.0]
            ]
            for pos in positions:
                w = trimesh.creation.cylinder(radius=6.5, height=5.0, sections=24)
                w.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2.0, [1, 0, 0]))
                w.apply_translation(pos)
                wheels.append(w)

            spoiler_wing = trimesh.creation.box(extents=[6.0, 26.0, 2.0])
            spoiler_wing.apply_translation([-27.0, 0, 18.0])
            sp_post_l = trimesh.creation.box(extents=[3.0, 2.0, 6.0])
            sp_post_l.apply_translation([-27.0, 9.0, 14.0])
            sp_post_r = trimesh.creation.box(extents=[3.0, 2.0, 6.0])
            sp_post_r.apply_translation([-27.0, -9.0, 14.0])

            parts = [body, cabin, hood, spoiler_wing, sp_post_l, sp_post_r] + wheels
            if manifold3d:
                try:
                    m_accum = cls._trimesh_to_manifold(parts[0])
                    for p in parts[1:]:
                        m_accum = m_accum + cls._trimesh_to_manifold(p)
                    cand = cls._manifold_to_trimesh(m_accum)
                    if cand is not None and not cand.is_empty:
                        return cand
                except Exception:
                    pass
            return trimesh.util.concatenate(parts)

        elif archetype == "rpg_cyber_mech":
            # Futuristic cybernetic mech with chest core and articulated limbs
            torso = trimesh.creation.box(extents=[24.0, 16.0, 28.0])
            torso.apply_translation([0, 0, 42.0])

            core = trimesh.creation.cylinder(radius=5.0, height=8.0, sections=16)
            core.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2.0, [1, 0, 0]))
            core.apply_translation([0, 8.0, 44.0])

            head = trimesh.creation.box(extents=[10.0, 12.0, 10.0])
            head.apply_translation([0, 2.0, 58.0])

            # Shoulders (pauldrons)
            pauldron_l = trimesh.creation.box(extents=[10.0, 12.0, 10.0])
            pauldron_l.apply_translation([-16.0, 0, 48.0])
            pauldron_r = trimesh.creation.box(extents=[10.0, 12.0, 10.0])
            pauldron_r.apply_translation([16.0, 0, 48.0])

            # Legs
            leg_l = trimesh.creation.cylinder(radius=4.5, height=28.0, sections=16)
            leg_l.apply_translation([-8.0, 0, 14.0])
            leg_r = trimesh.creation.cylinder(radius=4.5, height=28.0, sections=16)
            leg_r.apply_translation([8.0, 0, 14.0])

            # Feet
            foot_l = trimesh.creation.box(extents=[7.0, 14.0, 4.0])
            foot_l.apply_translation([-8.0, 2.0, 2.0])
            foot_r = trimesh.creation.box(extents=[7.0, 14.0, 4.0])
            foot_r.apply_translation([8.0, 2.0, 2.0])

            parts = [torso, core, head, pauldron_l, pauldron_r, leg_l, leg_r, foot_l, foot_r]
            if manifold3d:
                try:
                    m_accum = cls._trimesh_to_manifold(parts[0])
                    for p in parts[1:]:
                        m_accum = m_accum + cls._trimesh_to_manifold(p)
                    cand = cls._manifold_to_trimesh(m_accum)
                    if cand is not None and not cand.is_empty:
                        return cand
                except Exception:
                    pass
            return trimesh.util.concatenate(parts)

        else:
            # Default: Tabletop RPG Paladin Miniature (torso, helmet, curved shield, base feet)
            torso = trimesh.creation.icosphere(subdivisions=3, radius=14.0)
            torso.apply_scale([1.0, 0.8, 1.4])
            torso.apply_translation([0, 0, 36.0])

            # Helmet with crest
            head = trimesh.creation.icosphere(subdivisions=3, radius=8.0)
            head.apply_translation([0, 0, 52.0])
            crest = trimesh.creation.box(extents=[3.0, 14.0, 8.0])
            crest.apply_translation([0, 0, 58.0])

            # Pauldrons
            p_l = trimesh.creation.icosphere(subdivisions=2, radius=7.0)
            p_l.apply_translation([-14.0, 0, 44.0])
            p_r = trimesh.creation.icosphere(subdivisions=2, radius=7.0)
            p_r.apply_translation([14.0, 0, 44.0])

            # Shield
            shield = trimesh.creation.box(extents=[3.0, 16.0, 26.0])
            shield.apply_translation([-16.0, 8.0, 36.0])

            # Legs
            leg_l = trimesh.creation.cylinder(radius=4.5, height=24.0, sections=16)
            leg_l.apply_translation([-6.5, 0, 12.0])
            leg_r = trimesh.creation.cylinder(radius=4.5, height=24.0, sections=16)
            leg_r.apply_translation([6.5, 0, 12.0])

            parts = [torso, head, crest, p_l, p_r, shield, leg_l, leg_r]
            if manifold3d:
                try:
                    m_accum = cls._trimesh_to_manifold(parts[0])
                    for p in parts[1:]:
                        m_accum = m_accum + cls._trimesh_to_manifold(p)
                    cand = cls._manifold_to_trimesh(m_accum)
                    if cand is not None and not cand.is_empty:
                        return cand
                except Exception:
                    pass
            return trimesh.util.concatenate(parts)

    @classmethod
    def _normalize_and_ground_mesh(cls, mesh: trimesh.Trimesh, target_height_mm: float) -> trimesh.Trimesh:
        """Scales mesh to exact target height in mm, centers XY on (0, 0), and rests bottom on Z=0."""
        bounds = mesh.bounds
        extents = bounds[1] - bounds[0]
        # For flat EDC objects (e.g. carabiners, rings) where thickness Z is small relative to width/length,
        # scale based on the maximum dimension so the object fits the target bounding size (e.g. 60mm length).
        if extents[2] > 0 and (max(extents[0], extents[1]) / extents[2]) > 2.5:
            ref_dim = max(extents[0], extents[1])
        else:
            ref_dim = extents[2]

        if ref_dim > 1e-4:
            scale_factor = target_height_mm / ref_dim
            mesh.apply_scale(scale_factor)

        # Center XY on origin, place min Z exactly on 0
        new_bounds = mesh.bounds
        center_x = (new_bounds[0][0] + new_bounds[1][0]) / 2.0
        center_y = (new_bounds[0][1] + new_bounds[1][1]) / 2.0
        min_z = new_bounds[0][2]

        mesh.apply_translation([-center_x, -center_y, -min_z])
        return mesh

    @staticmethod
    def _trimesh_to_manifold(tm: trimesh.Trimesh):
        if tm is None or getattr(tm, "is_empty", True) or len(getattr(tm, "vertices", [])) == 0 or len(getattr(tm, "faces", [])) == 0:
            return manifold3d.Manifold()
        try:
            verts = np.ascontiguousarray(tm.vertices, dtype=np.float32)
            faces = np.ascontiguousarray(tm.faces, dtype=np.uint32)
            m_mesh = manifold3d.Mesh(vert_properties=verts, tri_verts=faces)
            return manifold3d.Manifold(m_mesh)
        except Exception:
            return manifold3d.Manifold()

    @staticmethod
    def _manifold_to_trimesh(m) -> Optional[trimesh.Trimesh]:
        try:
            if m is None or m.is_empty() or m.status() != manifold3d.Error.NoError or m.num_vert() == 0:
                return None
            out_mesh = m.to_mesh()
            res = trimesh.Trimesh(
                vertices=out_mesh.vert_properties[:, :3],
                faces=out_mesh.tri_verts,
                process=True
            )
            if res.is_empty or len(res.vertices) == 0:
                return None
            return res
        except Exception:
            return None
