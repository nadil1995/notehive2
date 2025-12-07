# Quick Start Guide - NoteHive

## 🚀 Start in 3 Minutes

### Prerequisites
- Docker and Docker Compose installed
- Your AWS credentials ready

### Option 1: Run with Docker (Recommended)

```bash
# Navigate to project directory
cd /tmp/notehive-app

# Build and start all services
docker-compose up --build

# Wait for services to start (30-60 seconds)
# Then open browser to: http://localhost:3000
```

**That's it!** Your application is running.

### Option 2: Run Locally (Development)

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file with your AWS credentials
cat > .env << EOF
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://admin:admin123@54.221.26.107:27017/notesafe?authSource=admin
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_BUCKET_NAME=notehive-uploads
AWS_REGION=us-east-1
CORS_ORIGIN=http://localhost:3000
EOF

# Start backend
npm run dev
# Backend runs on http://localhost:5001
```

#### Frontend (in new terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start frontend
npm start
# Frontend opens at http://localhost:3000
```

## 📋 What You Get

### Features
✅ Create and edit notes
✅ Attach files (uploaded to AWS S3)
✅ Organize with tags and categories
✅ Color-coded notes
✅ Pin important notes
✅ Automatic logging to AWS S3
✅ MongoDB persistence

### Services
- **Frontend**: React application on port 3000
- **Backend**: Express API on port 5001
- **Database**: MongoDB on port 27017 (containerized)

## 🔧 Common Commands

### Docker Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Access MongoDB shell
docker exec -it notehive-mongodb mongosh -u admin -p admin123
```

### Development Commands

```bash
# Backend - Run in watch mode
cd backend && npm run dev

# Frontend - Run development server
cd frontend && npm start

# Build frontend for production
cd frontend && npm run build
```

## 🌐 Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001/api |
| Health Check | http://localhost:5001/api/health |
| MongoDB | localhost:27017 |

## 📝 API Examples

### Create a Note
```bash
curl -X POST http://localhost:5001/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Note",
    "content": "This is my content",
    "userId": "user123",
    "category": "Personal",
    "tags": ["important"]
  }'
```

### Get All Notes
```bash
curl http://localhost:5001/api/notes/user123
```

### Upload File to Note
```bash
curl -X POST http://localhost:5001/api/notes/{noteId}/upload \
  -F "file=@/path/to/file"
```

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Kill process using port
lsof -i :3000
kill -9 <PID>
```

### Can't Connect to MongoDB
- Check MongoDB is running: `docker-compose ps`
- Verify credentials in `.env`
- Check network: `docker-compose logs db`

### Can't Connect to S3
- Verify AWS credentials are correct
- Check AWS_BUCKET_NAME exists
- Check IAM user has S3 permissions

### Frontend Shows "Disconnected"
- Backend service might not be running
- Check backend logs: `docker-compose logs backend`
- Verify CORS_ORIGIN in backend `.env`

## 📱 Testing the App

1. Open http://localhost:3000
2. Click "+ New Note"
3. Add title and content
4. Click "Save"
5. Try adding tags, changing color, uploading a file
6. Pin/unpin notes
7. Delete notes

## 🔐 Security Notes

⚠️ **Important for Production:**
- Never commit `.env` files with real credentials
- Use AWS IAM roles instead of access keys
- Enable HTTPS with proper SSL certificates
- Implement authentication/authorization
- Set up proper firewall rules

## 📚 Learn More

- **Full Documentation**: See [README.md](README.md)
- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Architecture**: Review code structure in `backend/` and `frontend/` directories

## 🎯 Next Steps

1. **Customize**: Modify components in `frontend/src/components/`
2. **Extend**: Add more API routes in `backend/routes/`
3. **Deploy**: Follow [DEPLOYMENT.md](DEPLOYMENT.md) for EC2 deployment
4. **Monitor**: Check logs in AWS S3 bucket

## 💡 Tips

- Backend auto-restarts on file changes (with nodemon)
- Frontend has hot-reload during development
- MongoDB data persists in Docker volume
- Logs are automatically uploaded to S3

## 🆘 Need Help?

Check these files:
- `README.md` - Complete documentation
- `DEPLOYMENT.md` - Production deployment guide
- `backend/.env.example` - Environment variables reference
- Docker logs - `docker-compose logs`

---

**Happy note-taking! 📝**
