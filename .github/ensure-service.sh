#!/usr/bin/env bash
set -euo pipefail

SERVICE=menux-backend
APP_DIR=/home/fayaz.ewu/menux/backend
JAR="$APP_DIR/target/menu-x-backend-0.0.1-SNAPSHOT.jar"
ENV_FILE="$APP_DIR/.env"

# Sanity checks
test -f "$JAR" || { echo "JAR not found: $JAR"; exit 1; }
test -f "$ENV_FILE" || { echo "Missing env file: $ENV_FILE"; exit 1; }

# Create/overwrite systemd unit
sudo tee /etc/systemd/system/$SERVICE.service >/dev/null <<EOF
[Unit]
Description=Menu.X Backend (Spring Boot)
After=network-online.target
Wants=network-online.target

[Service]
User=fayaz.ewu
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/java -Dserver.port=\${PORT} -jar $JAR
SuccessExitStatus=143
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload, enable on boot, and start now
sudo systemctl daemon-reload
sudo systemctl enable --now $SERVICE

# Status + recent logs
sudo systemctl status $SERVICE --no-pager || true
sudo journalctl -u $SERVICE -n 50 --no-pager || true

# Quick health check
PORT=$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 || echo 8080)
curl -sf "http://127.0.0.1:${PORT:-8080}/api/public/settings" | head -c 200 || true
echo