# AWS S3 Setup for NoteHive - Complete Guide

Welcome! This document explains how to set up AWS S3 for file uploads in NoteHive.

## Quick Navigation

- **⚡ Want to start in 5 minutes?** → Read [S3_QUICK_START.md](./S3_QUICK_START.md)
- **📚 Want complete details?** → Read [S3_SETUP.md](./S3_SETUP.md)
- **🏃 Just want to develop locally?** → No S3 needed! Use local storage.

---

## Overview

NoteHive supports two file upload methods:

### 1. Local File Storage (Default)
- ✅ Files stored in `backend/uploads/` folder
- ✅ Works out of the box - no AWS setup needed
- ✅ Perfect for development and testing
- ❌ Not suitable for production or multiple servers
- ❌ Data lost if Docker volume is deleted

### 2. AWS S3 Storage (Recommended for Production)
- ✅ Professional cloud storage
- ✅ Highly available and durable
- ✅ Works with multiple servers/scaling
- ✅ Automatic backups and versioning
- ✅ Cost-effective for small-to-medium usage
- ⚠️ Requires AWS account and setup

---

## Which Should I Use?

### Use Local Storage If:
- Learning/testing the application
- Running on single server
- Don't need persistent storage
- AWS account not available

### Use S3 If:
- Running in production
- Need multiple server instances
- Require high availability
- Want professional cloud backup
- Planning to scale later

---

## How It Works

The application automatically detects S3 credentials and:

1. **If S3 credentials are set** → Files upload to AWS S3 ☁️
2. **If S3 credentials are missing** → Files upload to local folder 📁

No code changes needed! Just set environment variables.

```
┌─────────────────────────────────────────────┐
│         File Upload Process                 │
├─────────────────────────────────────────────┤
│                                             │
│  User uploads file in browser               │
│           ↓                                 │
│  Frontend sends file to backend             │
│           ↓                                 │
│  Backend checks for S3 credentials          │
│           ↓                                 │
│  ┌─────────────────────────────┐           │
│  │                             │           │
│  ├─→ S3 credentials found?     │           │
│  │                             │           │
│  │  Yes → Upload to S3 ☁️       │           │
│  │  No  → Save locally 📁       │           │
│  │                             │           │
│  └─────────────────────────────┘           │
│           ↓                                 │
│  Return file URL to frontend                │
│           ↓                                 │
│  File appears in attachments                │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Getting Started

### Step 1: Choose Your Path

**Option A: Local Development** (5 seconds)
```bash
# Just start the app
docker-compose up
```

**Option B: AWS S3** (5-10 minutes)
1. Read [S3_QUICK_START.md](./S3_QUICK_START.md)
2. Follow the 5 steps
3. Restart application

---

## Environment Variables

These variables control where files are uploaded:

| Variable | Purpose | Example |
|----------|---------|---------|
| `AWS_ACCESS_KEY_ID` | AWS account access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS account secret key | `wJalrXUtnFEMI/K7...` |
| `AWS_BUCKET_NAME` | S3 bucket name | `notehive-uploads-prod` |
| `AWS_REGION` | AWS region | `us-east-1` |

**Where to set them:**

```bash
# Option 1: In backend/.env file
echo "AWS_ACCESS_KEY_ID=your_key" >> backend/.env

# Option 2: Export before running
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret

