# Quick S3 Credentials Setup & Testing

Follow this guide to add your S3 credentials and test the integration.

## ⚠️ IMPORTANT SECURITY REMINDER

- ✅ The `.env` file is in `.gitignore` - credentials won't be committed to git
- ✅ Credentials are only used at runtime
- ✅ Safe to add real credentials here for local development
- ✅ For production, use AWS Secrets Manager or environment variables

---

## Quick Setup (5 minutes)

### 1. Prepare Your AWS Credentials

You need:
- **Access Key ID** (starts with `AKIA...`)
- **Secret Access Key** (long string with special chars)
- **Bucket Name** (the S3 bucket you created)
- **Region** (e.g., `us-east-1`)

⚠️ If you don't have these, [follow S3_SETUP.md](./S3_SETUP.md) first to create them.

### 2. Edit `backend/.env`

Open the file:
```bash
# Mac/Linux
nano backend/.env

# Or use your editor
code backend/.env  # VS Code
```

Find and update these lines:

```bash
# Before (empty)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=notehive-uploads
AWS_REGION=us-east-1

# After (with your credentials)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET_NAME=notehive-uploads-john
AWS_REGION=us-east-1
```

**Replace** with your actual values from AWS:
- `AKIAIOSFODNN7EXAMPLE` → Your Access Key ID
- `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` → Your Secret Access Key
- `notehive-uploads-john` → Your S3 bucket name
- `us-east-1` → Your AWS region

### 3. Restart Docker

```bash
docker-compose down
docker-compose up -d --build
```

Wait 15-20 seconds for containers to start.

### 4. Verify S3 is Configured

Check the logs:
```bash
docker-compose logs backend | grep -i "s3\|storage"
```

You should see:
```
S3 configured - uploads will be stored in AWS S3
```

✅ **If you see this, S3 is ready!**

---

## Test S3 Integration

### Automated Test (Recommended)

Run the test script:
```bash
bash test-s3.sh
```

This script will:
1. ✅ Verify credentials are set
2. ✅ Test backend API
3. ✅ Create a test note
4. ✅ Upload a test file
5. ✅ Verify in S3 (if AWS CLI installed)
6. ✅ Show you the results

### Manual Test

**Create a test note:**
1. Go to http://localhost:3000
2. Click "+ New Note"
3. Title: "S3 Test"
4. Content: "Testing S3 upload"
5. Click "Save"

**Upload a file:**
1. In the note, click "📎 Add attachment"
2. Select a small test file
3. Wait for upload to complete

**Check S3:**
1. Go to https://console.aws.amazon.com/s3/
2. Click your bucket name
3. Open the `uploads/` folder
4. You should see your file! ✅

---

## Troubleshooting

### "S3 not fully configured" Message

**This means**: One or more credentials are empty

**Check**:
```bash
cat backend/.env | grep AWS_
```

Make sure all 4 lines have values:
```bash
AWS_ACCESS_KEY_ID=something
AWS_SECRET_ACCESS_KEY=something
AWS_BUCKET_NAME=something
AWS_REGION=something
```

Then restart:
```bash
docker-compose down && docker-compose up -d
```

### "Access Denied" Error

**This means**: Your IAM user doesn't have permission

**Fix**:
1. Go to AWS IAM console
2. Click Users → Click your user
3. Click "Add permissions"
4. Search: `AmazonS3FullAccess`
5. Check box and click "Attach policy"
6. Restart: `docker-compose down && docker-compose up -d`

### "NoSuchBucket" Error

**This means**: Bucket name is wrong or doesn't exist

**Fix**:
1. Go to AWS S3 console
2. Find your bucket name
3. Copy exact name
4. Update `AWS_BUCKET_NAME` in `.env`
5. Restart application

### File Upload Shows Error

**Check backend logs**:
```bash
docker-compose logs backend -f
```

Look for AWS errors like:
- `InvalidAccessKeyId` - Wrong Access Key ID
- `SignatureDoesNotMatch` - Wrong Secret Access Key
- `NoSuchBucket` - Wrong bucket name

---

## Verify Upload Success

### In AWS Console (Easy)

1. Go to https://console.aws.amazon.com/s3/
2. Click bucket name
3. Click `uploads/` folder
4. Look for files with your uploads
5. Each file has: `timestamp-uuid-originalname`

### With AWS CLI

```bash
aws s3 ls s3://notehive-uploads-yourname/uploads/ --recursive
```

Output will show all files you uploaded.

### In NoteHive App

1. Create/open a note
2. Go to "Attachments" section
3. Files you uploaded should be listed
4. Click to download/view

---

## Storage Comparison

| Aspect | Local Storage | S3 Storage |
|--------|---------------|-----------|
| Upload Location | `backend/uploads/` | AWS S3 bucket |
| Persistence | On your machine | Cloud (AWS) |
| Backup | Manual | Automatic |
| Accessibility | localhost only | From anywhere |
| Cost | Free | ~$0.25/month (typical) |
| When to use | Development | Production |

---

## Next Steps

### After Successful Test:

1. ✅ S3 is now the default storage
2. ✅ Files automatically upload to S3
3. ✅ Application is production-ready
4. ✅ Files are accessible from anywhere

### For Production:

1. Use AWS Secrets Manager or environment variables
2. Don't hardcode credentials in files
3. Enable S3 versioning (backup)
4. Enable S3 encryption
5. Configure CORS if needed
6. Set up CloudFront CDN (optional)

---

## Files & Commands Reference

| File/Command | Purpose |
|--------|---------|
| `backend/.env` | Store your credentials here |
| `test-s3.sh` | Automated testing script |
| `S3_TESTING_GUIDE.md` | Detailed testing guide |
| `docker-compose logs backend` | View backend logs |
| `curl http://localhost:5001/api/health` | Test API |

---

## Quick Reference

### Add Credentials
```bash
nano backend/.env
# Edit the 4 AWS_* variables
```

### Restart Docker
```bash
docker-compose down
docker-compose up -d
```

### Test Automatically
```bash
bash test-s3.sh
```

### Check Logs
```bash
docker-compose logs backend | grep -i s3
```

### Verify in S3
```bash
# AWS Console: https://console.aws.amazon.com/s3/
# Or AWS CLI:
aws s3 ls s3://your-bucket-name/uploads/
```

---

## Need Help?

- **Detailed Testing**: [S3_TESTING_GUIDE.md](./S3_TESTING_GUIDE.md)
- **Full Setup**: [S3_SETUP.md](./S3_SETUP.md)
- **Quick Reference**: [S3_QUICK_START.md](./S3_QUICK_START.md)
- **AWS Docs**: https://docs.aws.amazon.com/s3/

---

**Ready to test?** Run `bash test-s3.sh` when your credentials are added! 🚀
