@echo off
echo 🚀 Starting Menu.X Backend with Environment Variables
echo =====================================================

REM Set environment variables for local development
set SUPABASE_DATABASE_URL=jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
set SUPABASE_DATABASE_USERNAME=postgres.fxxbzrxcakzbbdvxocsu
set SUPABASE_DATABASE_PASSWORD=007$he@M
set DATABASE_URL=jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
set DATABASE_USERNAME=postgres.fxxbzrxcakzbbdvxocsu
set DATABASE_PASSWORD=007$he@M
set JWT_SECRET=mySecretKey123456789012345678901234567890
set JWT_EXPIRATION=86400000
REM Start backend without any hardcoded API keys (keys are stored centrally in DB)
set GEMINI_API_KEY=
set CORS_ALLOWED_ORIGINS=http://localhost:5173
set PORT=8080
set SPRING_PROFILES_ACTIVE=supabase

echo ✅ Environment variables set!
echo 🚀 Starting backend on port 8080...
echo.

cd backend
mvnw.cmd spring-boot:run

pause
