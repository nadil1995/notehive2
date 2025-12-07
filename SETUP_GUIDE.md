# NoteHive - Complete Setup Guide

## 🎯 Overview

This is a full-stack note-taking application with:
- **Frontend**: React with modern UI
- **Backend**: Node.js/Express API
- **Database**: MongoDB
- **Cloud Storage**: AWS S3 for files and logs
- **Containerization**: Docker & Docker Compose

Your application is located in: `/Users/nadilfernando/Documents/Devops/APP/notehive2-complete`

---

## ✅ Pre-requisites Check

Before starting, ensure you have:

- ✅ Docker installed: `docker --version`
- ✅ Docker Compose installed: `docker-compose --version`
- ✅ Node.js 18+ (for local development): `node --version`
- ✅ AWS credentials ready (provided)
- ✅ MongoDB server accessible (54.221.26.107:27017)
- ✅ Internet connection for AWS S3

---

## 📦 What's Included

### Backend (Node.js/Express)
- Express server with REST API
- MongoDB integration with Mongoose
- AWS S3 file uploads with multer
- Winston logger with S3 integration
- Health check endpoint
- CORS configuration
- Environment variable management

### Frontend (React)
- Modern React 18 application
- Note listing and creation
- Rich note editor with attachments
- Tag and category management
- Color-coded notes
- API integration with axios
- Responsive design

### Infra
- Docker files for both backend and frontend
- Docker Compose for orchestration
- Environment configuration
- Production-ready setup

---

## 🚀 Getting Started - 3 Options

### Option 1: Docker (Recommended - Fastest)

**Fastest way to get running:** ~2 minutes

```bash
# Navigate to project
cd /Users/nadilfernando/Documents/Devops/APP/notehive2-complete

# Start everything
docker-compose up --build

# Wait for services to start (you'll see "Server running on port 5001")
# Then open: http://localhost:3000
```

**What happens:**
- Backend container starts on port 5001
- Frontend container starts on port 3000
- MongoDB container starts on port 27017
- All containers connect on internal network

---

### Option 2: Local Development (Backend Only)

**For backend development:** ~2 minutes setup

```bash
cd /Users/nadilfernando/Documents/Devops/APP/notehive2-complete/backend

# Install dependencies
npm install

# You already have credentials, the .env file is ready
# Just verify it has all values
cat .env

# Start backend
npm run dev
# Server runs on http://localhost:5001

# In another terminal, start frontend
cd ../frontend
npm install
npm start
# Frontend runs on http://localhost:3000
```

---

### Option 3: Hybrid (Backend Local + Frontend Docker)

**Useful for debugging:**

```bash
# Terminal 1 - Backend
cd /Users/nadilfernando/Documents/Devops/APP/notehive2-complete/backend
npm install
npm run dev

# Terminal 2 - Frontend & MongoDB
cd /Users/nadilfernando/Documents/Devops/APP/notehive2-complete
docker-compose up frontend db
```

---

## 🔌 Accessing Your Application

Once running, access:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web app interface |
| Backend API | http://localhost:5001/api | API endpoints |
| Health Check | http://localhost:5001/api/health | API status |
| MongoDB | localhost:27017 | Database |

---

## 🧪 Testing the Application

### 1. Create a Note

```bash
curl -X POST http://localhost:5001/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Note",
    "content": "This is a test",
    "userId": "user123"
  }'
```

Expected response: Note object with `_id`

### 2. Get All Notes

```bash
curl http://localhost:5001/api/notes/user123
```

Expected response: Array of notes

### 3. Check Server Health

```bash
curl http://localhost:5001/api/health
```

Expected response: `{"status":"OK",...}`

### 4. Upload File to Note

```bash
# First create a note and get its ID
curl -X POST http://localhost:5001/api/notes/:noteId/upload \
  -F "file=@/path/to/file.txt"
```

Expected: Note with attachment URL pointing to S3

---

## 📁 Your Credentials (Already Configured)

The credentials you provided are already in:
- **File**: `backend/.env`

```
MONGODB_URI=mongodb://admin:admin123@54.221.26.107:27017/notesafe?authSource=admin

AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_BUCKET_NAME=notehive-uploads
AWS_REGION=us-east-1
```

✅ **No further configuration needed!**

---

## 🔧 Common Commands

### Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View running services
docker-compose ps

# View logs
docker-compose logs -f

# Logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Remove everything (fresh start)
docker-compose down -v

# Restart a service
docker-compose restart backend
```

### Backend Commands

```bash
# Install dependencies
npm install

# Start in development (watch mode)
npm run dev

# Start in production
npm start
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Test
npm test
```

### MongoDB Access

```bash
# Access MongoDB shell (when running in Docker)
docker exec -it notehive-mongodb mongosh -u admin -p admin123

# Example commands inside mongosh:
db.notes.find()           # View all notes
db.notes.countDocuments() # Count notes
db.notes.deleteMany({})   # Delete all notes
```

---

## 🚨 Troubleshooting

### Problem: "Cannot connect to MongoDB"
**Solution:**
```bash
# Check if MongoDB container is running
docker-compose ps

# Check MongoDB logs
docker-compose logs db

# Verify credentials in backend/.env
cat backend/.env | grep MONGODB_URI
```

### Problem: "Port 3000/5001 already in use"
**Solution:**
```bash
# Find process using port
lsof -i :3000
lsof -i :5001

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Problem: "Cannot connect to S3"
**Solution:**
- Verify AWS credentials are correct
- Check bucket name: `notehive-uploads`
- Check bucket exists in AWS console
- Verify IAM user has S3 permissions

### Problem: "Frontend shows 'Disconnected' status"
**Solution:**
```bash
# Check if backend is running
curl http://localhost:5001/api/health

# Check backend logs
docker-compose logs backend

# Verify CORS_ORIGIN in backend/.env
cat backend/.env | grep CORS_ORIGIN
```

