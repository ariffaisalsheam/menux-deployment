# Menu.X Backend Secrets - DO NOT COMMIT TO VERSION CONTROL
# This file contains sensitive credentials for local development

$env:JWT_SECRET = "mySecretKey123456789012345678901234567890abcdefghijklmnop"
$env:APP_ENCRYPTION_SECRET_KEY = "encryptionKey123456789012345678901234567890abcdef"
$env:SUPABASE_DATABASE_URL = "jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
$env:SUPABASE_DATABASE_USERNAME = "postgres.fxxbzrxcakzbbdvxocsu"
$env:SUPABASE_DATABASE_PASSWORD = "your-actual-database-password-here"

# Supabase Storage Configuration
$env:SUPABASE_URL = "https://fxxbzrxcakzbbdvxocsu.supabase.co"
$env:SUPABASE_SERVICE_KEY = "your-service-key-here"
$env:SUPABASE_STORAGE_BUCKET = "menu-images"
