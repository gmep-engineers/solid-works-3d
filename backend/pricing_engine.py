from datetime import datetime, timedelta

MATERIALS = {
    "ti_6al_4v": {
        "id": "ti_6al_4v",
        "name": "Titanium Ti-6Al-4V Grade 5",
        "density_g_cm3": 4.43,
        "raw_cost_per_g": 0.18,
        "laser_rate_cm3_hr": 18.0,
        "machine_hourly_rate": 110.0,
        "min_wall_recommended_mm": 0.6,
        "color_hex": "#94a3b8",
        "metalness": 0.85,
        "roughness": 0.35,
        "description": "High strength-to-weight ratio, biocompatible, aerospace and medical grade."
    },
    "ss_316l": {
        "id": "ss_316l",
        "name": "Stainless Steel 316L",
        "density_g_cm3": 7.99,
        "raw_cost_per_g": 0.065,
        "laser_rate_cm3_hr": 24.0,
        "machine_hourly_rate": 85.0,
        "min_wall_recommended_mm": 0.8,
        "color_hex": "#cbd5e1",
        "metalness": 0.9,
        "roughness": 0.3,
        "description": "Outstanding corrosion resistance, food-safe, chemical and marine engineering."
    },
    "alsi10mg": {
        "id": "alsi10mg",
        "name": "Aluminum AlSi10Mg",
        "density_g_cm3": 2.67,
        "raw_cost_per_g": 0.075,
        "laser_rate_cm3_hr": 35.0,
        "machine_hourly_rate": 80.0,
        "min_wall_recommended_mm": 0.8,
        "color_hex": "#e2e8f0",
        "metalness": 0.75,
        "roughness": 0.45,
        "description": "Lightweight, high thermal and electrical conductivity, ideal for heat exchangers and automotive."
    },
    "inconel_718": {
        "id": "inconel_718",
        "name": "Inconel 718 Nickel Superalloy",
        "density_g_cm3": 8.19,
        "raw_cost_per_g": 0.24,
        "laser_rate_cm3_hr": 16.0,
        "machine_hourly_rate": 135.0,
        "min_wall_recommended_mm": 0.7,
        "color_hex": "#64748b",
        "metalness": 0.95,
        "roughness": 0.25,
        "description": "Retains tensile strength up to 700°C, extreme oxidation resistance for rocket propulsion and turbines."
    },
    "ss_17_4ph": {
        "id": "ss_17_4ph",
        "name": "Stainless Steel 17-4 PH",
        "density_g_cm3": 7.80,
        "raw_cost_per_g": 0.08,
        "laser_rate_cm3_hr": 22.0,
        "machine_hourly_rate": 90.0,
        "min_wall_recommended_mm": 0.8,
        "color_hex": "#94a3b8",
        "metalness": 0.88,
        "roughness": 0.32,
        "description": "Precipitation hardened martensitic steel with high hardness and fatigue endurance."
    },
    "copper_cuni2sicr": {
        "id": "copper_cuni2sicr",
        "name": "Copper Alloy CuNi2SiCr",
        "density_g_cm3": 8.80,
        "raw_cost_per_g": 0.16,
        "laser_rate_cm3_hr": 20.0,
        "machine_hourly_rate": 120.0,
        "min_wall_recommended_mm": 0.8,
        "color_hex": "#d97706",
        "metalness": 0.9,
        "roughness": 0.28,
        "description": "High electrical conductivity and superior thermal dissipation for high-current inductors and cooling blocks."
    },
    "scalmalloy": {
        "id": "scalmalloy",
        "name": "Scalmalloy (Al-Mg-Sc-Zr)",
        "technology": "dmls_metal",
        "density_g_cm3": 2.77,
        "raw_cost_per_g": 0.19,
        "laser_rate_cm3_hr": 32.0,
        "machine_hourly_rate": 105.0,
        "min_wall_recommended_mm": 0.7,
        "color_hex": "#93c5fd",
        "metalness": 0.70,
        "roughness": 0.38,
        "is_transparent": False,
        "description": "Ultra-high strength aluminum-scandium alloy developed specifically for additive aerospace applications."
    },
    # SLA Optical Transparent & Translucent Resins for Custom Lights & Lenses
    "sla_ultraclear": {
        "id": "sla_ultraclear",
        "name": "UltraClear Optical Resin (92% Transmittance)",
        "technology": "sla_optical",
        "density_g_cm3": 1.18,
        "raw_cost_per_g": 0.09,
        "laser_rate_cm3_hr": 55.0,
        "machine_hourly_rate": 48.0,
        "min_wall_recommended_mm": 0.5,
        "color_hex": "#e0f2fe",
        "metalness": 0.05,
        "roughness": 0.04,
        "is_transparent": True,
        "optical_transmittance": 0.92,
        "refractive_index": 1.52,
        "description": "Glass-clarity optical photopolymer (n=1.52). 92% light transmittance, ideal for custom lenses, light pipes, and illuminated sculptures."
    },
    "sla_frosted_diffuser": {
        "id": "sla_frosted_diffuser",
        "name": "Frosted Opal Light Diffuser Resin",
        "technology": "sla_optical",
        "density_g_cm3": 1.16,
        "raw_cost_per_g": 0.085,
        "laser_rate_cm3_hr": 58.0,
        "machine_hourly_rate": 45.0,
        "min_wall_recommended_mm": 0.5,
        "color_hex": "#f8fafc",
        "metalness": 0.02,
        "roughness": 0.45,
        "is_transparent": True,
        "optical_transmittance": 0.78,
        "refractive_index": 1.48,
        "description": "Engineered opal micro-particles for soft photon scattering. Eliminates harsh LED diode hotspots for glare-free custom lamps."
    },
    "sla_amber_crystal": {
        "id": "sla_amber_crystal",
        "name": "Amber Crystal Vintage Tint Resin",
        "technology": "sla_optical",
        "density_g_cm3": 1.18,
        "raw_cost_per_g": 0.095,
        "laser_rate_cm3_hr": 52.0,
        "machine_hourly_rate": 48.0,
        "min_wall_recommended_mm": 0.5,
        "color_hex": "#f59e0b",
        "metalness": 0.06,
        "roughness": 0.08,
        "is_transparent": True,
        "optical_transmittance": 0.86,
        "refractive_index": 1.53,
        "description": "Translucent sunset amber hue. Emits a rich, warm incandescent glow when back-illuminated by warm white or Edison LEDs."
    },
    "sla_smoked_obsidian": {
        "id": "sla_smoked_obsidian",
        "name": "Smoked Obsidian Translucent Resin",
        "technology": "sla_optical",
        "density_g_cm3": 1.19,
        "raw_cost_per_g": 0.095,
        "laser_rate_cm3_hr": 50.0,
        "machine_hourly_rate": 48.0,
        "min_wall_recommended_mm": 0.5,
        "color_hex": "#334155",
        "metalness": 0.12,
        "roughness": 0.12,
        "is_transparent": True,
        "optical_transmittance": 0.72,
        "refractive_index": 1.54,
        "description": "Deep charcoal translucent aesthetic when off; reveals brilliant internal lighting patterns and geometric cores when energized."
    },
    "sla_cyan_luminescent": {
        "id": "sla_cyan_luminescent",
        "name": "Cyan Luminescent Edge-Glow Resin",
        "technology": "sla_optical",
        "density_g_cm3": 1.17,
        "raw_cost_per_g": 0.10,
        "laser_rate_cm3_hr": 54.0,
        "machine_hourly_rate": 48.0,
        "min_wall_recommended_mm": 0.5,
        "color_hex": "#06b6d4",
        "metalness": 0.08,
        "roughness": 0.06,
        "is_transparent": True,
        "optical_transmittance": 0.90,
        "refractive_index": 1.52,
        "description": "High-efficiency optical light piping with vibrant neon cyan luminescence along chamfers, contours, and etched edges."
    },
    "hybrid_metal_light": {
        "id": "hybrid_metal_light",
        "name": "Hybrid DMLS Metal + Optical Clear Luminaire",
        "technology": "hybrid_luminaire",
        "density_g_cm3": 2.20,
        "raw_cost_per_g": 0.14,
        "laser_rate_cm3_hr": 38.0,
        "machine_hourly_rate": 78.0,
        "min_wall_recommended_mm": 0.6,
        "color_hex": "#38bdf8",
        "metalness": 0.40,
        "roughness": 0.22,
        "is_transparent": True,
        "optical_transmittance": 0.85,
        "refractive_index": 1.52,
        "description": "Dual-process additive luminaire: DMLS aluminum thermal heatsink base co-engineered with an optical-clear SLA light diffusion shade."
    }
}

