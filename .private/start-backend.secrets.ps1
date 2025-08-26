# Local secrets for Menu.X backend (ignored by git)
# Values pulled from .private/DEPLOYMENT_NOTES.md where available.
# You can edit these any time.

# Security
$env:JWT_SECRET = 'mySecretKey123456789012345678901234567890'
$env:APP_ENCRYPTION_SECRET_KEY = 'mySecretKey123456789012345678901234567890'

# Supabase Database (from notes)
$env:SUPABASE_DATABASE_URL = 'jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&preferQueryMode=simple'
$env:SUPABASE_DATABASE_USERNAME = 'postgres.fxxbzrxcakzbbdvxocsu'
$env:SUPABASE_DATABASE_PASSWORD = 'q6UUrIlYsYKlnNez'

# Supabase Storage (media) – required for upload endpoints
$env:SUPABASE_URL = 'https://fxxbzrxcakzbbdvxocsu.supabase.co'
$env:SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eGJ6cnhjYWt6YmJkdnhvY3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MDc0MiwiZXhwIjoyMDcwNDE2NzQyfQ.D3T6cY6Qp6Uqb2jlsFyAVsRs1A8UGfyTt63PkvZqmho'
$env:SUPABASE_STORAGE_BUCKET = 'menu-images'

# App defaults (optional)
$env:SPRING_PROFILES_ACTIVE = 'supabase'
$env:APP_TIME_ZONE = 'Asia/Dhaka'
# Web Push (VAPID)
$env:VAPID_PUBLIC_KEY = 'BCiBY0-jJbx5xmlwoxRXw3y4szO9irEn4NifN_ZeL8wtI06G9c4kMLpnPXzRjvYGq5T91eCGM4nWVHTh9u1ysAQ'
$env:VAPID_PRIVATE_KEY = 'quZDCKP5TwOCz00AygUQWCtrQOhjGl6MFWgF76AIBgo'
$env:VAPID_SUBJECT = 'mailto:support@menux.com'
$env:APP_FRONTEND_URL = 'http://localhost:5173'
$env:CORS_ALLOWED_ORIGINS = 'http://localhost:5173'
$env:PORT = '8080'
