from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
import uuid
from datetime import datetime, timezone
from database import get_connection
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    company: str = ""
    role: str = "user"

class LoginRequest(BaseModel):
    email: str
    password: str

class DemoLoginRequest(BaseModel):
    role: str  # "admin" or "user"

@router.post("/register")
def register(req: RegisterRequest):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email is already registered")

    user_id = str(uuid.uuid4())
    hashed = hash_password(req.password)
    # Default to user unless explicit admin requested during bootstrap
    role = req.role if req.role in ["admin", "user"] else "user"
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute(
        "INSERT INTO users (id, email, hashed_password, full_name, company, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user_id, req.email, hashed, req.full_name, req.company, role, now_iso)
    )
    conn.commit()
    conn.close()

    token = create_access_token({"sub": user_id, "role": role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": req.email,
            "full_name": req.full_name,
            "company": req.company,
            "role": role
        }
    }

@router.post("/login")
def login(req: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, hashed_password, full_name, company, role FROM users WHERE email = ?", (req.email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "company": user["company"],
            "role": user["role"]
        }
    }

@router.post("/demo-login")
def demo_login(req: DemoLoginRequest):
    conn = get_connection()
    cursor = conn.cursor()
    target_role = "admin" if req.role == "admin" else "user"
    cursor.execute("SELECT id, email, full_name, company, role FROM users WHERE role = ? LIMIT 1", (target_role,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="Demo account not found")

    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": dict(user)
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}
