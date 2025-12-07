# NoteHive S3 Quick Setup (5 Minutes)

## For Development (Local Testing)

The app works fine without S3! File uploads are stored locally.

**No setup needed** - just start using it:
```bash
docker-compose up
# Visit http://localhost:3000
```

---

## For Production (AWS S3 Deployment)

### Quick 5-Step Setup

#### 1. Create AWS Account & Log In
- Go to https://aws.amazon.com
- Create account if needed
- Log into [AWS Console](https://console.aws.amazon.com)

#### 2. Create S3 Bucket (2 minutes)
```bash
# Go to S3 service → Create bucket
# Name: notehive-uploads-myapp
# Region: us-east-1 (closest to you)
# Click Create
```

#### 3. Create IAM User (2 minutes)
```bash
# Go to IAM service → Users → Create user
# Username: notehive-app
# Attach policy: AmazonS3FullAccess
# Create access key → Download CSV
```

Copy your credentials:
- Access Key ID: `AKIA...`
- Secret Access Key: `wJal...`

#### 4. Update `.env` File (30 seconds)
```bash
# backend/.env
AWS_ACCESS_KEY_ID=AKIA...your_key_here
AWS_SECRET_ACCESS_KEY=wJal...your_secret_here
AWS_BUCKET_NAME=notehive-uploads-myapp
AWS_REGION=us-east-1
```

#### 5. Restart App (30 seconds)
```bash
docker-compose down
docker-compose up -d
```

---

## Verify It's Working

1. Open http://localhost:3000
2. Create a note
3. Add attachment
4. Upload a file
5. Check AWS S3 Console → Your bucket → `uploads/` folder

You should see your file there! ✅

---

## Environment Variables

| Variable | Example | Get From |
|----------|---------|----------|
| `AWS_ACCESS_KEY_ID` | `AKIAIOSFODNN7EXAMPLE` | IAM User → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | `wJalrXUtnFEMI/K7MDENG...` | IAM User → Access key |
| `AWS_BUCKET_NAME` | `notehive-uploads-myapp` | S3 Console |
| `AWS_REGION` | `us-east-1` | S3 Console |

---

## Troubleshooting

**Q: "Access Denied" error**
- Check credentials are correct
- Verify IAM user has S3 permissions
- Check bucket name is spelled correctly

**Q: Uploads not in S3**
- Check logs: `docker-compose logs backend | grep S3`
- Verify credentials are set in `.env`
- Make sure you restarted Docker: `docker-compose down && docker-compose up -d`

**Q: Still using local storage?**
- Set all 4 AWS variables (no empty values)
- Restart: `docker-compose down && docker-compose up -d`
- Check logs: `docker-compose logs backend | grep "S3\|configured"`

---

## Full Setup Guide

For detailed instructions, security best practices, and advanced configuration, see:
📖 **[S3_SETUP.md](./S3_SETUP.md)**

---

## Important Security Notes ⚠️

- **NEVER** commit `.env` file to git
- **NEVER** share access keys publicly
- **Rotate keys** regularly
- Use **IAM roles** for production (EC2 instances)
- Enable **bucket encryption** and **versioning**

---

That's it! Your app now uploads files to AWS S3 instead of local storage. 🚀
