#!/usr/bin/env python3
"""
VisualPC — GPU Worker Auto-Registration & Heartbeat
Run this script on GPU worker machines to register with the monitoring API
and send periodic heartbeats to maintain ONLINE status.

Usage:
  python register_worker.py --name "gpu-rtx4060" --ip 100.66.90.56 --port 7000
"""

import argparse
import time
import sys
import requests

def main():
    parser = argparse.ArgumentParser(description="Register a GPU worker with VisualPC")
    parser.add_argument("--api", default="http://localhost:8500", help="Monitoring API base URL")
    parser.add_argument("--name", required=True, help="Worker name (e.g., gpu-rtx4060)")
    parser.add_argument("--ip", required=True, help="Worker node IP (Tailscale IP)")
    parser.add_argument("--port", type=int, default=7000, help="Worker service port (default: 7000)")
    parser.add_argument("--device", default="NVIDIA RTX 4060", help="GPU device name")
    parser.add_argument("--cuda", default="12.4", help="CUDA version")
    parser.add_argument("--memory", type=float, default=8192.0, help="GPU memory in MB")
    parser.add_argument("--interval", type=int, default=5, help="Heartbeat interval in seconds")
    args = parser.parse_args()

    # Step 1: Register
    print(f"[register] Registering worker '{args.name}' at {args.ip}:{args.port}")
    reg_payload = {
        "name": args.name,
        "device": args.device,
        "cuda_version": args.cuda,
        "gpu_memory_total": args.memory,
        "node_ip": args.ip,
        "role": "worker",
    }

    try:
        resp = requests.post(f"{args.api}/register-worker", json=reg_payload, timeout=10)
        if resp.status_code in (200, 201):
            worker_data = resp.json().get("worker", {})
            worker_id = worker_data.get("id")
            print(f"[register] OK — Worker ID: {worker_id}")
        else:
            print(f"[register] ERROR — Status {resp.status_code}: {resp.text}")
            sys.exit(1)
    except Exception as e:
        print(f"[register] FAILED — Could not reach API: {e}")
        sys.exit(1)

    # Step 2: Heartbeat loop
    print(f"[heartbeat] Sending heartbeats every {args.interval}s to worker {worker_id}...")
    failures = 0
    while True:
        try:
            hb_resp = requests.post(
                f"{args.api}/worker/{worker_id}/heartbeat",
                json={
                    "gpu_memory_total_mb": args.memory,
                    "free_memory_mb": args.memory * 0.8,  # placeholder
                    "gpu_util_pct": 0.0,
                },
                timeout=5,
            )
            if hb_resp.status_code == 200:
                status = hb_resp.json().get("computed_status", "UNKNOWN")
                print(f"[heartbeat] OK — Status: {status}")
                failures = 0
            else:
                failures += 1
                print(f"[heartbeat] WARN — Status {hb_resp.status_code}")
        except Exception as e:
            failures += 1
            print(f"[heartbeat] ERROR — {e}")

        if failures >= 10:
            print("[heartbeat] Too many failures, exiting.")
            sys.exit(1)

        time.sleep(args.interval)


if __name__ == "__main__":
    main()
