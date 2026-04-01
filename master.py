# =====================================================
# VisualPC Master Node
# Central Orchestrator for Hybrid Cloud–Edge PaaS
# =====================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from queue import PriorityQueue
import uuid
import datetime
import requests
import threading
import time
import os

# =====================================================
# FastAPI App Metadata
# =====================================================

app = FastAPI(
    title="VisualPC Master Node",
    description="Central Orchestrator for Hybrid Cloud–Edge PaaS",
    version="1.1"
)

# =====================================================
# GPU Worker (Execution Plane – TRUSTED INTERNAL)
# =====================================================
# GPU Worker URL — now resolved dynamically from worker registry
# Fallback to env var or hardcoded default
GPU_WORKER_URL_DEFAULT = os.environ.get("GPU_WORKER_URL", "http://localhost:7000/execute-job")
MONITOR_API_URL = os.environ.get("MONITOR_API_URL", "http://localhost:8500")

def get_gpu_worker_url():
    """Resolve GPU worker endpoint dynamically from monitoring API."""
    try:
        resp = requests.get(f"{MONITOR_API_URL}/workers/available", timeout=3)
        if resp.status_code == 200:
            workers = resp.json().get("data", [])
            for w in workers:
                if w.get("status") in ("ONLINE", "DEGRADED") and w.get("node_ip"):
                    port = w.get("service_port", 7000)
                    return f"http://{w['node_ip']}:{port}/execute-job"
    except Exception:
        pass
    return GPU_WORKER_URL_DEFAULT

# =====================================================
# Job Schema (API Contract – LOCKED)
# =====================================================

class Job(BaseModel):
    job_type: str
    compute: str                  # "gpu"
    priority: str                 # high | medium | low
    payload: Dict[str, Any]
    submitted_by: str

# =====================================================
# Priority Mapping (Scheduler Logic)
# =====================================================

PRIORITY_MAP = {
    "high": 1,
    "medium": 2,
    "low": 3
}

# =====================================================
# In-Memory State (INTENTIONAL – Phase 1)
# =====================================================
# DB will be added in later phase (SQLite WAL)

job_queue = PriorityQueue()
job_store: Dict[str, Dict[str, Any]] = {}

# =====================================================
# Helper: Safe datetime serialization
# =====================================================

def serialize_job(job: Dict[str, Any]) -> Dict[str, Any]:
    serialized = job.copy()
    for key in ["queued_at", "dispatched_at", "completed_at"]:
        if serialized.get(key):
            serialized[key] = serialized[key].isoformat()
    return serialized

# =====================================================
# Health Check Endpoint
# =====================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "role": "master-node",
        "queued_jobs": job_queue.qsize(),
        "tracked_jobs": len(job_store)
    }

# =====================================================
# Receive Job (from Edge Gateway)
# =====================================================

@app.post("/receive-job")
def receive_job(job: Job):
    job_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow()

    record = {
        "job_id": job_id,
        "job_type": job.job_type,
        "compute": job.compute,
        "priority": job.priority,
        "payload": job.payload,
        "submitted_by": job.submitted_by,

        # lifecycle
        "queued_at": now,
        "dispatched_at": None,
        "completed_at": None,

        # status
        "status": "queued",
        "attempts": 0,
        "last_error": None,

        # GPU response
        "worker_response": None
    }

    job_store[job_id] = record
    job_queue.put((PRIORITY_MAP.get(job.priority, 3), job_id))

    return {"job_id": job_id, "status": "queued"}

# =====================================================
# Scheduler (MASTER-OWNED LOGIC)
# =====================================================

