# =====================================================
# VisualPC Monitoring — JWT Authentication
# DB-backed user auth with role support
# =====================================================

import datetime
import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .config import SECRET_KEY

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class TokenRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "user"

class RegisterRequest(BaseModel):
    username: str
    email: Optional[str] = None
    password: str

# ---------------------------------------------------------------------------
# OAuth2 scheme (reads "Authorization: Bearer <token>" header)
# ---------------------------------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def authenticate_user(username: str, password: str, db: Session) -> Optional[dict]:
    """Authenticate against the DB users table."""
    from .models import User
    user = db.query(User).filter(User.username == username).first()
    if user and user.hashed_password and verify_password(password, user.hashed_password):
        return {
            "username": user.username,
            "role": user.role or "user",
            "full_name": user.full_name,
            "email": user.email,
        }
    # Fallback: hardcoded admin for bootstrapping (override via ADMIN_BOOTSTRAP_PASSWORD env var)
    bootstrap_pw = os.getenv("ADMIN_BOOTSTRAP_PASSWORD", "visualpc2026")
    if username == "admin" and password == bootstrap_pw:
        return {"username": "admin", "role": "admin", "full_name": "VisualPC Admin"}
    return None

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ---------------------------------------------------------------------------
# FastAPI dependency — validates JWT on protected routes
# ---------------------------------------------------------------------------

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role", "user")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    return {"username": username, "role": role}
