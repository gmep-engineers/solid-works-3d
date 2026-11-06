import urllib.request
import json

def test_admin_catalog():
    print("=== Testing Admin Materials & Services Management ===")
    
    # 1. Admin Login
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/demo-login',
        data=json.dumps({"role": "admin"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as r:
        adm = json.loads(r.read().decode("utf-8"))
    token = adm["access_token"]
    print(f"Logged in as Admin: {adm['user']['full_name']}")

    headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}

    # 2. Get Materials
    mat_req = urllib.request.Request('http://127.0.0.1:8000/api/admin/materials', headers=headers)
    with urllib.request.urlopen(mat_req) as r:
        mats = json.loads(r.read().decode('utf-8'))
    print(f"Admin retrieved {len(mats)} materials:")
    for m in mats[:3]:
        print(f"  • {m['name']} (${m['raw_cost_per_g']}/g, Machine: ${m['machine_hourly_rate']}/hr, Active: {m['is_active']})")

    # 3. Create a New Metal Material (e.g. Scalmalloy)
    new_mat_data = {
        "id": "scalmalloy",
        "name": "Scalmalloy (Al-Mg-Sc Aircraft Alloy)",
        "density_g_cm3": 2.67,
        "raw_cost_per_g": 0.22,
        "laser_rate_cm3_hr": 28.0,
        "machine_hourly_rate": 115.0,
        "min_wall_recommended_mm": 0.5,
        "color_hex": "#cbd5e1",
        "description": "High-strength aluminum-magnesium-scandium alloy with yield strength exceeding 520 MPa for motorsport and space."
    }
    create_mat_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/admin/materials',
        data=json.dumps(new_mat_data).encode("utf-8"),
        headers=headers
    )
    try:
        with urllib.request.urlopen(create_mat_req) as r:
            res = json.loads(r.read().decode('utf-8'))
            print("Created New Material:", res["message"])
    except urllib.error.HTTPError as e:
        print("Material Creation Status:", e.code, e.read().decode('utf-8'))

    # 4. Get Machining Services
    svc_req = urllib.request.Request('http://127.0.0.1:8000/api/admin/services', headers=headers)
    with urllib.request.urlopen(svc_req) as r:
        svcs = json.loads(r.read().decode('utf-8'))
    print(f"Admin retrieved {len(svcs)} machining services:")
    for s in svcs[:4]:
        print(f"  • [{s['category']}] {s['name']} - ${s['base_price']} / {s['unit']}")

    # 5. Create a New Machining Service (e.g. 5-Axis CNC Precision Contouring)
    new_svc_data = {
        "id": "5axis_contouring",
        "category": "cnc_operation",
        "name": "5-Axis CNC High-Speed Contouring",
        "base_price": 120.0,
        "unit": "per_part",
        "spec_detail": "True 5-axis simultaneous profiling within ±0.01 mm",
        "description": "High-speed precision multi-axis milling for aerodynamic impellers, turbine blades, and complex internal porting."
    }
    create_svc_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/admin/services',
        data=json.dumps(new_svc_data).encode("utf-8"),
        headers=headers
    )
    try:
        with urllib.request.urlopen(create_svc_req) as r:
            res = json.loads(r.read().decode('utf-8'))
            print("Created New Service:", res["message"])
    except urllib.error.HTTPError as e:
        print("Service Creation Status:", e.code, e.read().decode('utf-8'))

if __name__ == "__main__":
    test_admin_catalog()
