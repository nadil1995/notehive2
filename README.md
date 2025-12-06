# NoteHive - Full Stack Note-Taking Application

A complete full-stack application built with React frontend, Node.js/Express backend, MongoDB database, and AWS S3 integration.

## Features

- 📝 Create, edit, and delete notes
- 🎨 Customize note colors and categories
- 📎 Attach files to notes (saved to AWS S3)
- 🏷️ Organize notes with tags
- 📌 Pin important notes
- 📊 Application logs saved to AWS S3
- 🐳 Docker containerized deployment
- ☁️ AWS EC2 ready deployment

## Architecture

```
NoteHive
├── Frontend (React)
│   ├── Components (NotesList, NoteEditor)
│   ├── Services (API integration)
│   └── Styling (CSS)
├── Backend (Node.js/Express)
│   ├── Routes (API endpoints)
│   ├── Models (MongoDB schemas)
│   ├── Config (Database, Logger, S3)
│   └── Middleware
└── Database (MongoDB)
    └── Collections (Users, Notes)
```

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- AWS Account with S3 access
- MongoDB server (or use the containerized version)

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://admin:admin123@54.221.26.107:27017/notesafe?authSource=admin

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=notehive-uploads
AWS_REGION=us-east-1

CORS_ORIGIN=http://localhost:3000
```

## Running Locally with Docker

### Build and start all services:

```bash
cd /tmp/notehive-app
docker-compose up --build
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

### Stop services:

```bash
docker-compose down
```

### View logs:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Local Development

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend will run on http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend will run on http://localhost:3000

## API Endpoints

### Notes
- `GET /api/notes/:userId` - Get all notes for a user
- `GET /api/notes/:userId/:noteId` - Get a specific note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:noteId` - Update a note
- `DELETE /api/notes/:noteId` - Delete a note
- `POST /api/notes/:noteId/upload` - Upload file to note

### Health Check
- `GET /api/health` - Server health status

## Database Schema

### Note Collection
```json
{
  "_id": "ObjectId",
  "title": "string",
  "content": "string",
  "userId": "string",
  "category": "string",
  "attachments": [
    {
      "filename": "string",
      "url": "string",
      "uploadedAt": "Date"
    }
  ],
  "tags": ["string"],
  "isPinned": "boolean",
  "color": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Deployment to AWS EC2

### Prerequisites
- AWS EC2 instance running Ubuntu 20.04+
- Docker and Docker Compose installed
- Security group configured for ports 3000, 5000, 27017

### Steps

1. **Connect to your EC2 instance:**
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

2. **Clone or transfer the application:**
```bash
git clone <your-repo> notehive-app
cd notehive-app
```

3. **Create environment file:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your actual credentials
```

4. **Build and start with Docker Compose:**
```bash
docker-compose up -d --build
```

5. **Access the application:**
- Frontend: http://your-ec2-ip:3000
- API: http://your-ec2-ip:5000/api

### Production Configuration

Update `docker-compose.yml` for production:
- Set `NODE_ENV=production`
- Update `CORS_ORIGIN` to your domain
- Use environment variables from AWS Systems Manager Parameter Store
- Enable HTTPS with a reverse proxy (nginx/traefik)

## AWS S3 Integration

### File Uploads
- Files are automatically uploaded to S3 when attached to notes
- Stored in `uploads/` folder with unique timestamps
- Max file size: 10MB
- Allowed types: JPG, PNG, PDF, TXT, DOC

### Application Logs
- Logs are automatically collected and uploaded to S3
- Stored in `logs/` folder with daily rotation
- Logs are flushed every 60 seconds
- Format: JSON with timestamp, level, and metadata

## Monitoring

### Check container status:
```bash
docker ps
```

### View container logs:
```bash
docker logs notehive-backend -f
docker logs notehive-frontend -f
```

### Access MongoDB:
```bash
docker exec -it notehive-mongodb mongosh -u admin -p admin123
```

## Troubleshooting

### API Connection Error
- Ensure backend container is running: `docker ps`
- Check backend logs: `docker logs notehive-backend`
- Verify CORS_ORIGIN in backend .env

### MongoDB Connection Error
- Check MongoDB credentials in MONGODB_URI
- Verify MongoDB service is accessible
- Check network connectivity

### S3 Upload Failures
- Verify AWS credentials are correct
- Ensure IAM user has S3 permissions
- Check bucket name and region

### File Permissions
- Run with appropriate user: `docker-compose up --user <uid>`
- Check volume permissions

## Performance Tips

- Use CloudFront for S3 files
- Enable MongoDB indexing on frequently queried fields
- Use Redis for session caching
- Implement API rate limiting
- Compress logs before archiving

## Security Considerations

- Never commit `.env` files with real credentials
- Use AWS IAM roles instead of access keys (in production)
- Enable encryption at rest for S3
- Use VPC for EC2 instance
- Implement authentication/JWT tokens
- Enable HTTPS/SSL
- Regular security audits

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please check the application logs or contact the development team.
