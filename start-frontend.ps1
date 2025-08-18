param(
    [string]$ApiBaseUrl = "http://localhost:8080/api",
    [int]$Port = 5173,
    [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

# Resolve paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $ScriptDir "frontend"
$PkgJson = Join-Path $FrontendDir "package.json"
$EnvLocal = Join-Path $FrontendDir ".env.local"

function Write-Info($msg) { Write-Host "[frontend] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[frontend] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[frontend] $msg" -ForegroundColor Red }

# Basic validation
if (!(Test-Path $FrontendDir)) {
    Write-Err "Frontend directory not found at '$FrontendDir'"
    exit 1
}
if (!(Test-Path $PkgJson)) {
    Write-Err "package.json not found in '$FrontendDir'"
    exit 1
}

# Check for Node & npm
try {
    $npmVersion = (npm --version) 2>$null
} catch {
    Write-Err "npm is not installed or not in PATH. Please install Node.js (which includes npm)."
    exit 1
}

# Ensure API base URL is available to Vite
$env:VITE_API_BASE_URL = $ApiBaseUrl
Write-Info "Using VITE_API_BASE_URL = $($env:VITE_API_BASE_URL)"

# Let the user know about .env.local status
if (Test-Path $EnvLocal) {
    Write-Info ".env.local detected at '$EnvLocal'. Vite will also load it."
    Write-Info "If .env.local has VITE_API_BASE_URL, it will be consistent with the above."
} else {
    Write-Warn ".env.local not found. That's okay—using process env VITE_API_BASE_URL."
}

# Build vite args
$viteArgs = @("--port", "$Port")
if (-not $NoOpen) { $viteArgs += "--open" }

Write-Info "Starting Vite dev server on http://localhost:$Port"
Write-Info "Opening browser: $([bool](-not $NoOpen))"

# Run dev server in frontend directory
Push-Location $FrontendDir
try {
    # Pass vite args after '--'
    npm run dev -- @viteArgs
} finally {
    Pop-Location
}
