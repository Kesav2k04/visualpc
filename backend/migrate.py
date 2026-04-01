"""
VisualPC — Idempotent Database Migration
Run: python -m backend.migrate
Adds missing columns to existing tables using IF NOT EXISTS.
"""
from backend.config import DATABASE_URL
from sqlalchemy import create_engine, text

engine = create_engine(DATABASE_URL)

MIGRATIONS = [
    # Workers table — existing columns
    "ALTER TABLE workers ADD COLUMN IF NOT EXISTS cuda_version VARCHAR(32)",
    "ALTER TABLE workers ADD COLUMN IF NOT EXISTS gpu_memory_total FLOAT",
    "ALTER TABLE workers ADD COLUMN IF NOT EXISTS node_ip VARCHAR(64)",
    "ALTER TABLE workers ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP DEFAULT NOW()",
    # Workers table — new heartbeat & reachability columns
    "ALTER TABLE workers ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'worker'",
    "ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP",
    "ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_reach_success BOOLEAN",
    "ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_reach_tested_at TIMESTAMP",
    # Workers table — service port for reachability tests
    "ALTER TABLE workers ADD COLUMN IF NOT EXISTS service_port INTEGER DEFAULT 7000",
    # Users table
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(256)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(32) DEFAULT 'credentials'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(256)",
]

if __name__ == "__main__":
    applied = 0
    skipped = 0
    with engine.connect() as conn:
        for sql in MIGRATIONS:
            try:
                conn.execute(text(sql))
                col = sql.split("ADD COLUMN IF NOT EXISTS ")[-1].split(" ")[0]
                print(f"[migrate] OK: {col}")
                applied += 1
            except Exception as e:
                print(f"[migrate] SKIP: {e}")
                skipped += 1
        conn.commit()
    if applied > 0:
        print(f"[migrate] Done. Applied {applied} migration(s), skipped {skipped}.")
    else:
        print("[migrate] No changes required.")
