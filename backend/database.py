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

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,
)
logger.info("Database engine created")
print("[database] Engine created — connection will be tested on first request")
```

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