# Option 3: In docker-compose.yml (not recommended)
```

---

## Current Configuration

Your application currently:

- ✅ Uses **local file storage** by default
- ✅ Can use **S3 automatically** if credentials are provided
- ✅ Has **automatic fallback** if S3 fails
- ✅ Logs configuration status on startup

View current configuration:

```bash
docker-compose logs backend | grep -i "s3\|configured\|upload"
```

Expected output:
```
warn: S3 not fully configured - using local file storage as fallback
```

This means S3 isn't set up yet, so it's using local storage. ✅

---

## Cost Estimation

If you decide to use S3:

**Small usage (10GB, 1000 uploads/month):**
- Storage: $0.23/month
- Requests: ~$0.01/month
- **Total: ~$0.25/month**

**Medium usage (100GB, 10000 uploads/month):**
- Storage: $2.30/month
- Requests: ~$0.10/month
- **Total: ~$2.40/month**

Use [AWS Pricing Calculator](https://calculator.aws.amazon.com/) for your estimates.

---

## Security Notes ⚠️

### Local Storage
- Credentials stored in `.env` file
- Don't commit `.env` to git
- Use `.gitignore` to prevent accidental commits

### S3 Storage
- Use **IAM users** instead of root account
- Create **separate user** for application
- Use **minimal permissions** (only S3 access)
- **Rotate access keys** every 90 days
- Enable **bucket encryption** and **versioning**
- Use **bucket policies** for access control

See [S3_SETUP.md](./S3_SETUP.md) for detailed security best practices.

---

## Frequently Asked Questions

**Q: Can I switch from local storage to S3 later?**
A: Yes! Just set the environment variables and restart. Existing local files won't migrate automatically, but new uploads will go to S3.

**Q: What happens to old local files?**
A: They stay in `backend/uploads/` folder. New uploads go to S3 if credentials are set.

**Q: Can I use a different storage provider?**
A: Currently supports S3. Adding other providers (Azure, Google Cloud) requires code changes.

**Q: Is S3 mandatory for production?**
A: Recommended but not mandatory. For single-server setups, local storage works. For scaling/high-availability, S3 is needed.

**Q: How do I monitor upload costs?**
A: Use [AWS Cost Explorer](https://console.aws.amazon.com/cost-management) to track S3 expenses.

**Q: Can I use S3 in different regions?**
A: Yes! Set `AWS_REGION` to your preferred region for lowest latency.

---

## File Structure

```
notehive2-complete/
├── backend/
│   ├── .env                    ← Set AWS credentials here
│   ├── uploads/                ← Local file storage (fallback)
│   └── config/s3.js            ← Upload configuration
├── S3_SETUP.md                 ← Detailed setup guide
├── S3_QUICK_START.md           ← 5-minute setup
└── AWS_S3_README.md            ← This file
```

---

## Troubleshooting

### Problem: S3 not being used
**Solution:** Check logs
```bash
docker-compose logs backend | grep S3
```

Should show: `S3 configured - uploads will be stored in AWS S3`

If showing fallback message, check environment variables are set correctly.

### Problem: Access denied errors
**Solution:** Verify IAM permissions
1. Check user has `AmazonS3FullAccess` policy
2. Verify access key ID and secret key are correct
3. Check bucket name matches configuration

### Problem: Uploads are slow
**Solution:** This is normal for S3
- Initial setup takes a few seconds
- Internet speed affects upload time
- Choose region closest to you

---

## Next Steps

1. **Decide:** Local storage (develop) or S3 (production)?
2. **If local:** Just start using the app! ✅
3. **If S3:** Follow [S3_QUICK_START.md](./S3_QUICK_START.md)
4. **Test:** Upload a file and verify it works
5. **Monitor:** Check logs and AWS console periodically

---

## Support & Documentation

- 📖 [S3 Quick Start](./S3_QUICK_START.md) - 5-minute setup
- 📖 [S3 Complete Guide](./S3_SETUP.md) - Full documentation
- 🔍 [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- 💬 [AWS Support](https://console.aws.amazon.com/support/)

---

## Summary

| Feature | Local Storage | AWS S3 |
|---------|---|---|
| Setup time | 0 minutes | 5-10 minutes |
| Cost | Free | ~$0.25/month (small) |
| Production ready | No | Yes |
| Scalable | No | Yes |
| Backup | Manual | Automatic |
| HTTPS | No | Yes |
| Permissions | Simple | Advanced |

Choose what works best for you! 🚀

---

**Last Updated:** December 2024
**Version:** 1.0
**Author:** NoteHive Dev Team
