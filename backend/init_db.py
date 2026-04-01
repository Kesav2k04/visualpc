# =====================================================
# VisualPC Monitoring — Database Initialization
# Run: python -m backend.init_db
# =====================================================

import os
import sys
import datetime
import traceback

from passlib.context import CryptContext

from .database import engine, Base, SessionLocal
from .models import Worker, Job, Metric, User   # noqa: F401  — register models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def main():
    print("=" * 55)
    print("  VisualPC -- Database Initialization")
    print("=" * 55)

    # 1. Create tables
    try:
        print("[init_db] Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("[init_db] OK -- Tables created successfully.")
    except Exception as e:
        print(f"[init_db] ERROR -- Failed to create tables: {e}")
        traceback.print_exc()
        sys.exit(1)

    db = SessionLocal()
    try:
        # 2. Seed admin user
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@visualpc.local",
                full_name="VisualPC Admin",
                hashed_password=pwd_context.hash(os.getenv("ADMIN_BOOTSTRAP_PASSWORD", "visualpc2026")),
                role="admin",
                provider="credentials",
            )
            db.add(admin)
            db.commit()
            print("[init_db] OK -- Admin user seeded.")
        else:
            # Ensure admin has hashed_password and role
            changed = False
            if not admin.hashed_password:
                admin.hashed_password = pwd_context.hash(os.getenv("ADMIN_BOOTSTRAP_PASSWORD", "visualpc2026"))
                changed = True
            if admin.role != "admin":
                admin.role = "admin"
                changed = True
            if changed:
                db.commit()
                print("[init_db] OK -- Admin user updated with password/role.")
            else:
                print("[init_db] Admin user already exists, skipping.")

        # 3. Seed default GPU worker
        worker = db.query(Worker).filter(Worker.name == "gpu-worker-01").first()
        if not worker:
            worker = Worker(
                name="gpu-worker-01",
                device="NVIDIA GeForce RTX 4060 Laptop GPU",
                status="active",
                cuda_version="12.1",
                gpu_memory_total=8192.0,
                node_ip="127.0.0.1",
                role="worker",
                last_heartbeat=datetime.datetime.utcnow(),
                last_reach_success=True,
            )
            db.add(worker)
            db.commit()
            print("[init_db] OK -- Default worker 'gpu-worker-01' seeded.")
        else:
            print("[init_db] Default worker already exists, skipping seed.")

        # 4. Verification summary
        user_count = db.query(User).count()
        worker_count = db.query(Worker).count()
        job_count = db.query(Job).count()
        metric_count = db.query(Metric).count()
        print("-" * 40)
        print(f"[init_db] Summary:")
        print(f"  Users:   {user_count}")
        print(f"  Workers: {worker_count}")
        print(f"  Jobs:    {job_count}")
        print(f"  Metrics: {metric_count}")

    except Exception as e:
        print(f"[init_db] WARNING -- Seeding failed: {e}")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

    print("[init_db] Done.")


if __name__ == "__main__":
    main()
