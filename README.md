# Menu.X - Smart Digital Restaurant Communication System

Menu.X is a comprehensive digital restaurant management platform designed specifically for restaurants in Bangladesh. It modernizes the dining experience through QR-based menu viewing, digital ordering, and AI-powered features.

## 🚀 Features

### For Diners (Customers)
- **QR Code Menu Access**: Scan QR codes to view restaurant menus instantly
- **Mobile-First Design**: Optimized for smartphones and tablets
- **Digital Ordering**: Place orders directly from your device (Pro restaurants only)
- **Real-time Order Tracking**: Track your order status in real-time
- **Feedback System**: Submit ratings and reviews

### For Restaurant Owners
- **Menu Management**: Easy-to-use interface for managing menu items and categories
- **Table Management**: Organize tables and generate QR codes (Pro feature)
- **Live Order Management**: Real-time order tracking with Kanban-style interface (Pro feature)
- **AI Menu Writer**: Generate compelling menu descriptions using AI (Pro feature)
- **Analytics Dashboard**: Track sales, popular items, and customer feedback
- **QR Code Generation**: Create branded QR codes for tables and restaurant

### For Super Admins
- **User Management**: Manage restaurant owners and their accounts
- **Restaurant Management**: Oversee all restaurants on the platform
- **Platform Analytics**: System-wide statistics and insights
- **AI Configuration**: Manage AI providers and settings
- **Platform Settings**: Configure global platform settings

## 🛠 Technology Stack

### Backend
- **Java Spring Boot** - RESTful API with layered architecture
- **PostgreSQL** - Primary database (hosted on Supabase)
- **Spring Security** - JWT-based authentication and authorization
- **Flyway** - Database migrations
- **Maven** - Dependency management

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Lucide React** - Beautiful icons

### AI Integration
- **Flexible AI Provider Support** - Connect to various AI services like OpenAI, Google Gemini, OpenRouter, and other compatible providers.
- **Centralized Configuration** - Super Admins can add, manage, and prioritize AI providers from the dashboard.
- **Encrypted Storage** - All API keys are securely encrypted in the database.

## 📋 Prerequisites

- **Java 17+** - For running the Spring Boot backend
- **Node.js 18+** - For the React frontend
- **PostgreSQL** - Database (or Supabase account)
- **Maven** - For building the backend (or use included wrapper)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MenuX
```

### 2. Environment Setup

#### Backend Environment Variables
Create environment variables or use the provided setup scripts:

```bash
# Required Security Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
APP_ENCRYPTION_SECRET_KEY=your-encryption-key-for-ai-api-keys-32-chars

# Database Configuration (Supabase)
SUPABASE_DATABASE_URL=jdbc:postgresql://your-supabase-host:6543/postgres?sslmode=require
SUPABASE_DATABASE_USERNAME=your-username
SUPABASE_DATABASE_PASSWORD=your-password

# Optional Configuration
JWT_EXPIRATION=86400000
CORS_ALLOWED_ORIGINS=http://localhost:5173
PORT=8080
SPRING_PROFILES_ACTIVE=supabase
APP_FRONTEND_URL=http://localhost:5173
```

#### Frontend Environment Variables
Create `frontend/.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=Menu.X
VITE_APP_VERSION=1.0.0
```

### 3. Database Setup

The application uses Flyway for database migrations. When you start the backend, it will automatically create the required tables.

### 4. Start the Application

#### Option 1: Using Startup Scripts (Windows)
```bash
# Set your environment variables first
copy setup-env-example.bat setup-env.bat
# Edit setup-env.bat with your actual values
setup-env.bat

# Start both backend and frontend
start-menux.ps1
```

#### Option 2: Manual Start

**Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **H2 Console** (dev profile): http://localhost:8080/h2-console

## 👥 User Roles & Access

### Default Admin Account
After starting the application, create a Super Admin account through the registration page with role "SUPER_ADMIN".

### User Roles
1. **DINER** - Anonymous customers (no registration required)
2. **RESTAURANT_OWNER** - Restaurant managers and owners
3. **SUPER_ADMIN** - Platform administrators

## 🔧 Configuration

### AI Provider Setup
1. Login as Super Admin
2. Navigate to AI Configuration
3. Add your AI provider (Google Gemini, OpenAI, etc.)
4. Test the configuration
5. Set as primary provider

### Platform Settings
Super Admins can configure global settings including:
- Application name and version
- Pricing for Pro plans
- Feature toggles
- System limits

## 📚 API Documentation

The backend includes comprehensive API documentation. Key endpoints:

- **Authentication**: `/api/auth/*`
- **Restaurant Owner**: `/api/restaurant/*`, `/api/menu/*`, `/api/orders/*`
- **Super Admin**: `/api/admin/*`
- **Public**: `/api/public/menu/*`
- **AI Services**: `/api/ai/*`

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Granular permissions system
- **Encrypted AI Keys** - API keys stored encrypted in database
- **CORS Protection** - Configurable cross-origin resource sharing
- **Input Validation** - Comprehensive request validation
- **SQL Injection Prevention** - Parameterized queries and JPA

## 🚀 Deployment

### Production Environment Variables
Ensure all environment variables are properly set in production:

```bash
# Security (REQUIRED)
JWT_SECRET=<strong-production-secret>
APP_ENCRYPTION_SECRET_KEY=<strong-encryption-key>

# Database (REQUIRED)
DATABASE_URL=<production-database-url>
DATABASE_USERNAME=<production-username>
DATABASE_PASSWORD=<production-password>

# Application
PORT=8080
SPRING_PROFILES_ACTIVE=prod
CORS_ALLOWED_ORIGINS=https://yourdomain.com
APP_FRONTEND_URL=https://yourdomain.com
```

### Build for Production

**Backend:**
```bash
cd backend
./mvnw clean package -DskipTests
```

**Frontend:**
```bash
cd frontend
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: support@menux.com

## 🙏 Acknowledgments

- Built with Spring Boot and React
- UI components by shadcn/ui
- Icons by Lucide
- AI features powered by various large language models
