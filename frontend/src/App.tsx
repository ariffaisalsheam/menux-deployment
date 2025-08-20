import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import LandingPage from './components/LandingPage'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import { PublicMenu } from './pages/PublicMenu'
import ErrorBoundary from './components/common/ErrorBoundary'
import NetworkStatusIndicator from './components/common/NetworkStatusIndicator'
import { ToastProvider } from './contexts/ToastContext'
// Removed dev-only utilities import; file not present

// Inline placeholder removed to use the real Super Admin dashboard page

const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
      <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
    </div>
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <NetworkStatusIndicator className="fixed top-0 left-0 right-0 z-50" />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="/menu/:restaurantId" element={<PublicMenu />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard/*"
                    element={
                      <ProtectedRoute requiredRole="RESTAURANT_OWNER">
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute requiredRole="SUPER_ADMIN">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </div>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
