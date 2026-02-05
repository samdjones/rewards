#!/bin/bash
set -e

# UI E2E Testing Script for Playwright
# Builds container, starts app, runs E2E tests, then cleans up

CONTAINER_NAME="rewards-ui-test"
IMAGE_NAME="rewards-app:latest"
TEST_PORT=13001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Starting UI E2E Tests ===${NC}"

# Cleanup function
cleanup() {
  echo -e "\n${YELLOW}Cleaning up...${NC}"
  podman stop "$CONTAINER_NAME" 2>/dev/null || true
  podman rm "$CONTAINER_NAME" 2>/dev/null || true
}
trap cleanup EXIT

# Build container
echo -e "${YELLOW}Building container...${NC}"
podman build -t "$IMAGE_NAME" .

# Start container
echo -e "${YELLOW}Starting container on port $TEST_PORT...${NC}"
podman run -d \
  --name "$CONTAINER_NAME" \
  -p "$TEST_PORT:3000" \
  -e JWT_SECRET=test-secret-ui-tests \
  -e NODE_ENV=production \
  "$IMAGE_NAME"

# Wait for health check
echo -n "${YELLOW}Waiting for app to be ready${NC}"
HEALTH_CHECK_URL="https://localhost:$TEST_PORT/api/health"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -sk "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    echo -e " ${GREEN}ready!${NC}"
    break
  fi
  echo -n "."
  sleep 2
  ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo -e " ${RED}failed to start!${NC}"
  echo -e "${RED}Container logs:${NC}"
  podman logs "$CONTAINER_NAME"
  exit 1
fi

# Give it a moment to fully stabilize
sleep 2

# Run Playwright tests
echo -e "${YELLOW}Running Playwright tests...${NC}"
cd client
export PLAYWRIGHT_BASE_URL="https://localhost:$TEST_PORT"

# Run tests with chromium only (fastest for CI)
npx playwright test --project=chromium

echo -e "${GREEN}=== UI tests passed! ===${NC}"
