import os
import sqlite3
import json
import uuid
from datetime import datetime, timedelta, timezone

def seed_more_orders():
    db_path = os.path.join(os.path.dirname(__file__), "app.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id FROM users WHERE email = 'engineer@aerocad.com'")
    user = c.fetchone()
    if not user:
        print("User engineer@aerocad.com not found")
        conn.close()
        return

    user_id = user["id"]

    # Check if already seeded multiple orders
    c.execute("SELECT COUNT(*) FROM orders WHERE user_id = ?", (user_id,))
    existing_count = c.fetchone()[0]
    if existing_count >= 15:
        print(f"Already have {existing_count} orders for user.")
        conn.close()
        return

    now = datetime.now(timezone.utc)

    PARTS_CONFIG = [
        ("Rocket Injector Pintle Head", "rocket_injector_pintle_v3.sldprt", "ti_6al_4v", "Titanium Ti-6Al-4V Grade 5", 48.5, 3, 1420.0, "PRINTING", "FedEx Freight Priority", "FX-9920148192"),
        ("Conformal Cooling Core Insert", "mold_cooling_insert_m2.step", "ss_316l", "Stainless Steel 316L", 32.0, 1, 680.0, "PRINTING", "", ""),
        ("Titanium Lattice Spinal Cage", "spinal_implant_lattice_cage.stl", "ti_6al_4v", "Titanium Ti-6Al-4V Grade 5", 14.2, 5, 2150.0, "HEAT_TREATMENT", "DHL Express Metal", "DHL-8472910394"),
        ("Turbine Exhaust Manifold Flange", "manifold_exhaust_flange_revB.sldprt", "inconel_718", "Inconel 718 Superalloy", 58.0, 2, 1920.0, "SECONDARY_MACHINING", "", ""),
        ("Optical Gimbal Actuator Arm", "gimbal_actuator_arm_v2.step", "al_si10mg", "Aluminum AlSi10Mg", 26.5, 4, 890.0, "QUALITY_INSPECTION", "", ""),
        ("High-Pressure Hydraulic Valve Body", "hydraulic_spool_valve_body.sldprt", "ss_17_4ph", "17-4 PH Stainless Steel", 42.0, 2, 1140.0, "SHIPPED", "UPS Next Day Air", "1Z9999999999999999"),
        ("Aerospace Hinge Fitting", "airframe_hinge_fitting_rev5.sldprt", "ti_6al_4v", "Titanium Ti-6Al-4V Grade 5", 38.0, 4, 1860.0, "SHIPPED", "FedEx Priority Overnight", "FX-4820194821"),
        ("Hexagonal Titanium Carabiner", "edc_hex_carabiner.stl", "ti_6al_4v", "Titanium Ti-6Al-4V Grade 5", 28.5, 1, 385.0, "DELIVERED", "USPS Priority Commercial", "9400111899223194829102"),
        ("Formula E Brake Caliper Monoblock", "brake_caliper_topo_opt.step", "al_si10mg", "Aluminum AlSi10Mg", 74.0, 2, 1620.0, "DELIVERED", "FedEx Custom Critical", "FX-7729104812"),
        ("Reaction Wheel Sat-Mounting Ring", "reaction_wheel_cube_mount.sldprt", "ti_6al_4v", "Titanium Ti-6Al-4V Grade 5", 22.0, 6, 2450.0, "DELIVERED", "UPS Ground Freight", "1Z8888888888888888"),
        ("Cryogenic Propellant Coupling", "cryo_propellant_coupling_dn50.step", "ss_316l", "Stainless Steel 316L", 36.4, 2, 940.0, "DELIVERED", "DHL Express", "DHL-9028194821"),
        ("Custom Bionic Hand Finger Joint", "bionic_finger_tendon_actuator.stl", "ti_6al_4v", "Titanium Ti-6Al-4V Grade 5", 8.5, 10, 1450.0, "DELIVERED", "FedEx Standard Overnight", "FX-3829103948"),
        ("Telemetry Sensor Housing", "telemetry_can_transponder.sldprt", "al_si10mg", "Aluminum AlSi10Mg", 19.8, 4, 760.0, "DELIVERED", "UPS 2nd Day Air", "1Z7777777777777777"),
        ("Turbomachinery Blisk Segment", "blisk_impeller_segment_rev3.step", "inconel_718", "Inconel 718 Superalloy", 62.0, 1, 1550.0, "DFM_APPROVED", "", ""),
        ("Microwave Waveguide Horn", "ku_band_waveguide_horn.sldprt", "cu_cr_zr", "Copper Chromium Zirconium (CuCrZr)", 16.5, 2, 820.0, "SUBMITTED", "", "")
    ]

    shipping_addr = {
        "full_name": "Dr. Elena Rostova",
        "street": "100 Aerospace Parkway, Suite 400",
        "city": "Cape Canaveral",
        "state": "FL",
        "zip_code": "32920",
        "country": "United States",
        "phone": "+1 (321) 555-0199"
    }

    for i, (part_title, filename, mat_id, mat_name, vol, qty, total, status, carrier, trk) in enumerate(PARTS_CONFIG):
        days_ago = i + 1
        created_dt = now - timedelta(days=days_ago, hours=(i * 3) % 24)
        order_num = 8850 + i
        order_id = f"ORD-2026-{order_num}"
        quote_id = f"QTE-2026-{order_num}"
        model_id = str(uuid.uuid4())

        # Insert CAD Model
        c.execute("""
        INSERT INTO cad_models (
            id, user_id, filename, file_path, web_model_path,
            volume_cm3, surface_area_cm2, bbox_x, bbox_y, bbox_z,
            is_watertight, min_thickness_mm, thin_features_count,
            dfm_status, dfm_details, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            model_id,
            user_id,
            filename,
            "sample_models/aerospace_bracket.stl",
            "/sample_models/aerospace_bracket.stl",
            vol,
            vol * 4.2,
            50.0, 45.0, 40.0,
            1, 1.2, 0,
            "PASS",
            json.dumps({"warnings": ["Passed DMLS geometric audit."]} ),
            created_dt.isoformat()
        ))

        # Insert Quote
        c.execute("""
        INSERT INTO quotes (
            id, model_id, user_id, material_id, material_name, quantity,
            finish_type, machining_options, lead_time_option, unit_price,
            total_price, breakdown, estimated_ship_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            quote_id,
            model_id,
            user_id,
            mat_id,
            mat_name,
            qty,
            "bead_blasted",
            json.dumps({"tapped_holes": 2, "datum_faces": 1, "wire_edm_cutoff": True, "heat_treatment": "stress_relief"}),
            "standard",
            round(total / qty, 2),
            total,
            json.dumps({"material": total * 0.4, "laser_time": total * 0.45, "machining": total * 0.15}),
            (created_dt + timedelta(days=7)).strftime("%b %d, %Y"),
            created_dt.isoformat()
        ))

        # Status History
        history = [
            {
                "status": "SUBMITTED",
                "timestamp": created_dt.isoformat(),
                "title": "Order Placed",
                "note": f"Order #{order_id} placed for {qty}x {part_title} ({mat_name}).",
                "updated_by": "Dr. Elena Rostova"
            }
        ]

        if status in ["DFM_APPROVED", "PRINTING", "HEAT_TREATMENT", "SECONDARY_MACHINING", "QUALITY_INSPECTION", "SHIPPED", "DELIVERED"]:
            history.append({
                "status": "DFM_APPROVED",
                "timestamp": (created_dt + timedelta(hours=8)).isoformat(),
                "title": "CAM Slicing & Laser Pathing Complete",
                "note": "Laser sintering vectors verified. 40µm powder layer parameters locked in.",
                "updated_by": "Marcus Vance (CPO)"
            })

        if status in ["PRINTING", "HEAT_TREATMENT", "SECONDARY_MACHINING", "QUALITY_INSPECTION", "SHIPPED", "DELIVERED"]:
            history.append({
                "status": "PRINTING",
                "timestamp": (created_dt + timedelta(hours=20)).isoformat(),
                "title": "DMLS Powder Bed Fusion Active",
                "note": "Laser chamber sealed under inert Argon atmosphere (< 100 ppm O2). Build in progress.",
                "updated_by": "Automated Machine Telemetry (EOS M290)"
            })

        if status in ["HEAT_TREATMENT", "SECONDARY_MACHINING", "QUALITY_INSPECTION", "SHIPPED", "DELIVERED"]:
            history.append({
                "status": "HEAT_TREATMENT",
                "timestamp": (created_dt + timedelta(days=2)).isoformat(),
                "title": "Vacuum Furnace Stress Relief & HIP",
                "note": "Hot Isostatic Pressing cycle completed at 920°C / 1000 bar to eliminate internal micro-voids.",
                "updated_by": "Thermal Processing Lab"
            })

        if status in ["SECONDARY_MACHINING", "QUALITY_INSPECTION", "SHIPPED", "DELIVERED"]:
            history.append({
                "status": "SECONDARY_MACHINING",
                "timestamp": (created_dt + timedelta(days=3)).isoformat(),
                "title": "5-Axis CNC Milling & Thread Tapping",
                "note": "Wire EDM separation from build plate completed; mounting threads tapped to Class 2B.",
                "updated_by": "CNC Precision Cell #4"
            })

        if status in ["QUALITY_INSPECTION", "SHIPPED", "DELIVERED"]:
            history.append({
                "status": "QUALITY_INSPECTION",
                "timestamp": (created_dt + timedelta(days=4)).isoformat(),
                "title": "CMM Laser Dimensional Scan Passed",
                "note": "GD&T coordinate measuring inspection verified part dimensions within ±0.035mm tolerance.",
                "updated_by": "Metrology Inspection Specialist"
            })

        if status in ["SHIPPED", "DELIVERED"]:
            history.append({
                "status": "SHIPPED",
                "timestamp": (created_dt + timedelta(days=5)).isoformat(),
                "title": "Dispatched via Express Courier",
                "note": f"Handed off to {carrier}. Tracking waybill: {trk}.",
                "updated_by": "Logistics Dispatch Center"
            })

        if status == "DELIVERED":
            history.append({
                "status": "DELIVERED",
                "timestamp": (created_dt + timedelta(days=6, hours=4)).isoformat(),
                "title": "Delivered and Signed",
                "note": "Package received at Cape Canaveral receiving dock. Signature on file.",
                "updated_by": "Carrier Courier Telemetry"
            })

        # Insert Order
        c.execute("""
        INSERT INTO orders (
            id, quote_id, user_id, model_id, status, total_price,
            shipping_address, tracking_number, carrier, status_history,
            admin_notes, payment_method, payment_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            order_id,
            quote_id,
            user_id,
            model_id,
            status,
            total,
            json.dumps(shipping_addr),
            trk,
            carrier,
            json.dumps(history),
            f"Automated quality checkpoint passed for {part_title}.",
            "WALLET" if i % 2 == 0 else "CREDIT_CARD",
            "PAID",
            created_dt.isoformat()
        ))

    conn.commit()
    conn.close()
    print("Successfully seeded realistic order dataset!")

if __name__ == "__main__":
    seed_more_orders()
