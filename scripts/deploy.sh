#!/bin/bash
set -e

CONTAINER_NAME="rewards-app"
APP_VERSION=$(node -p "require('./package.json').version")
IMAGE_NAME="rewards-app:${APP_VERSION}"
PORT=3000
VOLUME_NAME="rewards-data"

# Parse flags
FRESH_DB=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --fresh-db)
      FRESH_DB=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--fresh-db]"
      exit 1
      ;;
  esac
done

echo "=== Deploying Rewards App ==="
echo ""

# Stop existing container if running
if podman ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
  echo "Stopping existing container..."
  podman stop "$CONTAINER_NAME" 2>/dev/null || true
  podman rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# Delete volume if fresh DB requested
if [ "$FRESH_DB" = true ]; then
  echo "Removing data volume for fresh database..."
  podman volume rm "$VOLUME_NAME" 2>/dev/null || true
fi

# Build the container
echo "Building container (version $APP_VERSION)..."
podman build --build-arg APP_VERSION="$APP_VERSION" -t "$IMAGE_NAME" -t "rewards-app:latest" . || { echo "FAIL: Container build failed"; exit 1; }

# Check for JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
  echo ""
  echo "WARNING: JWT_SECRET not set. Using default (not secure for production)."
  echo "Set it with: export JWT_SECRET='your-secret-here'"
  echo ""
  JWT_SECRET="change-this-secret-in-production"
fi

# Start the container
echo "Starting container on port $PORT..."
podman run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:3000" \
  -v "$VOLUME_NAME:/data" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e NODE_ENV=production \
  -e DATABASE_PATH=/data/database.db \
  --restart unless-stopped \
  "$IMAGE_NAME" || { echo "FAIL: Container failed to start"; exit 1; }

# Wait for container to be ready
echo -n "Waiting for container to be ready"
for i in {1..30}; do
  if curl -sk "https://localhost:$PORT/api/health" > /dev/null 2>&1; then
    echo " ready!"
    break
  fi
  echo -n "."
  sleep 2
  if [ $i -eq 30 ]; then
    echo ""
    echo "FAIL: Container failed to become ready"
    podman logs "$CONTAINER_NAME"
    exit 1
  fi
done

echo ""
echo "=== Deployment complete ==="
echo ""
echo "Version:        $APP_VERSION"
echo "App running at: https://localhost:$PORT"
echo "Container name: $CONTAINER_NAME"
echo "Data volume:    $VOLUME_NAME"
echo ""
echo "Useful commands:"
echo "  podman logs -f $CONTAINER_NAME    # View logs"
echo "  podman stop $CONTAINER_NAME       # Stop the app"
echo "  podman start $CONTAINER_NAME      # Start the app"
