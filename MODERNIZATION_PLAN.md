# NoteHive Modernization Plan
## Building a Modern, Mobile-Friendly MVP with Authentication, Roles, and Storage Management

**Date**: December 7, 2025
**Current Version**: 1.0 (Basic Notes App)
**Target Version**: 2.0 (Enterprise-Ready Multimedia Knowledge Manager)
**Estimated Timeline**: 2-4 weeks (based on implementation pace)

---

## 📋 Executive Summary

Transform NoteHive from a simple notes app into a professional SaaS platform featuring:

- ✅ Secure user authentication with JWT
- ✅ User roles (Standard User, Admin)
- ✅ Tiered storage plans (Free 5GB, Pro 50GB+, Enterprise Custom)
- ✅ Admin dashboard with analytics
- ✅ Timeline-based repository system
- ✅ Rich multimedia support (PDF, images, audio, video)
- ✅ Mobile-friendly UI with horizontal timeline
- ✅ S3 file storage with signed URLs
- ✅ Rate limiting and security hardening

---

## 🏗️ Phase 1: Database & Model Upgrades

### Current State
```
✓ User model (basic)
✓ Note model (currently storing notes with userId strings)
✓ S3 file upload configured
✗ No repository system
✗ No timeline nodes
✗ No plan management
✗ No admin features
```

### New Models to Create

#### 1. Updated User Model
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique, lowercase),
  passwordHash: String (bcrypt),
  displayName: String,
  profileImage: String,
  role: String ('user' | 'admin'), // NEW
  plan: String ('free' | 'pro' | 'enterprise'), // NEW
  storageUsed: Number (bytes), // NEW
  storageLimit: Number (5GB, 50GB, custom), // NEW
  isActive: Boolean, // NEW
  emailVerified: Boolean, // NEW
  refreshTokens: [String], // NEW - for JWT refresh
  lastLogin: Date, // NEW
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Repository Model (NEW)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String,
  description: String,
  isArchived: Boolean,
  color: String, // For UI color coding
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Timeline Node Model (NEW)
```javascript
{
  _id: ObjectId,
  repositoryId: ObjectId (ref: Repository),
  title: String,
  date: Date (required),
  content: String, // Rich text notes
  tags: [String],
  attachments: [
    {
      filename: String,
      fileType: String, // pdf, word, excel, image, audio, video
      fileSize: Number,
      fileUrl: String, // S3 signed URL
      uploadedAt: Date
    }
  ],
  color: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. Attachment Model (NEW)
```javascript
{
  _id: ObjectId,
  nodeId: ObjectId (ref: TimelineNode),
  fileName: String,
  fileType: String,
  fileSize: Number,
  s3Key: String,
  fileUrl: String,
  uploadedBy: ObjectId (ref: User),
  uploadedAt: Date
}
```

#### 5. Plan Model (NEW)
```javascript
{
  _id: ObjectId,
  name: String ('free', 'pro', 'enterprise'),
  storageLimit: Number,
  maxFileSize: Number,
  features: [String],
  monthlyPrice: Number,
  createdAt: Date
}
```

#### 6. Admin Audit Log Model (NEW)
```javascript
{
  _id: ObjectId,
  adminId: ObjectId (ref: User),
  action: String,
  targetUser: ObjectId (ref: User),
  details: Object,
  timestamp: Date
}
```

---

## 🔐 Phase 2: Authentication & Security

### JWT Implementation

#### Features
- Access tokens (15-minute expiry)
- Refresh tokens (7-day expiry)
- Password hashing with bcrypt
- Rate limiting (5 failed logins = 15 min lockout)
- CORS for localhost:3000
- Secure HTTP-only cookies (optional)

#### New Auth Routes

```
POST   /api/auth/register           - User signup
POST   /api/auth/login              - User login
POST   /api/auth/refresh            - Refresh access token
POST   /api/auth/logout             - Logout (invalidate tokens)
POST   /api/auth/verify-email       - Email verification (optional MVP)
POST   /api/auth/forgot-password    - Password reset request (optional MVP)
GET    /api/auth/me                 - Get current user profile
PUT    /api/auth/profile            - Update profile
```

#### Auth Middleware
```
verifyToken() - Check JWT in Authorization header
verifyRole(role) - Check user role (user or admin)
rateLimiter() - Rate limit by IP/email
```

---

## 👥 Phase 3: User Roles & Permissions

### Standard User Permissions
```
✓ Create/edit/delete own repositories
✓ Create/edit/delete own timeline nodes
✓ Upload files (up to plan limit)
✓ View own storage usage
✓ Manage own profile
✗ Access admin dashboard
✗ Manage other users
✗ Change plans (must request)
```

### Admin Permissions
```
✓ All standard user permissions
✓ Access admin dashboard
✓ View all users and stats
✓ Search users
✓ Upgrade/downgrade user plans
✓ Suspend/delete accounts
✓ View audit logs
✓ Monitor storage usage
✓ View system health
```

---

## 💾 Phase 4: Storage & Plan System

### Plan Tiers

| Plan | Storage | Max File | Features | Price |
|------|---------|----------|----------|-------|
| Free | 5 GB | 100 MB | Basic repos, timeline | $0 |
| Pro | 50 GB | 500 MB | ↑ + Larger uploads | $9.99/mo |
| Enterprise | Custom | Custom | ↑ + Team features | Contact |

### Storage Management

#### New Routes
```
GET    /api/storage/usage           - Get user's storage stats
GET    /api/storage/breakdown       - Storage breakdown by repo
```

#### Storage Checks
```
- Block uploads if > plan limit
- Show warning at 90% usage
- Real-time usage calculation
- Soft limit enforcement (Pro/Enterprise can exceed temporarily)
```

#### Admin Storage Controls
```
GET    /api/admin/storage/overview  - Platform storage stats
PUT    /api/admin/users/:id/plan    - Change user plan
GET    /api/admin/storage/top-users - Top storage users
```

---

## 📊 Phase 5: Admin Dashboard

### Admin Metrics & Insights

#### Dashboard Overview
```
- Total users (free vs paid)
- Total storage used (GB)
- Monthly revenue (if paid)
- Active users (last 30 days)
- New signups (this month)
- Most active users (by node creation)
- Top repositories
```

#### Admin Controls
```
User Management:
  - Search users
  - View user details
  - View user repositories
  - Change user plan
  - Suspend user
  - Delete user account

