import sqlite3
import json
import os
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

class ImmutableWORMRecordError(Exception):
    """Raised when an attempt is made to mutate or delete an immutable WORM record."""
    pass

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        company TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        wallet_balance REAL NOT NULL DEFAULT 0.0,
        phone TEXT DEFAULT '',
        default_shipping TEXT DEFAULT '',
        created_at TEXT NOT NULL
    );
    """)

    # Check and add columns if upgrading existing DB
    cursor.execute("PRAGMA table_info(users)")
    user_cols = [row["name"] for row in cursor.fetchall()]
    if "wallet_balance" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN wallet_balance REAL NOT NULL DEFAULT 0.0")
    if "phone" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''")
    if "default_shipping" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN default_shipping TEXT DEFAULT ''")

    # CAD models table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cad_models (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        web_model_path TEXT,
        volume_cm3 REAL NOT NULL,
        surface_area_cm2 REAL NOT NULL,
        bbox_x REAL NOT NULL,
        bbox_y REAL NOT NULL,
        bbox_z REAL NOT NULL,
        is_watertight INTEGER NOT NULL,
        min_thickness_mm REAL NOT NULL,
        thin_features_count INTEGER NOT NULL,
        dfm_status TEXT NOT NULL,
        dfm_details TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """)

    # Quotes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY,
        model_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        material_id TEXT NOT NULL,
        material_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        finish_type TEXT NOT NULL,
        machining_options TEXT NOT NULL,
        lead_time_option TEXT NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        breakdown TEXT NOT NULL,
        estimated_ship_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(model_id) REFERENCES cad_models(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """)

    # Check and add columns if upgrading existing quotes table
    cursor.execute("PRAGMA table_info(quotes)")
    quote_cols = [row["name"] for row in cursor.fetchall()]
    if "ip_terms_accepted" not in quote_cols:
        cursor.execute("ALTER TABLE quotes ADD COLUMN ip_terms_accepted INTEGER NOT NULL DEFAULT 0")
    if "ip_terms_version" not in quote_cols:
        cursor.execute("ALTER TABLE quotes ADD COLUMN ip_terms_version TEXT DEFAULT ''")
    if "ip_terms_accepted_at" not in quote_cols:
        cursor.execute("ALTER TABLE quotes ADD COLUMN ip_terms_accepted_at TEXT DEFAULT ''")

    # Orders table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        quote_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        model_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'SUBMITTED',
        total_price REAL NOT NULL,
        shipping_address TEXT NOT NULL,
        tracking_number TEXT,
        carrier TEXT,
        status_history TEXT NOT NULL,
        admin_notes TEXT,
        payment_method TEXT DEFAULT 'CREDIT_CARD',
        payment_status TEXT DEFAULT 'PAID',
        created_at TEXT NOT NULL,
        FOREIGN KEY(quote_id) REFERENCES quotes(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(model_id) REFERENCES cad_models(id)
    );
    """)

    cursor.execute("PRAGMA table_info(orders)")
    order_cols = [row["name"] for row in cursor.fetchall()]
    if "payment_method" not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'CREDIT_CARD'")
    if "payment_status" not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'PAID'")
    if "ip_terms_accepted" not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN ip_terms_accepted INTEGER NOT NULL DEFAULT 0")
    if "ip_terms_version" not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN ip_terms_version TEXT DEFAULT ''")
    if "ip_terms_accepted_at" not in order_cols:
        cursor.execute("ALTER TABLE orders ADD COLUMN ip_terms_accepted_at TEXT DEFAULT ''")

    # Wallet Transactions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wallet_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL, -- 'CREDIT' (refill) or 'DEBIT' (payment)
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        description TEXT NOT NULL,
        card_last4 TEXT DEFAULT '',
        reference_id TEXT DEFAULT '',
        status TEXT DEFAULT 'COMPLETED', -- 'PENDING', 'COMPLETED', 'REFUNDED', 'FAILED'
        tripo_task_type TEXT DEFAULT '',
        tripo_task_id TEXT DEFAULT '',
        tokens_used REAL DEFAULT 0.0,
        refund_reason TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """)

    cursor.execute("PRAGMA table_info(wallet_transactions)")
    tx_cols = [row["name"] for row in cursor.fetchall()]
    if "status" not in tx_cols:
        cursor.execute("ALTER TABLE wallet_transactions ADD COLUMN status TEXT DEFAULT 'COMPLETED'")
    if "tripo_task_type" not in tx_cols:
        cursor.execute("ALTER TABLE wallet_transactions ADD COLUMN tripo_task_type TEXT DEFAULT ''")
    if "tripo_task_id" not in tx_cols:
        cursor.execute("ALTER TABLE wallet_transactions ADD COLUMN tripo_task_id TEXT DEFAULT ''")
    if "tokens_used" not in tx_cols:
        cursor.execute("ALTER TABLE wallet_transactions ADD COLUMN tokens_used REAL DEFAULT 0.0")
    if "refund_reason" not in tx_cols:
        cursor.execute("ALTER TABLE wallet_transactions ADD COLUMN refund_reason TEXT DEFAULT ''")

    # Materials table (Admin Managed)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        density_g_cm3 REAL NOT NULL,
        raw_cost_per_g REAL NOT NULL,
        laser_rate_cm3_hr REAL NOT NULL,
        machine_hourly_rate REAL NOT NULL,
        min_wall_recommended_mm REAL NOT NULL,
        color_hex TEXT NOT NULL,
        description TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        technology TEXT DEFAULT 'dmls_metal',
        is_transparent INTEGER DEFAULT 0,
        optical_transmittance REAL DEFAULT 0.0,
        refractive_index REAL DEFAULT 1.0,
        optical_type TEXT DEFAULT 'OPAQUE',
        transmission_factor REAL DEFAULT 0.0
    );
    """)

    # Check and add columns if upgrading existing materials table
    cursor.execute("PRAGMA table_info(materials)")
    mat_cols = [row["name"] for row in cursor.fetchall()]
    if "technology" not in mat_cols:
        cursor.execute("ALTER TABLE materials ADD COLUMN technology TEXT DEFAULT 'dmls_metal'")
    if "is_transparent" not in mat_cols:
        cursor.execute("ALTER TABLE materials ADD COLUMN is_transparent INTEGER DEFAULT 0")
    if "optical_transmittance" not in mat_cols:
        cursor.execute("ALTER TABLE materials ADD COLUMN optical_transmittance REAL DEFAULT 0.0")
    if "refractive_index" not in mat_cols:
        cursor.execute("ALTER TABLE materials ADD COLUMN refractive_index REAL DEFAULT 1.0")
    if "optical_type" not in mat_cols:
        cursor.execute("ALTER TABLE materials ADD COLUMN optical_type TEXT DEFAULT 'OPAQUE'")
    if "transmission_factor" not in mat_cols:
        cursor.execute("ALTER TABLE materials ADD COLUMN transmission_factor REAL DEFAULT 0.0")

    # Machining Services table (Admin Managed)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS machining_services (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL, -- 'surface_finish', 'cnc_operation', 'heat_treatment', 'luminaire_optics'
        name TEXT NOT NULL,
        base_price REAL NOT NULL,
        unit TEXT NOT NULL, -- 'per_part', 'per_hole', 'per_face', 'per_bore', 'fixed'
        spec_detail TEXT NOT NULL,
        description TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1
    );
    """)

    # Seed default materials (Metal DMLS + SLA Optical Clear Resins + Hybrid Luminaire)
    all_materials = [
        # DMLS Metals (OPAQUE)
        ("ti_6al_4v", "Titanium Ti-6Al-4V Grade 5", 4.43, 0.18, 18.0, 110.0, 0.6, "#94a3b8", "High strength-to-weight ratio, biocompatible, aerospace and medical grade.", 1, "dmls_metal", 0, 0.0, 1.0, "OPAQUE", 0.0),
        ("ss_316l", "Stainless Steel 316L", 7.99, 0.065, 24.0, 85.0, 0.8, "#cbd5e1", "Outstanding corrosion resistance, food-safe, chemical and marine engineering.", 1, "dmls_metal", 0, 0.0, 1.0, "OPAQUE", 0.0),
        ("alsi10mg", "Aluminum AlSi10Mg", 2.67, 0.075, 35.0, 80.0, 0.8, "#e2e8f0", "Lightweight, high thermal and electrical conductivity, ideal for heat exchangers and automotive.", 1, "dmls_metal", 0, 0.0, 1.0, "OPAQUE", 0.0),
        ("inconel_718", "Inconel 718 Nickel Superalloy", 8.19, 0.24, 16.0, 135.0, 0.7, "#64748b", "Retains tensile strength up to 700°C, extreme oxidation resistance for rocket propulsion and turbines.", 1, "dmls_metal", 0, 0.0, 1.0, "OPAQUE", 0.0),
        ("ss_17_4ph", "Stainless Steel 17-4 PH", 7.80, 0.08, 22.0, 90.0, 0.8, "#94a3b8", "Precipitation hardened martensitic steel with high hardness and fatigue endurance.", 1, "dmls_metal", 0, 0.0, 1.0, "OPAQUE", 0.0),
        ("copper_cuni2sicr", "Copper Alloy CuNi2SiCr", 8.80, 0.16, 20.0, 120.0, 0.8, "#d97706", "High electrical conductivity and superior thermal dissipation for high-current inductors and cooling blocks.", 1, "dmls_metal", 0, 0.0, 1.0, "OPAQUE", 0.0),
        ("scalmalloy", "Scalmalloy (Al-Mg-Sc-Zr)", 2.77, 0.19, 32.0, 105.0, 0.7, "#93c5fd", "Ultra-high strength aluminum-scandium alloy developed specifically for additive aerospace applications.", 1, "dmls_metal", 0, 0.0, 1.0, "OPAQUE", 0.0),
        # SLA Optical Transparent & Translucent Resins for Custom Lights
        ("sla_ultraclear", "UltraClear Optical Resin (92% Transmittance)", 1.18, 0.09, 55.0, 48.0, 0.5, "#e0f2fe", "Glass-clarity optical photopolymer (n=1.52). 92% light transmittance, ideal for custom lenses, light pipes, and illuminated sculptures.", 1, "sla_optical", 1, 0.92, 1.52, "TRANSPARENT", 0.92),
        ("sla_frosted_diffuser", "Frosted Opal Light Diffuser Resin", 1.16, 0.085, 58.0, 45.0, 0.5, "#f8fafc", "Engineered opal micro-particles for soft photon scattering. Eliminates harsh LED diode hotspots for glare-free custom lamps.", 1, "sla_optical", 1, 0.78, 1.48, "TRANSLUCENT", 0.78),
        ("sla_amber_crystal", "Amber Crystal Vintage Tint Resin", 1.18, 0.095, 52.0, 48.0, 0.5, "#f59e0b", "Translucent sunset amber hue. Emits a rich, warm incandescent glow when back-illuminated by warm white or Edison LEDs.", 1, "sla_optical", 1, 0.86, 1.53, "TRANSLUCENT", 0.86),
        ("sla_smoked_obsidian", "Smoked Obsidian Translucent Resin", 1.19, 0.095, 50.0, 48.0, 0.5, "#334155", "Deep charcoal translucent aesthetic when off; reveals brilliant internal lighting patterns and geometric cores when energized.", 1, "sla_optical", 1, 0.72, 1.54, "TRANSLUCENT", 0.72),
        ("sla_cyan_luminescent", "Cyan Luminescent Edge-Glow Resin", 1.17, 0.10, 54.0, 48.0, 0.5, "#06b6d4", "High-efficiency optical light piping with vibrant neon cyan luminescence along chamfers, contours, and etched edges.", 1, "sla_optical", 1, 0.90, 1.52, "TRANSLUCENT", 0.90),
        # Hybrid Multi-Material Technology
        ("hybrid_metal_light", "Hybrid DMLS Metal + Optical Clear Luminaire", 2.20, 0.14, 38.0, 78.0, 0.6, "#38bdf8", "Dual-process additive luminaire: DMLS aluminum thermal heatsink base co-engineered with an optical-clear SLA light diffusion shade.", 1, "hybrid_luminaire", 1, 0.85, 1.52, "TRANSLUCENT", 0.85)
    ]

    for m in all_materials:
        cursor.execute("""
        INSERT INTO materials (id, name, density_g_cm3, raw_cost_per_g, laser_rate_cm3_hr, machine_hourly_rate, min_wall_recommended_mm, color_hex, description, is_active, technology, is_transparent, optical_transmittance, refractive_index, optical_type, transmission_factor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            density_g_cm3=excluded.density_g_cm3,
            raw_cost_per_g=excluded.raw_cost_per_g,
            laser_rate_cm3_hr=excluded.laser_rate_cm3_hr,
            machine_hourly_rate=excluded.machine_hourly_rate,
            min_wall_recommended_mm=excluded.min_wall_recommended_mm,
            color_hex=excluded.color_hex,
            description=excluded.description,
            is_active=excluded.is_active,
            technology=excluded.technology,
            is_transparent=excluded.is_transparent,
            optical_transmittance=excluded.optical_transmittance,
            refractive_index=excluded.refractive_index,
            optical_type=excluded.optical_type,
            transmission_factor=excluded.transmission_factor
        """, m)

    # Seed default machining services if empty
    cursor.execute("SELECT COUNT(*) as count FROM machining_services")
    if cursor.fetchone()["count"] == 0:
        default_services = [
            ("as_printed", "surface_finish", "As-Printed (Glass Bead Blast)", 0.0, "per_part", "Ra 6.3 - 9.0 µm", "Uniform satin matte appearance, removed residual sintered powder.", 1),
            ("vibratory_tumble", "surface_finish", "Vibratory Tumble Polish", 38.0, "per_part", "Ra 3.0 - 4.2 µm", "Deburred edges and smoothed external surfaces using ceramic media.", 1),
            ("electrochemical", "surface_finish", "Electro-Chemical Polish", 85.0, "per_part", "Ra 1.2 - 2.0 µm", "Electrolytic bath smoothing, micro-cleaned surface ideal for fluid channels and vacuum systems.", 1),
            ("mirror_polish", "surface_finish", "Optical Mirror Hand Polish", 165.0, "per_part", "Ra < 0.4 µm", "Manual progressive diamond lapping and buffing to high specular reflectance.", 1),
            ("hole_threading", "cnc_operation", "CNC Hole Threading", 14.0, "per_hole", "M3 - M12 / 1/4-20 to 1/2-13", "Precision thread tapping on calibrated CNC machining center.", 1),
            ("datum_face_milling", "cnc_operation", "Datum Face Milling", 65.0, "per_face", "Flatness within 0.02 mm", "High-speed CNC face milling for critical mating surfaces.", 1),
            ("precision_reaming", "cnc_operation", "H7 Precision Reaming", 22.0, "per_bore", "H7 ISO fit", "Dowel pin and bearing location bores reamed to precision H7 tolerance.", 1),
            ("wire_edm_cutoff", "cnc_operation", "Wire EDM Separation", 45.0, "fixed", "Ra 1.6 µm cut", "Submerged wire EDM cut-off from baseplate (no residual stub).", 1),
            ("stress_relief", "heat_treatment", "Vacuum Stress Relief", 85.0, "fixed", "Argon purge vacuum", "Relieves thermal residual stress before wire EDM cut-off, preventing deformation.", 1),
            ("hip", "heat_treatment", "Hot Isostatic Pressing (HIP)", 220.0, "fixed", "1020°C @ 100 MPa", "Eliminates internal micro-porosity to 99.9% density for aerospace fatigue critical parts.", 1),
            ("solution_aging", "heat_treatment", "Solution Anneal & Aging", 140.0, "fixed", "Precipitation hardened", "Optimizes crystalline microstructure for maximum tensile yield and hardness.", 1)
        ]
        cursor.executemany("""
        INSERT INTO machining_services (id, category, name, base_price, unit, spec_detail, description, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, default_services)

    # Post-Processing Techniques table (Admin Managed & Machine Linked)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS post_processing_techniques (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT DEFAULT '',
        category TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        lead_time_days INTEGER NOT NULL DEFAULT 1,
        pricing_model TEXT NOT NULL DEFAULT 'per_part',
        base_price REAL NOT NULL DEFAULT 0.0,
        unit_cost REAL NOT NULL DEFAULT 0.0,
        compatible_material_ids TEXT DEFAULT '[]',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("PRAGMA table_info(post_processing_techniques)")
    post_cols = [row["name"] for row in cursor.fetchall()]
    if "code" not in post_cols:
        cursor.execute("ALTER TABLE post_processing_techniques ADD COLUMN code TEXT DEFAULT ''")
    if "unit_cost" not in post_cols:
        cursor.execute("ALTER TABLE post_processing_techniques ADD COLUMN unit_cost REAL DEFAULT 0.0")

    cursor.execute("UPDATE post_processing_techniques SET code = id WHERE code IS NULL OR code = ''")
    cursor.execute("UPDATE post_processing_techniques SET unit_cost = base_price WHERE unit_cost IS NULL OR unit_cost = 0.0")

    # Add-On Features table (Admin Managed & Machine Linked)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS addon_features (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT DEFAULT '',
        category TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        lead_time_days INTEGER NOT NULL DEFAULT 1,
        pricing_model TEXT NOT NULL DEFAULT 'per_part',
        base_price REAL NOT NULL DEFAULT 0.0,
        unit_cost REAL NOT NULL DEFAULT 0.0,
        compatible_material_ids TEXT DEFAULT '[]',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("PRAGMA table_info(addon_features)")
    addon_cols = [row["name"] for row in cursor.fetchall()]
    if "code" not in addon_cols:
        cursor.execute("ALTER TABLE addon_features ADD COLUMN code TEXT DEFAULT ''")
    if "unit_cost" not in addon_cols:
        cursor.execute("ALTER TABLE addon_features ADD COLUMN unit_cost REAL DEFAULT 0.0")

    cursor.execute("UPDATE addon_features SET code = id WHERE code IS NULL OR code = ''")
    cursor.execute("UPDATE addon_features SET unit_cost = base_price WHERE unit_cost IS NULL OR unit_cost = 0.0")

    # Seed default post-processing techniques if table is empty
    cursor.execute("SELECT COUNT(*) as count FROM post_processing_techniques")
    if cursor.fetchone()["count"] == 0:
        default_post_proc = [
            ("as_printed", "Glass Bead Blasting", "Surface Finish", "Satin matte finish, removes residual sintered powder and provides uniform texture.", 1, "per_part", 15.0, json.dumps(["ti_6al_4v", "ss_316l", "alsi10mg", "inconel_718", "ss_17_4ph", "copper_cuni2sicr", "scalmalloy"]), 1, now_str),
            ("vibratory_tumble", "Vibratory Tumble Polish", "Surface Finish", "Ceramic media deburring and surface smoothing for complex external contours.", 2, "per_part", 38.0, json.dumps(["ti_6al_4v", "ss_316l", "alsi10mg", "inconel_718", "ss_17_4ph", "scalmalloy"]), 1, now_str),
            ("electrochemical", "Electro-Chemical Polish", "Surface Finish", "Ra 1.2-2.0 µm micro-cleaned electrolytic bath ideal for fluid passages and vacuum manifolds.", 3, "per_part", 85.0, json.dumps(["ti_6al_4v", "ss_316l", "inconel_718", "copper_cuni2sicr"]), 1, now_str),
            ("mirror_polish", "Optical Mirror Hand Polish", "Surface Finish", "Progressive diamond lapping to specular mirror reflectance for aesthetic hardware.", 4, "per_part", 165.0, json.dumps([]), 1, now_str),
            ("optical_diamond_coat", "Optical UV Clearcoat & Dip", "Optical & Resin", "UV lacquer dip and diamond buffing for 92% optical clarity and weather resistance.", 2, "per_part", 45.0, json.dumps(["sla_ultraclear", "sla_frosted_diffuser", "sla_amber_crystal", "sla_smoked_obsidian", "sla_cyan_luminescent", "hybrid_metal_light"]), 1, now_str),
            ("frosted_matte_diffusion", "Frosted Matte Light Diffusion", "Optical & Resin", "Soft photon-scattering micro-etching treatment eliminating diode hotspots on custom lamp diffusers.", 1, "per_part", 30.0, json.dumps(["sla_ultraclear", "sla_frosted_diffuser", "sla_amber_crystal", "sla_smoked_obsidian", "sla_cyan_luminescent", "hybrid_metal_light"]), 1, now_str),
            ("vapor_smoothing", "Chemical Vapor Smoothing", "Optical & Resin", "Solvent vapor circulation for sealed, glossy, injection-molded touch and enhanced fluid-tightness.", 2, "per_part", 55.0, json.dumps(["sla_ultraclear", "sla_frosted_diffuser", "sla_amber_crystal", "sla_smoked_obsidian", "sla_cyan_luminescent"]), 1, now_str),
            ("dyeing_tinting", "Pigment Dyeing & Tinting", "Optical & Resin", "Deep saturation heated dye bath for uniform custom translucent colors and edge glows.", 2, "per_part", 40.0, json.dumps(["sla_ultraclear", "sla_frosted_diffuser", "sla_amber_crystal", "sla_smoked_obsidian", "sla_cyan_luminescent"]), 1, now_str),
            ("uv_cure_wash", "Ultrasonic Wash & Multi-Axis UV Cure", "Optical & Resin", "Automated IPA wash station and multi-angle 405nm UV curing chamber for photopolymer crosslinking.", 1, "flat_rate", 25.0, json.dumps(["sla_ultraclear", "sla_frosted_diffuser", "sla_amber_crystal", "sla_smoked_obsidian", "sla_cyan_luminescent", "hybrid_metal_light"]), 1, now_str),
            ("stress_relief", "Vacuum Thermal Stress Relief", "Metallurgical", "Argon atmosphere vacuum furnace thermal cycle preventing residual part warpage during release.", 2, "flat_rate", 95.0, json.dumps(["ti_6al_4v", "ss_316l", "alsi10mg", "inconel_718", "ss_17_4ph", "copper_cuni2sicr", "scalmalloy"]), 1, now_str),
            ("hip", "Hot Isostatic Pressing (HIP)", "Metallurgical", "1020°C @ 100 MPa argon pressure to eliminate internal micro-porosity to 99.9% structural density.", 4, "flat_rate", 240.0, json.dumps(["ti_6al_4v", "inconel_718", "ss_316l"]), 1, now_str),
            ("solution_aging", "Solution Anneal & Aging", "Metallurgical", "Crystalline microstructure precipitation optimization for maximum tensile yield and fatigue life.", 3, "flat_rate", 150.0, json.dumps(["ss_17_4ph", "alsi10mg", "inconel_718", "scalmalloy"]), 1, now_str)
        ]
        cursor.executemany("""
        INSERT INTO post_processing_techniques (id, name, category, description, lead_time_days, pricing_model, base_price, compatible_material_ids, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_post_proc)

    # Seed default add-on features if table is empty
    cursor.execute("SELECT COUNT(*) as count FROM addon_features")
    if cursor.fetchone()["count"] == 0:
        default_addons = [
            ("hole_threading", "CNC Thread Tapping & Inserts", "Subtractive CNC", "M3-M12 & 1/4-20 calibrated thread tapping and helical wire thread inserts.", 2, "per_part", 18.0, json.dumps(["ti_6al_4v", "ss_316l", "alsi10mg", "inconel_718", "ss_17_4ph", "copper_cuni2sicr", "scalmalloy"]), 1, now_str),
            ("datum_face_milling", "Datum Face Precision Milling", "Subtractive CNC", "High-speed CNC face milling to <0.02 mm flatness for precision mating planes.", 2, "per_part", 65.0, json.dumps(["ti_6al_4v", "ss_316l", "alsi10mg", "inconel_718", "ss_17_4ph", "scalmalloy"]), 1, now_str),
            ("precision_reaming", "H7 Precision Bore Reaming", "Subtractive CNC", "H7 ISO dowel pin and precision bearing location bores machined on 5-axis center.", 2, "per_part", 28.0, json.dumps(["ti_6al_4v", "ss_316l", "alsi10mg", "inconel_718", "ss_17_4ph", "scalmalloy"]), 1, now_str),
            ("wire_edm_cutoff", "Submerged Wire EDM Plate Cut-Off", "Subtractive CNC", "Zero-stress wire EDM separation from build plate without residual attachment stubs.", 1, "flat_rate", 50.0, json.dumps(["ti_6al_4v", "ss_316l", "alsi10mg", "inconel_718", "ss_17_4ph", "copper_cuni2sicr", "scalmalloy"]), 1, now_str),
            ("warm_edison_2700k", "Warm Edison 2700K Luminaire Core", "Custom Light", "High-CRI 95+ warm LED core with engineered thermal interface for custom translucent lamps.", 1, "per_part", 35.0, json.dumps(["sla_ultraclear", "sla_frosted_diffuser", "sla_amber_crystal", "sla_smoked_obsidian", "sla_cyan_luminescent", "hybrid_metal_light"]), 1, now_str),
            ("architectural_4000k", "4000K Pure Neutral Architectural Core", "Custom Light", "Crisp studio neutral white LED engine for optical fixtures, light pipes, and architectural installations.", 1, "per_part", 35.0, json.dumps(["sla_ultraclear", "sla_frosted_diffuser", "sla_amber_crystal", "sla_smoked_obsidian", "sla_cyan_luminescent", "hybrid_metal_light"]), 1, now_str),
            ("smart_rgbw_touch", "Smart RGBW Touch Dimmer Luminaire Engine", "Custom Light", "Capacitive touch dimming and 16M color dynamic smartphone app control module.", 2, "per_part", 65.0, json.dumps(["sla_ultraclear", "sla_frosted_diffuser", "sla_amber_crystal", "sla_smoked_obsidian", "sla_cyan_luminescent", "hybrid_metal_light"]), 1, now_str),
            ("rechargeable_li_ion", "3000mAh USB-C Rechargeable Battery Pack", "Custom Light", "Integrated lithium-ion battery with internal charge controller and USB-C port.", 1, "per_part", 28.0, json.dumps(["sla_ultraclear", "sla_frosted_diffuser", "sla_amber_crystal", "sla_smoked_obsidian", "sla_cyan_luminescent", "hybrid_metal_light"]), 1, now_str),
            ("mag_levitation", "Anti-Gravity Magnetic Floating Base", "Exhibition", "Active electromagnetic suspension base for silent 360° mid-air floating display.", 3, "flat_rate", 120.0, json.dumps([]), 1, now_str),
            ("laser_engraved_plaque", "Custom Fiber Laser-Engraved Plaque", "Exhibition", "Precision fiber laser-etched titanium/brass plaque with custom serial, logo, or dedication.", 1, "per_part", 22.0, json.dumps([]), 1, now_str),
            ("express_production", "Critical Emergency Express (2-3 Days)", "Logistics", "Priority machine scheduling in 24/7 continuous run queue with expedited courier dispatch.", 0, "flat_rate", 250.0, json.dumps([]), 1, now_str)
        ]
        cursor.executemany("""
        INSERT INTO addon_features (id, name, category, description, lead_time_days, pricing_model, base_price, compatible_material_ids, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_addons)

    # 3D Metal & Optical Printing Machines (Fleet Management & DFM Limits)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS machines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        technology TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        build_volume_x_mm REAL NOT NULL,
        build_volume_y_mm REAL NOT NULL,
        build_volume_z_mm REAL NOT NULL,
        min_supported_wall_mm REAL NOT NULL DEFAULT 0.40,
        min_unsupported_wall_mm REAL NOT NULL DEFAULT 0.80,
        max_wall_thickness_mm REAL NOT NULL DEFAULT 80.0,
        min_hole_diameter_mm REAL NOT NULL DEFAULT 0.50,
        min_pin_diameter_mm REAL NOT NULL DEFAULT 0.30,
        laser_power_watts INTEGER NOT NULL DEFAULT 400,
        laser_spot_diameter_um INTEGER NOT NULL DEFAULT 100,
        min_layer_thickness_um INTEGER NOT NULL DEFAULT 20,
        max_layer_thickness_um INTEGER NOT NULL DEFAULT 60,
        hourly_rate REAL NOT NULL DEFAULT 95.0,
        supported_materials TEXT NOT NULL DEFAULT '[]',
        supported_post_processing TEXT NOT NULL DEFAULT '[]',
        supported_addons TEXT NOT NULL DEFAULT '[]',
        description TEXT DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
    );
    """)

    # Check and add columns if upgrading existing machines table
    cursor.execute("PRAGMA table_info(machines)")
    machine_cols = [row["name"] for row in cursor.fetchall()]
    if "supported_post_processing" not in machine_cols:
        cursor.execute("ALTER TABLE machines ADD COLUMN supported_post_processing TEXT DEFAULT '[]'")
    if "supported_addons" not in machine_cols:
        cursor.execute("ALTER TABLE machines ADD COLUMN supported_addons TEXT DEFAULT '[]'")
    if "max_wall_thickness_mm" not in machine_cols:
        cursor.execute("ALTER TABLE machines ADD COLUMN max_wall_thickness_mm REAL DEFAULT 80.0")

    # Seed default industrial 3D printing fleet if empty
    cursor.execute("SELECT COUNT(*) as count FROM machines")
    if cursor.fetchone()["count"] == 0:
        now_str = datetime.now(timezone.utc).isoformat()
        default_machines = [
            (
                "eos_m_290",
                "EOS M 290 Direct Metal Laser Sintering",
                "EOS GmbH",
                "DMLS (Direct Metal Laser Sintering)",
                "ACTIVE",
                250.0, 250.0, 325.0,
                0.40, 0.80, 80.0, 0.50, 0.30,
                400, 100, 20, 60,
                95.0,
                json.dumps(["ti_6al_4v", "ss_316l", "alsi10mg", "inconel_718"]),
                json.dumps(["as_printed", "vibratory_tumble", "electrochemical", "mirror_polish", "stress_relief", "hip", "solution_aging"]),
                json.dumps(["hole_threading", "datum_face_milling", "precision_reaming", "wire_edm_cutoff", "laser_engraved_plaque", "mag_levitation"]),
                "Industry gold-standard production system with 400W Yb-fiber laser, high detail resolution, and inert argon atmosphere circulation.",
                1,
                now_str
            ),
            (
                "slm_280_2",
                "SLM Solutions 280 2.0 Twin-Laser",
                "SLM Solutions",
                "SLM (Selective Laser Melting)",
                "ACTIVE",
                280.0, 280.0, 365.0,
                0.35, 0.75, 90.0, 0.45, 0.28,
                700, 80, 30, 75,
                115.0,
                json.dumps(["ss_316l", "ss_17_4ph", "inconel_718", "copper_cuni2sicr"]),
                json.dumps(["as_printed", "vibratory_tumble", "electrochemical", "mirror_polish", "stress_relief", "hip"]),
                json.dumps(["hole_threading", "datum_face_milling", "precision_reaming", "wire_edm_cutoff", "laser_engraved_plaque"]),
                "High-throughput multi-laser system featuring dual 700W fiber lasers and bidirectional powder recoating for rapid build rates.",
                1,
                now_str
            ),
            (
                "eos_m_400_4",
                "EOS M 400-4 Quad-Laser Heavy-Frame",
                "EOS GmbH",
                "DMLS (Direct Metal Laser Sintering)",
                "ACTIVE",
                400.0, 400.0, 400.0,
                0.45, 0.90, 120.0, 0.60, 0.35,
                1600, 100, 40, 90,
                185.0,
                json.dumps(["ti_6al_4v", "alsi10mg", "inconel_718", "scalmalloy"]),
                json.dumps(["as_printed", "vibratory_tumble", "stress_relief", "hip"]),
                json.dumps(["hole_threading", "datum_face_milling", "wire_edm_cutoff", "laser_engraved_plaque", "express_production"]),
                "Large-scale industrial production platform with four 400W lasers covering a massive 400x400x400mm envelope for rocket engines and aerospace manifolds.",
                1,
                now_str
            ),
            (
                "renishaw_500q",
                "Renishaw RenAM 500Q Ultra-Precision",
                "Renishaw plc",
                "LPBF (Laser Powder Bed Fusion)",
                "ACTIVE",
                250.0, 250.0, 350.0,
                0.30, 0.70, 75.0, 0.40, 0.25,
                500, 75, 20, 50,
                130.0,
                json.dumps(["ti_6al_4v", "inconel_718", "ss_316l", "copper_cuni2sicr"]),
                json.dumps(["as_printed", "electrochemical", "mirror_polish", "stress_relief", "hip"]),
                json.dumps(["hole_threading", "datum_face_milling", "precision_reaming", "laser_engraved_plaque", "mag_levitation"]),
                "Ultra-high precision quad-laser LPBF system with 75µm dynamic focus beam waist, ideal for thin-wall biomedical implants and complex micro-cooling channels.",
                1,
                now_str
            ),
            (
                "formlabs_form_4l",
                "Formlabs Form 4L SLA Optical Clear & Luminaire",
                "Formlabs",
                "SLA (Stereolithography)",
                "ACTIVE",
                353.0, 196.0, 350.0,
                0.35, 0.60, 60.0, 0.35, 0.20,
                120, 50, 25, 100,
                48.0,
                json.dumps(["sla_ultraclear", "sla_frosted_diffuser", "sla_amber_crystal", "sla_smoked_obsidian", "sla_cyan_luminescent"]),
                json.dumps(["optical_diamond_coat", "frosted_matte_diffusion", "vapor_smoothing", "dyeing_tinting", "uv_cure_wash"]),
                json.dumps(["warm_edison_2700k", "architectural_4000k", "smart_rgbw_touch", "rechargeable_li_ion", "laser_engraved_plaque", "express_production"]),
                "High-precision stereolithography with ultra-clear photopolymer optics, 50µm pixel size, and active heating for bubble-free optical light fixtures.",
                1,
                now_str
            ),
            (
                "stratasys_j850",
                "Stratasys J850 Prime PolyJet Multi-Material",
                "Stratasys",
                "PolyJet (Multi-Material Jetting)",
                "ACTIVE",
                490.0, 390.0, 200.0,
                0.30, 0.50, 50.0, 0.30, 0.18,
                80, 42, 14, 27,
                82.0,
                json.dumps(["hybrid_metal_light", "sla_ultraclear", "sla_frosted_diffuser", "ss_316l"]),
                json.dumps(["optical_diamond_coat", "vapor_smoothing", "dyeing_tinting", "mirror_polish"]),
                json.dumps(["warm_edison_2700k", "smart_rgbw_touch", "laser_engraved_plaque", "rechargeable_li_ion", "express_production"]),
                "Full-color multi-material jetting combining rigid opaque structural frames with glass-clear optical light guides in a single seamless print job.",
                1,
                now_str
            )
        ]
        cursor.executemany("""
        INSERT INTO machines (
            id, name, manufacturer, technology, status,
            build_volume_x_mm, build_volume_y_mm, build_volume_z_mm,
            min_supported_wall_mm, min_unsupported_wall_mm, max_wall_thickness_mm, min_hole_diameter_mm, min_pin_diameter_mm,
            laser_power_watts, laser_spot_diameter_um, min_layer_thickness_um, max_layer_thickness_um,
            hourly_rate, supported_materials, supported_post_processing, supported_addons, description, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_machines)

    # Merchant Bank Account & Gateway Config (Admin Managed)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS merchant_bank_config (
        id TEXT PRIMARY KEY,
        bank_name TEXT NOT NULL,
        account_holder TEXT NOT NULL,
        routing_number TEXT NOT NULL,
        account_number_masked TEXT NOT NULL,
        account_type TEXT NOT NULL DEFAULT 'business_checking',
        gateway_provider TEXT NOT NULL DEFAULT 'Stripe Additive Gateway',
        merchant_id TEXT NOT NULL DEFAULT 'acct_1N9472918840',
        api_key_masked TEXT NOT NULL DEFAULT 'sk_live_••••••••••••••••9482',
        currency TEXT NOT NULL DEFAULT 'USD',
        payout_schedule TEXT NOT NULL DEFAULT 'daily_rolling',
        is_verified INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
    );
    """)

    # Merchant Settlement Payouts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS merchant_settlement_payouts (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'SETTLED',
        destination_bank TEXT NOT NULL,
        destination_account TEXT NOT NULL,
        transaction_count INTEGER NOT NULL,
        initiated_at TEXT NOT NULL,
        arrival_date TEXT NOT NULL
    );
    """)

    # Seed merchant bank config if empty
    cursor.execute("SELECT COUNT(*) as count FROM merchant_bank_config")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("""
        INSERT INTO merchant_bank_config (
            id, bank_name, account_holder, routing_number, account_number_masked,
            account_type, gateway_provider, merchant_id, api_key_masked, currency,
            payout_schedule, is_verified, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "primary",
            "JPMorgan Chase Commercial Bank",
            "TitanForge Additive Manufacturing LLC",
            "021000021",
            "••••••••8849",
            "business_checking",
            "Stripe Additive Gateway",
            "acct_1N9472918840",
            "sk_live_••••••••••••••••9482",
            "USD",
            "daily_rolling",
            1,
            datetime.now(timezone.utc).isoformat()
        ))

    # Seed initial settlement payouts if empty
    cursor.execute("SELECT COUNT(*) as count FROM merchant_settlement_payouts")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("""
        INSERT INTO merchant_settlement_payouts (
            id, amount, status, destination_bank, destination_account, transaction_count, initiated_at, arrival_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "PO-2026-9810",
            5000.0,
            "SETTLED",
            "JPMorgan Chase Commercial Bank",
            "••••••••8849",
            4,
            "2026-10-17T12:00:00Z",
            "2026-10-18"
        ))

    # ForgeAI Saved Projects Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS forge_projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        session_id TEXT NOT NULL,
        feature_tree_json TEXT NOT NULL,
        history_index INTEGER NOT NULL DEFAULT 0,
        material_id TEXT NOT NULL DEFAULT 'bronze_infused_steel',
        solid_volume_cm3 REAL NOT NULL DEFAULT 0.0,
        hollowed_volume_cm3 REAL NOT NULL DEFAULT 0.0,
        is_hollowed INTEGER NOT NULL DEFAULT 0,
        bbox_x REAL NOT NULL DEFAULT 0.0,
        bbox_y REAL NOT NULL DEFAULT 0.0,
        bbox_z REAL NOT NULL DEFAULT 0.0,
        glb_path TEXT,
        stl_path TEXT,
        engine_used TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """)

    # Quote & DFM Saved Projects Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quote_projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        model_id TEXT,
        model_data_json TEXT NOT NULL,
        material_id TEXT NOT NULL DEFAULT 'ti_6al_4v',
        finish_id TEXT NOT NULL DEFAULT 'as_printed',
        machining_options_json TEXT NOT NULL DEFAULT '{}',
        quantity INTEGER NOT NULL DEFAULT 1,
        lead_time_id TEXT NOT NULL DEFAULT 'standard',
        quote_summary_json TEXT,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """)

    # Legal Disclaimers Table (Admin-Managed IP & Mandatory Clickwrap Terms)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS legal_disclaimers (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        checkbox_text TEXT NOT NULL,
        full_terms_content TEXT NOT NULL,
        version TEXT NOT NULL DEFAULT '1.0',
        worm_retention_years INTEGER NOT NULL DEFAULT 7,
        cad_retention_days INTEGER NOT NULL DEFAULT 90,
        is_active INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("PRAGMA table_info(legal_disclaimers)")
    disc_cols = [row["name"] for row in cursor.fetchall()]
    if "worm_retention_years" not in disc_cols:
        cursor.execute("ALTER TABLE legal_disclaimers ADD COLUMN worm_retention_years INTEGER NOT NULL DEFAULT 7")
    if "cad_retention_days" not in disc_cols:
        cursor.execute("ALTER TABLE legal_disclaimers ADD COLUMN cad_retention_days INTEGER NOT NULL DEFAULT 90")

    default_checkbox = (
        "I certify that I own the intellectual property rights or hold explicit authorization to "
        "manufacture the uploaded 3D model(s), that these files contain no prohibited/regulated items, "
        "and I agree to the IP & Indemnification Terms."
    )
    default_full_terms = """# TitanForge Additive Manufacturing — Intellectual Property & Legal Manufacturing Terms

**Document Version:** 1.0  
**Effective Date:** Mandatory Clickwrap Gate  
**Applicability:** Applies strictly to all uploaded CAD models, 3D tessellations, drawings, and physical manufacturing orders dispatched through the TitanForge quoting engine.

---

### 1. Intellectual Property Ownership & Customer Warranties
The Customer expressly certifies, warrants, and represents to TitanForge 3D and its manufacturing affiliates that:
* **Sole Ownership or Explicit License:** Customer is either the sole, exclusive, and unencumbered legal owner of all proprietary rights, trade secrets, patents, copyrights, and industrial design rights in and to the uploaded 3D CAD model(s); OR Customer holds a valid, fully executed, written license or authorization from the legal rights-holder granting explicit permission to manufacture, reproduce, machine, and post-process physical components based on the uploaded geometry.
* **Non-Infringement Warranty:** The production, machining, surface finishing, assembly, delivery, or sale of components generated from the uploaded designs will not infringe upon, misappropriate, dilute, or violate any patent, copyright, trademark, trade secret, mask work, or contractual right of any third party worldwide.

---

### 2. Defense, Indemnification & Hold Harmless
* **Comprehensive Customer Indemnification:** Customer agrees to defend, indemnify, and hold harmless TitanForge 3D, its corporate parents, subsidiaries, affiliates, officers, directors, employees, laser sintering technicians, and logistics partners from and against any and all claims, demands, liabilities, lawsuits, judgments, losses, damages, government penalties, costs, and expenses (including reasonable attorneys' fees and expert witness costs) arising out of or related to:
  * Any allegation or formal claim that the uploaded 3D geometry, CAD files, or physical parts produced therefrom infringe upon or violate third-party intellectual property or proprietary rights.
  * Any breach or alleged breach of Customer’s warranties, regulatory declarations, or representations contained in these terms.
* **Assumption of Defense:** TitanForge reserves the right, at its own option, to assume exclusive defense and control of any matter subject to indemnification by Customer, and Customer agrees to cooperate fully with TitanForge in asserting any available defenses.

---

### 3. Prohibited Designs & Regulatory Compliance
TitanForge enforces a strict zero-tolerance policy regarding illegal, hazardous, and regulated articles. You strictly certify that the uploaded files DO NOT contain, embody, or facilitate:
* **Firearms & Restricted Weaponry:** Complete firearms, receivers, frames, silencer/suppressor baffles, conversion devices (e.g., auto-sears), or any components regulated under the National Firearms Act (NFA) or Undetectable Firearms Act.
* **Defense Articles & Export Control (ITAR/EAR):** Technical data or defense articles restricted under U.S. International Traffic in Arms Regulations (ITAR) or Export Administration Regulations (EAR), unless explicitly disclosed and approved under an authorized ITAR manufacturing agreement.
* **Hazardous & Prohibited Contraband:** Biohazard dispersion mechanisms, controlled substance extraction vessels, illegal lock-picking or intrusion mechanisms, or items specifically engineered to inflict unlawful bodily harm.

---

### 4. Right to Refuse Service, Cancel Orders & Purge Files
* **On-Demand Contract Manufacturer Status:** TitanForge acts solely as an independent, on-demand contract manufacturer and automated geometry analysis provider. TitanForge does not verify design utility, fitness for a particular purpose, or freedom-to-operate.
* **Absolute Right to Cancel & Purge:** TitanForge reserves the absolute right, exercisable at any time in its sole discretion and without liability, to cancel orders, suspend automated slicing or laser powder bed fusion builds, notify law enforcement or regulatory authorities if prohibited items are identified, and immediately purge CAD models and associated data from all storage systems.

---

### 5. Customer IP Confidentiality & Non-Disclosure
* **Confidential Manufacturing Standard:** TitanForge treats all uploaded customer 3D CAD geometries, tessellated files (STL, OBJ, STEP), engineering drawings, and manufacturing specifications as strictly confidential Customer Proprietary Information.
* **Non-Disclosure & Anti-Derivative Guarantee:** TitanForge guarantees that customer CAD models and proprietary designs are utilized solely and exclusively to perform automated geometric DFM slicing, quotation calculation, laser path generation, and physical part manufacturing. TitanForge will never share, sell, distribute, display publicly, reverse engineer, or incorporate customer designs into derivative products or open machine learning training sets."""

    # Check and seed default IP & Legal Disclaimer if empty
    cursor.execute("SELECT COUNT(*) as count FROM legal_disclaimers")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("""
        INSERT INTO legal_disclaimers (id, title, checkbox_text, full_terms_content, version, worm_retention_years, cad_retention_days, is_active, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "default_ip_disclaimer",
            "Intellectual Property & Legal Manufacturing Terms",
            default_checkbox,
            default_full_terms,
            "1.0",
            7,
            90,
            1,
            datetime.now(timezone.utc).isoformat()
        ))
    else:
        # Update existing default record with 5th clause if not present
        cursor.execute("SELECT full_terms_content FROM legal_disclaimers WHERE id = 'default_ip_disclaimer'")
        cur_disc = cursor.fetchone()
        if cur_disc and "5. Customer IP Confidentiality" not in cur_disc["full_terms_content"]:
            cursor.execute("""
            UPDATE legal_disclaimers
            SET full_terms_content = ?, worm_retention_years = 7, cad_retention_days = 90
            WHERE id = 'default_ip_disclaimer'
            """, (default_full_terms,))

    # Storage Provider Configuration (Admin WORM Storage & Cloud S3 Providers)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS storage_provider_config (
        id TEXT PRIMARY KEY,
        provider_type TEXT NOT NULL DEFAULT 'LOCAL_WORM_VAULT', -- 'LOCAL_WORM_VAULT' or 'AWS_S3_OBJECT_LOCK'
        s3_bucket TEXT DEFAULT '',
        s3_region TEXT DEFAULT 'us-east-1',
        s3_access_key_masked TEXT DEFAULT '',
        s3_secret_key_masked TEXT DEFAULT '',
        retention_mode TEXT DEFAULT 'COMPLIANCE', -- 'COMPLIANCE' or 'GOVERNANCE'
        is_active INTEGER DEFAULT 1,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("SELECT COUNT(*) as count FROM storage_provider_config")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("""
        INSERT INTO storage_provider_config (
            id, provider_type, s3_bucket, s3_region, s3_access_key_masked, s3_secret_key_masked, retention_mode, is_active, updated_at
        ) VALUES ('primary', 'LOCAL_WORM_VAULT', '', 'us-east-1', '', '', 'COMPLIANCE', 1, ?)
        """, (datetime.now(timezone.utc).isoformat(),))

    # AI Provider Configuration (Tripo3D API & TitanForge Billing)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_provider_config (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL DEFAULT 'TRIPO_3D',
        api_key_encrypted TEXT DEFAULT '',
        api_key_masked TEXT DEFAULT '',
        base_url TEXT DEFAULT 'https://api.tripo3d.ai/v2/openapi',
        is_enabled INTEGER DEFAULT 1,
        fee_structure TEXT NOT NULL,
        balance_credits REAL DEFAULT 0.0,
        last_checked_at TEXT,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("SELECT COUNT(*) as count FROM ai_provider_config WHERE id = 'TRIPO_3D'")
    if cursor.fetchone()["count"] == 0:
        default_fees = json.dumps({
            "textTo3dDraftCost": 0.50,
            "imageTo3dDraftCost": 0.60,
            "meshRefinementCost": 0.75,
            "pbrTextureCost": 0.75,
            "formatConversionCost": 0.25,
            "platformMarkupPercent": 25.0
        })
        existing_key = "tsk_W3RwEPae2afzdJfycSfxrVizCRfYt_yiEKi8um4pvAT"
        masked_key = f"{existing_key[:8]}...{existing_key[-5:]}"
        cursor.execute("""
        INSERT INTO ai_provider_config (
            id, provider, api_key_encrypted, api_key_masked, base_url, is_enabled, fee_structure, balance_credits, last_checked_at, updated_at
        ) VALUES ('TRIPO_3D', 'TRIPO_3D', ?, ?, 'https://api.tripo3d.ai/v2/openapi', 1, ?, 1380.0, ?, ?)
        """, (existing_key, masked_key, default_fees, now_str, now_str))

    # WORM Transaction Ledger (Write Once, Read Many Cryptographic Audit Trail)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transaction_ledger (
        id TEXT PRIMARY KEY, -- Certificate UUID (e.g. TF-CERT-xxxx)
        project_id TEXT,
        order_id TEXT,
        quote_id TEXT,
        event_type TEXT NOT NULL, -- 'QUOTE_SUBMITTED', 'ORDER_CONFIRMED', 'REVISION_CREATED'
        actor_id TEXT,
        actor_email TEXT,
        actor_ip_address TEXT,
        actor_user_agent TEXT,
        cad_file_name TEXT,
        cad_file_size INTEGER,
        cad_file_sha256 TEXT NOT NULL,
        cad_thumbnail_data_url TEXT,
        dfm_geometry_metrics TEXT NOT NULL, -- Canonical JSON
        frozen_snapshot_json TEXT NOT NULL, -- Canonical JSON
        previous_hash TEXT NOT NULL, -- 64-char SHA256 of parent block
        ledger_hash TEXT NOT NULL, -- 64-char SHA256 of this block
        worm_retention_years INTEGER NOT NULL DEFAULT 7,
        worm_retain_until TEXT NOT NULL, -- ISO Timestamp (7 years in future)
        cad_retain_until TEXT NOT NULL,  -- ISO Timestamp (90 days in future)
        is_legal_hold INTEGER NOT NULL DEFAULT 0,
        legal_hold_reason TEXT DEFAULT '',
        legal_hold_updated_at TEXT DEFAULT '',
        storage_provider TEXT NOT NULL DEFAULT 'LOCAL_WORM_VAULT',
        storage_uri TEXT DEFAULT '',
        pdf_certificate_path TEXT DEFAULT '',
        created_at TEXT NOT NULL
    );
    """)

    # Layer 2 SQLite WORM Enforcing Triggers
    cursor.execute("""
    CREATE TRIGGER IF NOT EXISTS trg_prevent_ledger_delete
    BEFORE DELETE ON transaction_ledger
    BEGIN
        SELECT RAISE(ABORT, 'WORM Compliance Violation: Deletion of immutable transaction ledger records is strictly prohibited.');
    END;
    """)

    cursor.execute("DROP TRIGGER IF EXISTS trg_prevent_ledger_update")
    cursor.execute("""
    CREATE TRIGGER trg_prevent_ledger_update
    BEFORE UPDATE ON transaction_ledger
    BEGIN
        SELECT CASE
            WHEN (
                OLD.id = NEW.id
                AND OLD.event_type = NEW.event_type
                AND OLD.cad_file_sha256 = NEW.cad_file_sha256
                AND OLD.previous_hash = NEW.previous_hash
                AND OLD.ledger_hash = NEW.ledger_hash
                AND OLD.created_at = NEW.created_at
                AND OLD.cad_file_name = NEW.cad_file_name
                AND OLD.cad_file_size = NEW.cad_file_size
                AND OLD.dfm_geometry_metrics = NEW.dfm_geometry_metrics
                AND OLD.frozen_snapshot_json = NEW.frozen_snapshot_json
                AND OLD.worm_retention_years = NEW.worm_retention_years
                AND OLD.worm_retain_until = NEW.worm_retain_until
                AND (
                    -- Sub-case A: Legal hold enactment 0 -> 1
                    (OLD.is_legal_hold = 0 AND NEW.is_legal_hold = 1)
                    OR
                    -- Sub-case B: Storage URI / Certificate path attachment
                    ((OLD.storage_uri IS NULL OR OLD.storage_uri = '') AND OLD.is_legal_hold = NEW.is_legal_hold)
                )
            )
            THEN 1
            ELSE RAISE(ABORT, 'WORM Compliance Violation: Modification of immutable transaction ledger records is strictly prohibited.')
        END;
    END;
    """)

    conn.commit()
    conn.close()

