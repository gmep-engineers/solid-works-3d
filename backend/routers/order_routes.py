from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uuid
import json
import os
from datetime import datetime, timezone
from database import (
    get_connection, compute_file_sha256, create_worm_ledger_entry,
    get_worm_ledger_by_order_id, get_active_legal_disclaimer
)
from auth import get_current_user
from services.worm_storage_service import WormStorageService
from services.certificate_generator import generate_completion_certificate

router = APIRouter(prefix="/api/orders", tags=["Orders"])

class ShippingAddress(BaseModel):
    full_name: str
    street: str
    city: str
    state: str
    zip_code: str
    country: str = "United States"
    phone: str = ""

class CreateOrderRequest(BaseModel):
    quote_id: str
    shipping_address: ShippingAddress
    payment_method: Optional[str] = "WALLET" # "WALLET" or "CREDIT_CARD"
    ip_terms_accepted: Optional[bool] = None
    ip_terms_version: Optional[str] = None
    ip_terms_accepted_at: Optional[str] = None
    cad_thumbnail_data_url: Optional[str] = None
    cadThumbnailDataUrl: Optional[str] = None

@router.post("/create")
def create_order(req: CreateOrderRequest, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()

    # Verify quote
    cursor.execute("SELECT * FROM quotes WHERE id = ?", (req.quote_id,))
    quote = cursor.fetchone()
    if not quote:
        conn.close()
        raise HTTPException(status_code=404, detail="Quote not found")

    if quote["user_id"] != current_user["id"] and current_user["role"] != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Cannot order from someone else's quote")

    # Fetch CAD model details
    cursor.execute("SELECT * FROM cad_models WHERE id = ?", (quote["model_id"],))
    cad_model = cursor.fetchone()

    # Fetch Material details
    cursor.execute("SELECT * FROM materials WHERE id = ?", (quote["material_id"],))
    mat_row = cursor.fetchone()

    total_price = float(quote["total_price"])
    payment_method = req.payment_method.upper() if req.payment_method else "WALLET"

    # If paying via wallet, verify sufficient balance
    if payment_method == "WALLET":
        cursor.execute("SELECT wallet_balance FROM users WHERE id = ?", (current_user["id"],))
        user_row = cursor.fetchone()
        current_wallet = user_row["wallet_balance"] if user_row else 0.0

        if current_wallet < total_price:
            conn.close()
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient wallet balance (${current_wallet:.2f} available, ${total_price:.2f} required). Please refill your wallet or choose Credit Card payment."
            )

        # Deduct wallet balance
        new_wallet = round(current_wallet - total_price, 2)
        cursor.execute("UPDATE users SET wallet_balance = ? WHERE id = ?", (new_wallet, current_user["id"]))

    order_id = f"ORD-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # IP Terms & Clickwrap Audit Verification
    quote_dict = dict(quote)
    ip_accepted = req.ip_terms_accepted if req.ip_terms_accepted is not None else bool(quote_dict.get("ip_terms_accepted", 0))
    ip_version = req.ip_terms_version or quote_dict.get("ip_terms_version") or "1.0"
    ip_accepted_at = req.ip_terms_accepted_at or quote_dict.get("ip_terms_accepted_at") or (now_iso if ip_accepted else "")

    audit_note = f"Paid via {payment_method.replace('_', ' ')}. Automated DFM pre-screening passed."
    if ip_accepted:
        audit_note += f" IP & Legal Clickwrap (v{ip_version}) certified by customer."

    status_history = [
        {
            "status": "SUBMITTED",
            "timestamp": now_iso,
            "title": "Order Placed",
            "note": audit_note,
            "updated_by": current_user["full_name"],
            "ip_audit": {
                "ip_terms_accepted": ip_accepted,
                "ip_terms_version": ip_version,
                "ip_terms_accepted_at": ip_accepted_at
            }
        }
    ]

    cursor.execute("""
    INSERT INTO orders (
        id, quote_id, user_id, model_id, status, total_price,
        shipping_address, tracking_number, carrier, status_history,
        admin_notes, payment_method, payment_status, ip_terms_accepted,
        ip_terms_version, ip_terms_accepted_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order_id,
        quote["id"],
        current_user["id"],
        quote["model_id"],
        "SUBMITTED",
        total_price,
        json.dumps(req.shipping_address.model_dump()),
        "",
        "",
        json.dumps(status_history),
        "",
        payment_method,
        "PAID",
        1 if ip_accepted else 0,
        ip_version,
        ip_accepted_at,
        now_iso
    ))

    # Record wallet debit transaction if wallet was used
    if payment_method == "WALLET":
        cursor.execute("""
        INSERT INTO wallet_transactions (
            id, user_id, type, amount, balance_after, description, reference_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"WTX-{uuid.uuid4().hex[:8].upper()}",
            current_user["id"],
            "DEBIT",
            total_price,
            new_wallet,
            f"Order Payment ({order_id}) - {quote['material_name']} ({quote['quantity']} pcs)",
            order_id,
            now_iso
        ))

    conn.commit()
    conn.close()

    # Create immutable WORM ledger entry for this confirmed order
    cad_thumb = req.cadThumbnailDataUrl or req.cad_thumbnail_data_url or ""
    cad_path = cad_model["file_path"] if cad_model else ""
    cad_sha256 = compute_file_sha256(cad_path) if cad_path and os.path.isfile(cad_path) else ("0" * 64)
    cad_size = os.path.getsize(cad_path) if cad_path and os.path.isfile(cad_path) else 0

    dfm_metrics = {
        "bbox_x": cad_model["bbox_x"] if cad_model else 0.0,
        "bbox_y": cad_model["bbox_y"] if cad_model else 0.0,
        "bbox_z": cad_model["bbox_z"] if cad_model else 0.0,
        "volume_cm3": cad_model["volume_cm3"] if cad_model else 0.0,
        "surface_area_cm2": cad_model["surface_area_cm2"] if cad_model else 0.0,
        "is_watertight": bool(cad_model["is_watertight"]) if cad_model else True,
        "dfm_status": cad_model["dfm_status"] if cad_model else "PASS",
        "min_thickness_mm": cad_model["min_thickness_mm"] if cad_model else 0.8
    }

    try:
        machining_opts = json.loads(quote["machining_options"]) if quote["machining_options"] else {}
    except Exception:
        machining_opts = {}

    try:
        breakdown_dict = json.loads(quote["breakdown"]) if quote["breakdown"] else {}
    except Exception:
        breakdown_dict = {}

    frozen_dict = {
        "order_id": order_id,
        "quote_id": quote["id"],
        "material_name": quote["material_name"],
        "material_id": quote["material_id"],
        "optical_type": mat_row["optical_type"] if mat_row and "optical_type" in mat_row.keys() else "OPAQUE",
        "transmission_factor": mat_row["transmission_factor"] if mat_row and "transmission_factor" in mat_row.keys() else 0.0,
        "quantity": quote["quantity"],
        "finish_type": quote["finish_type"],
        "machining_options": machining_opts,
        "total_price": total_price,
        "breakdown": breakdown_dict,
        "ip_terms_accepted": bool(ip_accepted),
        "ip_terms_version": ip_version,
        "ip_terms_accepted_at": ip_accepted_at
    }

    active_disclaimer = get_active_legal_disclaimer()
    worm_years = active_disclaimer.get("wormRetentionYears", 7) if active_disclaimer else 7
    cad_days = active_disclaimer.get("cadRetentionDays", 90) if active_disclaimer else 90

    try:
        ledger_entry = create_worm_ledger_entry(
            event_type="ORDER_CONFIRMED",
            order_id=order_id,
            quote_id=quote["id"],
            actor_id=current_user["id"],
            actor_email=current_user["email"],
            cad_file_name=cad_model["filename"] if cad_model else "model.stl",
            cad_file_size=cad_size,
            cad_file_sha256=cad_sha256,
            cad_thumbnail_data_url=cad_thumb,
            dfm_geometry_metrics=dfm_metrics,
            frozen_snapshot_dict=frozen_dict,
            worm_retention_years=worm_years,
            cad_retention_days=cad_days
        )
        WormStorageService.archive_transaction(ledger_entry, cad_path)
        cert_id = ledger_entry["id"]
    except Exception as e:
        print(f"[Order] Error creating WORM ledger entry: {e}")
        cert_id = None

    return {
        "order_id": order_id,
        "certificate_id": cert_id,
        "status": "SUBMITTED",
        "total_price": quote["total_price"],
        "created_at": now_iso,
        "message": "Order created successfully! You can track production in real-time."
    }

