import urllib.request
import json

def test():
    print("=== Testing Credentials, Credit Card Refill, & Projects ===")

    # 1. Customer login
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/demo-login',
        data=json.dumps({"role": "user"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        cust = json.loads(resp.read().decode("utf-8"))
    token = cust["access_token"]
    print(f"Logged in: {cust['user']['full_name']}")

    headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}

    # 2. Get Profile & Credentials
    prof_req = urllib.request.Request('http://127.0.0.1:8000/api/user/profile', headers=headers)
    with urllib.request.urlopen(prof_req) as resp:
        profile = json.loads(resp.read().decode('utf-8'))
    print(f"Profile: Name='{profile['full_name']}', Company='{profile['company']}', Phone='{profile['phone']}', Balance=${profile['wallet_balance']}")

    # 3. Update Profile
    update_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/user/profile',
        data=json.dumps({
            "full_name": "Dr. Elena Rostova",
            "company": "Orbital Space Dynamics",
            "phone": "+1 (321) 555-8899",
            "default_shipping": {
                "street": "200 Launch Complex Way",
                "city": "Cape Canaveral",
                "state": "FL",
                "zip_code": "32920"
            }
        }).encode("utf-8"),
        headers=headers
    )
    update_req.get_method = lambda: 'PUT'
    with urllib.request.urlopen(update_req) as resp:
        up_res = json.loads(resp.read().decode('utf-8'))
    print("Profile Update Result:", up_res["message"])

    # 4. Refill Wallet via Credit Card (+$1,000)
    refill_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/user/wallet/refill',
        data=json.dumps({
            "amount": 1000.0,
            "card_number": "4242 4242 4242 4242",
            "card_holder": "Dr. Elena Rostova",
            "exp_month": "12",
            "exp_year": "28",
            "cvc": "888"
        }).encode("utf-8"),
        headers=headers
    )
    with urllib.request.urlopen(refill_req) as resp:
        refill_res = json.loads(resp.read().decode('utf-8'))
    print("Wallet Refill Result:", refill_res["message"], f"New Balance: ${refill_res['new_balance']}")

    # 5. Get Wallet & Ledger
    wallet_req = urllib.request.Request('http://127.0.0.1:8000/api/user/wallet', headers=headers)
    with urllib.request.urlopen(wallet_req) as resp:
        wallet = json.loads(resp.read().decode('utf-8'))
    print(f"Current Wallet Balance: ${wallet['balance']}, Total Transactions: {len(wallet['transactions'])}")

    # 6. Get User Uploaded Projects
    proj_req = urllib.request.Request('http://127.0.0.1:8000/api/user/projects', headers=headers)
    with urllib.request.urlopen(proj_req) as resp:
        projects = json.loads(resp.read().decode('utf-8'))
    print(f"User Uploaded Projects Found: {len(projects)}")
    for p in projects[:3]:
        print(f"  • Project: {p['filename']} | Vol: {p['volume_cm3']} cm³ | DFM: {p['dfm_status']} | Orders: {p['order_count']}")

if __name__ == "__main__":
    test()
