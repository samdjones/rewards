#!/bin/bash
set -e

BASE_URL="http://localhost:3000/api"
COOKIE_JAR=$(mktemp)

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

# Cleanup
rm -f "$COOKIE_JAR"

echo ""
echo "=== All functional tests passed! ==="
