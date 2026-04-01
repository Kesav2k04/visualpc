from fastapi import FastAPI
from pydantic import BaseModel
import torch
import time
from datetime import datetime

app = FastAPI(
    title="VisualPC GPU Worker",
    description="GPU Execution Service for VisualPC PaaS",
    version="1.1"
)

# -----------------------------
# GLOBAL EXECUTION COUNTER
# -----------------------------
jobs_executed = 0


# -----------------------------
# REQUEST MODEL
# -----------------------------
class Job(BaseModel):
    job_id: str
    job_type: str
    priority: str
    payload: dict


# -----------------------------
# HEALTH ENDPOINT (NEW)
# -----------------------------
@app.get("/health")
def health():
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No GPU"

    return {
        "status": "ok",
        "service": "gpu-worker",
        "gpu": gpu_name,
        "jobs_executed": jobs_executed
    }


# -----------------------------
# GPU JOB EXECUTION
# -----------------------------
@app.post("/execute-job")
def execute_job(job: Job):

    global jobs_executed

    if not torch.cuda.is_available():
        return {
            "status": "failed",
            "job_id": job.job_id,
            "error": "CUDA not available"
        }

    device = "cuda"

    # -------- FIXED PART (Scheduler compatibility) --------
    payload = job.payload or {}
    mode = payload.get("mode", "normal")
    workload = payload.get("workload", "medium")
    # ------------------------------------------------------

    torch.cuda.reset_peak_memory_stats()

    # -----------------------------
    # NORMAL MODE (FOR PAPER)
    # -----------------------------
    if mode == "normal":

        size_map = {
            "small": 512,
            "medium": 1000,
            "large": 2000
        }

        N = size_map.get(workload, 1000)

        start = time.time()

        x = torch.randn((N, N), device=device)
        y = torch.matmul(x, x)

        torch.cuda.synchronize()

        exec_time = time.time() - start

    # -----------------------------
    # STRESS / VALIDATION MODE
    # -----------------------------
    else:

        if workload == "small":
            N = 4096
        elif workload == "medium":
            N = 8192
        else:
            N = 16384

        a = torch.randn((N, N), device=device)
        b = torch.randn((N, N), device=device)

        torch.cuda.synchronize()
        start = time.time()

        for _ in range(10):
            c = torch.matmul(a, b)

        torch.cuda.synchronize()

        exec_time = time.time() - start

        # Hold memory so GPU usage is visible
        time.sleep(5)

    # -----------------------------
    # METRICS
    # -----------------------------
    peak_mem_mb = round(
        torch.cuda.max_memory_allocated() / (1024 * 1024), 2
    )

    jobs_executed += 1
    timestamp = datetime.utcnow().isoformat()

    # -----------------------------
    # STRUCTURED LOGGING
    # -----------------------------
    print(
        f"[GPU_JOB] "
        f"job_id={job.job_id} | "
        f"workload={workload} | "
        f"mode={mode} | "
        f"exec_time_sec={round(exec_time,3)} | "
        f"peak_mem_mb={peak_mem_mb} | "
        f"timestamp={timestamp}"
    )

    # -----------------------------
    # RESPONSE
    # -----------------------------
    return {
        "status": "completed",
        "job_id": job.job_id,
        "device": "GPU",
        "gpu": torch.cuda.get_device_name(0),
        "workload": workload,
        "mode": mode,
        "execution_time_sec": round(exec_time, 3),
        "gpu_memory_peak_mb": peak_mem_mb,
        "jobs_executed_count": jobs_executed
    }