def get_active_legal_disclaimer():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM legal_disclaimers WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1
    """)
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["checkboxText"] = d["checkbox_text"]
        d["fullTermsContent"] = d["full_terms_content"]
        d["wormRetentionYears"] = d.get("worm_retention_years", 7)
        d["cadRetentionDays"] = d.get("cad_retention_days", 90)
        d["isActive"] = bool(d["is_active"])
        d["updatedAt"] = d["updated_at"]
        return d
    return None

def get_all_legal_disclaimers():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM legal_disclaimers ORDER BY updated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    res = []
    for r in rows:
        d = dict(r)
        d["checkboxText"] = d["checkbox_text"]
        d["fullTermsContent"] = d["full_terms_content"]
        d["wormRetentionYears"] = d.get("worm_retention_years", 7)
        d["cadRetentionDays"] = d.get("cad_retention_days", 90)
        d["isActive"] = bool(d["is_active"])
        d["updatedAt"] = d["updated_at"]
        res.append(d)
    return res

def save_legal_disclaimer(
    title: str,
    checkbox_text: str,
    full_terms_content: str,
    version: str,
    worm_retention_years: int = 7,
    cad_retention_days: int = 90,
    is_active: bool = True,
    disclaimer_id: str = None
):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    if not disclaimer_id:
        cursor.execute("SELECT id FROM legal_disclaimers WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1")
        row = cursor.fetchone()
        disclaimer_id = row["id"] if row else "default_ip_disclaimer"

    cursor.execute("""
    INSERT INTO legal_disclaimers (id, title, checkbox_text, full_terms_content, version, worm_retention_years, cad_retention_days, is_active, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        checkbox_text = excluded.checkbox_text,
        full_terms_content = excluded.full_terms_content,
        version = excluded.version,
        worm_retention_years = excluded.worm_retention_years,
        cad_retention_days = excluded.cad_retention_days,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    """, (
        disclaimer_id,
        title,
        checkbox_text,
        full_terms_content,
        version,
        int(worm_retention_years or 7),
        int(cad_retention_days or 90),
        1 if is_active else 0,
        now_iso
    ))
    conn.commit()
    conn.close()
    return get_active_legal_disclaimer()

# ==========================================
# WORM CRYPTOGRAPHIC LEDGER HELPERS
# ==========================================

def compute_file_sha256(file_path_or_bytes) -> str:
    """Computes a strict 64-character lowercase hex SHA-256 digest from a file path or binary buffer."""
    sha256 = hashlib.sha256()
    if isinstance(file_path_or_bytes, (bytes, bytearray)):
        sha256.update(file_path_or_bytes)
    elif isinstance(file_path_or_bytes, str):
        if os.path.isfile(file_path_or_bytes):
            with open(file_path_or_bytes, "rb") as f:
                while chunk := f.read(65536):
                    sha256.update(chunk)
        else:
            sha256.update(file_path_or_bytes.encode("utf-8"))
    else:
        sha256.update(str(file_path_or_bytes).encode("utf-8"))
    return sha256.hexdigest().lower()

def compute_canonical_ledger_hash(previous_hash: str, created_at: str, cad_file_sha256: str, canonical_snapshot_str: str) -> str:
    """Calculates canonical Merkle block hash tying the cryptographic chain to CAD file and frozen quote/order state."""
    raw = f"{previous_hash}|{created_at}|{cad_file_sha256}|{canonical_snapshot_str}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest().lower()

def create_worm_ledger_entry(
    event_type: str,
    project_id: Optional[str] = None,
    order_id: Optional[str] = None,
    quote_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    actor_email: Optional[str] = None,
    actor_ip_address: Optional[str] = None,
    actor_user_agent: Optional[str] = None,
    cad_file_name: Optional[str] = None,
    cad_file_size: Optional[int] = 0,
    cad_file_sha256: Optional[str] = None,
    cad_thumbnail_data_url: Optional[str] = None,
    dfm_geometry_metrics: Optional[dict] = None,
    frozen_snapshot_dict: Optional[dict] = None,
    worm_retention_years: int = 7,
    cad_retention_days: int = 90,
    storage_provider: str = "LOCAL_WORM_VAULT",
    storage_uri: Optional[str] = "",
    pdf_certificate_path: Optional[str] = ""
) -> dict:
    """
    Creates an immutable WORM transaction ledger entry.
    Enforces Layer 1 application guardrails & hashes to previous ledger block to maintain Merkle chain.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Find previous ledger hash to maintain continuous cryptographic chain
    cursor.execute("SELECT ledger_hash FROM transaction_ledger ORDER BY created_at DESC, rowid DESC LIMIT 1")
    prev_row = cursor.fetchone()
    previous_hash = prev_row["ledger_hash"] if prev_row else ("0" * 64)

    now_dt = datetime.now(timezone.utc)
    created_at = now_dt.isoformat()
    worm_retain_until = (now_dt + timedelta(days=365 * int(worm_retention_years or 7))).isoformat()
    cad_retain_until = (now_dt + timedelta(days=int(cad_retention_days or 90))).isoformat()

    cert_id = f"TF-WORM-{uuid.uuid4().hex[:12].upper()}"

    # Canonicalize JSON to guarantee hash stability
    canonical_metrics_str = json.dumps(dfm_geometry_metrics or {}, sort_keys=True, separators=(",", ":"))
    canonical_snapshot_str = json.dumps(frozen_snapshot_dict or {}, sort_keys=True, separators=(",", ":"))

    cad_sha = (cad_file_sha256 or ("0" * 64)).lower()
    ledger_hash = compute_canonical_ledger_hash(previous_hash, created_at, cad_sha, canonical_snapshot_str)

    cursor.execute("""
    INSERT INTO transaction_ledger (
        id, project_id, order_id, quote_id, event_type,
        actor_id, actor_email, actor_ip_address, actor_user_agent,
        cad_file_name, cad_file_size, cad_file_sha256, cad_thumbnail_data_url,
        dfm_geometry_metrics, frozen_snapshot_json,
        previous_hash, ledger_hash,
        worm_retention_years, worm_retain_until, cad_retain_until,
        is_legal_hold, legal_hold_reason, legal_hold_updated_at,
        storage_provider, storage_uri, pdf_certificate_path, created_at
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?,
        0, '', '',
        ?, ?, ?, ?
    )
    """, (
        cert_id, project_id, order_id, quote_id, event_type,
        actor_id or "system", actor_email or "anonymous", actor_ip_address or "127.0.0.1", actor_user_agent or "TitanForge Web Client",
        cad_file_name or "part.stl", int(cad_file_size or 0), cad_sha, cad_thumbnail_data_url or "",
        canonical_metrics_str, canonical_snapshot_str,
        previous_hash, ledger_hash,
        int(worm_retention_years or 7), worm_retain_until, cad_retain_until,
        storage_provider or "LOCAL_WORM_VAULT", storage_uri or "", pdf_certificate_path or "", created_at
    ))

    conn.commit()
    cursor.execute("SELECT * FROM transaction_ledger WHERE id = ?", (cert_id,))
    created_entry = dict(cursor.fetchone())
    conn.close()

    return created_entry

def update_ledger_storage_info(ledger_id: str, storage_uri: str, pdf_certificate_path: str):
    """Safely updates storage URI and PDF certificate path on an existing ledger block if blank."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE transaction_ledger
    SET storage_uri = ?, pdf_certificate_path = ?
    WHERE id = ?
    """, (storage_uri, pdf_certificate_path, ledger_id))
    conn.commit()
    conn.close()

