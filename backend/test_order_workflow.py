import urllib.request
import urllib.parse
import json

def test_workflow():
    print("=== Testing End-to-End Order Creation & Admin Processing ===")
    
    # 1. Customer Demo Login
    req_cust = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/demo-login',
        data=json.dumps({"role": "user"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_cust) as r:
        cust = json.loads(r.read().decode("utf-8"))
    cust_token = cust["access_token"]
    print(f"Logged in customer: {cust['user']['full_name']}")

    # 2. Load Manifold CAD Model
    data = urllib.parse.urlencode({'sample_key': 'manifold'}).encode('utf-8')
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/cad/load-sample',
        data=data,
        headers={'Authorization': 'Bearer ' + cust_token}
    )
    with urllib.request.urlopen(req) as resp:
        model = json.loads(resp.read().decode('utf-8'))
    print(f"Loaded CAD model: {model['filename']} (ID: {model['id']})")

    # 3. Save Quote for Stainless Steel 316L + 6 Tapped Holes + Wire EDM + Standard Lead Time
    quote_payload = {
        "model_id": model["id"],
        "material_id": "ss_316l",
        "quantity": 3,
        "finish_id": "vibratory_tumble",
        "machining_options": {
            "tapped_holes": 6,
            "datum_faces": 2,
            "wire_edm_cutoff": True,
            "heat_treatment": "stress_relief"
        },
        "lead_time_id": "standard"
    }
    save_quote_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/quote/save',
        data=json.dumps(quote_payload).encode("utf-8"),
        headers={'Authorization': 'Bearer ' + cust_token, 'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(save_quote_req) as resp:
        quote = json.loads(resp.read().decode('utf-8'))
    print(f"Quote Saved: {quote['id']} | Total: ${quote['total_price']} | Est Ship: {quote['lead_time']['estimated_ship_date']}")

    # 4. Customer Places Order
    order_payload = {
        "quote_id": quote["id"],
        "shipping_address": {
            "full_name": "Dr. Elena Rostova",
            "street": "100 Aerospace Parkway",
            "city": "Cape Canaveral",
            "state": "FL",
            "zip_code": "32920",
            "country": "United States",
            "phone": "+1 (321) 555-0199"
        }
    }
    create_ord_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/orders/create',
        data=json.dumps(order_payload).encode("utf-8"),
        headers={'Authorization': 'Bearer ' + cust_token, 'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(create_ord_req) as resp:
        order = json.loads(resp.read().decode('utf-8'))
    order_id = order["order_id"]
    print(f"Order Placed Successfully: {order_id} | Status: {order['status']}")

    # 5. Customer Tracks Order
    track_req = urllib.request.Request(
        f'http://127.0.0.1:8000/api/orders/{order_id}',
        headers={'Authorization': 'Bearer ' + cust_token}
    )
    with urllib.request.urlopen(track_req) as resp:
        tracked = json.loads(resp.read().decode('utf-8'))
    print(f"Customer Tracking View: Stage={tracked['status']}, History Length={len(tracked['status_history'])}")

    # 6. Admin Logs In and Processes Order (Advances Stage to PRINTING)
    req_adm = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/demo-login',
        data=json.dumps({"role": "admin"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_adm) as r:
        adm = json.loads(r.read().decode("utf-8"))
    adm_token = adm["access_token"]
    print(f"Logged in admin: {adm['user']['full_name']}")

    # Update Status: Advance to PRINTING
    update_payload = {
        "status": "PRINTING",
        "note": "Multi-laser DMLS toolpaths loaded on EOS M 290. Build chamber sealed under high-purity argon gas.",
        "tracking_number": "FX-998274112",
        "carrier": "FedEx Priority Freight"
    }
    update_req = urllib.request.Request(
        f'http://127.0.0.1:8000/api/admin/orders/{order_id}/status',
        data=json.dumps(update_payload).encode("utf-8"),
        headers={'Authorization': 'Bearer ' + adm_token, 'Content-Type': 'application/json'}
    )
    update_req.get_method = lambda: 'PUT'
    with urllib.request.urlopen(update_req) as resp:
        up_res = json.loads(resp.read().decode('utf-8'))
    print(f"Admin Process Result: {up_res['message']} (New Status: {up_res['status']})")

    # 7. Customer Re-checks Tracking
    with urllib.request.urlopen(track_req) as resp:
        tracked_after = json.loads(resp.read().decode('utf-8'))
    print(f"Customer Tracking View After Admin Processing: Stage={tracked_after['status']}, Carrier={tracked_after['carrier']}, Tracking#={tracked_after['tracking_number']}")
    print(f"Latest Production Note: '{tracked_after['status_history'][-1]['note']}'")

if __name__ == "__main__":
    test_workflow()
