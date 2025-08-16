# Private Deployment Notes (Do Not Commit)

This file is intentionally kept outside version control. See `.gitignore` entry for `.private/`.

## Backend (Render)
- URL: https://menux-backend-api.onrender.com
- Stack: Spring Boot (Java 17), Dockerized on Render
- Deploy Flow: Push to GitHub → Render auto-builds using `backend/Dockerfile` → uses `backend/pom.xml` → starts container → production env vars injected
- Key repo files:
  - `backend/Dockerfile` (build and run)
  - `backend/pom.xml` (dependencies/build)
  - `backend/src/main/resources/application.yml` (defaults; overridden in prod)
- Required environment variables (Render → Environment):
```bash
# Security
JWT_SECRET=<64+ chars>
APP_ENCRYPTION_SECRET_KEY=<32+ chars>
JWT_EXPIRATION=86400000  # optional

# Database (prod profile)
DATABASE_URL=jdbc:postgresql://host:port/db?sslmode=require
DATABASE_USERNAME=<user>
DATABASE_PASSWORD=<pass>

# App
PORT=8080
CORS_ALLOWED_ORIGINS=https://menuxbd.vercel.app,https://menux-amber.vercel.app
APP_FRONTEND_URL=https://menuxbd.vercel.app  # used for QR generation; choose primary

# Supabase Storage (media uploads)
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_KEY=<service-role-key>
SUPABASE_STORAGE_BUCKET=menu-images
```
- Notes:
  - `/api/media/stream?path=...` is publicly accessible (GET) to allow `<img>` tags to load without auth.
  - Old images are deleted on menu item update/delete by `MenuController`.
  - CORS must explicitly allow the Vercel domains above.

## Backend application.yml keys (reference)

```yaml
spring:
  application:
    name: menu-x-backend
  profiles:
    active: supabase

  datasource:
  url: ${SUPABASE_DATABASE_URL:jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&preferQueryMode=simple}
    username: ${SUPABASE_DATABASE_USERNAME:postgres.fxxbzrxcakzbbdvxocsu}
    password: ${SUPABASE_DATABASE_PASSWORD:007$he@M}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 5
      minimum-idle: 1
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
      connection-test-query: SELECT 1
      validation-timeout: 5000
      auto-commit: true
      data-source-properties:
        cachePrepStmts: false
        prepStmtCacheSize: 0
        prepStmtCacheSqlLimit: 0
        useServerPrepStmts: false
        useLocalSessionState: true
        rewriteBatchedStatements: true
        cacheResultSetMetadata: false
        cacheServerConfiguration: true
        elideSetAutoCommits: true
        maintainTimeStats: false
        preferQueryMode: simple
        tcpKeepAlive: true
        socketTimeout: 30
        loginTimeout: 10

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        jdbc.prepStmtCacheSize: 0
        jdbc.prepStmtCacheSqlLimit: 0
        jdbc.use_get_generated_keys: true
        jdbc.batch_size: 50
        order_inserts: true
        order_updates: true
        connection.provider_disables_autocommit: false
        connection.autocommit: true
        connection.isolation: 2
        jdbc.time_zone: UTC
        temp.use_jdbc_metadata_defaults: false

  jackson:
    time-zone: ${APP_TIME_ZONE}
  logging:
    timezone: ${APP_TIME_ZONE}
  flyway:
    enabled: false
  servlet:
    multipart:
      max-file-size: 2MB
      max-request-size: 2MB

jwt:
  secret: ${JWT_SECRET}
  expiration: ${JWT_EXPIRATION}

app:
  time-zone: ${APP_TIME_ZONE}
  frontend:
    url: ${APP_FRONTEND_URL}
    media:
    supabase:
      url: ${SUPABASE_URL:https://fxxbzrxcakzbbdvxocsu.supabase.co}
      service-key: ${SUPABASE_SERVICE_KEY:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eGJ6cnhjYWt6YmJkdnhvY3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg0MDc0MiwiZXhwIjoyMDcwNDE2NzQyfQ.D3T6cY6Qp6Uqb2jlsFyAVsRs1A8UGfyTt63PkvZqmho}
      bucket: ${SUPABASE_STORAGE_BUCKET:menu-images}
```

## Frontend (Vercel)
- Domains:
  - https://menuxbd.vercel.app (primary)
  - https://menux-amber.vercel.app (secondary)
- Stack: React + Vite (TypeScript)
- Location: `frontend/`
- Build command: from `frontend/package.json`
```json
"build": "tsc -b && vite build"
```
- SPA routing: `frontend/vercel.json`
```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```
- Required environment variables (Vercel Project Settings → Environment Variables):
```bash
VITE_API_BASE=https://menux-backend-api.onrender.com
```

## Integration Checklist
- Backend CORS (`SecurityConfig`) includes both Vercel origins.
- Frontend axios base URL (`frontend/src/services/api.ts`) reads `VITE_API_BASE` in production.
- Media previews use `/api/media/stream?path=...` (no auth required) and upload uses authenticated flow.

## Quick Verification
- Backend health: open https://menux-backend-api.onrender.com/api/public/health (or the configured health endpoint) if available.
- Frontend app: open the Vercel domain and verify API calls succeed (no CORS errors in browser console).

## Ownership
- This document is for internal reference only. Do not share publicly, and do not commit to git.