SURFACE_FINISHES = {
    # DMLS Metal Surface Finishes
    "as_printed": {
        "id": "as_printed",
        "name": "As-Printed (Glass Bead Blast)",
        "price": 0.0,
        "roughness_ra": "6.3 - 9.0 µm",
        "technology": "dmls_metal",
        "description": "Uniform satin matte appearance, removed residual sintered powder."
    },
    "vibratory_tumble": {
        "id": "vibratory_tumble",
        "name": "Vibratory Tumble Polish",
        "price": 38.0,
        "roughness_ra": "3.0 - 4.2 µm",
        "technology": "dmls_metal",
        "description": "Deburred edges and smoothed external surfaces using ceramic media."
    },
    "electrochemical": {
        "id": "electrochemical",
        "name": "Electro-Chemical Polish",
        "price": 85.0,
        "roughness_ra": "1.2 - 2.0 µm",
        "technology": "dmls_metal",
        "description": "Electrolytic bath smoothing, micro-cleaned surface ideal for fluid channels and vacuum systems."
    },
    "mirror_polish": {
        "id": "mirror_polish",
        "name": "Optical Mirror Hand Polish",
        "price": 165.0,
        "roughness_ra": "< 0.4 µm",
        "technology": "dmls_metal",
        "description": "Manual progressive diamond lapping and buffing to high specular reflectance."
    },
    # SLA Optical Resin Surface Finishes
    "optical_diamond_coat": {
        "id": "optical_diamond_coat",
        "name": "Optical UV Clearcoat & Dip",
        "price": 45.0,
        "roughness_ra": "Ra < 0.1 µm",
        "technology": "sla_optical",
        "description": "UV lacquer dip and progressive diamond buffing for 92% optical clarity and high-gloss water-clear look."
    },
    "frosted_matte_diffusion": {
        "id": "frosted_matte_diffusion",
        "name": "Frosted Matte Light Diffusion",
        "price": 30.0,
        "roughness_ra": "Ra 2.4 - 3.2 µm",
        "technology": "sla_optical",
        "description": "Soft photon-scattering micro-etching eliminating diode hotspots on custom translucent lamp diffusers."
    },
    "vapor_smoothing": {
        "id": "vapor_smoothing",
        "name": "Chemical Vapor Smoothing",
        "price": 55.0,
        "roughness_ra": "Ra 0.4 - 0.8 µm",
        "technology": "sla_optical",
        "description": "Solvent vapor circulation for sealed, glossy, injection-molded tactile feel and liquid-tight seal."
    },
    "dyeing_tinting": {
        "id": "dyeing_tinting",
        "name": "Pigment Dyeing & Tinting",
        "price": 40.0,
        "roughness_ra": "Translucent Tint",
        "technology": "sla_optical",
        "description": "Heated deep-penetration dye bath for uniform custom translucent colors and edge glows."
    },
    "uv_cure_wash": {
        "id": "uv_cure_wash",
        "name": "Ultrasonic Wash & Multi-Axis UV Cure",
        "price": 0.0,
        "roughness_ra": "Standard Optical",
        "technology": "sla_optical",
        "description": "Automated IPA wash station and multi-angle 405nm UV curing chamber for photopolymer crosslinking."
    },
    # Hybrid Multi-Material Jetting Finishes
    "hybrid_dual_finish": {
        "id": "hybrid_dual_finish",
        "name": "Dual-Finish: Bead Blasted Base + Diamond Clear Optics",
        "price": 58.0,
        "roughness_ra": "Hybrid Spec",
        "technology": "hybrid_luminaire",
        "description": "Co-processed finish: satin bead-blasted aluminum heatsink coupled with diamond-polished optical resin optics."
    }
}

