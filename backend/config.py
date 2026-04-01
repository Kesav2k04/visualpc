# =====================================================
# VisualPC Monitoring — Configuration Layer
# Loads environment variables from backend/.env
# =====================================================

import os
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

SECRET_KEY: str = os.getenv("FASTAPI_SECRET_KEY", os.getenv("VISUALPC_SECRET_KEY", "visualpc-demo-secret"))
ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

# Master scheduler URL — for forwarding submitted jobs
MASTER_NODE_URL: str = os.getenv("MASTER_NODE_URL", "http://localhost:9000")

# Default port the GPU worker service listens on (for reachability tests)
GPU_WORKER_PORT: int = int(os.getenv("GPU_WORKER_PORT", "7000"))
