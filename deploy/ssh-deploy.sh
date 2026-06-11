#!/usr/bin/env bash
# Run from your dev machine to deploy via SSH.
set -euo pipefail

REMOTE_HOST="15.204.162.84"
REMOTE_USER="ubuntu"
REMOTE_PORT="22"
REMOTE_APP_DIR="/home/ubuntu/DEV/AGENT_DEV/mermaid-plan"

ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" "bash ${REMOTE_APP_DIR}/deploy/deploy.sh"