HEAT_TREATMENTS = {
    # DMLS Metal Metallurgical Cycles
    "none": {
        "id": "none",
        "name": "As-Solidified (None)",
        "badge": "Standard",
        "price": 0.0,
        "technology": "dmls_metal",
        "description": "Standard post-print state with support removal. Suitable for non-critical non-load-bearing prototypes."
    },
    "stress_relief": {
        "id": "stress_relief",
        "name": "Vacuum Stress Relieving",
        "badge": "Recommended",
        "price": 85.0,
        "technology": "dmls_metal",
        "description": "High-vacuum thermal soak cycle to dissipate extreme thermal gradients and eliminate build residual stresses."
    },
    "hip": {
        "id": "hip",
        "name": "Hot Isostatic Pressing (HIP)",
        "badge": "Aerospace Grade",
        "price": 220.0,
        "technology": "dmls_metal",
        "description": "1020°C @ 100 MPa argon pressure to eliminate internal micro-porosity to 99.9% structural density."
    },
    "solution_aging": {
        "id": "solution_aging",
        "name": "Solution Anneal & Aging",
        "badge": "Max Hardness",
        "price": 140.0,
        "technology": "dmls_metal",
        "description": "Multi-stage solutionizing followed by precipitation aging for peak tensile strength, hardness, and fatigue endurance."
    },
    # SLA Optical Resin Curing & Annealing Cycles
    "uv_ambient_cure": {
        "id": "uv_ambient_cure",
        "name": "Ambient 405nm UV Crosslink Post-Cure",
        "badge": "Standard",
        "price": 0.0,
        "technology": "sla_optical",
        "description": "Multi-angle 405nm LED ultraviolet light bath achieving baseline photopolymer crosslinking and structural stability."
    },
    "thermal_uv_anneal": {
        "id": "thermal_uv_anneal",
        "name": "60°C Isothermal Bake & UV Annealing",
        "badge": "High Rigidity",
        "price": 45.0,
        "technology": "sla_optical",
        "description": "Elevated thermal soak at 60°C with high-flux UV exposure to reach 100% conversion, eliminating green-state creep."
    },
    "optical_degas": {
        "id": "optical_degas",
        "name": "Ultrasonic Vacuum Degas & Optical Clarity Bath",
        "badge": "UltraClear Spec",
        "price": 55.0,
        "technology": "sla_optical",
        "description": "De-aeration cycle evacuating dissolved micro-bubbles for crystal water-clear transmission (92% T)."
    },
    "inert_chamber_cure": {
        "id": "inert_chamber_cure",
        "name": "Nitrogen-Purged High-Flux UV Chamber",
        "badge": "Anti-Yellowing",
        "price": 75.0,
        "technology": "sla_optical",
        "description": "Oxygen-depleted nitrogen atmosphere curing preventing surface inhibition, tackiness, and photochemical yellowing."
    },
    # Hybrid Multi-Material Curing Cycles
    "hybrid_dual_cure": {
        "id": "hybrid_dual_cure",
        "name": "Dual-Stage Metal Stress Relief & Optical UV Cure",
        "badge": "Composite Grade",
        "price": 110.0,
        "technology": "hybrid_luminaire",
        "description": "Pre-assembly vacuum thermal soak of aluminum chassis followed by automated multi-wavelength UV resin curing."
    }
}

