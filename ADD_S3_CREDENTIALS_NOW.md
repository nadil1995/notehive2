# 🚀 Add Your S3 Credentials NOW

This is your action checklist to get S3 working in 5 minutes.

---

## Do You Have AWS Credentials?

### ✅ YES - I Have Access Key & Secret Key

**Jump to Step 2** below

### ❌ NO - I Need to Create Them First

**Follow this first**:
1. Open [HOW_TO_SETUP_S3.md](./HOW_TO_SETUP_S3.md) OR [S3_SETUP.md](./S3_SETUP.md)
2. Complete Steps 1-3 (takes ~10 minutes)
3. Come back here with your credentials
4. Continue to Step 2

---

## Step 1: Gather Your Credentials ⚙️

Before you edit the `.env` file, gather these 4 pieces of information from AWS:

**From AWS IAM Console:**
- [ ] Access Key ID (starts with `AKIA...`)
- [ ] Secret Access Key (long string with special characters)

**From AWS S3 Console:**
- [ ] Bucket Name (e.g., `notehive-uploads-john`)
- [ ] Region (e.g., `us-east-1`)

**Example values:**
```
Access Key ID:     AKIAIOSFODNN7EXAMPLE
Secret Key:        wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Bucket Name:       notehive-uploads-john
Region:            us-east-1
```

---

## Step 2: Edit Your `.env` File

### Option A: Using Command Line

```bash
# Open the file
nano backend/.env
```

**Find these lines** (should be empty or have placeholder values):
```bash
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=notehive-uploads
AWS_REGION=us-east-1
```

**Replace with your actual values:**
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET_NAME=notehive-uploads-john
AWS_REGION=us-east-1
```

**Save and exit** (Ctrl+X, then Y, then Enter)

### Option B: Using VS Code

```bash
# Open VS Code
code backend/.env
```

1. Find the 4 AWS lines
2. Replace the empty values with your credentials
3. Save (Ctrl+S)

### Option C: Using Any Text Editor

1. Open `backend/.env` from your project folder
2. Find the 4 AWS lines (they're around line 8-11)
3. Replace the values with your credentials
4. Save the file

---

## The 4 Environment Variables

| Variable | Your Value | Example |
|----------|-----------|---------|
| `AWS_ACCESS_KEY_ID` | Access Key from AWS | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Secret Key from AWS | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_BUCKET_NAME` | S3 bucket name | `notehive-uploads-john` |
| `AWS_REGION` | AWS region | `us-east-1` |

---

## ✅ Verify Your Edits

After editing, run this to verify:

```bash
cat backend/.env | grep AWS_
```

**You should see something like:**
```
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET_NAME=notehive-uploads-john
AWS_REGION=us-east-1
```

**If empty or still has `=` at the end**, go back and re-edit the file.

---

## Step 3: Restart Docker 🐳

Now restart your application with the new credentials:

```bash
docker-compose down
docker-compose up -d --build
```

Wait 15-20 seconds for containers to start.

**Check if everything started:**
```bash
docker-compose ps
```

You should see all 3 containers with "Up" status:
```
NAME                STATUS
notehive-backend    Up 1 minute ✅
notehive-frontend   Up 1 minute ✅
notehive-mongodb    Up 1 minute ✅
```

---

## Step 4: Verify S3 Configuration ✔️

### Quick Check

```bash
docker-compose logs backend | grep -i "s3 configured"
```

**If you see:**
```
S3 configured - uploads will be stored in AWS S3
```

✅ **SUCCESS! S3 is active!**

**If you see:**
```
S3 not fully configured - using local file storage
```

❌ **PROBLEM** - One or more credentials are missing or wrong. Go back to Step 2 and check.

---

## Step 5: Test File Upload 🎯

### Easy Test (Recommended)

