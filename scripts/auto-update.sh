#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

AUTO_UPDATE_REMOTE="${AUTO_UPDATE_REMOTE:-origin}"
AUTO_UPDATE_BRANCH="${AUTO_UPDATE_BRANCH:-main}"
AUTO_UPDATE_LOCK_FILE="${AUTO_UPDATE_LOCK_FILE:-/tmp/clawquest-auto-update.lock}"
AUTO_UPDATE_ALLOW_UNTRACKED="${AUTO_UPDATE_ALLOW_UNTRACKED:-1}"
AUTO_UPDATE_LOCK_DIR=""

log() {
  printf '[%s] %s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$*"
}

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    log "missing required command: ${cmd}"
    exit 1
  fi
}

acquire_lock() {
  if command -v flock >/dev/null 2>&1; then
    exec 9>"${AUTO_UPDATE_LOCK_FILE}"
    if ! flock -n 9; then
      log "auto-update is already running, skipping"
      exit 0
    fi
    return
  fi

  # Fallback for systems without flock.
  AUTO_UPDATE_LOCK_DIR="${AUTO_UPDATE_LOCK_FILE}.d"
  if ! mkdir "${AUTO_UPDATE_LOCK_DIR}" 2>/dev/null; then
    log "auto-update is already running (mkdir lock), skipping"
    exit 0
  fi
  trap 'if [ -n "${AUTO_UPDATE_LOCK_DIR:-}" ]; then rmdir "${AUTO_UPDATE_LOCK_DIR}" 2>/dev/null || true; fi' EXIT
}

working_tree_is_dirty() {
  # Block updates only when tracked content differs.
  if ! git diff --quiet || ! git diff --cached --quiet; then
    return 0
  fi

  if [ "${AUTO_UPDATE_ALLOW_UNTRACKED}" = "1" ]; then
    return 1
  fi

  if [ -n "$(git ls-files --others --exclude-standard)" ]; then
    return 0
  fi

  return 1
}

run_deploy() {
  if [ -x "${PROJECT_DIR}/deploy.sh" ]; then
    "${PROJECT_DIR}/deploy.sh"
  else
    docker compose -f "${PROJECT_DIR}/docker-compose.yml" up -d --build --remove-orphans
  fi
}

main() {
  require_cmd git
  require_cmd docker

  acquire_lock

  if ! docker compose version >/dev/null 2>&1; then
    log "docker compose is not available"
    exit 1
  fi

  cd "${PROJECT_DIR}"

  if [ ! -d .git ]; then
    log "project is not a git checkout: ${PROJECT_DIR}"
    exit 1
  fi

  if working_tree_is_dirty; then
    log "tracked working tree is dirty; skipping auto-update to avoid overwriting local changes"
    exit 0
  fi

  local_branch="$(git rev-parse --abbrev-ref HEAD)"
  if [ "${local_branch}" != "${AUTO_UPDATE_BRANCH}" ]; then
    log "switching branch ${local_branch} -> ${AUTO_UPDATE_BRANCH}"
    git checkout "${AUTO_UPDATE_BRANCH}"
  fi

  log "fetching ${AUTO_UPDATE_REMOTE}/${AUTO_UPDATE_BRANCH}"
  git fetch --prune "${AUTO_UPDATE_REMOTE}" "${AUTO_UPDATE_BRANCH}"

  local_commit="$(git rev-parse HEAD)"
  remote_commit="$(git rev-parse "${AUTO_UPDATE_REMOTE}/${AUTO_UPDATE_BRANCH}")"

  if [ "${local_commit}" = "${remote_commit}" ]; then
    log "already up to date (${local_commit})"
    exit 0
  fi

  log "updating ${local_commit} -> ${remote_commit}"
  git pull --ff-only "${AUTO_UPDATE_REMOTE}" "${AUTO_UPDATE_BRANCH}"

  log "running docker deploy"
  run_deploy

  log "auto-update finished successfully"
}

main "$@"
