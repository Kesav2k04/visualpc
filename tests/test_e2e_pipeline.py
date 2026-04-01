"""
VisualPC — End-to-End Pipeline Test
Validates the full lifecycle: register worker → submit job → completion → metrics.

Run: python -m pytest tests/test_e2e_pipeline.py -v

Prerequisites:
  - Backend running on port 8500
  - Master running on port 9000 (optional, but recommended)
"""

import requests
import uuid
import time

API = "http://localhost:8500"


def get_token():
    resp = requests.post(f"{API}/auth/login", json={
        "username": "admin", "password": "visualpc2026",
    })
    assert resp.status_code == 200
    return resp.json()["access_token"]


class TestE2EPipeline:
    """Full end-to-end pipeline validation."""

    def test_full_pipeline(self):
        token = get_token()
        headers = {"Authorization": f"Bearer {token}"}

        # ── Step 1: Register GPU Worker ──
        worker_name = f"e2e-worker-{uuid.uuid4().hex[:6]}"
        reg = requests.post(f"{API}/register-worker", json={
            "name": worker_name,
            "device": "NVIDIA RTX 4060 E2E",
            "cuda_version": "12.4",
            "gpu_memory_total": 8192.0,
            "node_ip": "100.66.90.56",
            "role": "worker",
        })
        assert reg.status_code == 201, f"Registration failed: {reg.text}"
        worker_id = reg.json()["worker"]["id"]
        print(f"  ✓ Worker registered: {worker_name} (ID={worker_id})")

        # ── Step 2: Send heartbeat → ONLINE ──
        hb = requests.post(f"{API}/worker/{worker_id}/heartbeat", json={
            "gpu_memory_total_mb": 8192.0,
            "free_memory_mb": 6000.0,
            "gpu_util_pct": 5.0,
        })
        assert hb.status_code == 200
        print(f"  ✓ Heartbeat sent: status={hb.json()['computed_status']}")

        # ── Step 3: Verify worker visible ──
        workers = requests.get(f"{API}/workers", headers=headers)
        assert workers.status_code == 200
        worker_names = [w["name"] for w in workers.json()["data"]]
        assert worker_name in worker_names
        print(f"  ✓ Worker visible in /workers list")

        # ── Step 4: Submit job ──
        submit = requests.post(f"{API}/jobs", json={
            "workload_size": "small",
            "priority": "high",
            "job_type": "gpu_compute",
        }, headers=headers)
        assert submit.status_code == 201
        job_data = submit.json()["job"]
        job_id = job_data["job_id"]
        print(f"  ✓ Job submitted: {job_id} (status={job_data['status']})")

        # ── Step 5: Simulate GPU completion callback ──
        callback = requests.put(f"{API}/jobs/{job_id}/status", json={
            "status": "completed",
            "worker_response": {
                "execution_time_sec": 0.842,
                "gpu_memory_peak_mb": 312.5,
                "total_latency_sec": 1.2,
                "gpu_model": "RTX 4060",
            },
        })
        assert callback.status_code == 200
        assert callback.json()["new_status"] == "completed"
        print(f"  ✓ Job completed via callback")

        # ── Step 6: Verify job status ──
        jobs_list = requests.get(f"{API}/jobs", headers=headers)
        assert jobs_list.status_code == 200
        job_match = [j for j in jobs_list.json()["data"] if j["job_id"] == job_id]
        assert len(job_match) == 1
        assert job_match[0]["status"] == "completed"
        print(f"  ✓ Job status confirmed: completed")

        # ── Step 7: Verify metrics recorded ──
        metrics = requests.get(f"{API}/metrics", headers=headers)
        assert metrics.status_code == 200
        print(f"  ✓ Metrics endpoint accessible ({metrics.json()['count']} records)")

        # ── Step 8: Check health ──
        health = requests.get(f"{API}/health")
        assert health.status_code == 200
        assert health.json()["status"] == "healthy"
        print(f"  ✓ System healthy")

        print("\n  ═══════════════════════════════════════════")
        print("  ✅ END-TO-END PIPELINE TEST PASSED")
        print("  ═══════════════════════════════════════════")