@app.get("/schedule-next")
def schedule_next():
    if job_queue.empty():
        return {"status": "idle"}

    _, job_id = job_queue.get()
    job = job_store[job_id]

    job["attempts"] += 1
    job["status"] = "dispatched"
    job["dispatched_at"] = datetime.datetime.utcnow()

    # ---- CLEAN PAYLOAD FOR GPU WORKER ----
    gpu_payload = {
        "job_id": job["job_id"],
        "job_type": job["job_type"],
        "priority": job["priority"],
        "payload": job["payload"],
        "submitted_by": job["submitted_by"]
    }

    try:
        if job["compute"] != "gpu":
            job["status"] = "failed"
            job["last_error"] = "Unsupported compute type"
            return {"status": "failed", "job": serialize_job(job)}

        # Dynamically resolve GPU worker URL
        worker_url = get_gpu_worker_url()

        response = requests.post(
            worker_url,
            json=gpu_payload,
            timeout=60
        )

        response.raise_for_status()

        job["worker_response"] = response.json()
        job["status"] = "completed"
        job["completed_at"] = datetime.datetime.utcnow()

        # ---- CALLBACK: notify monitoring API of completion ----
        dashboard_job_id = job["payload"].get("dashboard_job_id")
        if dashboard_job_id:
            try:
                requests.put(
                    f"{MONITOR_API_URL}/jobs/{dashboard_job_id}/status",
                    json={
                        "status": "completed",
                        "worker_response": job["worker_response"],
                    },
                    timeout=5,
                )
            except Exception as cb_err:
                print(f"[master] Callback failed for {dashboard_job_id}: {cb_err}")

        return {"status": "completed", "job": serialize_job(job)}

    except Exception as e:
        job["status"] = "failed"
        job["last_error"] = str(e)

        # ---- CALLBACK: notify monitoring API of failure ----
        dashboard_job_id = job["payload"].get("dashboard_job_id")
        if dashboard_job_id:
            try:
                requests.put(
                    f"{MONITOR_API_URL}/jobs/{dashboard_job_id}/status",
                    json={"status": "failed", "error": str(e)},
                    timeout=5,
                )
            except Exception:
                pass

        return {"status": "failed", "job": serialize_job(job)}

# =====================================================
# Job Status Lookup
# =====================================================

@app.get("/job-status/{job_id}")
def job_status(job_id: str):
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    return serialize_job(job_store[job_id])

# =====================================================
# Metrics Summary (Paper-Safe, Deterministic)
# =====================================================

@app.get("/metrics/summary")
def metrics_summary():
    completed_jobs = [
        j for j in job_store.values()
        if j["status"] == "completed"
    ]

    if not completed_jobs:
        return {
            "jobs_completed": 0,
            "avg_total_latency_sec": None,
            "avg_queue_wait_sec": None,
            "avg_execution_time_sec": None
        }

    total_latency = []
    queue_wait = []
    execution_time = []

    for j in completed_jobs:
        if j["queued_at"] and j["completed_at"]:
            total_latency.append(
                (j["completed_at"] - j["queued_at"]).total_seconds()
            )

        if j["queued_at"] and j["dispatched_at"]:
            queue_wait.append(
                (j["dispatched_at"] - j["queued_at"]).total_seconds()
            )

        if j["worker_response"] and "execution_time_sec" in j["worker_response"]:
            execution_time.append(
                j["worker_response"]["execution_time_sec"]
            )

    return {
        "jobs_completed": len(completed_jobs),
        "avg_total_latency_sec": round(sum(total_latency) / len(total_latency), 3),
        "avg_queue_wait_sec": round(sum(queue_wait) / len(queue_wait), 3),
        "avg_execution_time_sec":
            round(sum(execution_time) / len(execution_time), 3)
            if execution_time else None
    }

# =====================================================
# Export Raw Metrics (Research / Review Only)
# =====================================================

@app.get("/metrics/export")
def export_metrics():
    export = []

    for job in job_store.values():
        if job["status"] == "completed" and job["worker_response"]:
            export.append({
                "job_id": job["job_id"],
                "workload": job["payload"].get("workload"),
                "execution_time_sec": job["worker_response"].get("execution_time_sec"),
                "gpu_memory_peak_mb": job["worker_response"].get("gpu_memory_peak_mb"),
                "queue_wait_sec": (
                    job["dispatched_at"] - job["queued_at"]
                ).total_seconds(),
                "total_latency_sec": (
                    job["completed_at"] - job["queued_at"]
                ).total_seconds()
            })

    return export

# =====================================================
# ENTRY POINT — TLS-ENABLED HTTPS SERVER
# =====================================================

import uvicorn

def scheduler_loop():
    while True:
        try:
            requests.get("http://localhost:9000/schedule-next")
        except:
            pass
        time.sleep(2)

threading.Thread(target=scheduler_loop, daemon=True).start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "master:app",
        host="0.0.0.0",
        port=9000,
        reload=False
    )

