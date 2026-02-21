#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

SERVICE_NAME="${AUTO_UPDATE_SERVICE_NAME:-clawquest-auto-update}"
RUN_USER="${AUTO_UPDATE_USER:-${SUDO_USER:-$(id -un)}}"
BRANCH="${AUTO_UPDATE_BRANCH:-main}"
INTERVAL_MINUTES="${AUTO_UPDATE_INTERVAL_MINUTES:-5}"

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must run as root (use sudo)." >&2
  exit 1
fi

if ! id "${RUN_USER}" >/dev/null 2>&1; then
  echo "User does not exist: ${RUN_USER}" >&2
  exit 1
fi

if ! [[ "${INTERVAL_MINUTES}" =~ ^[0-9]+$ ]] || [ "${INTERVAL_MINUTES}" -lt 1 ]; then
  echo "AUTO_UPDATE_INTERVAL_MINUTES must be an integer >= 1" >&2
  exit 1
fi

if [ ! -x "${PROJECT_DIR}/scripts/auto-update.sh" ]; then
  echo "Missing executable: ${PROJECT_DIR}/scripts/auto-update.sh" >&2
  exit 1
fi

RUN_HOME="$(getent passwd "${RUN_USER}" | cut -d: -f6)"
if [ -z "${RUN_HOME}" ]; then
  echo "Failed to resolve home directory for user: ${RUN_USER}" >&2
  exit 1
fi

SUPPLEMENTARY_GROUPS_LINE=""
if getent group docker >/dev/null 2>&1; then
  SUPPLEMENTARY_GROUPS_LINE="SupplementaryGroups=docker"
fi

SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
TIMER_FILE="/etc/systemd/system/${SERVICE_NAME}.timer"

cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=ClawQuest auto update from Git and Docker redeploy
Wants=network-online.target
After=network-online.target docker.service
ConditionPathExists=${PROJECT_DIR}/scripts/auto-update.sh

[Service]
Type=oneshot
User=${RUN_USER}
Group=${RUN_USER}
${SUPPLEMENTARY_GROUPS_LINE}
WorkingDirectory=${PROJECT_DIR}
Environment=HOME=${RUN_HOME}
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=AUTO_UPDATE_BRANCH=${BRANCH}
Environment=AUTO_UPDATE_ALLOW_UNTRACKED=1
ExecStart=${PROJECT_DIR}/scripts/auto-update.sh

[Install]
WantedBy=multi-user.target
EOF

cat > "${TIMER_FILE}" <<EOF
[Unit]
Description=Run ClawQuest auto update every ${INTERVAL_MINUTES} minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=${INTERVAL_MINUTES}min
RandomizedDelaySec=30s
Persistent=true
Unit=${SERVICE_NAME}.service

[Install]
WantedBy=timers.target
EOF

chmod 0644 "${SERVICE_FILE}" "${TIMER_FILE}"

systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}.timer"
systemctl restart "${SERVICE_NAME}.timer"

echo "Installed ${SERVICE_NAME}.service and ${SERVICE_NAME}.timer"
echo "Timer status:"
systemctl --no-pager --full status "${SERVICE_NAME}.timer" | sed -n '1,30p'
echo
echo "Logs:"
echo "  journalctl -u ${SERVICE_NAME}.service -n 200 --no-pager"