def get_worm_ledger_entries(limit: int = 100) -> list:
    """Returns chronologically ordered transaction ledger entries."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM transaction_ledger ORDER BY created_at DESC, rowid DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        try:
            d["dfm_geometry_metrics"] = json.loads(d["dfm_geometry_metrics"])
        except Exception:
            d["dfm_geometry_metrics"] = {}
        try:
            d["frozen_snapshot_json"] = json.loads(d["frozen_snapshot_json"])
        except Exception:
            d["frozen_snapshot_json"] = {}
        d["is_legal_hold"] = bool(d["is_legal_hold"])
        results.append(d)
    return results

def get_worm_ledger_by_id(ledger_id: str) -> Optional[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transaction_ledger WHERE id = ?", (ledger_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    try:
        d["dfm_geometry_metrics"] = json.loads(d["dfm_geometry_metrics"])
    except Exception:
        d["dfm_geometry_metrics"] = {}
    try:
        d["frozen_snapshot_json"] = json.loads(d["frozen_snapshot_json"])
    except Exception:
        d["frozen_snapshot_json"] = {}
    d["is_legal_hold"] = bool(d["is_legal_hold"])
    return d

def get_worm_ledger_by_order_id(order_id: str) -> Optional[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transaction_ledger WHERE order_id = ? ORDER BY created_at DESC LIMIT 1", (order_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    try:
        d["dfm_geometry_metrics"] = json.loads(d["dfm_geometry_metrics"])
    except Exception:
        d["dfm_geometry_metrics"] = {}
    try:
        d["frozen_snapshot_json"] = json.loads(d["frozen_snapshot_json"])
    except Exception:
        d["frozen_snapshot_json"] = {}
    d["is_legal_hold"] = bool(d["is_legal_hold"])
    return d

def get_worm_ledger_by_quote_id(quote_id: str) -> Optional[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transaction_ledger WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1", (quote_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    try:
        d["dfm_geometry_metrics"] = json.loads(d["dfm_geometry_metrics"])
    except Exception:
        d["dfm_geometry_metrics"] = {}
    try:
        d["frozen_snapshot_json"] = json.loads(d["frozen_snapshot_json"])
    except Exception:
        d["frozen_snapshot_json"] = {}
    d["is_legal_hold"] = bool(d["is_legal_hold"])
    return d

def toggle_legal_hold(ledger_id: str, reason: str, admin_email: str) -> dict:
    """Enforces WORM legal hold lock (0 -> 1). Once locked, it cannot be tampered with."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transaction_ledger WHERE id = ?", (ledger_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Ledger record '{ledger_id}' does not exist.")
    if row["is_legal_hold"] == 1:
        conn.close()
        return {
            "message": "Legal hold is already active on this record under WORM compliance.",
            "is_legal_hold": True,
            "id": ledger_id
        }

    now_iso = datetime.now(timezone.utc).isoformat()
    hold_reason = f"Enacted by {admin_email} on {now_iso}: {reason or 'Pending regulatory / IP litigation hold'}"
    cursor.execute("""
    UPDATE transaction_ledger
    SET is_legal_hold = 1,
        legal_hold_reason = ?,
        legal_hold_updated_at = ?
    WHERE id = ?
    """, (hold_reason, now_iso, ledger_id))
    conn.commit()
    conn.close()
    return {
        "message": f"Legal hold successfully enacted on ledger entry '{ledger_id}'. CAD purge routines indefinitely suspended.",
        "is_legal_hold": True,
        "id": ledger_id,
        "legal_hold_reason": hold_reason
    }

def verify_merkle_chain() -> dict:
    """
    Crawls every block in the transaction ledger in sequence and verifies:
    1. Previous hash link matches preceding block's ledger hash
    2. Recalculated SHA-256 matches stored block ledger hash
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transaction_ledger ORDER BY created_at ASC, rowid ASC")
    rows = cursor.fetchall()
    conn.close()

    total_blocks = len(rows)
    if total_blocks == 0:
        return {
            "is_valid": True,
            "total_blocks": 0,
            "broken_at_index": None,
            "message": "Transaction ledger is currently empty. Merkle chain genesis ready."
        }

    expected_prev = "0" * 64
    for idx, r in enumerate(rows):
        actual_prev = r["previous_hash"]
        if actual_prev != expected_prev:
            return {
                "is_valid": False,
                "total_blocks": total_blocks,
                "broken_at_index": idx,
                "broken_block_id": r["id"],
                "reason": f"Block #{idx} ({r['id']}) previous_hash mismatch! Expected {expected_prev}, got {actual_prev}."
            }

        recomputed = compute_canonical_ledger_hash(
            actual_prev,
            r["created_at"],
            r["cad_file_sha256"],
            r["frozen_snapshot_json"]
        )
        if recomputed != r["ledger_hash"]:
            return {
                "is_valid": False,
                "total_blocks": total_blocks,
                "broken_at_index": idx,
                "broken_block_id": r["id"],
                "reason": f"Block #{idx} ({r['id']}) hash tampered! Expected {recomputed}, got {r['ledger_hash']}."
            }
        expected_prev = r["ledger_hash"]

    return {
        "is_valid": True,
        "total_blocks": total_blocks,
        "broken_at_index": None,
        "message": f"All {total_blocks} ledger blocks cryptographically verified with unbroken Merkle integrity."
    }

# ==========================================
# STORAGE PROVIDER CONFIG HELPERS
# ==========================================

def get_storage_provider_config() -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM storage_provider_config WHERE id = 'primary'")
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return {
        "id": "primary",
        "provider_type": "LOCAL_WORM_VAULT",
        "s3_bucket": "",
        "s3_region": "us-east-1",
        "s3_access_key_masked": "",
        "s3_secret_key_masked": "",
        "retention_mode": "COMPLIANCE",
        "is_active": 1,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

def update_storage_provider_config(
    provider_type: str,
    s3_bucket: Optional[str] = "",
    s3_region: Optional[str] = "us-east-1",
    s3_access_key: Optional[str] = None,
    s3_secret_key: Optional[str] = None,
    retention_mode: Optional[str] = "COMPLIANCE",
    is_active: bool = True
) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM storage_provider_config WHERE id = 'primary'")
    curr = cursor.fetchone()

    access_masked = curr["s3_access_key_masked"] if curr else ""
    if s3_access_key and len(s3_access_key.strip()) >= 6:
        clean = s3_access_key.strip()
        access_masked = f"{clean[:4]}••••••••{clean[-4:]}"

    secret_masked = curr["s3_secret_key_masked"] if curr else ""
    if s3_secret_key and len(s3_secret_key.strip()) >= 6:
        clean = s3_secret_key.strip()
        secret_masked = f"{clean[:3]}••••••••••••••••{clean[-4:]}"

    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO storage_provider_config (
        id, provider_type, s3_bucket, s3_region, s3_access_key_masked, s3_secret_key_masked,
        retention_mode, is_active, updated_at
    ) VALUES ('primary', ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        provider_type = excluded.provider_type,
        s3_bucket = excluded.s3_bucket,
        s3_region = excluded.s3_region,
        s3_access_key_masked = excluded.s3_access_key_masked,
        s3_secret_key_masked = excluded.s3_secret_key_masked,
        retention_mode = excluded.retention_mode,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    """, (
        provider_type,
        (s3_bucket or "").strip(),
        (s3_region or "us-east-1").strip(),
        access_masked,
        secret_masked,
        (retention_mode or "COMPLIANCE").strip().upper(),
        1 if is_active else 0,
        now_iso
    ))
    conn.commit()
    conn.close()
    return get_storage_provider_config()