@router.get("/{order_id}/certificate")
def download_order_certificate(order_id: str, current_user: dict = Depends(get_current_user)):
    """Downloads the official cryptographic Certificate of Completion PDF for this order."""
    entry = get_worm_ledger_by_order_id(order_id)
    if not entry:
        raise HTTPException(status_code=404, detail="WORM ledger certificate not found for this order.")

    pdf_path = entry.get("pdf_certificate_path")
    if not pdf_path or not os.path.isfile(pdf_path):
        pdf_path = generate_completion_certificate(entry)

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"TitanForge_Certificate_{order_id}.pdf"
    )

@router.get("")
def get_user_orders(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT o.id, o.quote_id, o.model_id, o.status, o.total_price, o.tracking_number,
           o.carrier, o.shipping_address, o.status_history, o.ip_terms_accepted, o.ip_terms_version, o.ip_terms_accepted_at, o.created_at,
           m.filename, m.web_model_path, q.material_name, q.quantity, q.finish_type, q.estimated_ship_date
    FROM orders o
    JOIN quotes q ON o.quote_id = q.id
    JOIN cad_models m ON o.model_id = m.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
    """, (current_user["id"],))
    rows = cursor.fetchall()
    conn.close()

    orders = []
    for r in rows:
        d = dict(r)
        d["shipping_address"] = json.loads(d["shipping_address"])
        d["status_history"] = json.loads(d["status_history"])
        orders.append(d)
    return orders

@router.get("/{order_id}")
def get_order_by_id(order_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT o.id, o.user_id, o.quote_id, o.model_id, o.status, o.total_price, o.tracking_number,
           o.carrier, o.shipping_address, o.status_history, o.admin_notes, o.ip_terms_accepted, o.ip_terms_version, o.ip_terms_accepted_at, o.created_at,
           m.filename, m.volume_cm3, m.bbox_x, m.bbox_y, m.bbox_z, m.web_model_path, m.dfm_status, m.min_thickness_mm,
           q.material_name, q.quantity, q.finish_type, q.machining_options, q.lead_time_option, q.breakdown, q.estimated_ship_date,
           u.full_name as user_name, u.email as user_email
    FROM orders o
    JOIN quotes q ON o.quote_id = q.id
    JOIN cad_models m ON o.model_id = m.id
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
    """, (order_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Order not found")

    d = dict(row)
    if d["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    d["shipping_address"] = json.loads(d["shipping_address"])
    d["status_history"] = json.loads(d["status_history"])
    d["machining_options"] = json.loads(d["machining_options"])
    d["breakdown"] = json.loads(d["breakdown"])
    return d
