# =====================================================
# VisualPC Monitoring — FastAPI Application (v4.0)
# Production-hardened: heartbeat status, SSE, register,
# reachability, metrics summary, structured errors
# =====================================================

import json
import csv
import os
import io
import uuid
import logging
import asyncio
import datetime
import statistics
import httpx
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from .database import get_db
from .models import Worker, Job, Metric, User
from .auth import (
    TokenRequest, TokenResponse, RegisterRequest,
    authenticate_user, create_access_token, get_current_user,
    hash_password,
)
from .config import MASTER_NODE_URL, GPU_WORKER_PORT

# ---------------------------------------------------------------------------
# Structured JSON logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp":"%(asctime)s","level":"%(levelname)s","component":"%(name)s","message":"%(message)s"}',
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("visualpc.api")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="VisualPC Monitoring API",
    description="Production-grade monitoring layer for the VisualPC cloud-edge PaaS",
    version="4.0",
)

# CORS — explicit origins
CORS_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Metrics folder path
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
METRICS_DIR  = PROJECT_ROOT / "Metrics"

# ---------------------------------------------------------------------------
# Structured error helper
# ---------------------------------------------------------------------------

def api_error(status_code: int, code: str, message: str):
    raise HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message}},
    )

# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Unhandled error on {request.url.path}: {e}")
        raise

# ---------------------------------------------------------------------------
# Pydantic request schemas with validation
# ---------------------------------------------------------------------------

class JobSubmission(BaseModel):
    workload_size: str
    priority: str = "medium"
    job_type: str = "gpu_compute"

    @field_validator("workload_size")
    @classmethod
    def validate_workload(cls, v: str) -> str:
        allowed = {"small", "medium", "large"}
        if v.lower() not in allowed:
            raise ValueError(f"workload_size must be one of {allowed}")
        return v.lower()

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        allowed = {"low", "medium", "high"}
        if v.lower() not in allowed:
            raise ValueError(f"priority must be one of {allowed}")
        return v.lower()

class WorkerRegistration(BaseModel):
    name: str
    device: str = ""
    cuda_version: Optional[str] = None
    gpu_memory_total: Optional[float] = None
    node_ip: Optional[str] = None
    role: Optional[str] = "worker"
    service_port: Optional[int] = 7000
    tags: Optional[list] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Worker name cannot be empty")
        return v.strip()

class HeartbeatPayload(BaseModel):
    timestamp: Optional[str] = None
    free_memory_mb: Optional[float] = None
    gpu_memory_total_mb: Optional[float] = None
    gpu_util_pct: Optional[float] = None

# =====================================================
# Auth endpoints
# =====================================================

@app.post("/auth/login", response_model=TokenResponse)
def login(creds: TokenRequest, db: Session = Depends(get_db)):
    """Authenticate and return a JWT access token."""
    user = authenticate_user(creds.username, creds.password, db)
    if not user:
        api_error(401, "INVALID_CREDENTIALS", "Invalid username or password")
    token = create_access_token(data={
        "sub": user["username"],
        "role": user.get("role", "user"),
    })
    logger.info(f"User '{user['username']}' authenticated (role={user.get('role')})")
    return TokenResponse(access_token=token, role=user.get("role", "user"))

@app.post("/auth/register", status_code=201)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        api_error(409, "USER_EXISTS", f"Username '{req.username}' is already taken")
    if req.email:
        email_exists = db.query(User).filter(User.email == req.email).first()
        if email_exists:
            api_error(409, "EMAIL_EXISTS", f"Email '{req.email}' is already registered")

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        role="user",
        provider="credentials",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"New user registered: {req.username}")
    return {"status": "registered", "user": user.to_dict()}

# =====================================================
# Health checks (unauthenticated)
# =====================================================

