@echo off
echo Starting Menu.X Application
echo ===========================

echo.
echo Starting Backend (Spring Boot)...
echo Backend will run on: http://localhost:8080
echo.

start "Menu.X Backend" cmd /k "cd backend && mvnw.cmd spring-boot:run"

echo Waiting 10 seconds for backend to start...
timeout /t 10 /nobreak > nul

echo.
echo Starting Frontend (Vite)...
echo Frontend will run on: http://localhost:5173
echo.

start "Menu.X Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===========================
echo Menu.X Application Starting
echo ===========================
echo.
echo Backend: http://localhost:8080
echo Frontend: http://localhost:5173
echo.
echo Both services are starting in separate windows.
echo Wait for both to fully load before accessing the application.
echo.
pause
