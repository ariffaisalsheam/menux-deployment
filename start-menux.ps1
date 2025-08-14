# Menu.X Application Startup Script
Write-Host "Starting Menu.X Application" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

Write-Host ""
Write-Host "Starting Backend (Spring Boot)..." -ForegroundColor Yellow
Write-Host "Backend will run on: http://localhost:8080" -ForegroundColor White

# Start backend in new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; ./mvnw spring-boot:run"

Write-Host "Waiting 10 seconds for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Starting Frontend (Vite)..." -ForegroundColor Yellow
Write-Host "Frontend will run on: http://localhost:5173" -ForegroundColor White

# Start frontend in new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "===========================" -ForegroundColor Green
Write-Host "Menu.X Application Starting" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Both services are starting in separate windows." -ForegroundColor White
Write-Host "Wait for both to fully load before accessing the application." -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit this window"