# =============================================================================
# TITANFORGE AI & TRIPO3D BILLING HELPERS
# =============================================================================

def get_tripo_config() -> dict:
    """Retrieves Tripo3D API configuration with masked key and parsed fee structure."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ai_provider_config WHERE id = 'TRIPO_3D'")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {
            "provider": "TRIPO_3D",
            "isEnabled": True,
            "baseUrl": "https://api.tripo3d.ai/v2/openapi",
            "apiKeyMasked": "",
            "feeStructure": {
                "textTo3dDraftCost": 0.50,
                "imageTo3dDraftCost": 0.60,
                "meshRefinementCost": 0.75,
                "pbrTextureCost": 0.75,
                "formatConversionCost": 0.25,
                "platformMarkupPercent": 25.0
            },
            "balanceCredits": 0.0,
            "lastCheckedAt": None
        }

    d = dict(row)
    try:
        fee_struct = json.loads(d.get("fee_structure") or "{}")
    except Exception:
        fee_struct = {}

    return {
        "id": d["id"],
        "provider": d["provider"],
        "apiKeyMasked": d.get("api_key_masked") or "",
        "hasKey": bool(d.get("api_key_encrypted")),
        "baseUrl": d.get("base_url") or "https://api.tripo3d.ai/v2/openapi",
        "isEnabled": bool(d.get("is_enabled", 1)),
        "feeStructure": fee_struct,
        "balanceCredits": float(d.get("balance_credits") or 0.0),
        "lastCheckedAt": d.get("last_checked_at"),
        "updatedAt": d.get("updated_at")
    }


def get_raw_tripo_key() -> str:
    """Fetches the real raw API key for secure backend proxy dispatch only."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT api_key_encrypted, is_enabled FROM ai_provider_config WHERE id = 'TRIPO_3D'")
    row = cursor.fetchone()
    conn.close()
    if row and row["is_enabled"]:
        return row["api_key_encrypted"] or ""
    return ""


