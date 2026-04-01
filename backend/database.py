# =====================================================
# VisualPC Monitoring — Database Engine & Session
# Isolated from main compute pipeline
# =====================================================

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import DATABASE_URL

logger = logging.getLogger("visualpc.database")

# ---------------------------------------------------------------------------
# Engine — uses DATABASE_URL loaded from config.py (which reads .env)
# ---------------------------------------------------------------------------

try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        echo=False,
    )
    # Quick connection test at import time
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Database connection established")
    print("[database] OK — Connected to PostgreSQL")
except Exception as e:
    logger.error(f"Database connection failed: {e}")
    print(f"[database] ERROR — Connection failed: {e}")
    print(f"[database] DATABASE_URL = {DATABASE_URL[:30]}...")
    raise

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ---------------------------------------------------------------------------
# Declarative Base (shared by all ORM models)
# ---------------------------------------------------------------------------

Base = declarative_base()

# ---------------------------------------------------------------------------
# FastAPI Dependency — yields a DB session per request
# ---------------------------------------------------------------------------

def get_db():
    """Dependency generator for FastAPI route handlers."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
