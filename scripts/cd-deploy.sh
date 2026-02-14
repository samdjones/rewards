#!/bin/bash
set -euo pipefail

# CD deploy script — invoked by GitHub Actions deploy job on lister.
# Builds the container image, restarts the systemd service, and verifies health.
# On failure, rolls back to the previous image.

CONTAINER_NAME="rewards-app"
IMAGE_NAME="rewards-app"
VOLUME_NAME="rewards-data"
PORT=3000
HEALTH_URL="https://localhost:${PORT}/api/health"
ENV_FILE="${HOME}/.config/rewards-app/env"

# Source nvm so node/npm are available
export NVM_DIR="${HOME}/.nvm"
# shellcheck source=/dev/null
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"

# Parse arguments
BUMP_TYPE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --bump)
      BUMP_TYPE="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# Version bump (when invoked from CI with --bump)
if [ -n "$BUMP_TYPE" ]; then
  echo "=== Bumping version (${BUMP_TYPE}) ==="
  npm version "$BUMP_TYPE" --no-git-tag-version
  APP_VERSION=$(node -p "require('./package.json').version")

  git config user.name "github-actions[bot]"
  git config user.email "github-actions[bot]@users.noreply.github.com"
  git add package.json package-lock.json
  git commit -m "v${APP_VERSION} [skip ci]"
  git tag -a "v${APP_VERSION}" -m "v${APP_VERSION}"
  git push origin HEAD:master --follow-tags

  echo "Bumped to v${APP_VERSION} and pushed tag"
fi

# Read version from package.json
APP_VERSION=$(node -p "require('./package.json').version")
echo "=== CD Deploy: rewards-app v${APP_VERSION} ==="

# Verify env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "FAIL: Environment file not found: ${ENV_FILE}"
  exit 1
fi

# Source env file (provides JWT_SECRET)
# shellcheck source=/dev/null
. "$ENV_FILE"

if [ -z "${JWT_SECRET:-}" ]; then
  echo "FAIL: JWT_SECRET not set in ${ENV_FILE}"
  exit 1
fi

rollback() {
  echo ""
  echo "!!! Deployment failed — rolling back !!!"
  if podman image exists "${IMAGE_NAME}:rollback" 2>/dev/null; then
    podman tag "${IMAGE_NAME}:rollback" "${IMAGE_NAME}:latest"
    systemctl --user restart "${CONTAINER_NAME}"
    echo "Rolled back to previous image and restarted service."
  else
    echo "WARNING: No rollback image available. Service may be down."
  fi
  exit 1
}

# Tag current running image as rollback (if it exists)
if podman image exists "${IMAGE_NAME}:latest" 2>/dev/null; then
  echo "Tagging current image as rollback..."
  podman tag "${IMAGE_NAME}:latest" "${IMAGE_NAME}:rollback"
fi

# Build the new image
echo "Building container image (v${APP_VERSION})..."
if ! podman build \
  --build-arg APP_VERSION="${APP_VERSION}" \
  -t "${IMAGE_NAME}:${APP_VERSION}" \
  -t "${IMAGE_NAME}:latest" \
  .; then
  echo "FAIL: Container build failed"
  rollback
fi

# Restart the systemd service (picks up the new :latest image)
echo "Restarting systemd service..."
if ! systemctl --user restart "${CONTAINER_NAME}"; then
  echo "FAIL: Service restart failed"
  rollback
fi

# Health check — wait up to 60 seconds
echo -n "Waiting for health check"
for i in $(seq 1 30); do
  if curl -sk "${HEALTH_URL}" > /dev/null 2>&1; then
    echo " ready!"
    echo ""
    echo "=== Deployment successful ==="
    echo "Version: ${APP_VERSION}"
    echo "Service: systemctl --user status ${CONTAINER_NAME}"
    exit 0
  fi
  echo -n "."
  sleep 2
done

echo ""
echo "FAIL: Health check timed out after 60 seconds"
podman logs "${CONTAINER_NAME}" 2>/dev/null || true
rollback
