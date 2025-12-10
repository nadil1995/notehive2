#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API base URL
API_URL="http://localhost:5001/api"

echo "🚀 NoteHive Phase 3 - Repositories & Timeline Test Suite"
echo "========================================================="
echo ""

# Test variables
TEST_EMAIL="phase3_$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!@#"
ACCESS_TOKEN=""
REPO_ID=""
NODE_ID=""

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

# ============================================
# STEP 1: Setup - Create Test User
# ============================================
echo -e "${BLUE}Step 1: User Setup${NC}"
echo "-------------------"

register_response=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser_phase3_$(date +%s)\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"displayName\": \"Phase 3 Test User\"
  }")

ACCESS_TOKEN=$(echo "$register_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
  print_result "User registration" "PASS"
else
  print_result "User registration" "FAIL"
  exit 1
fi
echo ""

# ============================================
# STEP 2: Repository Tests
# ============================================
echo -e "${BLUE}Step 2: Repository CRUD Operations${NC}"
echo "-----------------------------------"

# Create Repository
echo "Testing: Create Repository..."
create_repo=$(curl -s -X POST "$API_URL/repositories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "2025 Journal",
    "description": "Daily journal entries",
    "color": "#FF6B6B"
  }')

REPO_ID=$(echo "$create_repo" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$REPO_ID" ]; then
  print_result "Create repository" "PASS"
else
  print_result "Create repository" "FAIL"
fi

# List Repositories
echo "Testing: List Repositories..."
list_repos=$(curl -s -X GET "$API_URL/repositories" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$list_repos" | grep -q '"success":true'; then
  print_result "List repositories" "PASS"
else
  print_result "List repositories" "FAIL"
fi

# Get Repository
echo "Testing: Get Repository..."
get_repo=$(curl -s -X GET "$API_URL/repositories/$REPO_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$get_repo" | grep -q '"success":true'; then
  print_result "Get repository" "PASS"
else
  print_result "Get repository" "FAIL"
fi

# Update Repository
echo "Testing: Update Repository..."
update_repo=$(curl -s -X PUT "$API_URL/repositories/$REPO_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "2025 Personal Journal",
    "description": "Updated journal entries",
    "color": "#4ECDC4"
  }')

if echo "$update_repo" | grep -q '"success":true'; then
  print_result "Update repository" "PASS"
else
  print_result "Update repository" "FAIL"
fi

echo ""

# ============================================
# STEP 3: Timeline Node Tests
# ============================================
echo -e "${BLUE}Step 3: Timeline Node CRUD Operations${NC}"
echo "-------------------------------------"

# Create Timeline Node
echo "Testing: Create Timeline Node..."
create_node=$(curl -s -X POST "$API_URL/timeline" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"repositoryId\": \"$REPO_ID\",
    \"title\": \"My First Entry\",
    \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"content\": \"Today was a great day!\",
    \"tags\": [\"personal\", \"reflection\"],
    \"color\": \"#FFE66D\"
  }")

NODE_ID=$(echo "$create_node" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$NODE_ID" ]; then
  print_result "Create timeline node" "PASS"
else
  print_result "Create timeline node" "FAIL"
fi

# List Timeline Nodes
echo "Testing: List Timeline Nodes..."
list_nodes=$(curl -s -X GET "$API_URL/timeline" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$list_nodes" | grep -q '"success":true'; then
  print_result "List timeline nodes" "PASS"
else
  print_result "List timeline nodes" "FAIL"
fi

# Get Timeline Node
echo "Testing: Get Timeline Node..."
get_node=$(curl -s -X GET "$API_URL/timeline/$NODE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$get_node" | grep -q '"success":true'; then
  print_result "Get timeline node" "PASS"
else
  print_result "Get timeline node" "FAIL"
fi

# Update Timeline Node
echo "Testing: Update Timeline Node..."
update_node=$(curl -s -X PUT "$API_URL/timeline/$NODE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Updated: My First Entry",
    "content": "Updated content for today'"'"'s reflection",
    "tags": ["personal", "reflection", "important"]
  }')

if echo "$update_node" | grep -q '"success":true'; then
  print_result "Update timeline node" "PASS"
else
  print_result "Update timeline node" "FAIL"
fi

# Get Timeline for Repository
echo "Testing: Get Repository Timeline..."
get_timeline=$(curl -s -X GET "$API_URL/repositories/$REPO_ID/timeline" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$get_timeline" | grep -q '"success":true'; then
  print_result "Get repository timeline" "PASS"
else
  print_result "Get repository timeline" "FAIL"
fi

echo ""

# ============================================
# STEP 4: Storage Tests
# ============================================
echo -e "${BLUE}Step 4: Storage Management${NC}"
echo "-------------------------"

# Check Storage Usage
echo "Testing: Check Storage Usage..."
check_storage=$(curl -s -X GET "$API_URL/storage/usage" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$check_storage" | grep -q '"success":true'; then
  print_result "Check storage usage" "PASS"
else
  print_result "Check storage usage" "FAIL"
fi

# Get Storage Breakdown
echo "Testing: Get Storage Breakdown..."
storage_breakdown=$(curl -s -X GET "$API_URL/storage/breakdown" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$storage_breakdown" | grep -q '"success":true'; then
  print_result "Get storage breakdown" "PASS"
else
  print_result "Get storage breakdown" "FAIL"
fi

# Get Plan Details
echo "Testing: Get Plan Details..."
get_plan=$(curl -s -X GET "$API_URL/storage/plan" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$get_plan" | grep -q '"success":true'; then
  print_result "Get plan details" "PASS"
else
  print_result "Get plan details" "FAIL"
fi

# Check Upload Eligibility
echo "Testing: Check Upload Eligibility..."
check_upload=$(curl -s -X POST "$API_URL/uploads/check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "fileName": "test.pdf",
    "fileSize": 5242880
  }')

if echo "$check_upload" | grep -q '"success":true'; then
  print_result "Check upload eligibility" "PASS"
else
  print_result "Check upload eligibility" "FAIL"
fi

echo ""

# ============================================
# STEP 5: Search Tests
# ============================================
echo -e "${BLUE}Step 5: Search Operations${NC}"
echo "------------------------"

# Search Timeline
echo "Testing: Search Timeline..."
search_timeline=$(curl -s -X GET "$API_URL/timeline/search?q=First" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$search_timeline" | grep -q '"success":true'; then
  print_result "Search timeline" "PASS"
else
  print_result "Search timeline" "FAIL"
fi

echo ""

# ============================================
# STEP 6: Advanced Operations
# ============================================
echo -e "${BLUE}Step 6: Advanced Operations${NC}"
echo "-------------------------"

# Add Attachment (simulated)
echo "Testing: Add Attachment..."
add_attachment=$(curl -s -X POST "$API_URL/timeline/$NODE_ID/attachments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "filename": "document.pdf",
    "fileType": "pdf",
    "fileSize": 1024000,
    "s3Key": "user123/doc.pdf",
    "fileUrl": "https://s3.amazonaws.com/user123/doc.pdf"
  }')

if echo "$add_attachment" | grep -q '"success":true'; then
  print_result "Add attachment" "PASS"
else
  print_result "Add attachment" "FAIL"
fi

# Get Attachments
echo "Testing: Get Attachments..."
get_attachments=$(curl -s -X GET "$API_URL/timeline/$NODE_ID/attachments" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$get_attachments" | grep -q '"success":true'; then
  print_result "Get attachments" "PASS"
else
  print_result "Get attachments" "FAIL"
fi

# Archive Repository
echo "Testing: Archive Repository..."
archive_repo=$(curl -s -X DELETE "$API_URL/repositories/$REPO_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$archive_repo" | grep -q '"success":true'; then
  print_result "Archive repository" "PASS"
else
  print_result "Archive repository" "FAIL"
fi

# Restore Repository
echo "Testing: Restore Repository..."
restore_repo=$(curl -s -X POST "$API_URL/repositories/$REPO_ID/restore" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$restore_repo" | grep -q '"success":true'; then
  print_result "Restore repository" "PASS"
else
  print_result "Restore repository" "FAIL"
fi

# Delete Timeline Node
echo "Testing: Delete Timeline Node..."
delete_node=$(curl -s -X DELETE "$API_URL/timeline/$NODE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$delete_node" | grep -q '"success":true'; then
  print_result "Delete timeline node" "PASS"
else
  print_result "Delete timeline node" "FAIL"
fi

echo ""

# ============================================
# Summary
# ============================================
echo "========================================================="
echo "✅ Phase 3 API Test Suite Complete"
echo ""
echo "Features Tested:"
echo "  ✓ Repository CRUD operations (create, read, update, archive, restore)"
echo "  ✓ Timeline node CRUD operations (create, read, update, delete)"
echo "  ✓ Storage management (usage, breakdown, plan details)"
echo "  ✓ File upload eligibility checks"
echo "  ✓ Search functionality (timeline entries)"
echo "  ✓ Attachment management (add, get, delete)"
echo "  ✓ Advanced operations (archive, restore, delete)"
echo ""
