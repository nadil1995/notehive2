# AWS S3 Setup Guide for NoteHive

This guide will help you set up AWS S3 bucket for file uploads in NoteHive instead of using local storage.

## Prerequisites

- AWS Account (create one at https://aws.amazon.com)
- AWS CLI configured (optional but recommended)
- NoteHive application running

## Step 1: Create an S3 Bucket

### Via AWS Console:

1. Log in to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **S3** service
3. Click **Create bucket**
4. **Bucket name**: `notehive-uploads-<your-unique-id>` (must be globally unique)
5. **Region**: Choose closest to you (e.g., `us-east-1`)
6. **Block Public Access settings**:
   - Uncheck "Block all public access" if you want public file access
   - Or keep checked for private access
7. Click **Create bucket**

### Via AWS CLI:

```bash
aws s3 mb s3://notehive-uploads-<your-unique-id> --region us-east-1
```

## Step 2: Create IAM User for File Uploads

### Via AWS Console:

1. Navigate to **IAM** service
2. Click **Users** → **Create user**
3. **Username**: `notehive-app`
4. Click **Next: Permissions**
5. Click **Attach policies directly**
6. Search for and select: `AmazonS3FullAccess` (or create custom policy below)
7. Click **Create user**

### Custom Policy (More Secure):

If you prefer to limit permissions to only your bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::notehive-uploads-<your-bucket-name>",
        "arn:aws:s3:::notehive-uploads-<your-bucket-name>/*"
      ]
    }
  ]
}
```

## Step 3: Generate Access Keys

1. In IAM, click on your newly created user `notehive-app`
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Choose **Application running outside AWS**
5. Click **Next**
6. Download or copy:
   - **Access Key ID** (starts with AKIA...)
   - **Secret Access Key**

**⚠️ IMPORTANT**: Store these securely. The secret key won't be shown again!

## Step 4: Configure NoteHive

### Update Environment Variables

Create or update the `.env` file in the `backend/` directory:

```bash
# Backend Configuration
PORT=5001
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb://admin:admin123@notehive-mongodb:27017/notesafe?authSource=admin

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_BUCKET_NAME=notehive-uploads-<your-bucket-name>
AWS_REGION=us-east-1

# Application Configuration
CORS_ORIGIN=http://localhost:3000
```

### For Docker Deployment

Set environment variables when running containers:

```bash
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
docker-compose up -d
```

Or add to `.env` file in the project root:

```bash
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

## Step 5: Restart Application

```bash
# Rebuild with new configuration
docker-compose down
docker-compose up -d --build
```

Verify S3 is configured:

```bash
docker-compose logs backend | grep -i "S3\|credentials"
```

## Step 6: Test File Upload

1. Open NoteHive at http://localhost:3000
2. Create a new note
3. Click "Add attachment"
4. Upload a file
5. The file should now upload to S3 instead of local storage

## Verify S3 Upload

Check your S3 bucket in AWS Console:

1. Go to S3 service
2. Click your bucket name
3. You should see an `uploads/` folder with your files

Or via CLI:

```bash
aws s3 ls s3://notehive-uploads-<your-bucket-name>/uploads/
```

## Make Bucket Files Public (Optional)

If you want files to be publicly accessible:

### Via Console:

1. Go to your bucket → **Permissions**
2. Add this Bucket Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::notehive-uploads-<your-bucket-name>/*"
    }
  ]
}
```

### Via CLI:

```bash
aws s3api put-bucket-policy --bucket notehive-uploads-<your-bucket-name> --policy file://policy.json
```

## Troubleshooting

### "Access Denied" Error

- Verify Access Key ID and Secret Access Key are correct
- Check IAM user has S3 permissions
- Ensure bucket name is correct

### Files Not Appearing in S3

- Check backend logs: `docker-compose logs backend`
- Verify AWS credentials are set in environment
- Check bucket name matches configuration

### Slow File Uploads

- Files are being uploaded to S3 (not local)
- Internet speed affects upload time
- Check AWS region is close to your location

### CORS Issues

If accessing files from frontend, configure CORS:

```bash
aws s3api put-bucket-cors --bucket notehive-uploads-<your-bucket-name> --cors-configuration file://cors.json
```

Where `cors.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

## Security Best Practices

1. **Use IAM Roles** instead of access keys when running on EC2
2. **Enable Versioning** on bucket: `aws s3api put-bucket-versioning --bucket notehive-uploads-<your-bucket-name> --versioning-configuration Status=Enabled`
3. **Enable Encryption** on bucket (Server-side encryption with S3)
4. **Use Specific Policies** - Don't use `AmazonS3FullAccess` in production
5. **Rotate Access Keys** regularly
6. **Use Bucket Policies** to restrict access to specific IPs/resources

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_BUCKET_NAME` | S3 bucket name | `notehive-uploads-prod` |
| `AWS_REGION` | AWS region | `us-east-1`, `us-west-2`, `eu-west-1` |

## Supported AWS Regions

- `us-east-1` - N. Virginia
- `us-west-2` - Oregon
- `eu-west-1` - Ireland
- `eu-central-1` - Frankfurt
- `ap-southeast-1` - Singapore
- `ap-northeast-1` - Tokyo

[View all regions](https://docs.aws.amazon.com/general/latest/gr/s3.html)

## Cost Estimation

- **Storage**: $0.023 per GB/month (first 50TB)
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Data transfer out**: $0.09 per GB

[AWS S3 Pricing Calculator](https://calculator.aws.amazon.com/)

## Removing Local Storage Fallback

If you want to ONLY use S3 (and fail if credentials aren't set):

Edit `backend/config/s3.js` and change:

```javascript
// Only use S3, no fallback
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS credentials are required for file uploads');
}
```

Then restart the application.

## Learn More

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Multer S3 Documentation](https://github.com/badrap/multer-s3)

---

Need help? Check the logs: `docker-compose logs backend | grep -i upload`
