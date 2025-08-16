# Environment Variables

This document lists all required environment variables for the Menu.X application.

## Security Notice
🚨 **CRITICAL**: All sensitive data MUST be provided via environment variables. Never commit credentials to version control.

## Required Environment Variables

### Security Configuration
- `JWT_SECRET`: Secret key for JWT token signing (minimum 32 characters)
- `JWT_EXPIRATION`: Token expiration time in milliseconds (default: 86400000 = 24 hours)
- `APP_ENCRYPTION_SECRET_KEY`: Secret key for encrypting AI provider API keys (minimum 32 characters)

### Database Configuration (Profile-dependent)

#### Development Profile (dev)
- No database environment variables required (uses H2 in-memory database)

#### Supabase Profile (supabase) - **REQUIRED**
- `SUPABASE_DATABASE_URL`: Full PostgreSQL connection URL
- `SUPABASE_DATABASE_USERNAME`: Database username
- `SUPABASE_DATABASE_PASSWORD`: Database password

#### Production Profile (prod) - **REQUIRED**
- `DATABASE_URL`: Full PostgreSQL connection URL
- `DATABASE_USERNAME`: Database username
- `DATABASE_PASSWORD`: Database password

### Application Configuration
- `PORT`: Backend HTTP port (default: 8080)
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `APP_FRONTEND_URL`: Frontend base URL for QR code generation
- `APP_TIME_ZONE`: Application time zone (default: Asia/Dhaka)

- `APP_FLYWAY_REPAIR_ON_START` (optional): Defaults to `false`. Set to `true` only for a one-time startup to run `flyway.repair()` before migrate (e.g., to fix a checksum mismatch), then revert to `false`.

### Supabase Storage (Image Uploads) - REQUIRED for media upload
- `SUPABASE_URL`: Your Supabase project URL (e.g., https://xyzcompany.supabase.co)
- `SUPABASE_SERVICE_KEY`: Supabase service role key (server-side only, never expose to frontend)
- `SUPABASE_STORAGE_BUCKET`: Storage bucket name (default: menu-images)

### Frontend Environment Variables
- `VITE_API_BASE_URL`: Base API URL used by the frontend (e.g., https://menux-backend-api.onrender.com/api)
- `VITE_APP_NAME` (optional): Display name for the app
- `VITE_APP_VERSION` (optional): Display version label

## AI Provider Configuration
AI provider keys are NOT set via environment variables. They are configured by Super Admin users through the web interface and stored encrypted in the database for security.

## Example .env File for Local Development
```bash
# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRATION=86400000
APP_ENCRYPTION_SECRET_KEY=your-encryption-key-for-ai-api-keys-32-chars

# Supabase Database (for supabase profile)
SUPABASE_DATABASE_URL=jdbc:postgresql://your-supabase-host:6543/postgres?sslmode=require
SUPABASE_DATABASE_USERNAME=your-username
SUPABASE_DATABASE_PASSWORD=your-password

# Application Configuration
PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173
APP_FRONTEND_URL=http://localhost:5173
APP_TIME_ZONE=Asia/Dhaka

# Supabase Storage (required for image uploads)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=menu-images
```

## Security Best Practices
1. Never commit `.env` files to version control
2. Use strong, unique passwords for database access
3. Rotate JWT secrets regularly in production
4. Use HTTPS in production environments
5. Restrict CORS origins to your actual domains