Storage Management:
  - View per-user storage
  - Reclaim deleted space

System:
  - View audit logs
  - API health check
  - Database status
```

#### Admin Routes
```
GET    /api/admin/dashboard         - Dashboard metrics
GET    /api/admin/users             - List all users (paginated)
GET    /api/admin/users/:id         - User details
PUT    /api/admin/users/:id/plan    - Change plan
PUT    /api/admin/users/:id/suspend - Suspend user
DELETE /api/admin/users/:id         - Delete user
GET    /api/admin/audit-logs        - Audit logs
GET    /api/admin/storage/overview  - Storage stats
```

---

## 🎨 Phase 6: UI/UX Modernization

### Mobile-First Design

#### Key Features
- ✅ Horizontal scrollable timeline
- ✅ Touch-friendly tap targets (44px minimum)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Color-coded nodes
- ✅ Tag filtering
- ✅ Quick preview modal
- ✅ Attachment counter badges
- ✅ Storage usage bar

#### Component Structure

```
App
├── Layout
│   ├── Header (logo, user menu, auth)
│   ├── Sidebar (optional, collapsible on mobile)
│   └── Main Content
│       ├── Dashboard/Home
│       ├── Repository View
│       │   ├── Timeline (horizontal)
│       │   │   └── Nodes (clickable)
│       │   └── Node Details Modal
│       ├── Admin Dashboard (if admin)
│       └── Settings
└── Auth Pages
    ├── Login
    ├── Register
    └── Reset Password
```

#### File Preview Components
```
PDFViewer      - react-pdf
ImageViewer    - Built-in or Lightbox
AudioPlayer    - HTML5 <audio>
VideoPlayer    - react-player or HTML5 <video>
DocumentViewer - Fallback to download
```

---

## 📁 Phase 7: Repository & Timeline System

### Repository Structure

```
Each Repository contains:
├── Metadata (name, description, color)
├── Timeline (horizontal scrollable list)
│   ├── Node 1 (2025-01-15)
│   ├── Node 2 (2025-02-10)
│   ├── Node 3 (2025-03-05)
│   └── ... sorted by date
└── Settings (archive, delete)
```

### Node Features

#### Create Node
```
POST /api/nodes
{
  repositoryId: string,
  title: string,
  date: date (required),
  content: string (rich text),
  tags: [string],
  attachments: [files]
}
```

#### Edit Node
```
PUT /api/nodes/:id
{
  // same as create
}
```

#### Node Operations
```
GET    /api/nodes/:id               - Get node details
PUT    /api/nodes/:id               - Update node
DELETE /api/nodes/:id               - Delete node
GET    /api/nodes/:id/attachments   - Get attachments
POST   /api/nodes/:id/attachments   - Upload files
DELETE /api/nodes/:id/attachments/:attachId - Delete attachment
GET    /api/nodes/:id/preview/:attachId - Download/view file
```

---

## 🔒 Phase 8: File Security & Preview

### Signed URL Implementation

```javascript
// When storing file metadata:
s3Key: "uploads/user123/repo456/node789/file.pdf"

