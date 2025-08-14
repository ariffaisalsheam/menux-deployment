@echo off
REM Menu.X Environment Setup Example
REM Copy this file to setup-env.bat and fill in your actual values
REM DO NOT commit setup-env.bat to version control!

echo 🔐 Setting up Menu.X Environment Variables
echo ==========================================

REM Security Configuration (REQUIRED)
set JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
set APP_ENCRYPTION_SECRET_KEY=your-encryption-key-for-ai-api-keys-32-chars

REM Database Configuration for Supabase Profile (REQUIRED)
set SUPABASE_DATABASE_URL=jdbc:postgresql://your-supabase-host:6543/postgres?sslmode=require
set SUPABASE_DATABASE_USERNAME=your-username
set SUPABASE_DATABASE_PASSWORD=your-password

REM Application Configuration (Optional - defaults provided)
set JWT_EXPIRATION=86400000
set CORS_ALLOWED_ORIGINS=http://localhost:5173
set PORT=8080
set SPRING_PROFILES_ACTIVE=supabase
set APP_FRONTEND_URL=http://localhost:5173

echo ✅ Environment variables configured!
echo 📝 Remember to:
echo    1. Copy this file to setup-env.bat
echo    2. Fill in your actual database credentials
echo    3. Never commit setup-env.bat to version control
echo    4. Run setup-env.bat before starting the application

pause