DISPLAY_ACCESSORIES = {
    "display_bases": {
        "none": {"id": "none", "name": "None (Bare Component)", "price": 0.0, "technology": "all", "description": "Standard as-printed component without a custom exhibition base."},
        "cnc_aluminum": {"id": "cnc_aluminum", "name": "Anodized 6061-T6 Aluminum Base", "price": 95.0, "technology": "dmls_metal", "description": "Precision CNC milled aerospace aluminum plinth with satin bead-blasted anodizing."},
        "walnut_brass": {"id": "walnut_brass", "name": "Walnut Wood & Brushed Brass Plinth", "price": 145.0, "technology": "all", "description": "Solid hand-rubbed walnut pedestal with brushed solid brass mounting plate."},
        "carbon_fiber": {"id": "carbon_fiber", "name": "3K Twill Pre-Preg Carbon Fiber Stand", "price": 180.0, "technology": "all", "description": "Autoclaved structural carbon fiber exhibition pedestal with high-gloss resin finish."},
        "frosted_acrylic_led": {"id": "frosted_acrylic_led", "name": "Frosted Edge-Lit Acrylic Luminaire Plinth", "price": 115.0, "technology": "sla_optical", "description": "Precision CNC routed cast acrylic pedestal with concealed cable conduit and edge illumination."},
        "hybrid_duo_pedestal": {"id": "hybrid_duo_pedestal", "name": "Billet Aluminum & Walnut Duo Pedestal", "price": 160.0, "technology": "hybrid_luminaire", "description": "Architectural dual-material plinth pairing satin 6061-T6 aluminum with hand-oiled American walnut."}
    },
    "floating_systems": {
        "none": {"id": "none", "name": "None (Static Mount)", "price": 0.0, "technology": "all", "description": "Standard resting contact without electromagnetic levitation."},
        "mag_levitation": {"id": "mag_levitation", "name": "Anti-Gravity Magnetic Floating Base", "price": 280.0, "technology": "all", "description": "Active electromagnetic suspension base providing silent 360° frictionless floating in mid-air."},
        "mag_induction_luminaire": {"id": "mag_induction_luminaire", "name": "Wireless Induction Levitating Base", "price": 320.0, "technology": "sla_optical", "description": "Mid-air electromagnetic levitation with continuous wireless inductive power transfer to illuminate internal LEDs."}
    },
    "illumination_options": {
        "none": {"id": "none", "name": "None (Ambient Light)", "price": 0.0, "technology": "all", "description": "Standard ambient room lighting."},
        "edge_glow_white": {"id": "edge_glow_white", "name": "4000K Halcyon White Edge Rim Glow", "price": 65.0, "technology": "dmls_metal", "description": "Concealed perimeter LED halo illuminating the metallic contours of the sculpture."},
        "rgbw_app": {"id": "rgbw_app", "name": "Smart RGBW App-Controlled Halo", "price": 110.0, "technology": "dmls_metal", "description": "Wireless Bluetooth/Wi-Fi connected RGBW LED halo with custom dynamic color scenes."},
        "warm_edison_2700k": {"id": "warm_edison_2700k", "name": "Warm Edison 2700K Luminaire Core", "price": 48.0, "technology": "sla_optical", "description": "Internal high-CRI warm incandescent amber light engine designed for custom transparent luminaires."},
        "architectural_4000k": {"id": "architectural_4000k", "name": "4000K Pure Neutral Architectural Core", "price": 48.0, "technology": "sla_optical", "description": "Crisp studio neutral white LED core for optical clarity and modern design fixtures."},
        "smart_rgbw_touch": {"id": "smart_rgbw_touch", "name": "Smart RGBW Touch Dimmer Core", "price": 78.0, "technology": "sla_optical", "description": "Stepless capacitive touch dimming and 16-million color dynamic light scenes."}
    },
    "engraving_options": {
        "none": {"id": "none", "name": "No Plaque Engraving", "price": 0.0, "technology": "all"},
        "laser_engraved_plaque": {"id": "laser_engraved_plaque", "name": "Custom Laser-Engraved Plaque", "price": 35.0, "technology": "all", "description": "Fiber laser etched brushed titanium or brass plate with custom name, date, or serial."}
    }
}