// When serving files:
- Generate signed URL (expires in 1 hour)
- Return URL to frontend
- User downloads/views via signed URL
- URLs not publicly accessible
```

### File Type Handling

```
PDF      → PDF.js viewer
Images   → Image lightbox + preview
Audio    → HTML5 player + metadata
Video    → react-player
Office   → Download only (MVP)
Code     → Code highlighter (optional)
```

---

## 🔧 Phase 9: Backend Implementation Order

### Week 1
- [ ] Update User model with new fields
- [ ] Create Repository model
- [ ] Create TimelineNode model
- [ ] Create Plan model
- [ ] Update authentication routes (register, login, refresh)
- [ ] Add JWT verification middleware
- [ ] Test auth flow

### Week 2
- [ ] Create repository routes (CRUD)
- [ ] Create node routes (CRUD)
- [ ] Implement file upload with S3 signed URLs
- [ ] Add storage tracking
- [ ] Add role-based access control

### Week 3
- [ ] Create admin routes
- [ ] Build admin dashboard API
- [ ] Add audit logging
- [ ] Implement rate limiting
- [ ] Add password hashing

### Week 4
- [ ] Security hardening
- [ ] Error handling
- [ ] Documentation
- [ ] Deployment preparation

---

## 🎨 Phase 10: Frontend Implementation Order

### Week 1
- [ ] Update layout structure
- [ ] Build login/register pages
- [ ] Implement auth context
- [ ] Add token management
- [ ] Style basic pages

### Week 2
- [ ] Build repository list view
- [ ] Create horizontal timeline component
- [ ] Build node modal/drawer
- [ ] Implement node creation form
- [ ] Add rich text editor

### Week 3
- [ ] Build file upload UI
- [ ] Implement file preview components
- [ ] Add storage meter
- [ ] Build settings page
- [ ] Mobile responsiveness

### Week 4
- [ ] Build admin dashboard (if admin)
- [ ] Add filtering/search
- [ ] Polish UI
- [ ] Mobile testing
- [ ] Performance optimization

---

## 📚 New Dependencies to Add

### Backend
```json
{
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "express-rate-limit": "^6.7.0",
  "cors": "^2.8.5",
  "@aws-sdk/client-s3": "^3.0.0",
  "dotenv": "^16.3.1"
}
```

### Frontend
```json
{
  "axios": "^1.4.0",
  "react-router-dom": "^6.0.0",
  "react-pdf": "^7.0.0",
  "react-player": "^2.0.0",
  "react-quill": "^2.0.0",
  "zustand": "^4.0.0" // State management
}
```

---

## 🚀 Deployment Checklist

- [ ] Update environment variables
- [ ] Set up S3 bucket with proper CORS
- [ ] Configure MongoDB with proper indexes
- [ ] Set up SSL/TLS certificates
- [ ] Configure CDN for static assets
- [ ] Set up monitoring/logging
- [ ] Create backup strategy
- [ ] Document API endpoints
- [ ] Create user documentation
- [ ] Set up automated tests
- [ ] Performance optimization
- [ ] Security audit

---

## 📊 Success Metrics

- ✅ Users can sign up and log in securely
- ✅ File uploads work with S3 integration
- ✅ Storage limits enforced
- ✅ Admin dashboard functional
- ✅ Mobile app works smoothly
- ✅ Timeline rendering performant
- ✅ < 2 second page loads
- ✅ 99% uptime target

---

## 🔄 Migration Strategy

### Phase 1: Parallel Running
- Keep old notes system functional
- Build new system alongside
- Users can opt-in to new features

### Phase 2: Data Migration
- Map old notes → new nodes
- Preserve all attachments
- Update user records

### Phase 3: Full Migration
- Deprecate old system
- Redirect users to new app
- Archive old data

---

## 📝 Additional Features (Post-MVP)

- OAuth integration (Google, Microsoft)
- Team/collaboration features
- Advanced search
- Export functionality
- Webhook integrations
- Mobile apps (iOS/Android)
- Dark mode
- Offline support

---

## 📞 Technical Support

For questions during implementation:
1. Refer to relevant phase documentation
2. Check API specifications
3. Review schema definitions
4. Test locally first

---

**Next Steps**:
1. Review and approve this plan
2. Start Phase 1: Database upgrades
3. Create new model files
4. Begin implementation

---

*This document will be updated as development progresses.*
