# =====================================================
# VisualPC Monitoring — Configuration Layer
# Loads environment variables from backend/.env
# =====================================================

import os
import secrets
import sys
from pathlib import Path

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Load .env from this directory (backend/.env)
# ---------------------------------------------------------------------------

_env_path = Path(__file__).resolve().parent / ".env"

if _env_path.exists():
    load_dotenv(_env_path, override=True)
    print(f"[config] Loaded environment from {_env_path}")
else:
    print(f"[config] WARNING: {_env_path} not found — using system environment only")

# ---------------------------------------------------------------------------
# DATABASE_URL — required
# ---------------------------------------------------------------------------

DATABASE_URL: str = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    print(
        "\n"
        "╔══════════════════════════════════════════════════════════╗\n"
        "║  ERROR: DATABASE_URL is not set!                        ║\n"
        "║                                                         ║\n"
        "║  Create backend/.env with:                              ║\n"
        "║  DATABASE_URL=postgresql://user:pass@host:5432/dbname   ║\n"
        "║                                                         ║\n"
        "║  If password contains special chars like @, URL-encode  ║\n"
        "║  them:  @  →  %40                                      ║\n"
        "╚══════════════════════════════════════════════════════════╝\n"
    )
    raise RuntimeError("DATABASE_URL environment variable is not set. See backend/.env")

# ---------------------------------------------------------------------------
# Optional settings
# ---------------------------------------------------------------------------

# Signing keys that were published in this repository as defaults or
# placeholders. They are public, so they are never used to sign tokens.
PUBLISHED_SECRET_KEYS = {
    "visualpc-demo-secret",
    "visualpc-prod-secret-change-me",
    "your-secret-key-change-me",
    "your-production-secret",
}

SECRET_KEY: str = ""
for _name in ("FASTAPI_SECRET_KEY", "VISUALPC_SECRET_KEY"):
    _value = os.getenv(_name, "")
    if _value in PUBLISHED_SECRET_KEYS:
        print(f"[config] WARNING: {_name} is a published value; ignoring it.")
    elif _value and not SECRET_KEY:
        SECRET_KEY = _value

if not SECRET_KEY:
    if os.getenv("RENDER"):
        raise RuntimeError(
            "VISUALPC_SECRET_KEY is not set to a private value. Set it (or "
            "FASTAPI_SECRET_KEY) in the Render environment before starting."
        )
    # Local runs only: a random key for this process, so tokens end on restart.
    SECRET_KEY = secrets.token_urlsafe(32)
    print("[config] WARNING: VISUALPC_SECRET_KEY is not set; using a random key for this process.")

ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

# Master scheduler URL — for forwarding submitted jobs
MASTER_NODE_URL: str = os.getenv("MASTER_NODE_URL", "http://localhost:9000")

# Default port the GPU worker service listens on (for reachability tests)
GPU_WORKER_PORT: int = int(os.getenv("GPU_WORKER_PORT", "7000"))

# The admin password that used to be the built-in default. It is published in
# older copies of the README, so it is never accepted as the admin password.
RETIRED_ADMIN_PASSWORD = "visualpc2026"
