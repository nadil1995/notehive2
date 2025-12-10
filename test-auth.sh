#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API base URL
API_URL="http://localhost:5001/api"

echo "🔐 NoteHive Authentication System Test"
echo "======================================"
echo ""

# Test variables
TEST_USERNAME="testuser_$(date +%s)"
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!@#"
NEW_PASSWORD="NewPassword456!@#"
ACCESS_TOKEN=""
REFRESH_TOKEN=""

# Function to print test result
print_result() {
  local test_name=$1
  local status=$2
  if [ "$status" = "PASS" ]; then
    echo -e "${GREEN}✓ $test_name${NC}"
  else
    echo -e "${RED}✗ $test_name${NC}"
  fi
}

echo "Test 1: Register New User"
echo "------------------------"
register_response=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$TEST_USERNAME\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"displayName\": \"Test User\"
  }")

echo "Response: $register_response"
echo ""

# Extract tokens
ACCESS_TOKEN=$(echo "$register_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$register_response" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ] && [ -n "$REFRESH_TOKEN" ]; then
  print_result "Register successful" "PASS"
  echo "Access Token: ${ACCESS_TOKEN:0:20}..."
  echo "Refresh Token: ${REFRESH_TOKEN:0:20}..."
else
  print_result "Register successful" "FAIL"
  echo "Could not extract tokens"
  exit 1
fi
echo ""

echo "Test 2: Get User Profile"
echo "------------------------"
profile_response=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $profile_response"
echo ""

if echo "$profile_response" | grep -q "\"username\""; then
  print_result "Get user profile successful" "PASS"
else
  print_result "Get user profile successful" "FAIL"
fi
echo ""

echo "Test 3: Update Profile"
echo "----------------------"
update_response=$(curl -s -X PUT "$API_URL/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"displayName\": \"Updated Test User\"
  }")

echo "Response: $update_response"
echo ""

if echo "$update_response" | grep -q "Profile updated successfully"; then
  print_result "Update profile successful" "PASS"
else
  print_result "Update profile successful" "FAIL"
fi
echo ""

echo "Test 4: Change Password"
echo "----------------------"
change_pwd_response=$(curl -s -X POST "$API_URL/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"currentPassword\": \"$TEST_PASSWORD\",
    \"newPassword\": \"$NEW_PASSWORD\"
  }")

echo "Response: $change_pwd_response"
echo ""

if echo "$change_pwd_response" | grep -q "Password changed successfully"; then
  print_result "Change password successful" "PASS"
else
  print_result "Change password successful" "FAIL"
fi
echo ""

echo "Test 5: Login with New Password"
echo "-------------------------------"
login_response=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$NEW_PASSWORD\"
  }")

echo "Response: $login_response"
echo ""

# Extract new tokens
NEW_ACCESS_TOKEN=$(echo "$login_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
NEW_REFRESH_TOKEN=$(echo "$login_response" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$NEW_ACCESS_TOKEN" ] && [ -n "$NEW_REFRESH_TOKEN" ]; then
  print_result "Login with new password successful" "PASS"
  ACCESS_TOKEN=$NEW_ACCESS_TOKEN
  REFRESH_TOKEN=$NEW_REFRESH_TOKEN
else
  print_result "Login with new password successful" "FAIL"
fi
echo ""

echo "Test 6: Refresh Token"
echo "---------------------"
refresh_response=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

echo "Response: $refresh_response"
echo ""

REFRESHED_TOKEN=$(echo "$refresh_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$REFRESHED_TOKEN" ]; then
  print_result "Refresh token successful" "PASS"
  ACCESS_TOKEN=$REFRESHED_TOKEN
else
  print_result "Refresh token successful" "FAIL"
fi
echo ""

echo "Test 7: Logout"
echo "--------------"
logout_response=$(curl -s -X POST "$API_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

echo "Response: $logout_response"
echo ""

if echo "$logout_response" | grep -q "Logout successful"; then
  print_result "Logout successful" "PASS"
else
  print_result "Logout successful" "FAIL"
fi
echo ""

echo "Test 8: Invalid Token Should Fail"
echo "---------------------------------"
invalid_response=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer invalid_token")

echo "Response: $invalid_response"
echo ""

if echo "$invalid_response" | grep -q "Invalid or expired token"; then
  print_result "Invalid token rejection successful" "PASS"
else
  print_result "Invalid token rejection successful" "FAIL"
fi
echo ""

echo "======================================"
echo "✅ Authentication System Tests Complete"
echo ""
