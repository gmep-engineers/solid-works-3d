import json
import uuid
from datetime import datetime, timedelta, timezone
from database import get_connection, init_db
from auth import hash_password
from pricing_engine import calculate_quote

def seed():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    # Check if admin already exists
    cursor.execute("SELECT id FROM users WHERE email = 'admin@metalprint.com'")
    if cursor.fetchone():
        conn.close()
        print("Database already seeded.")
        return

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # 1. Create Admin User
    admin_id = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO users (id, email, hashed_password, full_name, company, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        admin_id,
        "admin@metalprint.com",
        hash_password("admin123"),
        "Marcus Vance (Chief Production Officer)",
        "Additive Precision Tech",
        "admin",
        (now - timedelta(days=30)).isoformat()
    ))

    # 2. Create Customer User
    customer_id = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO users (id, email, hashed_password, full_name, company, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        customer_id,
        "engineer@aerocad.com",
        hash_password("password123"),
        "Dr. Elena Rostova",
        "Orbital Propulsion Systems",
        "user",
        (now - timedelta(days=20)).isoformat()
    ))

    # 3. Create Sample CAD Model: Aerospace Bracket
    model_id = str(uuid.uuid4())
    dfm_details = {
        "warnings": ["Geometry verified: all walls comply with DMLS metal printing guidelines (>= 0.8 mm)."],
        "thin_features": [],
        "vertex_count": 1840,
        "face_count": 3676,
        "is_solidworks": True
    }
    cursor.execute("""
    INSERT INTO cad_models (
        id, user_id, filename, file_path, web_model_path,
        volume_cm3, surface_area_cm2, bbox_x, bbox_y, bbox_z,
        is_watertight, min_thickness_mm, thin_features_count,
        dfm_status, dfm_details, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        model_id,
        customer_id,
        "gimbal_actuator_bracket_rev4.sldprt",
        "sample_models/aerospace_bracket.stl",
        "/sample_models/aerospace_bracket.stl",
        34.0,
        142.5,
        60.0,
        40.0,
        41.0,
        1,
        5.99,
        0,
        "PASS",
        json.dumps(dfm_details),
        (now - timedelta(days=3)).isoformat()
    ))

    # 4. Create Sample Quote
    quote_id = "QTE-ORBITAL-01"
    quote_calc = calculate_quote(
        volume_cm3=34.0,
        surface_area_cm2=142.5,
        material_id="ti_6al_4v",
        quantity=2,
        finish_id="electrochemical",
        machining_options={
            "tapped_holes": 4,
            "datum_faces": 2,
            "wire_edm_cutoff": True,
            "heat_treatment": "hip"
        },
        lead_time_id="expedited"
    )

    cursor.execute("""
    INSERT INTO quotes (
        id, model_id, user_id, material_id, material_name, quantity,
        finish_type, machining_options, lead_time_option, unit_price,
        total_price, breakdown, estimated_ship_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        quote_id,
        model_id,
        customer_id,
        "ti_6al_4v",
        "Titanium Ti-6Al-4V Grade 5",
        2,
        "electrochemical",
        json.dumps({
            "tapped_holes": 4,
            "datum_faces": 2,
            "wire_edm_cutoff": True,
            "heat_treatment": "hip"
        }),
        "expedited",
        quote_calc["unit_price"],
        quote_calc["total_price"],
        json.dumps(quote_calc["breakdown"]),
        quote_calc["lead_time"]["estimated_ship_date"],
        (now - timedelta(days=3)).isoformat()
    ))

    # 5. Create Sample Active Order with Realistic Progress Stepper
    order_id = "ORD-2026-8849"
    shipping_addr = {
        "full_name": "Dr. Elena Rostova",
        "street": "100 Aerospace Parkway, Suite 400",
        "city": "Cape Canaveral",
        "state": "FL",
        "zip_code": "32920",
        "country": "United States",
        "phone": "+1 (321) 555-0199"
    }

    status_history = [
        {
            "status": "SUBMITTED",
            "timestamp": (now - timedelta(days=3, hours=4)).isoformat(),
            "title": "Order Placed",
            "note": "Customer submitted SolidWorks model & expedited quote approved.",
            "updated_by": "Dr. Elena Rostova"
        },
        {
            "status": "DFM_APPROVED",
            "timestamp": (now - timedelta(days=2, hours=18)).isoformat(),
            "title": "DFM & Slicing Approved",
            "note": "40µm layer slicing completed. Laser power 400W parameters optimized for Ti-6Al-4V.",
            "updated_by": "Admin (Marcus Vance)"
        },
        {
            "status": "PRINTING",
            "timestamp": (now - timedelta(days=1, hours=12)).isoformat(),
            "title": "DMLS Laser Sintering",
            "note": "EOS M 290 Chamber running under high-purity argon atmosphere (< 100 ppm O2).",
            "updated_by": "Admin (Marcus Vance)"
        },
        {
            "status": "HEAT_TREATMENT",
            "timestamp": (now - timedelta(hours=8)).isoformat(),
            "title": "Thermal Stress Relief & HIP",
            "note": "Transferred to Hot Isostatic Press (HIP) vacuum chamber for 1020°C cycle.",
            "updated_by": "Admin (Marcus Vance)"
        }
    ]

    cursor.execute("""
    INSERT INTO orders (
        id, quote_id, user_id, model_id, status, total_price,
        shipping_address, tracking_number, carrier, status_history,
        admin_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order_id,
        quote_id,
        customer_id,
        model_id,
        "HEAT_TREATMENT",
        quote_calc["total_price"],
        json.dumps(shipping_addr),
        "FX-9402847291",
        "FedEx Priority Freight",
        json.dumps(status_history),
        "High-priority spaceflight hardware. Coordinate inspection with CMM report upon finish.",
        (now - timedelta(days=3)).isoformat()
    ))

    conn.commit()
    conn.close()
    print("Seeded database with Admin, Customer, CAD model, and Live Order!")

if __name__ == "__main__":
    seed()
