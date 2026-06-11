#!/usr/bin/env bash
# Run on the remote server: pull latest code and rebuild Docker services.
set -euo pipefail

APP_DIR="/home/ubuntu/DEV/AGENT_DEV/mermaid-plan"

cd "$APP_DIR"

echo "==> $(date -Is) Deploy started in $(pwd)"

echo "==> Pulling latest changes..."
git pull --ff-only

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found. Copy .env.docker.example to .env and configure secrets." >&2
  exit 1
fi

echo "==> Rebuilding and starting containers..."
sudo docker compose up -d --build

echo "==> Deploy complete."
sudo docker compose ps
