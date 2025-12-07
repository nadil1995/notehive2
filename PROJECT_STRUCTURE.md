# NoteHive - Project Structure

## 📁 Complete Directory Layout

```
notehive2-complete/
├── backend/                          # Node.js/Express Backend
│   ├── config/
│   │   ├── database.js              # MongoDB connection
│   │   ├── logger.js                # Winston logger with S3 upload
│   │   └── s3.js                    # AWS S3 multer configuration
│   ├── models/
│   │   ├── Note.js                  # Note schema
│   │   └── User.js                  # User schema
│   ├── routes/
│   │   ├── health.js                # Health check endpoint
│   │   └── notes.js                 # Notes CRUD operations
│   ├── server.js                    # Express app setup
│   ├── package.json                 # Backend dependencies
│   ├── .env                         # Environment variables (add to .gitignore)
│   ├── .env.example                 # Example environment file
│   └── Dockerfile                   # Docker image for backend
│
├── frontend/                         # React Frontend
│   ├── public/
│   │   └── index.html               # HTML entry point
│   ├── src/
│   │   ├── components/
│   │   │   ├── NotesList.js        # Notes list component
│   │   │   ├── NotesList.css       # Notes list styling
│   │   │   ├── NoteEditor.js       # Note editor component
│   │   │   └── NoteEditor.css      # Note editor styling
│   │   ├── services/
│   │   │   └── api.js              # API service (axios)
│   │   ├── App.js                  # Main App component
│   │   ├── App.css                 # App styling
│   │   ├── index.js                # React entry point
│   │   └── index.css               # Global styling
│   ├── package.json                # Frontend dependencies
│   └── Dockerfile                  # Docker image for frontend
│
├── docker-compose.yml               # Docker Compose orchestration
├── .dockerignore                    # Docker build ignore file
├── .gitignore                       # Git ignore file
├── README.md                        # Complete documentation
├── QUICK_START.md                   # Quick start guide
├── DEPLOYMENT.md                    # AWS EC2 deployment guide
└── PROJECT_STRUCTURE.md             # This file
```

## 🔄 Architecture Flow

```
┌─────────────────┐
│  React Frontend │ (Port 3000)
│   - NotesList   │
│  - NoteEditor   │
└────────┬────────┘
         │ HTTP/CORS
         ▼
┌─────────────────────────┐
│  Express Backend Server │ (Port 5001)
│  - /api/notes           │
│  - /api/health          │
└────────┬────────────────┘
         │
    ┌────┴────┬──────────┐
    │          │          │
    ▼          ▼          ▼
 MongoDB    AWS S3    Winston Logger
 (Local)   (Uploads) (Upload to S3)
```

## 📦 Dependencies

### Backend (Node.js 18)

```
express              - Web framework
mongoose            - MongoDB ODM
dotenv              - Environment variables
cors                - Cross-origin resource sharing
aws-sdk             - AWS SDK for S3
multer              - File upload middleware
multer-s3          - S3 storage for multer
express-validator   - Input validation
winston             - Logging library
uuid                - Unique ID generation
nodemon             - Auto-reload during development
```

### Frontend (React 18)

```
react              - UI framework
react-dom          - React DOM rendering
react-scripts      - Build tools
react-router-dom   - Client-side routing
axios              - HTTP client
```

## 🔌 API Endpoints

### Notes API
```
GET    /api/notes/:userId              # Get all notes for user
GET    /api/notes/:userId/:noteId      # Get specific note
POST   /api/notes                       # Create new note
PUT    /api/notes/:noteId              # Update note
DELETE /api/notes/:noteId              # Delete note
POST   /api/notes/:noteId/upload       # Upload file to note
```

### Health Check
```
GET    /api/health                      # Server health status
```

## 💾 Data Models

### Note Schema
```javascript
{
  _id: ObjectId,
  title: String,                  // Required
  content: String,                // Required
  userId: String,                 // Required
  category: String,               // Default: "General"
  attachments: [{                 // File attachments
    filename: String,
    url: String,                  // S3 URL
    uploadedAt: Date
  }],
  tags: [String],                 // Search/organize
  isPinned: Boolean,              // Default: false
  color: String,                  // Hex color
  createdAt: Date,                // Auto-generated
  updatedAt: Date                 // Auto-updated
}
```

