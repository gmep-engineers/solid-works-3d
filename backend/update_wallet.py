from database import get_connection
import uuid
from datetime import datetime, timezone

def update():
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    UPDATE users
    SET wallet_balance = 5000.0,
        phone = '+1 (321) 555-0199',
        default_shipping = '{"full_name": "Dr. Elena Rostova", "street": "100 Aerospace Parkway", "city": "Cape Canaveral", "state": "FL", "zip_code": "32920", "country": "United States", "phone": "+1 (321) 555-0199"}'
    WHERE email = 'engineer@aerocad.com'
    """)

    # Seed an initial refill record
    c.execute("SELECT id FROM users WHERE email = 'engineer@aerocad.com'")
    user = c.fetchone()
    if user:
        c.execute("SELECT COUNT(*) as cnt FROM wallet_transactions WHERE user_id = ?", (user["id"],))
        if c.fetchone()["cnt"] == 0:
            c.execute("""
            INSERT INTO wallet_transactions (id, user_id, type, amount, balance_after, description, card_last4, reference_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"WTX-{uuid.uuid4().hex[:8].upper()}",
                user["id"],
                "CREDIT",
                5000.0,
                5000.0,
                "Initial Engineering Credit Card Refill (•••• 4242)",
                "4242",
                "CARD_AUTH_INIT",
                datetime.now(timezone.utc).isoformat()
            ))

    conn.commit()
    c.execute("SELECT email, wallet_balance, phone FROM users")
    for row in c.fetchall():
        print(dict(row))
    conn.close()

if __name__ == "__main__":
    update()
