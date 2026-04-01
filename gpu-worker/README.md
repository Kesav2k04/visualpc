# VisualPC — GPU Worker

GPU execution service for the VisualPC distributed compute platform.

## Overview

This worker runs on machines with NVIDIA GPUs and executes compute jobs dispatched by the Master Scheduler. It provides a FastAPI endpoint that accepts job payloads, runs CUDA/PyTorch matrix operations, and returns execution metrics.

## Requirements

- **NVIDIA GPU** with CUDA support
- **CUDA Toolkit 12.x** or NVIDIA Container Toolkit (for Docker)
- **Python 3.10+**

## Quick Start (Local)

```bash
cd gpu-worker
pip install -r requirements.txt
uvicorn worker:app --host 0.0.0.0 --port 7000
```

## Quick Start (Docker)

```bash
cd gpu-worker
docker build -t visualpc-gpu-worker .
docker run --gpus all -p 7000:7000 visualpc-gpu-worker
```

## Registration

After starting the worker, register it with the monitoring API:

```bash
python scripts/register_worker.py \
  --api http://<monitoring-api>:8500 \
  --name "gpu-worker-01" \
  --ip <worker-tailscale-ip> \
  --port 7000 \
  --device "NVIDIA RTX 4060" \
  --memory 8192
```

## API

### `GET /health`
Returns worker health and GPU info.

### `POST /execute-job`
Execute a compute job.

**Request:**
```json
{
  "job_id": "uuid",
  "job_type": "matrix_compute",
  "priority": "high",
  "payload": { "size": "small|medium|large", "mode": "normal|stress" }
}
```

**Response:**
```json
{
  "status": "completed",
  "job_id": "uuid",
  "execution_time_sec": 0.042,
  "gpu_memory_peak_mb": 8.0,
  "gpu": "NVIDIA GeForce RTX 4060"
}
```