def update_tripo_config(
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    is_enabled: Optional[bool] = None,
    fee_structure: Optional[dict] = None,
    balance_credits: Optional[float] = None
) -> dict:
    """Updates Tripo3D API settings, credentials, and customer wallet fee structure."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ai_provider_config WHERE id = 'TRIPO_3D'")
    curr = cursor.fetchone()

    now_iso = datetime.now(timezone.utc).isoformat()
    new_key = curr["api_key_encrypted"] if curr else ""
    new_masked = curr["api_key_masked"] if curr else ""

    if api_key is not None and api_key.strip():
        k = api_key.strip()
        new_key = k
        new_masked = f"{k[:8]}...{k[-5:]}" if len(k) > 13 else ("****" if k else "")

    new_base_url = base_url.strip() if base_url is not None and base_url.strip() else (curr["base_url"] if curr else "https://api.tripo3d.ai/v2/openapi")
    new_is_enabled = int(is_enabled) if is_enabled is not None else (curr["is_enabled"] if curr else 1)
    new_fees = json.dumps(fee_structure) if fee_structure is not None else (curr["fee_structure"] if curr else "{}")
    new_balance = float(balance_credits) if balance_credits is not None else (float(curr["balance_credits"]) if curr else 0.0)
    last_checked = now_iso if balance_credits is not None else (curr["last_checked_at"] if curr else None)

    cursor.execute("""
    INSERT INTO ai_provider_config (
        id, provider, api_key_encrypted, api_key_masked, base_url, is_enabled,
        fee_structure, balance_credits, last_checked_at, updated_at
    ) VALUES ('TRIPO_3D', 'TRIPO_3D', ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        api_key_encrypted = excluded.api_key_encrypted,
        api_key_masked = excluded.api_key_masked,
        base_url = excluded.base_url,
        is_enabled = excluded.is_enabled,
        fee_structure = excluded.fee_structure,
        balance_credits = excluded.balance_credits,
        last_checked_at = excluded.last_checked_at,
        updated_at = excluded.updated_at
    """, (new_key, new_masked, new_base_url, new_is_enabled, new_fees, new_balance, last_checked, now_iso))

    conn.commit()
    conn.close()
    return get_tripo_config()


def hold_wallet_funds_for_task(
    user_id: str,
    amount: float,
    task_type: str = "TEXT_TO_3D",
    description: str = ""
) -> dict:
    """
    Atomically verifies user has sufficient wallet balance, debits the funds into escrow,
    and records a PENDING WalletTransaction record.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("BEGIN IMMEDIATE")
        cursor.execute("SELECT wallet_balance FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError("User not found")

        curr_balance = float(row["wallet_balance"] or 0.0)
        if curr_balance < amount:
            raise ValueError(f"Insufficient wallet balance (${curr_balance:.2f}). Required: ${amount:.2f}")

        new_balance = round(curr_balance - amount, 2)
        cursor.execute("UPDATE users SET wallet_balance = ? WHERE id = ?", (new_balance, user_id))

        tx_id = f"WTX-TF-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        desc = description or f"TitanForge 3D: {task_type.replace('_', ' ').title()} (${amount:.2f})"

        cursor.execute("""
        INSERT INTO wallet_transactions (
            id, user_id, type, amount, balance_after, description, reference_id,
            status, tripo_task_type, created_at
        ) VALUES (?, ?, 'DEBIT', ?, ?, ?, ?, 'PENDING', ?, ?)
        """, (tx_id, user_id, amount, new_balance, desc, tx_id, task_type, now_iso))

        conn.commit()
        return {
            "tx_id": tx_id,
            "user_id": user_id,
            "amount": amount,
            "balance_after": new_balance,
            "status": "PENDING",
            "task_type": task_type
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def complete_wallet_task(tx_id: str, tripo_task_id: str = "", tokens_used: float = 0.0) -> bool:
    """Marks an escrow-held wallet transaction as COMPLETED upon successful 3D generation."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        UPDATE wallet_transactions
        SET status = 'COMPLETED', tripo_task_id = ?, tokens_used = ?
        WHERE id = ? AND status = 'PENDING'
        """, (tripo_task_id, tokens_used, tx_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def refund_wallet_task(tx_id: str, reason: str = "") -> dict:
    """
    Atomically restores held funds back to the user's wallet when a generation
    task fails, times out, or is cancelled.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("BEGIN IMMEDIATE")
        cursor.execute("SELECT user_id, amount, status FROM wallet_transactions WHERE id = ?", (tx_id,))
        tx = cursor.fetchone()
        if not tx:
            raise ValueError("Transaction not found")
        if tx["status"] != "PENDING":
            return {"refunded": False, "status": tx["status"]}

        user_id = tx["user_id"]
        amount = float(tx["amount"])

        cursor.execute("SELECT wallet_balance FROM users WHERE id = ?", (user_id,))
        u = cursor.fetchone()
        new_balance = round(float(u["wallet_balance"] or 0.0) + amount, 2)

        cursor.execute("UPDATE users SET wallet_balance = ? WHERE id = ?", (new_balance, user_id))
        cursor.execute("""
        UPDATE wallet_transactions
        SET status = 'REFUNDED', balance_after = ?, refund_reason = ?
        WHERE id = ?
        """, (new_balance, reason[:250], tx_id))

        # Add refund credit line item for complete transparency
        refund_tx_id = f"WTX-REF-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
        INSERT INTO wallet_transactions (
            id, user_id, type, amount, balance_after, description, reference_id,
            status, refund_reason, created_at
        ) VALUES (?, ?, 'CREDIT', ?, ?, ?, ?, 'COMPLETED', ?, ?)
        """, (
            refund_tx_id, user_id, amount, new_balance,
            f"Auto-Refund: TitanForge 3D generation ({reason[:50] or 'Task error'})",
            tx_id, reason[:250], now_iso
        ))

        conn.commit()
        return {
            "refunded": True,
            "refunded_amount": amount,
            "new_balance": new_balance,
            "tx_id": tx_id
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