1. Open your browser: http://localhost:3000
2. Click **+ New Note**
3. Add title: "S3 Test"
4. Add content: "Testing S3"
5. Click **Save**
6. Click **📎 Add attachment**
7. Select a file from your computer
8. Wait for "⏳ Uploading..." to finish

### What Should Happen

✅ The attachment appears in your note
✅ No error messages
✅ File is now in your S3 bucket

### Verify in AWS Console

1. Go to: https://console.aws.amazon.com/s3/
2. Click your bucket (e.g., `notehive-uploads-john`)
3. Click the `uploads/` folder
4. Look for your file! 🎉

---

## Step 6: Automated Testing (Optional)

Run the automated test script:

```bash
bash test-s3.sh
```

This will:
- ✅ Verify credentials
- ✅ Test backend API
- ✅ Create a test note
- ✅ Upload a test file
- ✅ Show results

---

## 🎉 Success Checklist

After completing all steps:

- [ ] Step 1: Gathered 4 pieces of info from AWS
- [ ] Step 2: Edited `backend/.env` with credentials
- [ ] Step 3: Restarted Docker containers
- [ ] Step 4: Verified S3 is configured
- [ ] Step 5: Uploaded a test file
- [ ] Step 6: Found file in AWS S3 console

**If all checkmarks are done: Congratulations! 🎊**

Your NoteHive app is now using AWS S3 for file storage!

---

## 🆘 Troubleshooting

### Problem: "S3 not fully configured"

**Cause**: One or more credentials are empty

**Fix**:
1. Open `backend/.env` again
2. Check all 4 AWS_* lines have values (not empty)
3. Save the file
4. Restart: `docker-compose down && docker-compose up -d`

### Problem: "Access Denied" Error

**Cause**: IAM user doesn't have S3 permissions

**Fix**:
1. Go to AWS IAM console
2. Click Users → Your user
3. Click "Add permissions" → "Attach policies directly"
4. Search for `AmazonS3FullAccess`
5. Check it and click "Attach policy"
6. Restart: `docker-compose down && docker-compose up -d`

### Problem: "Bucket Does Not Exist"

**Cause**: Bucket name is wrong or misspelled

**Fix**:
1. Go to AWS S3 console
2. Copy your exact bucket name
3. Edit `backend/.env`
4. Update `AWS_BUCKET_NAME` with exact name
5. Restart: `docker-compose down && docker-compose up -d`

### Problem: File Upload Still Going to Local Storage

**Cause**: Credentials not being loaded

**Fix**:
1. Make sure `.env` is in the `backend/` folder (not root)
2. Verify all 4 AWS_* variables have values
3. Restart fresh:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

---

## Quick Commands Reference

```bash
# Edit credentials
nano backend/.env

# Verify credentials are set
cat backend/.env | grep AWS_

# Restart Docker
docker-compose down
docker-compose up -d --build

# Check S3 is configured
docker-compose logs backend | grep -i "s3 configured"

# Test with automated script
bash test-s3.sh

# View all backend logs
docker-compose logs backend
```

---

## Next Step: Test Now! 🚀

**Ready to test S3?**

```bash
# Option 1: Automated test (easiest)
bash test-s3.sh

# Option 2: Manual test (through web app)
# 1. Go to http://localhost:3000
# 2. Create a note
# 3. Add an attachment
# 4. Check AWS S3 console
```

---

## Need More Help?

- **Step-by-step guide**: [S3_TESTING_GUIDE.md](./S3_TESTING_GUIDE.md)
- **Setup from scratch**: [S3_SETUP.md](./S3_SETUP.md) or [HOW_TO_SETUP_S3.md](./HOW_TO_SETUP_S3.md)
- **Quick reference**: [S3_QUICK_START.md](./S3_QUICK_START.md)
- **AWS Documentation**: https://docs.aws.amazon.com/s3/

---

**Now go add those credentials and test! You've got this! 💪**

```bash
nano backend/.env    # Edit credentials
docker-compose down && docker-compose up -d  # Restart
bash test-s3.sh      # Test
```
