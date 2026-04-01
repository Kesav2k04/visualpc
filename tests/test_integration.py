"""
VisualPC — Integration Test Suite
Run: python -m pytest tests/test_integration.py -v

Prerequisites:
  - Backend running on port 8500: python -m uvicorn backend.metrics_api:app --port 8500
  - Master running on port 9000: python master.py
"""

import pytest
import requests
import uuid

API = "http://localhost:8500"
MASTER = "http://localhost:9000"

# ── Helpers ──

def get_token(username="admin", password="visualpc2026"):
    """Authenticate and return JWT token."""
    resp = requests.post(f"{API}/auth/login", json={
        "username": username,
        "password": password,
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]

def auth_headers(token=None):
    if token is None:
        token = get_token()
    return {"Authorization": f"Bearer {token}"}

# ── 1. Health Checks ──

class TestHealth:
    def test_monitoring_health(self):
        resp = requests.get(f"{API}/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "visualpc-monitoring"

    def test_monitoring_alive(self):
        resp = requests.get(f"{API}/alive")
        assert resp.status_code == 200
        assert resp.json()["alive"] is True

    def test_monitoring_ready(self):
        resp = requests.get(f"{API}/ready")
        assert resp.status_code == 200
        assert resp.json()["ready"] is True

    def test_master_health(self):
        resp = requests.get(f"{MASTER}/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["role"] == "master-node"


# ── 2. Authentication ──

class TestAuth:
    def test_login_valid(self):
        resp = requests.post(f"{API}/auth/login", json={
            "username": "admin",
            "password": "visualpc2026",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["role"] == "admin"

    def test_login_invalid(self):
        resp = requests.post(f"{API}/auth/login", json={
            "username": "admin",
            "password": "wrong",
        })
        assert resp.status_code == 401

    def test_protected_endpoint_without_token(self):
        resp = requests.get(f"{API}/metrics")
        assert resp.status_code in (401, 403)

    def test_protected_endpoint_with_token(self):
        resp = requests.get(f"{API}/metrics", headers=auth_headers())
        assert resp.status_code == 200

    def test_register_user(self):
        unique = str(uuid.uuid4())[:8]
        resp = requests.post(f"{API}/auth/register", json={
            "username": f"test_{unique}",
            "password": "TestPass123!",
            "email": f"{unique}@test.com",
        })
        assert resp.status_code == 201
        assert resp.json()["status"] == "registered"


# ── 3. Worker Registration ──

class TestWorkerRegistration:
    def test_register_worker(self):
        name = f"test-worker-{uuid.uuid4().hex[:8]}"
        resp = requests.post(f"{API}/register-worker", json={
            "name": name,
            "device": "NVIDIA RTX 4060 Test",
            "cuda_version": "12.4",
            "gpu_memory_total": 8192.0,
            "node_ip": "127.0.0.1",
            "role": "worker",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "registered"
        assert data["worker"]["name"] == name
        return data["worker"]["id"]

    def test_worker_appears_in_list(self):
        name = f"visible-worker-{uuid.uuid4().hex[:6]}"
        requests.post(f"{API}/register-worker", json={
            "name": name,
            "device": "Test GPU",
            "node_ip": "127.0.0.1",
        })
        resp = requests.get(f"{API}/workers", headers=auth_headers())
        assert resp.status_code == 200
        workers = resp.json()["data"]
        names = [w["name"] for w in workers]
        assert name in names

    def test_available_workers_no_auth(self):
        """GET /workers/available should work without JWT."""
        resp = requests.get(f"{API}/workers/available")
        assert resp.status_code == 200
        assert "data" in resp.json()


# ── 4. Worker Heartbeat ──

class TestHeartbeat:
    def test_heartbeat_updates_status(self):
        name = f"hb-worker-{uuid.uuid4().hex[:6]}"
        reg = requests.post(f"{API}/register-worker", json={
            "name": name,
            "device": "Test GPU",
            "node_ip": "127.0.0.1",
        })
        worker_id = reg.json()["worker"]["id"]

        hb = requests.post(f"{API}/worker/{worker_id}/heartbeat", json={
            "gpu_memory_total_mb": 8192.0,
        })
        assert hb.status_code == 200
        assert hb.json()["computed_status"] in ("ONLINE", "DEGRADED")


# ── 5. Job Submission ──

class TestJobSubmission:
    def test_submit_job(self):
        resp = requests.post(f"{API}/jobs", json={
            "workload_size": "small",
            "priority": "medium",
            "job_type": "gpu_compute",
        }, headers=auth_headers())
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "queued"
        assert "job" in data
        assert data["job"]["status"] == "queued"

    def test_job_appears_in_list(self):
        requests.post(f"{API}/jobs", json={
            "workload_size": "small",
            "priority": "low",
            "job_type": "gpu_compute",
        }, headers=auth_headers())

        resp = requests.get(f"{API}/jobs", headers=auth_headers())
        assert resp.status_code == 200
        assert resp.json()["count"] > 0


# ── 6. Job Status Callback ──

class TestJobStatusCallback:
    def test_update_job_status(self):
        # Submit a job first
        submit = requests.post(f"{API}/jobs", json={
            "workload_size": "small",
            "priority": "medium",
            "job_type": "gpu_compute",
        }, headers=auth_headers())
        job_id = submit.json()["job"]["job_id"]

        # Simulate master callback
        resp = requests.put(f"{API}/jobs/{job_id}/status", json={
            "status": "completed",
            "worker_response": {
                "execution_time_sec": 1.234,
                "gpu_memory_peak_mb": 256.0,
                "total_latency_sec": 2.5,
            },
        })
        assert resp.status_code == 200
        assert resp.json()["new_status"] == "completed"


# ── 7. Metrics ──

class TestMetrics:
    def test_metrics_summary(self):
        resp = requests.get(f"{API}/metrics/summary", headers=auth_headers())
        assert resp.status_code == 200
        assert "total_records" in resp.json()

    def test_ingest(self):
        resp = requests.post(f"{API}/ingest", headers=auth_headers())
        assert resp.status_code == 200
        assert "ingested" in resp.json()