### Problem: "Files not uploading to S3"
**Solution:**
```bash
# Check AWS credentials
cat backend/.env | grep AWS

# Check bucket permissions in AWS IAM
# Test S3 access manually
aws s3 ls notehive-uploads --profile default

# Check backend logs for S3 errors
docker-compose logs backend | grep -i s3
```

---

## 📊 Monitoring & Logging

### View Application Logs

```bash
# All logs
docker-compose logs

# Follow backend logs in real-time
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Check Container Resources

```bash
# Real-time container stats
docker stats

# Memory and CPU usage
docker-compose stats
```

### View Logs in AWS S3

Logs are automatically uploaded to S3 bucket `notehive-uploads`:
1. Go to AWS S3 Console
2. Open `notehive-uploads` bucket
3. Check `logs/` folder
4. Files named: `app-logs-YYYY-MM-DD-UUID.log`

---

## 📱 Using the Application

### Creating a Note

1. Open http://localhost:3000
2. Click "+ New Note" button
3. Enter title and content
4. Optional: Add category, color, tags
5. Click "Save"

### Uploading Files

1. Select/open a note
2. Scroll to "Attachments" section
3. Click "📎 Add attachment"
4. Select file (max 10MB)
5. Attachment automatically uploads to AWS S3

### Organizing Notes

- **Categories**: Organize by type (Work, Personal, etc.)
- **Tags**: Add searchable tags (comma-separated)
- **Colors**: Visual organization with color coding
- **Pin**: Mark important notes with pin icon

---

## 🌐 Deploying to AWS EC2

When ready to deploy to your EC2 instance (http://3.214.216.50):

```bash
# 1. Connect to EC2
ssh -i your-key.pem ec2-user@3.214.216.50

# 2. Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clone or upload the application
git clone <your-repo> notehive-app
cd notehive-app

# 4. Start application
docker-compose up -d --build

# 5. Access at: http://3.214.216.50:3000
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete EC2 setup instructions.

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [README.md](README.md) | Complete documentation and features |
| [QUICK_START.md](QUICK_START.md) | Quick start guide |
| [DEPLOYMENT.md](DEPLOYMENT.md) | AWS EC2 deployment instructions |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Detailed project structure |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | This file - Setup instructions |

---

## 🎯 Quick Reference - File Locations

```
/Users/nadilfernando/Documents/Devops/APP/notehive2-complete/

Backend Configuration:
├── backend/.env              (Your credentials)
├── backend/server.js         (Main app)
├── backend/package.json      (Dependencies)
└── backend/Dockerfile        (Container config)

Frontend:
├── frontend/src/App.js       (Main component)
├── frontend/src/components/  (UI components)
├── frontend/package.json     (Dependencies)
└── frontend/Dockerfile       (Container config)

Docker:
├── docker-compose.yml        (Orchestration)
└── .dockerignore             (Build ignore)

Documentation:
├── README.md                 (Main docs)
├── QUICK_START.md            (Quick guide)
├── DEPLOYMENT.md             (EC2 deploy)
└── PROJECT_STRUCTURE.md      (Architecture)
```

---

## ✨ Features Overview

### Notes
- ✅ Create, read, update, delete notes
- ✅ Rich text content
- ✅ Automatic timestamps

### Organization
- ✅ Categories (Work, Personal, etc.)
- ✅ Tags for filtering
- ✅ Color coding
- ✅ Pin important notes

### Files
- ✅ Upload attachments to notes
- ✅ Automatically stored in AWS S3
- ✅ File preview/download
- ✅ Size limit: 10MB

### Cloud Features
- ✅ Application logs saved to S3
- ✅ Automatic daily rotation
- ✅ JSON format for easy querying
- ✅ 60-second flush interval

---

## 🔐 Security Checklist

- ✅ Environment variables for secrets
- ✅ CORS configured
- ✅ MongoDB authentication required
- ✅ AWS credentials in separate file
- ✅ File type validation
- ✅ File size limits
- ✅ Input validation on API

---

## 🎓 Learning Resources

### Backend Development
- Express docs: https://expressjs.com/
- Mongoose docs: https://mongoosejs.com/
- AWS SDK: https://docs.aws.amazon.com/sdk-for-javascript/

### Frontend Development
- React docs: https://react.dev/
- React Router: https://reactrouter.com/
- Axios: https://axios-http.com/

### DevOps
- Docker: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- AWS EC2: https://docs.aws.amazon.com/ec2/

---

## 💡 Next Steps

1. **Get it running**: Follow Option 1 (Docker) above
2. **Test it**: Create some notes, upload files
3. **Explore code**: Review the components and API
4. **Customize**: Modify colors, features, components
5. **Deploy**: Follow DEPLOYMENT.md for EC2

---

## 📞 Quick Answers

**Q: How do I start fresh?**
```bash
docker-compose down -v  # Removes all containers and volumes
docker-compose up --build
```

**Q: How do I see logs?**
```bash
docker-compose logs -f backend
```

**Q: How do I stop the app?**
```bash
docker-compose down
```

**Q: How do I update code?**
```bash
# Edit files, then:
docker-compose up --build
```

**Q: Where are files stored?**
```
AWS S3 bucket: notehive-uploads
├── uploads/    (User uploaded files)
└── logs/       (Application logs)
```

---

## 🚀 You're Ready!

Everything is configured and ready to run. Start with:

```bash
cd /Users/nadilfernando/Documents/Devops/APP/notehive2-complete
docker-compose up --build
```

Then open http://localhost:3000 and start taking notes!

**Happy coding! 🎉**

---

**Created**: December 5, 2025
**Version**: 1.0.0
**Last Updated**: December 5, 2025
