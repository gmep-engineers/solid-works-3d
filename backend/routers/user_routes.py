import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any

from database import get_connection
from auth import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/user", tags=["User Account & Wallet"])

class UpdateProfileRequest(BaseModel):
    full_name: str
    company: Optional[str] = ""
    phone: Optional[str] = ""
    default_shipping: Optional[Dict[str, Any]] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class WalletRefillRequest(BaseModel):
    amount: float
    card_number: str
    card_holder: str
    exp_month: str
    exp_year: str
    cvc: str
    save_card: Optional[bool] = True

@router.get("/profile")
def get_user_profile(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, email, full_name, company, role, wallet_balance, phone, default_shipping, created_at
    FROM users WHERE id = ?
    """, (current_user["id"],))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    d = dict(row)
    try:
        d["default_shipping"] = json.loads(d["default_shipping"]) if d["default_shipping"] else {}
    except Exception:
        d["default_shipping"] = {}
    return d

@router.put("/profile")
def update_user_profile(req: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    
    shipping_json = json.dumps(req.default_shipping or {})
    cursor.execute("""
    UPDATE users
    SET full_name = ?, company = ?, phone = ?, default_shipping = ?
    WHERE id = ?
    """, (req.full_name.strip(), req.company.strip(), req.phone.strip(), shipping_json, current_user["id"]))
    
    conn.commit()
    conn.close()

    return {
        "message": "Profile and credentials updated successfully",
        "user": {
            "id": current_user["id"],
            "full_name": req.full_name,
            "company": req.company,
            "phone": req.phone
        }
    }

@router.put("/change-password")
def change_password(req: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT hashed_password FROM users WHERE id = ?", (current_user["id"],))
    user = cursor.fetchone()

    if not user or not verify_password(req.current_password, user["hashed_password"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Current password does not match")

    new_hashed = hash_password(req.new_password)
    cursor.execute("UPDATE users SET hashed_password = ? WHERE id = ?", (new_hashed, current_user["id"]))
    conn.commit()
    conn.close()

    return {"message": "Password changed successfully"}

@router.get("/wallet")
def get_wallet(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT wallet_balance FROM users WHERE id = ?", (current_user["id"],))
    row = cursor.fetchone()
    balance = row["wallet_balance"] if row else 0.0

    cursor.execute("""
    SELECT id, type, amount, balance_after, description, card_last4, reference_id, created_at
    FROM wallet_transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    """, (current_user["id"],))
    transactions = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "balance": round(balance, 2),
        "transactions": transactions
    }

@router.post("/wallet/refill")
def refill_wallet(req: WalletRefillRequest, current_user: dict = Depends(get_current_user)):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Refill amount must be greater than $0.00")
    if req.amount > 50000:
        raise HTTPException(status_code=400, detail="Maximum single transaction refill limit is $50,000")

    # Clean and validate card
    clean_card = req.card_number.replace(" ", "").replace("-", "")
    if len(clean_card) < 15 or not clean_card.isdigit():
        raise HTTPException(status_code=400, detail="Please enter a valid credit card number")

    last4 = clean_card[-4:]
    tx_id = f"WTX-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT wallet_balance FROM users WHERE id = ?", (current_user["id"],))
    curr_balance = cursor.fetchone()["wallet_balance"] or 0.0

    new_balance = round(curr_balance + req.amount, 2)
    cursor.execute("UPDATE users SET wallet_balance = ? WHERE id = ?", (new_balance, current_user["id"]))

    cursor.execute("""
    INSERT INTO wallet_transactions (
        id, user_id, type, amount, balance_after, description, card_last4, reference_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tx_id,
        current_user["id"],
        "CREDIT",
        req.amount,
        new_balance,
        f"Wallet Refill via Card ending in •••• {last4}",
        last4,
        f"CARD_AUTH_{uuid.uuid4().hex[:6].upper()}",
        now_iso
    ))

    conn.commit()
    conn.close()

    return {
        "message": f"Successfully refilled ${req.amount:.2f} to your wallet!",
        "new_balance": new_balance,
        "transaction_id": tx_id
    }

@router.get("/projects")
def get_user_projects(current_user: dict = Depends(get_current_user)):
    """
    Returns all uploaded CAD models/projects with their geometry specs,
    DFM status, and any associated quotes/orders.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT m.id, m.filename, m.volume_cm3, m.surface_area_cm2, m.bbox_x, m.bbox_y, m.bbox_z,
           m.is_watertight, m.min_thickness_mm, m.thin_features_count, m.dfm_status,
           m.dfm_details, m.web_model_path, m.created_at,
           (SELECT COUNT(*) FROM quotes q WHERE q.model_id = m.id) as quote_count,
           (SELECT COUNT(*) FROM orders o WHERE o.model_id = m.id) as order_count,
           (SELECT o.id FROM orders o WHERE o.model_id = m.id ORDER BY o.created_at DESC LIMIT 1) as latest_order_id,
           (SELECT o.status FROM orders o WHERE o.model_id = m.id ORDER BY o.created_at DESC LIMIT 1) as latest_order_status
    FROM cad_models m
    WHERE m.user_id = ?
    ORDER BY m.created_at DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()
    conn.close()

    projects = []
    for r in rows:
        d = dict(r)
        try:
            d["dfm_details"] = json.loads(d["dfm_details"])
        except Exception:
            d["dfm_details"] = {}
        projects.append(d)

    return projects
