# Raspberry Pi Edge Node Setup

This guide explains how to set up a Raspberry Pi as an edge gateway node for the VisualPC distributed compute platform.

## Overview

The edge node serves as an IoT ingestion gateway that:
- Receives compute requests from local devices
- Forwards jobs to the Master Scheduler via Tailscale VPN
- Reports health status and heartbeats to the Monitoring API

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Board** | Raspberry Pi 4B | Raspberry Pi 4B / 5 |
| **RAM** | 2 GB | 4 GB+ |
| **Storage** | 16 GB microSD | 32 GB+ microSD (Class 10 / A2) |
| **Network** | Ethernet or Wi-Fi | Ethernet (for stability) |
| **Power** | USB-C 5V/3A | Official Pi power supply |

## OS Setup

1. **Flash Raspberry Pi OS Lite (64-bit)** using [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
   - Choose: Raspberry Pi OS Lite (64-bit, Bookworm)
   - Enable SSH in imager settings
   - Set hostname, username, and Wi-Fi (if needed)

2. **Boot and SSH into the Pi:**
   ```bash
   ssh pi@<your-pi-ip>
   ```

3. **Update system:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## Automated Setup

Use the bootstrap script for a one-command setup:

```bash
# Copy the script to the Pi
scp scripts/pi-bootstrap.sh pi@<your-pi-ip>:~/

# SSH in and run
ssh pi@<your-pi-ip>
chmod +x pi-bootstrap.sh
./pi-bootstrap.sh
```

## Manual Setup

### 1. Install Python Dependencies

```bash
sudo apt install -y python3 python3-pip python3-venv
python3 -m venv ~/visualpc-env
source ~/visualpc-env/bin/activate
pip install fastapi uvicorn requests
```

### 2. Install Tailscale VPN

Tailscale creates a secure mesh network between Pi ↔ Master ↔ GPU Worker:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

After authenticating, note your Pi's Tailscale IP:
```bash
tailscale ip -4
```

### 3. Install Docker (Optional)

For containerized deployment:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group changes
```

### 4. Deploy Edge Gateway Service

Create the edge gateway FastAPI service on the Pi:

```python
# ~/edge_gateway.py
from fastapi import FastAPI
import requests
import os

app = FastAPI(title="VisualPC Edge Gateway")

MASTER_URL = os.getenv("MASTER_NODE_URL", "http://localhost:9000")

@app.get("/health")
def health():
    return {"status": "online", "role": "edge", "node": "raspberry-pi"}

@app.post("/submit")
def submit_job(job: dict):
    """Forward job from local network to master scheduler."""
    resp = requests.post(f"{MASTER_URL}/receive-job", json=job, timeout=10)
    return resp.json()
```

Run it:
```bash
source ~/visualpc-env/bin/activate
MASTER_NODE_URL=http://<master-tailscale-ip>:9000 \
  uvicorn edge_gateway:app --host 0.0.0.0 --port 8000
```

### 5. Register as Edge Worker

From any machine with access to the Monitoring API:

```bash
python scripts/register_worker.py \
  --api http://<monitoring-api>:8500 \
  --name "edge-pi-01" \
  --ip <pi-tailscale-ip> \
  --port 8000 \
  --device "Raspberry Pi 4B"
```

### 6. Set Up as systemd Service

For auto-start on boot:

```bash
sudo tee /etc/systemd/system/visualpc-edge.service << 'EOF'
[Unit]
Description=VisualPC Edge Gateway
After=network-online.target tailscaled.service
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
Environment=MASTER_NODE_URL=http://<master-tailscale-ip>:9000
ExecStart=/home/pi/visualpc-env/bin/uvicorn edge_gateway:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable visualpc-edge
sudo systemctl start visualpc-edge
```

## Networking

### Tailscale Mesh Topology

```
[Raspberry Pi Edge]  ←— Tailscale VPN —→  [Master Node]
     100.x.x.x                              100.x.x.x
         ↕                                      ↕
   Local IoT devices                      [GPU Worker]
                                           100.x.x.x
```

- All nodes communicate via Tailscale's private 100.x.x.x network
- No port forwarding or public IPs required
- Traffic is encrypted end-to-end (WireGuard)

## Monitoring

Check edge node status from the dashboard:
- Navigate to the **Workers** tab
- Edge nodes appear with role `edge`
- Status shows `ONLINE` / `DEGRADED` / `OFFLINE` based on heartbeat

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Pi can't reach Master | Check `tailscale status` — ensure both nodes are connected |
| Edge shows OFFLINE | Ensure heartbeat script is running, check `systemctl status visualpc-edge` |
| High latency | Use Ethernet instead of Wi-Fi, check for network congestion |
| Service won't start | Check logs with `journalctl -u visualpc-edge -f` |
| Python dependency errors | Ensure virtualenv is activated: `source ~/visualpc-env/bin/activate` |
