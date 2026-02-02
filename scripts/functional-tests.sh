#!/bin/bash
set -e

CONTAINER_NAME="rewards-functional-test"
IMAGE_NAME="rewards-app:test"
TEST_PORT=3000
BASE_URL="http://localhost:$TEST_PORT/api"
COOKIE_JAR=$(mktemp)

# Cleanup function
cleanup() {
  rm -f "$COOKIE_JAR"
  echo ""
  echo "Stopping container..."
  podman stop "$CONTAINER_NAME" 2>/dev/null || true
  podman rm "$CONTAINER_NAME" 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Helper function for API calls
api() {
  local method=$1
  local endpoint=$2
  local data=$3

  if [ -n "$data" ]; then
    curl -s -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
      -d "$data"
  else
    curl -s -X "$method" "$BASE_URL$endpoint" \
      -b "$COOKIE_JAR" -c "$COOKIE_JAR"
  fi
}

echo "=== Functional API Tests ==="
echo ""

# Stop any existing container with same name
echo "Cleaning up any existing test container..."
podman stop "$CONTAINER_NAME" 2>/dev/null || true
podman rm "$CONTAINER_NAME" 2>/dev/null || true

# Stop any container using port 3000
CONTAINER_ON_PORT=$(podman ps --format "{{.Names}} {{.Ports}}" 2>/dev/null | grep ":$TEST_PORT->" | awk '{print $1}' | head -1)
if [ -n "$CONTAINER_ON_PORT" ]; then
  echo "Stopping container '$CONTAINER_ON_PORT' using port $TEST_PORT..."
  podman stop "$CONTAINER_ON_PORT" 2>/dev/null || true
  podman rm "$CONTAINER_ON_PORT" 2>/dev/null || true
fi

# Build the container
echo "Building container..."
podman build -t "$IMAGE_NAME" . || { echo "FAIL: Container build failed"; exit 1; }

# Start the container
echo "Starting container..."
podman run -d \
  --name "$CONTAINER_NAME" \
  -p "$TEST_PORT:3000" \
  -e JWT_SECRET=test-secret-for-functional-tests \
  "$IMAGE_NAME" || { echo "FAIL: Container failed to start"; exit 1; }

# Wait for container to be ready
echo -n "Waiting for container to be ready"
for i in {1..30}; do
  if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
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
echo "Running tests..."
echo ""

# Test 1: Health check
echo -n "Health check... "
HEALTH=$(curl -s "$BASE_URL/health")
echo "$HEALTH" | grep -q "ok" && echo "PASS" || { echo "FAIL"; exit 1; }

# Test 2: Register user
echo -n "Register user... "
REGISTER=$(api POST "/auth/register" '{"email":"test@example.com","password":"password123","name":"Test User"}')
echo "$REGISTER" | grep -q "id" && echo "PASS" || { echo "FAIL: $REGISTER"; exit 1; }

# Test 3: Create family
echo -n "Create family... "
FAMILY=$(api POST "/families" '{"name":"Test Family"}')
echo "$FAMILY" | grep -q "id" && echo "PASS" || { echo "FAIL: $FAMILY"; exit 1; }

# Test 4: Create child
echo -n "Create child... "
CHILD=$(api POST "/children" '{"name":"Test Child"}')
CHILD_ID=$(echo "$CHILD" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "$CHILD" | grep -q "id" && echo "PASS" || { echo "FAIL: $CHILD"; exit 1; }

# Test 5: Create task
echo -n "Create task... "
TASK=$(api POST "/tasks" '{"name":"Test Task","point_value":10}')
echo "$TASK" | grep -q "id" && echo "PASS" || { echo "FAIL: $TASK"; exit 1; }

# Test 6: Create reward
echo -n "Create reward... "
REWARD=$(api POST "/rewards" '{"name":"Test Reward","point_cost":50}')
echo "$REWARD" | grep -q "id" && echo "PASS" || { echo "FAIL: $REWARD"; exit 1; }

# Test 7: Get children
echo -n "Get children... "
CHILDREN=$(api GET "/children")
echo "$CHILDREN" | grep -q "Test Child" && echo "PASS" || { echo "FAIL: $CHILDREN"; exit 1; }

# Test 8: Logout
echo -n "Logout... "
LOGOUT=$(api POST "/auth/logout")
echo "PASS"

# Test 9: Verify logged out
echo -n "Verify logged out... "
ME=$(api GET "/auth/me")
echo "$ME" | grep -q "Unauthorized\|Not authenticated\|Authentication required" && echo "PASS" || { echo "FAIL: $ME"; exit 1; }

echo ""
echo "=== All functional tests passed! ==="
