# Deployment Guide - NoteHive on AWS EC2

This guide walks through deploying the NoteHive application on an AWS EC2 instance.

## Prerequisites

- AWS Account
- EC2 instance (Ubuntu 20.04 or later recommended)
- Domain name (optional, for HTTPS)
- SSH access to your EC2 instance

## Step 1: Prepare EC2 Instance

### 1.1 Launch EC2 Instance

1. Go to AWS Console → EC2 → Instances → Launch Instance
2. Select Ubuntu 20.04 LTS AMI
3. Choose instance type (t3.small recommended for testing)
4. Configure security group to allow:
   - Port 22 (SSH)
   - Port 3000 (Frontend)
   - Port 5000 (Backend)
   - Port 27017 (MongoDB - if exposing)

### 1.2 Update System

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update packages
sudo apt-get update
sudo apt-get upgrade -y
```

## Step 2: Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker ubuntu

# Log out and back in for group changes to take effect
exit
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Step 3: Deploy Application

### 3.1 Download Application Code

```bash
# Option 1: Clone from GitHub (if using version control)
git clone <your-repository-url> notehive-app
cd notehive-app

# Option 2: Transfer files via SCP
# From your local machine:
scp -i your-key.pem -r ./notehive-app ubuntu@your-ec2-public-ip:~/
```

### 3.2 Configure Environment Variables

```bash
# Copy and edit environment file
cp backend/.env.example backend/.env
nano backend/.env

# Update with your credentials:
# MONGODB_URI=mongodb://admin:admin123@your-external-mongo:27017/notesafe?authSource=admin
# AWS credentials from your AWS account
```

### 3.3 Update Docker Compose for EC2

Edit `docker-compose.yml` to replace localhost with EC2 IP:

```yaml
environment:
  - CORS_ORIGIN=http://your-ec2-public-ip:3000
  - REACT_APP_API_URL=http://your-ec2-public-ip:5000/api
```

### 3.4 Build and Start Services

```bash
cd ~/notehive-app

# Build images
docker-compose build

# Start services
docker-compose up -d

# Verify services are running
docker-compose ps
```

## Step 4: Verify Deployment

### 4.1 Check Service Health

```bash
# Check if containers are running
docker ps

# View logs
docker-compose logs -f

# Check backend health
curl http://localhost:5000/api/health

# Check frontend
curl http://localhost:3000
```

### 4.2 Access Application

- Frontend: `http://your-ec2-public-ip:3000`
- API: `http://your-ec2-public-ip:5000/api`
- Health: `http://your-ec2-public-ip:5000/api/health`

## Step 5: Production Setup (Recommended)

### 5.1 Install Nginx Reverse Proxy

```bash
sudo apt-get install -y nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/notehive
```

Add configuration:

```nginx
upstream backend {
    server localhost:5000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # API endpoints
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable configuration:

```bash
sudo ln -s /etc/nginx/sites-available/notehive /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 5.2 Setup HTTPS with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 5.3 Update Docker Compose Environment

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
      - CORS_ORIGIN=https://your-domain.com

  frontend:
    environment:
      - REACT_APP_API_URL=https://your-domain.com/api
```

Restart services:

```bash
docker-compose down
docker-compose up -d
```

## Step 6: Data Persistence

### 6.1 MongoDB Backup Strategy

```bash
# Create backup directory
mkdir -p ~/notehive-backups

# Manual backup
docker exec notehive-mongodb mongodump -u admin -p admin123 \
  --out /backups/$(date +%Y%m%d_%H%M%S)

# Automated backup (cron job)
crontab -e

# Add to crontab (daily at 2 AM):
0 2 * * * docker exec notehive-mongodb mongodump -u admin -p admin123 \
  --out /home/ubuntu/notehive-backups/$(date +\%Y\%m\%d)
```

### 6.2 AWS S3 Log Retention

Create lifecycle policy for S3 bucket:

1. Go to S3 → Select bucket
2. Management → Lifecycle rules
3. Set expiration for old logs (e.g., 90 days)

## Step 7: Monitoring and Maintenance

### 7.1 Monitor Logs

```bash
# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Save logs to file
docker-compose logs > app-logs.txt
```

### 7.2 System Resources

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Monitor container performance
docker stats
```

### 7.3 Cleanup Old Docker Images

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Clean up everything (careful!)
docker system prune -a
```

## Step 8: Auto-Start on Server Reboot

Create systemd service file:

```bash
sudo nano /etc/systemd/system/notehive.service
```

Add:

```ini
[Unit]
Description=NoteHive Application
Requires=docker.service
After=docker.service

[Service]
Type=simple
Restart=always
RestartSec=10
WorkingDirectory=/home/ubuntu/notehive-app
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
```

Enable service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable notehive
sudo systemctl start notehive

# Check status
sudo systemctl status notehive
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

### MongoDB Connection Issues

```bash
# Check MongoDB logs
docker-compose logs mongodb

# Connect to MongoDB shell
docker exec -it notehive-mongodb mongosh -u admin -p admin123
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Remove old logs
sudo journalctl --vacuum=500M

# Clean Docker system
docker system prune -a --volumes
```

### High Memory Usage

```bash
# Check container memory
docker stats

# Limit memory in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

## Performance Optimization

### 1. Enable Gzip Compression

In nginx config:

```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1024;
```

### 2. Enable Caching Headers

Add to backend routes:

```javascript
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600');
  next();
});
```

### 3. Database Indexing

```bash
# Connect to MongoDB
docker exec -it notehive-mongodb mongosh -u admin -p admin123

# Create indexes
db.notes.createIndex({ userId: 1 })
db.notes.createIndex({ createdAt: -1 })
```

## Security Hardening

### 1. Update Security Group

Remove public access to MongoDB:
- Only allow SSH from your IP
- Allow 80/443 from 0.0.0.0/0
- Allow 3000/5000 only if needed

### 2. Use IAM Roles Instead of Keys

```bash
# Create IAM role with S3 permissions
# Attach to EC2 instance
# Remove AWS credentials from .env
```

### 3. Enable CloudTrail

Monitor AWS API calls and resource changes.

## Next Steps

- Set up CloudWatch alarms
- Configure auto-scaling
- Implement CI/CD pipeline
- Set up automated backups to S3
- Configure CDN for static assets
- Implement rate limiting
- Add authentication/JWT tokens

## Support

For additional help, refer to:
- AWS EC2 Documentation: https://docs.aws.amazon.com/ec2/
- Docker Documentation: https://docs.docker.com/
- MongoDB Documentation: https://docs.mongodb.com/
