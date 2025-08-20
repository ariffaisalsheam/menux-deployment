param(
    [switch]$RepairFlyway
)

# Menu.X backend starter for Windows PowerShell
# - Loads optional secrets from start-backend.secrets.ps1 (next to this script)
# - Sets sane defaults for local dev
# - Validates required environment variables
# - Runs Spring Boot via mvnw

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root 'backend'

# Load user secrets if present (do not commit this file)
$SecretsFile = Join-Path $Root 'start-backend.secrets.ps1'
if (Test-Path $SecretsFile) {
    Write-Host "Loading secrets from: $SecretsFile"
    . $SecretsFile
}

# Also load from .private if present
$PrivateDir = Join-Path $Root '.private'
$PrivateSecrets = Join-Path $PrivateDir 'start-backend.secrets.ps1'
if (Test-Path $PrivateSecrets) {
    Write-Host "Loading secrets from: $PrivateSecrets"
    . $PrivateSecrets
}

# Auto-load Firebase Admin service account for local dev if present
# - Place your service account JSON at: .private/firebase-service-account.json (ignored by git)
# - You can still override via env vars set in secrets files
$FirebaseJsonFile = Join-Path $PrivateDir 'firebase-service-account.json'
if (Test-Path $FirebaseJsonFile) {
    # Only set if caller hasn't provided either env already
    if (-not $env:FIREBASE_SERVICE_ACCOUNT_JSON -and -not $env:FIREBASE_SERVICE_ACCOUNT_JSON_BASE64) {
        try {
            $firebaseJson = Get-Content $FirebaseJsonFile -Raw -ErrorAction Stop
            $base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($firebaseJson))
            $env:FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = $base64
            Write-Host "Loaded Firebase service account from: $FirebaseJsonFile (base64 in env)"
        } catch {
            Write-Warning "Failed to read Firebase JSON from ${FirebaseJsonFile}: $($_.Exception.Message)"
        }
    }
}

# If still not set, try to auto-discover any service account JSON under .private/**
if (-not $env:FIREBASE_SERVICE_ACCOUNT_JSON -and -not $env:FIREBASE_SERVICE_ACCOUNT_JSON_BASE64) {
    try {
        $candidates = @()
        $FirebaseDir = Join-Path $PrivateDir 'firebase'
        if (Test-Path $FirebaseDir) {
            $candidates += Get-ChildItem $FirebaseDir -Recurse -Filter *.json -File -ErrorAction SilentlyContinue
        }
        $candidates += Get-ChildItem $PrivateDir -Filter *.json -File -ErrorAction SilentlyContinue
        foreach ($f in ($candidates | Select-Object -Unique)) {
            try {
                $jsonContent = Get-Content $f.FullName -Raw -ErrorAction Stop
                if ($jsonContent -match '"type"\s*:\s*"service_account"') {
                    $env:FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($jsonContent))
                    Write-Host "Loaded Firebase service account from: $($f.FullName) (base64 in env)"
                    break
                }
            } catch {
                Write-Warning "Failed to read candidate Firebase JSON from $($f.FullName): $($_.Exception.Message)"
            }
        }
    } catch {
        Write-Warning "Auto-discovery for Firebase service account failed: $($_.Exception.Message)"
    }
}

# Defaults for local development
if (-not $env:SPRING_PROFILES_ACTIVE) { $env:SPRING_PROFILES_ACTIVE = 'supabase' }
if (-not $env:APP_TIME_ZONE) { $env:APP_TIME_ZONE = 'Asia/Dhaka' }
if (-not $env:APP_FRONTEND_URL) { $env:APP_FRONTEND_URL = 'http://localhost:5173' }
if (-not $env:PORT) { $env:PORT = '8080' }
if (-not $env:CORS_ALLOWED_ORIGINS) { $env:CORS_ALLOWED_ORIGINS = 'http://localhost:5173' }
if ($RepairFlyway) { $env:APP_FLYWAY_REPAIR_ON_START = 'false' }
elseif (-not $env:APP_FLYWAY_REPAIR_ON_START) { $env:APP_FLYWAY_REPAIR_ON_START = 'false' }

# Enable FCM push locally by default if not explicitly set
if (-not $env:FEATURE_FCM_PUSH) { $env:FEATURE_FCM_PUSH = 'true' }

# Required variables
$required = @(
    'JWT_SECRET',
    'APP_ENCRYPTION_SECRET_KEY',
    'SUPABASE_DATABASE_URL',
    'SUPABASE_DATABASE_USERNAME',
    'SUPABASE_DATABASE_PASSWORD'
)
$missing = @()
foreach ($k in $required) {
    $val = [System.Environment]::GetEnvironmentVariable($k)
    if ([string]::IsNullOrEmpty($val)) { $missing += $k }
}
if ($missing.Count -gt 0) {
    Write-Error ("Missing required environment variables: {0}." -f ($missing -join ', '))
    Write-Host "Create a secrets file next to this script named 'start-backend.secrets.ps1' with contents like:" -ForegroundColor Yellow
    Write-Host @'
$env:JWT_SECRET = "your-32+ char secret"
$env:APP_ENCRYPTION_SECRET_KEY = "your-32 char encryption key"
$env:SUPABASE_DATABASE_URL = "jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
$env:SUPABASE_DATABASE_USERNAME = "your_username"
$env:SUPABASE_DATABASE_PASSWORD = "your_password"
'@
    exit 1
}

function Mask([string]$s) {
    if (-not $s) { return '' }
    if ($s.Length -le 6) { return '******' }
    return $s.Substring(0,3) + '***' + $s.Substring($s.Length-3,3)
}

Write-Host "Starting Menu.X backend with:" -ForegroundColor Cyan
Write-Host "  Profile: $($env:SPRING_PROFILES_ACTIVE)"
Write-Host "  DB URL: $($env:SUPABASE_DATABASE_URL)"
Write-Host "  DB User: $($env:SUPABASE_DATABASE_USERNAME)"
Write-Host "  JWT_SECRET: $(Mask $env:JWT_SECRET)"
Write-Host "  APP_ENCRYPTION_SECRET_KEY: $(Mask $env:APP_ENCRYPTION_SECRET_KEY)"
Write-Host "  APP_FLYWAY_REPAIR_ON_START: $($env:APP_FLYWAY_REPAIR_ON_START)"
Write-Host "  PORT: $($env:PORT)"
Write-Host "  FCM Enabled: $($env:FEATURE_FCM_PUSH)"
Write-Host "  Firebase credentials provided: $([bool]($env:FIREBASE_SERVICE_ACCOUNT_JSON) -or [bool]($env:FIREBASE_SERVICE_ACCOUNT_JSON_BASE64))"
Write-Host ""

Push-Location $BackendDir
try {
    & "$BackendDir\mvnw.cmd" spring-boot:run
}
finally {
    Pop-Location
}
