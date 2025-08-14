# Development helper to start both backend and frontend

# Clear legacy envs (no API keys in env; keys are stored in DB)
Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue

Write-Host "Starting backend and frontend..."

Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c mvn -f ./backend spring-boot:run"
Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c cd frontend && npm run dev"
