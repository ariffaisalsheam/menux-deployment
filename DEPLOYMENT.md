# Menu.X Deployment Guide

This guide covers deploying Menu.X to production environments.

## 🏗️ Architecture Overview

Menu.X consists of:
- **Backend**: Spring Boot application (Java)
- **Frontend**: React SPA (TypeScript)
- **Database**: PostgreSQL
- **File Storage**: Supabase Storage (for images)

## 🔧 Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are configured:

#### Backend Environment Variables
```bash
# Security Configuration (REQUIRED)
JWT_SECRET=<64-character-random-string>
APP_ENCRYPTION_SECRET_KEY=<32-character-random-string>

# Database Configuration (REQUIRED)
DATABASE_URL=jdbc:postgresql://host:port/database?sslmode=require
DATABASE_USERNAME=<username>
DATABASE_PASSWORD=<password>

# OR (if using the 'supabase' profile)
SUPABASE_DATABASE_URL=jdbc:postgresql://host:port/postgres?sslmode=require
SUPABASE_DATABASE_USERNAME=<username>
SUPABASE_DATABASE_PASSWORD=<password>

# Application Configuration
PORT=8080
SPRING_PROFILES_ACTIVE=supabase
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
APP_FRONTEND_URL=https://yourdomain.com

# Flyway (optional; use only if checksum mismatch appears)
# Set true for a single deploy to run flyway.repair() before migrate, then revert to false
APP_FLYWAY_REPAIR_ON_START=false

# Optional
JWT_EXPIRATION=86400000
APP_TIME_ZONE=Asia/Dhaka
```

#### Frontend Environment Variables
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Menu.X
VITE_APP_VERSION=1.0.0
```

### 2. Database Setup
- Provision PostgreSQL database
- Ensure database user has CREATE, ALTER, INSERT, UPDATE, DELETE permissions
- Flyway will handle schema creation automatically

#### One-time Flyway Repair (only if needed)
- If deploy logs show a Flyway checksum mismatch for a previously applied migration:
  1) Temporarily set `APP_FLYWAY_REPAIR_ON_START=true` in backend env.
  2) Redeploy once; logs should show "Flyway repair..." followed by successful validate/migrate.
  3) Immediately set `APP_FLYWAY_REPAIR_ON_START=false` and redeploy to enforce strict validation.

### 3. SSL Certificates
- Obtain SSL certificates for your domain
- Configure HTTPS for both frontend and backend

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

#### 1. Create Dockerfile for Backend
```dockerfile
# backend/Dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/menu-x-backend-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 2. Create Dockerfile for Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

#### 3. Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - APP_ENCRYPTION_SECRET_KEY=${APP_ENCRYPTION_SECRET_KEY}
      - SUPABASE_DATABASE_URL=${SUPABASE_DATABASE_URL}
      - SUPABASE_DATABASE_USERNAME=${SUPABASE_DATABASE_USERNAME}
      - SUPABASE_DATABASE_PASSWORD=${SUPABASE_DATABASE_PASSWORD}
      - SPRING_PROFILES_ACTIVE=supabase
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=menux
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Option 2: Cloud Platform Deployment

#### Heroku
1. Create Heroku apps for backend and frontend
2. Set environment variables in Heroku dashboard
3. Deploy using Git or GitHub integration

#### AWS/Azure/GCP
1. Use container services (ECS, Container Instances, Cloud Run)
2. Set up load balancers and auto-scaling
3. Configure environment variables in platform settings

#### Vercel (Frontend) + Railway/Render (Backend)
1. Deploy frontend to Vercel
2. Deploy backend to Railway or Render
3. Configure environment variables in each platform

## 🔒 Security Configuration

### 1. Environment Variables Security
- Never commit `.env` files to version control
- Use platform-specific secret management
- Rotate secrets regularly

### 2. Database Security
- Use connection pooling
- Enable SSL connections
- Restrict database access by IP
- Regular backups

### 3. Application Security
- Enable HTTPS only
- Configure proper CORS origins
- Set secure headers
- Regular security updates

## 📊 Monitoring & Logging

### 1. Application Monitoring
- Set up health check endpoints
- Monitor application metrics
- Configure alerts for errors

### 2. Database Monitoring
- Monitor connection pool usage
- Track query performance
- Set up backup monitoring

### 3. Logging
- Configure structured logging
- Set up log aggregation
- Monitor error rates

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Run backend tests
        run: |
          cd backend
          ./mvnw test
      
      - name: Run frontend tests
        run: |
          cd frontend
          npm ci
          npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and deploy backend
        run: |
          cd backend
          ./mvnw clean package -DskipTests
          # Deploy to your platform
      
      - name: Build and deploy frontend
        run: |
          cd frontend
          npm ci
          npm run build
          # Deploy to your platform
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
- Check connection string format
- Verify credentials
- Ensure database server is accessible
- Check SSL requirements

#### 2. CORS Errors
- Verify CORS_ALLOWED_ORIGINS includes your frontend domain
- Check protocol (http vs https)
- Ensure no trailing slashes

#### 3. Hibernate cannot determine Dialect / JDBC metadata
- Symptom in logs: "Unable to determine Dialect without JDBC metadata..."
- Ensure datasource is reachable and `spring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=true`.
- In `backend/src/main/resources/application.yml` (supabase profile) this is already enabled.

#### 3. AI Service Issues
- Verify AI provider configuration in admin panel
- Check API key validity
- Monitor rate limits

#### 4. File Upload Issues
- Check Supabase storage configuration
- Verify bucket permissions
- Monitor storage quotas

### Health Checks

#### Backend Health Check
```bash
curl https://api.yourdomain.com/actuator/health
```

#### Frontend Health Check
```bash
curl https://yourdomain.com
```

## 📈 Performance Optimization

### Backend Optimization
- Configure connection pooling
- Enable response compression
- Set up caching for static data
- Optimize database queries

### Frontend Optimization
- Enable gzip compression
- Configure CDN for static assets
- Implement code splitting
- Optimize images

### Database Optimization
- Create appropriate indexes
- Regular VACUUM and ANALYZE
- Monitor slow queries
- Configure connection limits

## 🔄 Backup & Recovery

### Database Backups
- Set up automated daily backups
- Test restore procedures
- Store backups in multiple locations
- Document recovery procedures

### Application Backups
- Version control for code
- Configuration backups
- Document deployment procedures
- Maintain rollback procedures

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- Update dependencies
- Monitor security advisories
- Review logs and metrics
- Performance optimization
- Database maintenance

### Emergency Procedures
- Document incident response
- Maintain contact information
- Prepare rollback procedures
- Monitor system status

For additional support, contact: support@menux.com
