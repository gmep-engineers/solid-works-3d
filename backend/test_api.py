import urllib.request
import urllib.parse
import json

def test():
    req_cust = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/demo-login',
        data=json.dumps({"role": "user"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_cust) as r:
        cust = json.loads(r.read().decode("utf-8"))
    token = cust["access_token"]

    print("=== Testing CAD Analysis Engine ===")
    for s_key in ['bracket', 'thin_fin', 'manifold']:
        data = urllib.parse.urlencode({'sample_key': s_key}).encode('utf-8')
        req = urllib.request.Request(
            'http://127.0.0.1:8000/api/cad/load-sample',
            data=data,
            headers={'Authorization': 'Bearer ' + token}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            print(f"Sample [{s_key}]:")
            print(f"  Filename: {res['filename']}")
            print(f"  Volume: {res['volume_cm3']} cm³")
            print(f"  Dimensions: {res['bbox']} mm")
            print(f"  Watertight: {res['is_watertight']}")
            print(f"  Min Wall Thickness: {res['min_thickness_mm']} mm")
            print(f"  Thin Features: {res['thin_features_count']}")
            print(f"  DFM Status: {res['dfm_status']}")
            print(f"  Warnings: {res['dfm_warnings']}")

            # If not FAIL, calculate a quote
            if res['dfm_status'] != 'FAIL':
                calc_req = urllib.request.Request(
                    'http://127.0.0.1:8000/api/quote/calculate',
                    data=json.dumps({
                        "model_id": res["id"],
                        "material_id": "ti_6al_4v",
                        "quantity": 2,
                        "finish_id": "electrochemical",
                        "machining_options": {
                            "tapped_holes": 4,
                            "datum_faces": 1,
                            "wire_edm_cutoff": True,
                            "heat_treatment": "stress_relief"
                        },
                        "lead_time_id": "standard"
                    }).encode("utf-8"),
                    headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(calc_req) as q_resp:
                    q_data = json.loads(q_resp.read().decode('utf-8'))
                    print(f"  Quote: Total=${q_data['total_price']}, Unit=${q_data['unit_price']}, Est. Ship={q_data['lead_time']['estimated_ship_date']}")

if __name__ == "__main__":
    test()
