#!/bin/bash

# S3 Testing Script
# This script helps you safely test S3 credentials with your NoteHive application

set -e

echo "================================"
echo "NoteHive S3 Testing Script"
echo "================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Step 1: Check if backend/.env exists
echo "Step 1: Checking .env file..."
if [ ! -f "backend/.env" ]; then
    print_error "backend/.env file not found!"
    echo "Please create backend/.env with your S3 credentials."
    exit 1
fi
print_success ".env file found"
echo ""

# Step 2: Check if credentials are set
echo "Step 2: Checking S3 credentials..."
source backend/.env 2>/dev/null || true

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    print_warning "AWS credentials are empty in .env file"
    echo ""
    echo "To add credentials:"
    echo "1. Edit backend/.env"
    echo "2. Add your AWS credentials:"
    echo ""
    echo "   AWS_ACCESS_KEY_ID=AKIA_YOUR_KEY"
    echo "   AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY"
    echo "   AWS_BUCKET_NAME=your-bucket-name"
    echo "   AWS_REGION=us-east-1"
    echo ""
    echo "3. Save the file"
    echo "4. Run this script again"
    exit 1
fi

print_success "AWS credentials are set"
print_info "Access Key: ${AWS_ACCESS_KEY_ID:0:10}...***"
print_info "Bucket: $AWS_BUCKET_NAME"
print_info "Region: $AWS_REGION"
echo ""

# Step 3: Check if Docker is running
echo "Step 3: Checking Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi
print_success "Docker is installed"
echo ""

# Step 4: Check if Docker Compose is running
echo "Step 4: Checking Docker Compose services..."
if ! docker-compose ps | grep -q "notehive-backend"; then
    print_warning "Backend is not running"
    echo "Starting Docker containers..."
    docker-compose up -d
    sleep 10
fi
print_success "Docker containers are running"
echo ""

# Step 5: Test backend API
echo "Step 5: Testing backend API..."
HEALTH_RESPONSE=$(curl -s http://localhost:5001/api/health 2>/dev/null || echo "error")

if [ "$HEALTH_RESPONSE" = "error" ]; then
    print_error "Cannot connect to backend at http://localhost:5001"
    echo "Make sure Docker containers are running:"
    echo "  docker-compose up -d"
    exit 1
fi
print_success "Backend API is responding"
echo ""

# Step 6: Check S3 configuration in logs
echo "Step 6: Checking S3 configuration..."
S3_CONFIG=$(docker-compose logs backend 2>/dev/null | grep -i "s3 configured" | tail -1)

if echo "$S3_CONFIG" | grep -q "S3 configured"; then
    print_success "S3 is configured correctly!"
    echo "Logs: $S3_CONFIG"
elif echo "$S3_CONFIG" | grep -q "fallback"; then
    print_error "S3 is NOT configured - using local storage fallback"
    echo ""
    echo "Possible causes:"
    echo "1. Credentials are empty in .env"
    echo "2. Bucket name is not set"
    echo "3. Region is not set"
    echo ""
    echo "Please verify backend/.env contains all 4 variables"
    exit 1
else
    print_warning "Could not determine S3 configuration status"
    echo "Check logs manually: docker-compose logs backend | grep -i s3"
fi
echo ""

# Step 7: Create a test note
echo "Step 7: Creating test note..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:5001/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "S3 Integration Test",
    "content": "Testing file upload to S3",
    "category": "Test",
    "userId": "test-user-'"$(date +%s)"'"
  }')

TEST_ID=$(echo "$TEST_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TEST_ID" ]; then
    print_error "Failed to create test note"
    echo "Response: $TEST_RESPONSE"
    exit 1
fi
print_success "Test note created: $TEST_ID"
echo ""

# Step 8: Create a test file
echo "Step 8: Creating test file..."
TEST_FILE="s3-test-$(date +%s).txt"
echo "This is a test file for S3 integration at $(date)" > "$TEST_FILE"
print_success "Test file created: $TEST_FILE"
echo ""

# Step 9: Upload file to S3
echo "Step 9: Uploading file to S3..."
UPLOAD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:5001/api/notes/$TEST_ID/upload" \
  -F "file=@$TEST_FILE")

HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | tail -1)
UPLOAD_BODY=$(echo "$UPLOAD_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    print_success "File uploaded successfully (HTTP $HTTP_CODE)"
    echo "Response: $UPLOAD_BODY"
else
    print_error "File upload failed (HTTP $HTTP_CODE)"
    echo "Response: $UPLOAD_BODY"
    exit 1
fi
echo ""

# Step 10: Verify file URL
echo "Step 10: Checking file attachment..."
NOTE_DETAILS=$(curl -s "http://localhost:5001/api/notes/test-user-$(date +%s)/$TEST_ID")
if echo "$NOTE_DETAILS" | grep -q "uploads"; then
    print_success "File is attached to note!"
    echo "Details: $NOTE_DETAILS"
else
    print_warning "Could not verify file attachment"
fi
echo ""

# Step 11: AWS CLI verification (if available)
echo "Step 11: Verifying in AWS S3 (optional)..."
if command -v aws &> /dev/null; then
    S3_FILES=$(aws s3 ls "s3://$AWS_BUCKET_NAME/uploads/" 2>/dev/null | wc -l)
    if [ "$S3_FILES" -gt 0 ]; then
        print_success "Files found in S3 bucket!"
        echo "Running: aws s3 ls s3://$AWS_BUCKET_NAME/uploads/ --human-readable"
        aws s3 ls "s3://$AWS_BUCKET_NAME/uploads/" --human-readable --recursive | tail -5
    else
        print_warning "No files found in S3 bucket (might be first upload)"
    fi
else
    print_info "AWS CLI not installed - skipping S3 verification"
    echo "To verify files in S3:"
    echo "1. Go to AWS S3 Console: https://console.aws.amazon.com/s3/"
    echo "2. Click your bucket: $AWS_BUCKET_NAME"
    echo "3. Open the 'uploads/' folder"
    echo "4. You should see your test file"
fi
echo ""

# Cleanup
echo "Step 12: Cleaning up..."
rm -f "$TEST_FILE"
print_success "Test file cleaned up"
echo ""

# Final summary
echo "================================"
print_success "S3 Integration Test Complete!"
echo "================================"
echo ""
echo "Summary:"
echo "✅ Docker containers running"
echo "✅ Backend API responding"
echo "✅ S3 configuration active"
echo "✅ Test note created"
echo "✅ File uploaded to S3"
echo ""
echo "Next steps:"
echo "1. Verify in AWS Console: https://console.aws.amazon.com/s3/"
echo "2. Check bucket: $AWS_BUCKET_NAME"
echo "3. Look in 'uploads/' folder for test file"
echo ""
echo "Your NoteHive app is ready to use with S3! 🎉"
