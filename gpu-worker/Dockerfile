# =====================================================
# VisualPC GPU Worker — Dockerfile
# Requires NVIDIA Container Toolkit on the host
# =====================================================

FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker.py .

EXPOSE 7000

CMD ["python3", "-m", "uvicorn", "worker:app", "--host", "0.0.0.0", "--port", "7000"]