### User Schema
```javascript
{
  _id: ObjectId,
  username: String,               // Unique, Required
  email: String,                  // Unique, Required
  password: String,               // Required
  displayName: String,            // Optional
  profileImage: String,           // URL
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Environment Variables

### Backend (.env)
```
PORT=5001
NODE_ENV=development|production

MONGODB_URI=mongodb://user:pass@host:27017/db?authSource=admin

AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET_NAME=notehive-uploads
AWS_REGION=us-east-1

CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

### Frontend (.env, optional)
```
REACT_APP_API_URL=http://localhost:5001/api
```

## 📋 Configuration Files

### docker-compose.yml
- **backend service**: Node.js Express app
- **frontend service**: React with serve
- **db service**: MongoDB 6.0
- **networks**: Bridge network for inter-container communication
- **volumes**: MongoDB data persistence

### Dockerfiles
- **backend/Dockerfile**: Multi-stage build with npm
- **frontend/Dockerfile**: Multi-stage build with serve

## 🔄 File Upload Flow

```
1. User selects file in NoteEditor
2. Frontend sends POST to /api/notes/:noteId/upload
3. multer-s3 middleware handles upload
4. File stored in S3 bucket (uploads/)
5. URL returned and saved to note attachments
6. Note updated in MongoDB
7. User sees attachment link
```

## 📊 Logging Architecture

```
1. Winston logger captures all app events
2. Logs stored in memory buffer
3. Every 60 seconds, batch flushed to S3
4. S3 logs organized by date (logs/)
5. Supports JSON parsing and querying
```

## 🚀 Deployment Paths

### Local Development
```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm start
```

### Docker Local
```bash
docker-compose up --build
```

### AWS EC2
```bash
1. SSH into EC2 instance
2. Install Docker & Docker Compose
3. Clone/transfer repository
4. Configure .env with credentials
5. docker-compose up -d --build
```

## 🔧 Technologies Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2.0 |
| Backend | Node.js/Express | 18/4.18.2 |
| Database | MongoDB | 6.0 |
| Cloud Storage | AWS S3 | Latest |
| Containerization | Docker | Latest |
| Orchestration | Docker Compose | 3.8 |
| ORM | Mongoose | 7.5.0 |
| HTTP Client | Axios | 1.5.0 |
| Logging | Winston | 3.10.0 |

## 📝 Code Quality

### Backend
- Clean separation of concerns (routes, models, config)
- Error handling on all endpoints
- CORS configured for frontend
- Request validation with express-validator
- Async/await patterns

### Frontend
- Functional components with React Hooks
- Axios service abstraction
- Component composition (NotesList, NoteEditor)
- CSS modules for styling
- Error state management

## 🔒 Security Features

- ✅ CORS enabled for controlled origin
- ✅ Environment variables for secrets
- ✅ Input validation on API endpoints
- ✅ MongoDB authentication
- ✅ AWS IAM credentials for S3
- ✅ File type validation on uploads
- ✅ File size limits (10MB)

## 🎯 Future Enhancements

- [ ] User authentication (JWT)
- [ ] Real-time collaboration (WebSockets)
- [ ] Search functionality
- [ ] Note sharing/permissions
- [ ] Rich text editor (TipTap/Slate)
- [ ] Mobile app (React Native)
- [ ] Dark mode support
- [ ] Offline support (Service Workers)
- [ ] End-to-end encryption
- [ ] Redis caching
- [ ] API rate limiting
- [ ] Automated testing (Jest/Cypress)

## 📞 Support Resources

- **Local Testing**: QUICK_START.md
- **Production Deployment**: DEPLOYMENT.md
- **Full Documentation**: README.md
- **AWS Setup**: AWS console guides
- **Docker Help**: Official Docker docs
- **MongoDB Help**: Official MongoDB docs

---

**Last Updated**: December 5, 2025
**Version**: 1.0.0
**Status**: Production Ready
