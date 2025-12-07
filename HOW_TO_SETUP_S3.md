# How to Setup AWS S3 for NoteHive - Step by Step

This is a **hands-on guide** that walks you through setting up AWS S3 for file uploads.

## Time Required: 10 minutes

---

## Step 1: Create AWS Account (3 minutes)

### If you don't have an AWS account:

1. Go to https://aws.amazon.com
2. Click **Create an AWS Account**
3. Enter your email address
4. Choose **Personal** account type
5. Enter payment information (won't charge if you stay in free tier)
6. Verify phone number
7. Create and save password

### If you have an account:

Just log in to https://console.aws.amazon.com

---

## Step 2: Create S3 Bucket (2 minutes)

### Using AWS Console:

1. **Go to S3**: In AWS Console, search for "S3" and click **S3**
2. **Click "Create bucket"** (orange button)
3. **Configure bucket**:
   - **Bucket name**: `notehive-uploads-<your-name>`
     - Example: `notehive-uploads-john-2024`
     - ⚠️ Must be globally unique (no duplicates across all AWS accounts)
   - **Region**: Choose closest to you
     - `us-east-1` (N. Virginia) - most common
     - `us-west-2` (Oregon) - if on west coast
     - `eu-west-1` (Ireland) - if in Europe

4. **Block public access**:
   - Leave as default (checked = private)
   - Uncheck only if you want public file access

5. **Click "Create bucket"** (orange button)

✅ Your bucket is created!

---

## Step 3: Create IAM User (3 minutes)

This creates a special user account just for your app (more secure than root account).

### Steps:

1. **Go to IAM**: In AWS Console, search for "IAM" → click **IAM**

2. **Create User**:
   - Click **Users** in left menu
   - Click **Create user** (orange button)
   - **Username**: `notehive-app`
   - Click **Next**

3. **Add Permissions**:
   - Click **Attach policies directly**
   - Search for: `AmazonS3FullAccess`
   - **Check the box** next to it
   - Click **Next** → **Create user**

4. **Create Access Key**:
   - Click on your user `notehive-app`
   - Go to **Security credentials** tab
   - Click **Create access key**
   - Choose **Application running outside AWS**
   - Click **Next** → **Create access key**

5. **Copy Your Credentials** ⚠️ **IMPORTANT**:
   - You'll see your credentials once - **SAVE THEM NOW**
   - Copy and save somewhere safe:
     - **Access Key ID** (starts with AKIA...)
     - **Secret Access Key** (long string with special characters)
   - You won't see secret key again!

---

## Step 4: Update NoteHive Configuration (1 minute)

### Edit the `.env` file:

Open or create file: `backend/.env`

**Add or update these lines:**

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA_paste_your_access_key_here
AWS_SECRET_ACCESS_KEY=paste_your_secret_key_here
AWS_BUCKET_NAME=notehive-uploads-your-name
AWS_REGION=us-east-1
```

**Example (with real values):**

```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET_NAME=notehive-uploads-john-2024
AWS_REGION=us-east-1
```

✅ Save the file

---

## Step 5: Restart Application (1 minute)

### In your terminal:

```bash
# Stop the current app
docker-compose down

# Start with new credentials
docker-compose up -d
```

### Verify it's working:

```bash
# Check logs for S3 configuration
docker-compose logs backend | grep -i "s3\|configured"
```

**Expected output:**
```
info: S3 configured - uploads will be stored in AWS S3
```

✅ S3 is configured!

---

## Step 6: Test File Upload (1 minute)

1. **Open browser**: Go to http://localhost:3000
2. **Create a note**:
   - Click **+ New Note**
   - Add title: "Test S3 Upload"
   - Click **Save**

3. **Upload a file**:
   - Click **Add attachment**
   - Select any file on your computer
   - Wait for upload (shows "⏳ Uploading...")

4. **Verify in S3**:
   - Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
   - Click your bucket
   - Open the `uploads/` folder
   - Your file should appear there! ✅

---

## ✅ Success! You're Done

Your NoteHive application now uploads files to AWS S3 instead of local storage.

**What's happening:**
- Files are stored in cloud (AWS S3)
- Highly available and backed up
- Can be accessed from anywhere
- Production-ready

---

## If Something Goes Wrong

### Error: "Access Denied"

**Cause**: Wrong credentials

**Fix**:
1. Check credentials are exactly correct (copy/paste again)
2. Verify IAM user has `AmazonS3FullAccess` permission
3. Check bucket name is spelled correctly
4. Restart: `docker-compose down && docker-compose up -d`

### Error: "Bucket does not exist"

**Cause**: Wrong bucket name

**Fix**:
1. Go to S3 console
2. Copy exact bucket name from list
3. Paste into `.env` file
4. Restart application

### Still using local storage (not S3)

**Cause**: Credentials not set

**Fix**:
1. Check all 4 variables are set in `.env`:
   - `AWS_ACCESS_KEY_ID` ✓
   - `AWS_SECRET_ACCESS_KEY` ✓
   - `AWS_BUCKET_NAME` ✓
   - `AWS_REGION` ✓
2. No empty values!
3. Restart: `docker-compose down && docker-compose up -d`

### Check logs:

```bash
docker-compose logs backend | tail -50
```

Look for mentions of "S3" or "upload"

---

## Security Notes ⚠️

### DO:
- ✅ Store credentials in `.env` file
- ✅ Add `.env` to `.gitignore`
- ✅ Rotate credentials every 3 months
- ✅ Use minimal permissions (IAM user, not root)
- ✅ Enable bucket encryption

### DON'T:
- ❌ Commit `.env` file to git
- ❌ Share access keys publicly
- ❌ Use root account credentials
- ❌ Use same credentials for multiple apps
- ❌ Enable public read access (unless you want it)

---

## Next Steps

### Optional: Make Files Public

If you want people to access uploaded files directly:

1. Go to S3 bucket → **Permissions**
2. Add this bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

Replace `your-bucket-name` with your actual bucket name.

### Optional: Enable Versioning

Keep backup versions of files:

```bash
aws s3api put-bucket-versioning \
  --bucket your-bucket-name \
  --versioning-configuration Status=Enabled
```

### Optional: Enable Encryption

Secure your files:

Go to S3 bucket → **Properties** → **Default encryption** → Enable

---

## Costs

### Free Tier (First Year)
- 5 GB storage - FREE
- 20,000 GET requests - FREE
- 2,000 PUT requests - FREE

### After Free Tier
| Usage | Cost |
|-------|------|
| 10 GB storage | $0.23/month |
| 1,000 uploads | $0.005/month |
| 1,000 downloads | $0.0004/month |

**Estimate for typical use: ~$0.25/month**

See [AWS Pricing Calculator](https://calculator.aws.amazon.com/) for your specific usage.

---

## Summary

You just:
1. ✅ Created AWS account
2. ✅ Created S3 bucket
3. ✅ Created IAM user
4. ✅ Got access credentials
5. ✅ Updated `.env` file
6. ✅ Restarted application
7. ✅ Tested file upload

**Congratulations! 🎉**

Your application is now using professional cloud storage (AWS S3).

---

## More Information

- **[S3_QUICK_START.md](./S3_QUICK_START.md)** - 5-minute reference version
- **[S3_SETUP.md](./S3_SETUP.md)** - Comprehensive guide with advanced options
- **[AWS_S3_README.md](./AWS_S3_README.md)** - Overview and comparison with local storage
- **[AWS S3 Docs](https://docs.aws.amazon.com/s3/)** - Official AWS documentation

---

## Need Help?

**Check logs:**
```bash
docker-compose logs backend
```

**Restart fresh:**
```bash
docker-compose down
docker-compose up -d
```

**Verify S3:**
```bash
aws s3 ls s3://your-bucket-name/uploads/
```

---

**Last Updated:** December 2024
**Time to Complete:** 10 minutes
**Difficulty:** Beginner-friendly ✅
