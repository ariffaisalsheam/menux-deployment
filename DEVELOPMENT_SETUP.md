# Menu.X Development Setup Guide

This guide will help you set up the Menu.X development environment on your local machine.

## 📋 Prerequisites

### Required Software
- **Java 17 or higher** - [Download OpenJDK](https://adoptium.net/)
- **Node.js 18 or higher** - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/)
- **PostgreSQL** (optional, can use H2 for development) - [Download PostgreSQL](https://www.postgresql.org/)

### Recommended Tools
- **IntelliJ IDEA** or **VS Code** - IDE for development
- **Postman** or **Insomnia** - API testing
- **pgAdmin** - PostgreSQL administration (if using PostgreSQL)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MenuX
```

### 2. Backend Setup

#### Option A: Using H2 Database (Easiest)
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend will start on `http://localhost:8080` with an in-memory H2 database.

#### Option B: Using PostgreSQL/Supabase
1. Copy the environment setup example:
   ```bash
   copy setup-env-example.bat setup-env.bat
   ```

2. Edit `setup-env.bat` with your database credentials:
   ```bash
   set SUPABASE_DATABASE_URL=jdbc:postgresql://your-host:6543/postgres?sslmode=require
   set SUPABASE_DATABASE_USERNAME=your-username
   set SUPABASE_DATABASE_PASSWORD=your-password
   set JWT_SECRET=your-jwt-secret-minimum-32-characters-long
   set APP_ENCRYPTION_SECRET_KEY=your-encryption-key-32-characters
   ```

3. Run the setup and start the backend:
   ```bash
   setup-env.bat
   cd backend
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=supabase
   ```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`.

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **H2 Console** (dev profile only): http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:testdb`
  - Username: `sa`
  - Password: (leave empty)

## 🔧 Development Configuration

### Environment Variables

#### Backend (.env or system environment)
```bash
# Security
JWT_SECRET=development-secret-key-minimum-32-characters-long
APP_ENCRYPTION_SECRET_KEY=development-encryption-key-32-chars

# Database (for supabase profile)
SUPABASE_DATABASE_URL=jdbc:postgresql://localhost:5432/menux
SUPABASE_DATABASE_USERNAME=menux_user
SUPABASE_DATABASE_PASSWORD=password

# Application
SPRING_PROFILES_ACTIVE=dev
CORS_ALLOWED_ORIGINS=http://localhost:5173
PORT=8080
APP_FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env.local)
```bash
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=Menu.X
VITE_APP_VERSION=1.0.0-dev
```

### Database Profiles

#### Development Profile (dev)
- Uses H2 in-memory database
- Database recreated on each restart
- Perfect for quick development and testing
- No external database required

#### Supabase Profile (supabase)
- Uses PostgreSQL database
- Persistent data storage
- Requires database setup
- Better for integration testing

#### Production Profile (prod)
- Uses production database
- Optimized settings
- Security hardened
- For production deployment only

## 🛠 Development Tools

### Backend Development

#### Running Tests
```bash
cd backend
./mvnw test
```

#### Building the Application
```bash
cd backend
./mvnw clean package
```

#### Database Migrations
Flyway migrations are located in `backend/src/main/resources/db/migration/`.
They run automatically when the application starts.

### Frontend Development

#### Running Tests
```bash
cd frontend
npm test
```

#### Building for Production
```bash
cd frontend
npm run build
```

## 🎯 AI Provider Configuration

This project uses centralized AI provider configuration stored in the database:

- **AI Keys Management**: Keys are managed by Super Admin in the Admin → AI Configuration page
- **Encrypted Storage**: All API keys are stored encrypted in the `ai_provider_configs` table
- **No Environment Variables**: Do not set `GEMINI_API_KEY` or similar environment variables
- **Multiple Providers**: Supports Google Gemini, OpenAI, OpenRouter, and other providers

### Setting Up AI Providers
1. Start the application and login as Super Admin
2. Navigate to Admin → AI Configuration
3. Add your AI provider (e.g., Google Gemini)
4. Test the configuration
5. Set as primary provider

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues
- **Port conflicts**: Make sure port 8080 is available
- **Database connection**: Check your database credentials and connection string
- **AI fallback text**: Ensure at least one provider is Active and set as Primary

#### Frontend Issues
- **Port conflicts**: Make sure port 5173 is available
- **CORS errors**: Ensure CORS_ALLOWED_ORIGINS includes your frontend URL
- **Node modules**: Try `rm -rf node_modules && npm install` if you have dependency issues

### Database Access
- **H2 Console**: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:testdb`
  - Username: `sa`
  - Password: (empty)

## 📚 Additional Resources

### Documentation
- [API Documentation](backend/API_DOCUMENTATION.md)
- [Environment Variables](ENVIRONMENT_VARIABLES.md)
- [Deployment Guide](DEPLOYMENT.md)

### External Resources
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

For questions or support, contact: dev-support@menux.com