@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        worker_count = db.query(Worker).count()
        job_count = db.query(Job).count()
        metric_count = db.query(Metric).count()
        queued_jobs = db.query(Job).filter(Job.status == "queued").count()
    except Exception:
        worker_count = job_count = metric_count = queued_jobs = 0

    return {
        "status": "healthy",
        "service": "visualpc-monitoring",
        "version": "4.0",
        "workers": worker_count,
        "jobs": job_count,
        "metrics": metric_count,
        "queued_jobs": queued_jobs,
    }

@app.get("/ready")
def readiness(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text as sa_text
        db.execute(sa_text("SELECT 1"))
        return {"ready": True}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {"ready": False, "error": str(e)}

@app.get("/alive")
def liveness():
    return {"alive": True}

# =====================================================
# GET /metrics
# =====================================================

@app.get("/metrics")
def list_metrics(
    workload: Optional[str] = Query(None, description="Filter by workload size"),
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    try:
        query = db.query(Metric)
        if workload:
            query = query.filter(Metric.workload_size == workload)
        rows = query.order_by(Metric.id).all()
        data = [m.to_dict() for m in rows]
    except Exception as e:
        logger.error(f"Error fetching metrics: {e}")
        data = []
    return {"data": data, "count": len(data)}

# =====================================================
# GET /metrics/summary — aggregated stats for charts
# =====================================================

@app.get("/metrics/summary")
def metrics_summary(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    try:
        rows = db.query(Metric).filter(Metric.latency_total != None).order_by(Metric.id.desc()).limit(50).all()
        exec_times = [m.execution_time for m in rows if m.execution_time is not None]
        gpu_mems = [m.gpu_memory_peak for m in rows if m.gpu_memory_peak is not None]
        latencies = [m.latency_total for m in rows if m.latency_total is not None]

        def stats(vals):
            if not vals:
                return {"mean": 0, "std": 0, "min": 0, "max": 0, "count": 0}
            return {
                "mean": round(statistics.mean(vals), 4),
                "std": round(statistics.stdev(vals), 4) if len(vals) > 1 else 0,
                "min": round(min(vals), 4),
                "max": round(max(vals), 4),
                "count": len(vals),
            }

        # Last 10 for charts
        last_10 = rows[:10]
        chart_data = [m.to_dict() for m in reversed(last_10)]

        return {
            "execution_time": stats(exec_times),
            "gpu_memory_peak": stats(gpu_mems),
            "latency_total": stats(latencies),
            "total_records": len(rows),
            "chart_data": chart_data,
        }
    except Exception as e:
        logger.error(f"Error computing metrics summary: {e}")
        return {"execution_time": {}, "gpu_memory_peak": {}, "latency_total": {}, "total_records": 0, "chart_data": []}

# =====================================================
# GET /metrics/export — CSV download
# =====================================================

@app.get("/metrics/export")
def export_metrics(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    try:
        rows = db.query(Metric).order_by(Metric.id).all()
    except Exception as e:
        logger.error(f"Error exporting metrics: {e}")
        rows = []

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "job_id", "execution_time", "gpu_memory_peak", "latency_total", "workload_size", "timestamp"])
    for m in rows:
        writer.writerow([
            m.id, m.job_id, m.execution_time, m.gpu_memory_peak,
            m.latency_total, m.workload_size,
            m.timestamp.isoformat() if m.timestamp else "",
        ])

    output.seek(0)
    logger.info(f"Exported {len(rows)} metrics to CSV")
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=visualpc_metrics.csv"},
    )

# =====================================================
# GET /jobs
# =====================================================

@app.get("/jobs")
def list_jobs(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    try:
        rows = db.query(Job).order_by(Job.id).all()
        data = [j.to_dict() for j in rows]
    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        data = []
    return {"data": data, "count": len(data)}

# =====================================================
# POST /jobs — submit a new job
# =====================================================

@app.post("/jobs", status_code=201)
def submit_job(
    submission: JobSubmission,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    job_id = str(uuid.uuid4())
    job = Job(
        job_id=job_id,
        job_type=submission.job_type,
        workload_size=submission.workload_size,
        priority=submission.priority,
        status="queued",
        submitted_by=_user.get("username", "unknown"),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    logger.info(f"Job {job_id} submitted by {_user.get('username')}")

    # ---- SCHEDULER BRIDGE: forward to master for dispatch ----
    forwarded = False
    try:
        master_payload = {
            "job_type": submission.job_type,
            "compute": "gpu",
            "priority": submission.priority,
            "payload": {"workload": submission.workload_size, "dashboard_job_id": job_id},
            "submitted_by": _user.get("username", "unknown"),
        }
        resp = httpx.post(
            f"{MASTER_NODE_URL}/receive-job",
            json=master_payload,
            timeout=5.0,
        )
        if resp.status_code == 200:
            forwarded = True
            logger.info(f"Job {job_id} forwarded to master scheduler")
        else:
            logger.warning(f"Master returned {resp.status_code} for job {job_id}")
    except Exception as e:
        logger.warning(f"Could not forward job {job_id} to master: {e}")

    return {"status": "queued", "job": job.to_dict(), "forwarded_to_master": forwarded}

# =====================================================
# GET /workers — with computed heartbeat status
# =====================================================

@app.get("/workers")
def list_workers(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    try:
        rows = db.query(Worker).order_by(Worker.id).all()
        data = []
        for w in rows:
            worker_data = w.to_dict()
            worker_data["status"] = w.computed_status()
            data.append(worker_data)
    except Exception as e:
        logger.error(f"Error fetching workers: {e}")
        data = []
    return {"data": data, "count": len(data)}

# =====================================================
# GET /workers/available — unauthenticated for master
# =====================================================

@app.get("/workers/available")
def available_workers(db: Session = Depends(get_db)):
    """Return workers for the master scheduler (no JWT required)."""
    try:
        rows = db.query(Worker).order_by(Worker.id).all()
        data = [w.to_dict() for w in rows]
    except Exception as e:
        logger.error(f"Error fetching available workers: {e}")
        data = []
    return {"data": data, "count": len(data)}

# =====================================================
# PUT /jobs/{job_id}/status — completion callback from master
# =====================================================

class JobStatusUpdate(BaseModel):
    status: str  # completed | failed
    worker_response: Optional[dict] = None
    error: Optional[str] = None

@app.put("/jobs/{job_id}/status")
def update_job_status(
    job_id: str,
    update: JobStatusUpdate,
    db: Session = Depends(get_db),
):
    """Called by master scheduler to report job completion/failure."""
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        api_error(404, "JOB_NOT_FOUND", f"Job {job_id} not found")

    job.status = update.status
    logger.info(f"Job {job_id} status updated to {update.status}")

    # If completed with worker response, insert metrics
    if update.status == "completed" and update.worker_response:
        wr = update.worker_response
        latency = (
            wr.get("total_latency_sec")
            or wr.get("end_to_end_latency_sec")
            or wr.get("execution_time_sec")
        )

        metric = Metric(
            job_id=job.id,
            execution_time=wr.get("execution_time_sec"),
            gpu_memory_peak=wr.get("gpu_memory_peak_mb"),
            latency_total=latency,
            workload_size=job.workload_size,
        )

        db.add(metric)

    db.commit()
    return {"status": "updated", "job_id": job_id, "new_status": update.status}

# =====================================================
# POST /register-worker — upsert + reachability test
# =====================================================

@app.post("/register-worker", status_code=201)
def register_worker(
    reg: WorkerRegistration,
    db: Session = Depends(get_db),
):
    now = datetime.datetime.utcnow()

    # Upsert: update if exists, insert if not
    worker = db.query(Worker).filter(Worker.name == reg.name).first()
    if worker:
        worker.device = reg.device or worker.device
        worker.cuda_version = reg.cuda_version or worker.cuda_version
        worker.gpu_memory_total = reg.gpu_memory_total or worker.gpu_memory_total
        worker.node_ip = reg.node_ip or worker.node_ip
        worker.role = reg.role or worker.role
        worker.service_port = reg.service_port or worker.service_port
        worker.status = "active"
        worker.last_heartbeat = now
    else:
        worker = Worker(
            name=reg.name,
            device=reg.device,
            cuda_version=reg.cuda_version,
            gpu_memory_total=reg.gpu_memory_total,
            node_ip=reg.node_ip,
            role=reg.role or "worker",
            service_port=reg.service_port or 7000,
            status="active",
            last_heartbeat=now,
        )
        db.add(worker)

    # Test reachability
    reachable = False
    port = reg.service_port if hasattr(reg, 'service_port') and reg.service_port else (worker.service_port or GPU_WORKER_PORT)
    if reg.node_ip:
        try:
            resp = httpx.get(f"http://{reg.node_ip}:{port}/health", timeout=3.0)
            reachable = resp.status_code == 200
        except Exception:
            reachable = False
    worker.last_reach_success = reachable
    worker.last_reach_tested_at = now

    db.commit()
    db.refresh(worker)
    logger.info(f"Worker '{reg.name}' registered from {reg.node_ip} (reachable={reachable})")
    return {"status": "registered", "worker": worker.to_dict()}

# =====================================================
# POST /worker/{worker_id}/heartbeat
# =====================================================

@app.post("/worker/{worker_id}/heartbeat")
def worker_heartbeat(
    worker_id: int,
    payload: Optional[HeartbeatPayload] = None,
    db: Session = Depends(get_db),
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        api_error(404, "WORKER_NOT_FOUND", f"Worker {worker_id} not found")

    worker.last_heartbeat = datetime.datetime.utcnow()
    worker.status = "active"

    if payload:
        if payload.gpu_memory_total_mb is not None:
            worker.gpu_memory_total = payload.gpu_memory_total_mb
    db.commit()
    logger.info(f"Heartbeat from worker {worker_id}")
    return {"status": "alive", "worker_id": worker_id, "computed_status": worker.computed_status()}

# =====================================================
# GET /workers/{worker_id}/reachability
# =====================================================

@app.get("/workers/{worker_id}/reachability")
def check_reachability(
    worker_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        api_error(404, "WORKER_NOT_FOUND", f"Worker {worker_id} not found")

    reachable = False
    latency_ms = None
    if worker.node_ip:
        try:
            import time
            start = time.time()
            port = worker.service_port or GPU_WORKER_PORT
            resp = httpx.get(f"http://{worker.node_ip}:{port}/health", timeout=3.0)
            latency_ms = round((time.time() - start) * 1000, 1)
            reachable = resp.status_code == 200
        except Exception:
            reachable = False

    worker.last_reach_success = reachable
    worker.last_reach_tested_at = datetime.datetime.utcnow()
    db.commit()

    return {
        "worker_id": worker_id,
        "node_ip": worker.node_ip,
        "reachable": reachable,
        "latency_ms": latency_ms,
        "tested_at": worker.last_reach_tested_at.isoformat(),
    }

# =====================================================
# GET /edge/status — Raspberry Pi health
# =====================================================

@app.get("/edge/status")
def edge_status(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    """Fetch Raspberry Pi edge gateway health."""
    edge_workers = db.query(Worker).filter(Worker.role == "edge").all()
    results = []
    for edge in edge_workers:
        info = {"name": edge.name, "node_ip": edge.node_ip, "status": "OFFLINE", "details": None}
        if edge.node_ip:
            try:
                port = edge.service_port or GPU_WORKER_PORT
                resp = httpx.get(f"http://{edge.node_ip}:{port}/health", timeout=3.0)
                if resp.status_code == 200:
                    info["status"] = "ONLINE"
                    info["details"] = resp.json()
                    edge.last_reach_success = True
                else:
                    edge.last_reach_success = False
            except Exception:
                edge.last_reach_success = False
            edge.last_reach_tested_at = datetime.datetime.utcnow()
        results.append(info)
    db.commit()
    return {"edges": results}

# =====================================================
# GET /events — Server-Sent Events for realtime
# =====================================================

@app.get("/events")
async def sse_events(
    request: Request,
    db: Session = Depends(get_db),
):
    """SSE endpoint pushing workers/jobs/metrics every 3s."""
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            try:
                workers_data = []
                for w in db.query(Worker).all():
                    wd = w.to_dict()
                    wd["status"] = w.computed_status()
                    workers_data.append(wd)
                jobs_data = [j.to_dict() for j in db.query(Job).order_by(Job.id.desc()).limit(20).all()]
                workers = db.query(Worker).all()
                active_workers = sum(
                    1 for w in workers if w.computed_status() == "online"
                )
                health_data = {
                    "workers_total": len(workers),
                    "workers_active": active_workers,
                    "jobs": db.query(Job).count(),
                    "metrics": db.query(Metric).count(),
                    "queued_jobs": db.query(Job).filter(Job.status == "queued").count(),
                }
                payload = json.dumps({
                    "workers": workers_data,
                    "jobs": jobs_data,
                    "health": health_data,
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                })
                yield f"data: {payload}\n\n"
            except Exception as e:
                logger.error(f"SSE error: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            await asyncio.sleep(3)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

# =====================================================
# POST /ingest
# =====================================================

@app.post("/ingest")
def ingest_metrics(
    db: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
):
    """Read metrics.json and fig4 CSV from the Metrics/ folder, insert into DB."""

    ingested = {"json_records": 0, "csv_records": 0}

    # ---- metrics.json ----
    json_path = METRICS_DIR / "metrics.json"
    if json_path.exists():
        with open(json_path, "r") as f:
            records = json.load(f)

        for rec in records:
            job_id_str = rec.get("job_id", "")
            existing_job = db.query(Job).filter(Job.job_id == job_id_str).first()
            if existing_job:
                continue

            job = Job(
                job_id=job_id_str,
                job_type="gpu_compute",
                workload_size=rec.get("workload"),
                priority="medium",
                status="completed",
                submitted_by="experiment_script",
            )
            db.add(job)
            db.flush()

            metric = Metric(
                job_id=job.id,
                execution_time=rec.get("execution_time_sec"),
                gpu_memory_peak=rec.get("gpu_memory_peak_mb"),
                latency_total=rec.get("total_latency_sec"),
                workload_size=rec.get("workload"),
            )
            db.add(metric)
            ingested["json_records"] += 1

    # ---- fig4_gpu_memory_metrics.csv ----
    csv_path = METRICS_DIR / "fig4_gpu_memory_metrics.csv"
    if csv_path.exists():
        with open(csv_path, "r", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                workload = row.get("workload", "unknown")
                run      = row.get("run", "0")
                synth_id = f"fig4-{workload}-run{run}"

                existing_job = db.query(Job).filter(Job.job_id == synth_id).first()
                if existing_job:
                    continue

                job = Job(
                    job_id=synth_id,
                    job_type="gpu_memory_test",
                    workload_size=workload,
                    priority="medium",
                    status="completed",
                    submitted_by="auto_gpu_experiment",
                )
                db.add(job)
                db.flush()

                metric = Metric(
                    job_id=job.id,
                    execution_time=_safe_float(row.get("execution_time_sec")),
                    gpu_memory_peak=_safe_float(row.get("gpu_memory_peak_mb")),
                    latency_total=_safe_float(row.get("end_to_end_latency_sec")),
                    workload_size=workload,
                )
                db.add(metric)
                ingested["csv_records"] += 1

    db.commit()
    logger.info(f"Ingested {ingested}")
    return {"status": "ok", "ingested": ingested}


def _safe_float(value) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


# =====================================================
# Entry point
# =====================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.metrics_api:app",
        host="0.0.0.0",
        port=8500,
        reload=False,
    )
