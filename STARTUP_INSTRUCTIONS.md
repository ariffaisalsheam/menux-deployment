# Menu.X Application Startup Instructions

## Prerequisites
- Java 17 or higher
- Node.js and npm
- Internet connection (for Supabase database)

## Quick Start

### 1. Start Backend
Open a terminal/command prompt and navigate to the backend directory:

```bash
cd backend
./mvnw spring-boot:run
```

**For Windows Command Prompt:**
```cmd
cd backend
mvnw.cmd spring-boot:run
```

Wait for the backend to start. You should see:
- "Tomcat started on port 8080"
- "Started MenuXBackendApplication"

### 2. Start Frontend
Open a **new** terminal/command prompt and navigate to the frontend directory:

```bash
cd frontend
npm run dev
```

Wait for the frontend to start. You should see:
- "VITE ready in [time]"
- "Local: http://localhost:5173/"

## Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080/api
- **Health Check:** http://localhost:8080/api/test/health

## Current Configuration

The application is configured with:
- **Backend Port:** 8080
- **Frontend Port:** 5173
- **Database:** Supabase PostgreSQL (configured in application.yml)
- **Profile:** supabase (active by default)

## Troubleshooting

### Backend Issues

1. **Compilation Error:**
   ```bash
   cd backend
   ./mvnw clean compile
   ```
   If successful, try starting again.

2. **Port Already in Use:**
   - Kill any process using port 8080
   - Or change the port in `application.yml`

3. **Database Connection Issues:**
   - Check internet connection
   - Verify Supabase credentials in `application.yml`

### Frontend Issues

1. **Dependencies Missing:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Port Already in Use:**
   - Kill any process using port 5173
   - Vite will automatically suggest an alternative port

### General Issues

1. **CORS Errors:**
   - Ensure backend is running on port 8080
   - Ensure frontend is running on port 5173
   - Check browser console for specific errors

2. **API Connection Issues:**
   - Verify backend is accessible at http://localhost:8080
   - Check that both services are running
   - Look for error messages in terminal outputs

## Testing the Setup

1. **Backend Health Check:**
   - Open: http://localhost:8080/api/test/health
   - Should return: `{"status":"OK","message":"Menu.X Backend is running!"}`

2. **Frontend Access:**
   - Open: http://localhost:5173
   - Should show the Menu.X landing page

3. **Basic Functionality:**
   - Try registering a new restaurant owner
   - Test login functionality
   - Navigate through the dashboard

## Default Credentials

The application uses the following default configuration:
- Database: Supabase PostgreSQL (remote)
- JWT Secret: Hard-coded in application.yml
- Gemini API: Hard-coded in application.yml

## Stopping the Application

1. **Stop Backend:** Press `Ctrl+C` in the backend terminal
2. **Stop Frontend:** Press `Ctrl+C` in the frontend terminal

## Notes

- Both services must be running for full functionality
- The backend connects to a remote Supabase database
- No additional environment setup is required
- All configuration is in the application.yml file
