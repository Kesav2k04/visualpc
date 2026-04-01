from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests


# ================================
# FASTAPI APP
# ================================
app = FastAPI(
    title="VisualPC Edge Gateway",
    description="Hybrid Cloud–Edge PaaS Entry Point",
    version="1.0"
)

# ================================
# MASTER NODE ENDPOINT (LOCKED)
# ================================
import os
MASTER_ENDPOINT = os.getenv("MASTER_ENDPOINT", "http://localhost:9000/receive-job")

# ================================
# JOB SCHEMA (CRITICAL)
# ================================
class Job(BaseModel):
    job_type: str
    compute: str
    priority: str
    payload: dict
    submitted_by: str

# ================================
# ROOT
# ================================
@app.get("/")
def root():
    return {
        "service": "VisualPC Edge Gateway",
        "status": "running",
        "role": "edge-entry",
        "next": "hybrid-routing"
    }

# ================================
# HEALTH
# ================================
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "node": "visualpc-edge"
    }

# ================================
# LIGHT COMPUTE (EDGE)
# ================================
@app.get("/compute/light")
def light_compute():
    total = sum(range(1, 1_000_000))
    return {
        "task": "edge-light-compute",
        "result": total,
        "executed_on": "visualpc-edge"
    }

# ================================
# HEAVY COMPUTE (FORWARD TO MASTER)
# ================================
@app.post("/compute/heavy")
def heavy_compute(job: Job):
    try:
        response = requests.post(
            MASTER_ENDPOINT,
            json=job.dict(),
            timeout=10
        )
        response.raise_for_status()

        return {
            "task": "heavy-compute",
            "status": "forwarded",
            "forwarded_to": "master-node",
            "master_response": response.json()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to forward job to master: {str(e)}"
        )

