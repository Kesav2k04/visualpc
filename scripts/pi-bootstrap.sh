#!/bin/bash
# =====================================================
# VisualPC — Raspberry Pi Bootstrap Script
# Automated setup for edge gateway nodes
# Usage: ./pi-bootstrap.sh
# =====================================================

set -e

echo "============================================="
echo "  VisualPC Edge Node — Bootstrap"
echo "============================================="

# ----- 1. System Update -----
echo "[1/6] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# ----- 2. Install Python -----
echo "[2/6] Installing Python dependencies..."
sudo apt install -y python3 python3-pip python3-venv curl

# ----- 3. Create virtualenv -----
echo "[3/6] Setting up Python virtual environment..."
python3 -m venv ~/visualpc-env
source ~/visualpc-env/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn requests

# ----- 4. Install Tailscale -----
echo "[4/6] Installing Tailscale VPN..."
if ! command -v tailscale &> /dev/null; then
    curl -fsSL https://tailscale.com/install.sh | sh
    echo ""
    echo "  ⚠️  Run 'sudo tailscale up' to authenticate with your Tailscale account"
    echo "  Then note your Tailscale IP with: tailscale ip -4"
    echo ""
else
    echo "  Tailscale already installed."
fi

# ----- 5. Create edge gateway service -----
echo "[5/5] Creating systemd service..."

sudo tee /etc/systemd/system/visualpc-edge.service > /dev/null << EOF
[Unit]
Description=VisualPC Edge Gateway
After=network-online.target tailscaled.service
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/home/$USER/visualpc/edge
Environment=MASTER_ENDPOINT=http://localhost:9000/receive-job
ExecStart=/home/$USER/visualpc-env/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable visualpc-edge

echo ""
echo "============================================="
echo "  ✅ VisualPC Edge Node — Setup Complete"
echo "============================================="
echo ""
echo "  Next steps:"
echo "  1. Run: sudo tailscale up"
echo "  2. Note your Tailscale IP: tailscale ip -4"
echo "  3. Edit /etc/systemd/system/visualpc-edge.service"
echo "     Set MASTER_NODE_URL=http://<master-tailscale-ip>:9000"
echo "  4. Start the service:"
echo "     sudo systemctl start visualpc-edge"
echo "  5. Register with the monitoring API:"
echo "     python scripts/register_worker.py --name edge-pi-01 --ip <your-tailscale-ip> --port 8000"
echo ""