from datetime import datetime, timedelta

def get_db_materials(active_only=True):
    try:
        from database import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM materials"
        if active_only:
            query += " WHERE is_active = 1"
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()
        if rows:
            return {r["id"]: dict(r) for r in rows}
    except Exception as e:
        print("get_db_materials note:", e)
    return MATERIALS

def get_db_services(active_only=True):
    try:
        from database import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM machining_services"
        if active_only:
            query += " WHERE is_active = 1"
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()
        if rows:
            return {r["id"]: dict(r) for r in rows}
    except Exception as e:
        print("get_db_services note:", e)
    return {}

LEAD_TIMES = {
    "standard": {
        "id": "standard",
        "name": "Standard Production (8 - 10 Business Days)",
        "days": 9,
        "shipping_cost": 25.0,
        "rush_multiplier": 1.0
    },
    "expedited": {
        "id": "expedited",
        "name": "Expedited Priority (4 - 6 Business Days)",
        "days": 5,
        "shipping_cost": 75.0,
        "rush_multiplier": 1.25
    },
    "rush": {
        "id": "rush",
        "name": "Critical Emergency Rush (2 - 3 Business Days)",
        "days": 3,
        "shipping_cost": 160.0,
        "rush_multiplier": 1.6
    }
}

def calculate_quote(
    volume_cm3: float,
    surface_area_cm2: float,
    material_id: str,
    quantity: int = 1,
    finish_id: str = "as_printed",
    machining_options: dict = None,
    lead_time_id: str = "standard"
):
    if machining_options is None:
        machining_options = {}

    db_mats = get_db_materials(active_only=True)
    mat = db_mats.get(material_id) or db_mats.get("ss_316l") or list(db_mats.values())[0]

    db_svcs = get_db_services(active_only=True)
    finish_svc = db_svcs.get(finish_id)
    finish_price = finish_svc["base_price"] if finish_svc else SURFACE_FINISHES.get(finish_id, {}).get("price", 0.0)

    lead = LEAD_TIMES.get(lead_time_id, LEAD_TIMES["standard"])

    # 1. Mass calculation (g)
    mass_grams = volume_cm3 * mat["density_g_cm3"]
    # 15% powder recycling loss & support material allowance
    raw_material_cost = mass_grams * mat["raw_cost_per_g"] * 1.15

    # 2. Machine Print Time & Cost
    # Volumetric laser exposure + recoating time per layer (~12s per 40µm layer)
    laser_hours = volume_cm3 / mat["laser_rate_cm3_hr"]
    # Recoater & gas purge fixed overhead per job
    recoater_hours = 0.5
    total_print_hours = laser_hours + recoater_hours
    machine_cost = total_print_hours * mat["machine_hourly_rate"]

    # 3. Surface Finishing Cost
    # Base finish fee + surface area scaling
    area_factor = max(1.0, surface_area_cm2 / 100.0)
    finishing_cost = finish_price * (0.6 + 0.4 * area_factor)

    # 4. Localized Machining Operations (Feature-Specific):
    localized_machining_cost = 0.0
    machining_breakdown = {}

    # Thread tapping
    tapped_holes = int(machining_options.get("tapped_holes", 0))
    cost_threads = 0.0
    if tapped_holes > 0:
        cost_threads = tapped_holes * 14.0
        localized_machining_cost += cost_threads
        machining_breakdown["tapped_holes"] = {
            "count": tapped_holes,
            "cost": cost_threads,
            "description": f"{tapped_holes}x CNC Thread Tapping"
        }

    # Datum face milling
    datum_faces = int(machining_options.get("datum_faces", 0))
    cost_milling = 0.0
    if datum_faces > 0:
        cost_milling = datum_faces * 65.0
        localized_machining_cost += cost_milling
        machining_breakdown["datum_faces"] = {
            "count": datum_faces,
            "cost": cost_milling,
            "description": f"{datum_faces}x CNC Precision Face Milling"
        }

    # Precision reaming
    reamed_bores = int(machining_options.get("reamed_bores", 0))
    cost_reaming = 0.0
    if reamed_bores > 0:
        cost_reaming = reamed_bores * 22.0
        localized_machining_cost += cost_reaming
        machining_breakdown["reamed_bores"] = {
            "count": reamed_bores,
            "cost": cost_reaming,
            "description": f"{reamed_bores}x H7 Bore Reaming"
        }

    # Wire EDM build plate cut-off (only applicable for conductive metal)
    cost_edm = 0.0
    is_conductive_metal = mat.get("technology", "dmls_metal") != "sla_optical"
    if is_conductive_metal and machining_options.get("wire_edm_cutoff", True):
        cost_edm = 45.0
        localized_machining_cost += cost_edm
        machining_breakdown["wire_edm_cutoff"] = {
            "cost": cost_edm,
            "description": "Wire EDM Baseplate Cut & Burr Removal"
        }

    # 5. Whole-Body Metallurgical Thermal Treatments & HIP:
    heat_opt = machining_options.get("heat_treatment", "stress_relief")
    ht_spec = HEAT_TREATMENTS.get(heat_opt, HEAT_TREATMENTS["none"])
    heat_treatment_cost = float(ht_spec.get("price", 0.0))
    if heat_treatment_cost > 0:
        machining_breakdown["heat_treatment"] = {
            "type": heat_opt,
            "name": ht_spec["name"],
            "cost": heat_treatment_cost
        }

    machining_cost = localized_machining_cost + heat_treatment_cost

    # 6. Display & Exhibition Features (Bases, Magnetic Floating, Illumination, Custom Engraving)
    display_cost = 0.0
    display_details = {}

    display_base_id = machining_options.get("display_base", "none")
    base_item = DISPLAY_ACCESSORIES["display_bases"].get(display_base_id)
    if base_item and float(base_item.get("price", 0.0)) > 0:
        p = float(base_item["price"])
        display_cost += p
        display_details["display_base"] = {
            "id": display_base_id,
            "name": base_item["name"],
            "cost": p
        }

    floating_id = machining_options.get("floating_system", "none")
    floating_item = DISPLAY_ACCESSORIES["floating_systems"].get(floating_id)
    if floating_item and float(floating_item.get("price", 0.0)) > 0:
        p = float(floating_item["price"])
        display_cost += p
        display_details["floating_system"] = {
            "id": floating_id,
            "name": floating_item["name"],
            "cost": p
        }

    illum_id = machining_options.get("illumination", "none")
    illum_item = DISPLAY_ACCESSORIES["illumination_options"].get(illum_id)
    if illum_item and float(illum_item.get("price", 0.0)) > 0:
        p = float(illum_item["price"])
        display_cost += p
        display_details["illumination"] = {
            "id": illum_id,
            "name": illum_item["name"],
            "cost": p
        }

    custom_text = str(machining_options.get("custom_engraving") or "").strip()
    if custom_text:
        engr_price = float(DISPLAY_ACCESSORIES["engraving_options"]["laser_engraved_plaque"]["price"])
        display_cost += engr_price
        display_details["custom_engraving"] = {
            "text": custom_text,
            "cost": engr_price
        }

    # 7. Quantity Discount Curve
    qty = max(1, quantity)
    if qty >= 25:
        discount_rate = 0.32
    elif qty >= 10:
        discount_rate = 0.22
    elif qty >= 5:
        discount_rate = 0.15
    elif qty >= 2:
        discount_rate = 0.08
    else:
        discount_rate = 0.0

    # Base production subtotal per unit (before rush multiplier)
    base_unit_cost = (raw_material_cost + machine_cost + finishing_cost + machining_cost + display_cost)
    adjusted_unit_cost = base_unit_cost * lead["rush_multiplier"] * (1.0 - discount_rate)
    
    # Total for batch
    parts_subtotal = round(adjusted_unit_cost * qty, 2)
    shipping_total = round(lead["shipping_cost"], 2)
    grand_total = round(parts_subtotal + shipping_total, 2)
    unit_price = round(parts_subtotal / qty, 2)

    # Estimated delivery date
    ship_date = datetime.now() + timedelta(days=lead["days"])

    return {
        "material_id": mat["id"],
        "material_name": mat["name"],
        "quantity": qty,
        "mass_grams": round(mass_grams, 1),
        "print_hours": round(total_print_hours, 2),
        "unit_price": unit_price,
        "parts_subtotal": parts_subtotal,
        "shipping_cost": shipping_total,
        "total_price": grand_total,
        "discount_percentage": int(discount_rate * 100),
        "lead_time": {
            "id": lead["id"],
            "name": lead["name"],
            "estimated_ship_date": ship_date.strftime("%Y-%m-%d"),
            "display_delivery": ship_date.strftime("%b %d, %Y")
        },
        "breakdown": {
            "raw_material_cost": round(raw_material_cost, 2),
            "laser_machine_cost": round(machine_cost, 2),
            "finishing_cost": round(finishing_cost, 2),
            "machining_cost": round(machining_cost, 2),
            "localized_machining_cost": round(localized_machining_cost, 2),
            "heat_treatment_cost": round(heat_treatment_cost, 2),
            "display_cost": round(display_cost, 2),
            "display_details": display_details,
            "machining_details": machining_breakdown,
            "base_unit_cost": round(base_unit_cost, 2),
            "rush_multiplier": lead["rush_multiplier"]
        }
    }
