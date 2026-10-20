# =====================================================
# VisualPC Monitoring — Database Engine & Session
# Isolated from main compute pipeline
# =====================================================

import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import DATABASE_URL

logger = logging.getLogger("visualpc.database")

# ---------------------------------------------------------------------------
# Engine — pool_pre_ping handles reconnection automatically on each request
# ---------------------------------------------------------------------------

# SQLAlchemy 2.1 maps a bare postgresql:// URL to psycopg 3, but this project
# ships psycopg2-binary, so name the driver explicitly.
_url = DATABASE_URL
for _prefix in ("postgres://", "postgresql://"):
    if _url.startswith(_prefix):
        _url = "postgresql+psycopg2://" + _url[len(_prefix):]
        break

engine = create_engine(
    _url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,
)
logger.info("Database engine created")
print("[database] Engine created — connection will be tested on first request")

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
