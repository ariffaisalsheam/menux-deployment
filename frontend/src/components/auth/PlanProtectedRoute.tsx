import React from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, Lock } from 'lucide-react'

interface PlanProtectedRouteProps {
  children: React.ReactNode
  requiredPlan: 'BASIC' | 'PRO'
  fallbackComponent?: React.ReactNode
}

export default function PlanProtectedRoute({
  children,
  requiredPlan,
  fallbackComponent
}: PlanProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required subscription plan
  const userPlan = user?.subscriptionPlan || 'BASIC'
  const hasRequiredPlan = requiredPlan === 'BASIC' || userPlan === 'PRO'

  if (!hasRequiredPlan) {
    // Show upgrade prompt or custom fallback component
    if (fallbackComponent) {
      return <>{fallbackComponent}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-yellow-600" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Crown className="w-5 h-5 text-yellow-500" />
              Pro Feature Required
            </CardTitle>
            <CardDescription className="text-base">
              This feature is only available to Pro subscribers. Upgrade your plan to access advanced functionality.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-sm mb-2">Pro Features Include:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Live order management</li>
                <li>• AI-powered menu descriptions</li>
                <li>• Advanced analytics</li>
                <li>• Customer feedback analysis</li>
                <li>• QR code ordering system</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              <Button
                className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                onClick={() => navigate('/dashboard/upgrade')}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
