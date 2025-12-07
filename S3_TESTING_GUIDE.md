# Testing S3 Integration - Complete Guide

This guide will help you safely add AWS S3 credentials and test the integration.

## ⚠️ IMPORTANT SECURITY WARNING

**NEVER commit credentials to git!** The `.env` file should:
- ✅ Be in `.gitignore` (already configured)
- ✅ Only exist on your local machine
- ✅ Be kept in a secure secrets manager for production
- ❌ Never be pushed to GitHub

The credentials are only used at runtime and won't be committed.

---

## Step 1: Get Your AWS S3 Credentials

### Option A: You Already Have Credentials
If you already have AWS S3 credentials (Access Key ID and Secret Access Key), skip to Step 2.

### Option B: Create New AWS Credentials

1. **Log in to AWS Console**: https://console.aws.amazon.com
2. **Go to IAM Service**:
   - Search for "IAM" in the top search bar
   - Click on "IAM"

3. **Create an S3 Bucket** (if you don't have one):
   - Search for "S3" and open S3 service
   - Click "Create bucket"
   - Name: `notehive-uploads-yourname` (must be globally unique)
   - Region: `us-east-1` (or closest to you)
   - Click "Create bucket"

4. **Create an IAM User** (recommended - more secure):
   - In IAM service, click "Users" → "Create user"
   - Username: `notehive-app`
   - Click "Next"

5. **Add S3 Permissions**:
   - Click "Attach policies directly"
   - Search for: `AmazonS3FullAccess`
   - Check the box
   - Click "Next" → "Create user"

6. **Generate Access Key**:
   - Click on the user you just created
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Choose "Application running outside AWS"
   - Click "Next" → "Create access key"

7. **Copy Your Credentials** ⚠️ **IMPORTANT**:
   - You'll see:
     - **Access Key ID** (starts with `AKIA...`)
     - **Secret Access Key** (long string)
   - Save these somewhere safe (they won't be shown again!)

---

## Step 2: Add Credentials to .env File

**Location**: `backend/.env`

Edit the file and update these lines with your actual credentials:

```bash
AWS_ACCESS_KEY_ID=AKIA_YOUR_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY_HERE
AWS_BUCKET_NAME=notehive-uploads-yourname
AWS_REGION=us-east-1
```

**Example** (with fake values):
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET_NAME=notehive-uploads-john
AWS_REGION=us-east-1
```

---

## Step 3: Restart Docker with New Credentials

Run this command to restart the application with the new S3 credentials:

```bash
docker-compose down
docker-compose up -d --build
```

Wait for all containers to start (about 15-20 seconds).

---

## Step 4: Verify S3 Configuration

### Check Backend Logs

```bash
docker-compose logs backend | grep -i "s3\|storage\|credential"
```

**Expected Output** (if S3 is configured correctly):
```
info: S3 configured - uploads will be stored in AWS S3
```

**If you see this** (wrong credentials):
```
warn: S3 not fully configured - using local file storage as fallback
```

### Check Health Endpoint

```bash
curl http://localhost:5001/api/health
```

**Expected Response**:
```json
{"status":"OK","timestamp":"2025-12-07T22:32:00.018Z","uptime":152.74}
```

### Verify Backend is Running

```bash
docker-compose ps
```

**Expected**:
```
NAME                STATUS
notehive-backend    Up 2 minutes ✅
notehive-frontend   Up 2 minutes ✅
notehive-mongodb    Up 2 minutes ✅
```

---

## Step 5: Test File Upload to S3

### Method 1: Using the Web Application (Recommended)

1. **Open NoteHive**: http://localhost:3000
2. **Create a Test Note**:
   - Click "+ New Note"
   - Title: "S3 Upload Test"
   - Content: "Testing file upload to S3"
   - Click "Save"

3. **Add an Attachment**:
   - Click "📎 Add attachment"
   - Select any small file from your computer (< 10MB)
   - Wait for "⏳ Uploading..." to complete

4. **Check for Success**:
   - The attachment should appear in the note
   - No error messages

### Method 2: Test with curl (Advanced)

First, create a test file:
```bash
echo "This is a test file for S3" > test-s3.txt
```

Create a note first:
```bash
curl -X POST http://localhost:5001/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "S3 Test Note",
    "content": "Testing S3 upload",
    "category": "Test",
    "userId": "test-user-123"
  }'
```

This will return a note ID like `"_id":"507f1f77bcf86cd799439011"`

Then upload a file (replace NOTE_ID):
```bash
curl -X POST http://localhost:5001/api/notes/NOTE_ID/upload \
  -F "file=@test-s3.txt"
```

---

## Step 6: Verify Files Are in S3

### Method 1: AWS Console (Easiest)

1. **Open AWS S3 Console**: https://console.aws.amazon.com/s3/
2. **Click Your Bucket**: `notehive-uploads-yourname`
3. **Look for `uploads/` Folder**
4. **Check Inside**: You should see files like:
   - `1765145268323-df7745eb-bb37-4943-83fc-87256466ec15-test.txt`

✅ **If you see your files here, S3 upload is working!**

### Method 2: AWS CLI

```bash
# List files in your bucket
aws s3 ls s3://notehive-uploads-yourname/uploads/

# Or just check if bucket is accessible
aws s3api head-bucket --bucket notehive-uploads-yourname
```

**Expected Output**:
```
2025-12-07 15:30:45        1024 uploads/1765145268323-df7745eb-bb37-4943-83fc-87256466ec15-test.txt
2025-12-07 15:35:12        2048 uploads/1765145612158-2d93fb0a-1abd-454c-9268-1db609ba9a43-app-logs.json
```

---

## Step 7: Check Backend Logs for S3 Activity

```bash
docker-compose logs backend | tail -50
```

**Expected Log Messages** (if S3 is working):
```
info: S3 configured - uploads will be stored in AWS S3
info: File uploaded successfully to S3
```

**Error Examples & Solutions**:

| Error | Cause | Solution |
|-------|-------|----------|
| `NoCredentialsError` | AWS credentials missing or wrong | Check `.env` file, verify credentials in AWS console |
| `NoSuchBucket` | Bucket name doesn't exist | Check bucket name in AWS console, update `.env` |
| `AccessDenied` | IAM user doesn't have S3 permissions | Add `AmazonS3FullAccess` policy to IAM user |
| `SignatureDoesNotMatch` | Secret key is wrong | Verify secret key in AWS console |
| `RequestLimitExceeded` | Too many requests too fast | Wait a few seconds and try again |

---

## Step 8: Monitor S3 Activity

### Real-time Upload Monitoring

While uploading, watch the logs:

```bash
docker-compose logs -f backend | grep -i "s3\|upload\|error"
```

### Check S3 Bucket Size

```bash
# In AWS Console:
# Go to S3 → Your Bucket → Properties → Bucket size
```

### View Upload History

```bash
# List recent uploads
aws s3 ls s3://notehive-uploads-yourname/uploads/ --recursive --human-readable --summarize
```

---

## Troubleshooting

### Issue: "S3 not fully configured" Message

**Cause**: One or more environment variables are empty

**Fix**:
1. Check `backend/.env` file
2. Verify all 4 variables are set:
   - `AWS_ACCESS_KEY_ID` - not empty
   - `AWS_SECRET_ACCESS_KEY` - not empty
   - `AWS_BUCKET_NAME` - not empty
   - `AWS_REGION` - not empty
3. Restart: `docker-compose down && docker-compose up -d`

### Issue: "Access Denied" Error

**Cause**: IAM user doesn't have S3 permissions

**Fix**:
1. Go to AWS IAM console
2. Click on your user (`notehive-app`)
3. Click "Add permissions" → "Attach policies directly"
4. Search for `AmazonS3FullAccess`
5. Check the box and click "Attach policy"
6. Restart the application

### Issue: Files Not Appearing in S3

**Cause**: Credentials are wrong or upload failed silently

**Fix**:
1. Check backend logs: `docker-compose logs backend | grep -i error`
2. Verify credentials are correct
3. Try uploading again
4. Check AWS console S3 bucket for files

### Issue: "Bucket Does Not Exist"

**Cause**: Bucket name is misspelled or doesn't exist

**Fix**:
1. Go to AWS S3 console
2. Copy exact bucket name
3. Update `AWS_BUCKET_NAME` in `.env`
4. Restart application

### Issue: "Connection Timeout"

**Cause**: AWS region might be wrong or network issue

**Fix**:
1. Check your AWS region is correct
2. Verify internet connection
3. Try a different region (e.g., `us-east-1`)

---

## Comparison: Local vs S3 Storage

| Feature | Local Storage | S3 Storage |
|---------|---------------|-----------|
| Setup Time | Instant | 5-10 minutes |
| Storage Limit | Disk size | Unlimited (pay as you go) |
| Reliability | ⚠️ Depends on server | ✅ 99.99% uptime |
| Cost | Free | ~$0.25/month (typical) |
| Backup | Manual | Automatic |
| Accessibility | Local only | From anywhere |
| Scaling | Limited | Unlimited |

---

## Quick Reference

### Environment Variables

```bash
# backend/.env
AWS_ACCESS_KEY_ID=AKIA_YOUR_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
AWS_BUCKET_NAME=notehive-uploads-yourname
AWS_REGION=us-east-1
```

### Common Commands

```bash
# Restart application
docker-compose down && docker-compose up -d

# View backend logs
docker-compose logs backend

# Test S3 connection
curl http://localhost:5001/api/health

# Check S3 in AWS CLI
aws s3 ls s3://notehive-uploads-yourname/uploads/
```

### File Upload Flow

```
User uploads file in web app
        ↓
Frontend sends to /api/notes/{noteId}/upload
        ↓
Backend receives file
        ↓
S3 config checks: Are credentials set?
        ↓
YES → Uploads to S3 bucket ✅
NO  → Saves to local disk folder (fallback)
        ↓
Returns file URL to frontend
        ↓
File appears in note attachments
```

---

## Next Steps

1. ✅ Get AWS credentials
2. ✅ Add to `.env` file
3. ✅ Restart Docker
4. ✅ Upload test file
5. ✅ Verify in S3 console
6. ✅ Celebrate! 🎉

---

## Need More Help?

- **S3 Setup**: [S3_SETUP.md](./S3_SETUP.md)
- **Quick Start**: [S3_QUICK_START.md](./S3_QUICK_START.md)
- **AWS Docs**: https://docs.aws.amazon.com/s3/
- **Troubleshooting**: See section above

---

**Last Updated**: December 7, 2025
**Status**: Ready for S3 testing
