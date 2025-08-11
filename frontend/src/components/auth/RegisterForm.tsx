import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { authAPI } from '@/services/api'
import { QrCode, Eye, EyeOff } from 'lucide-react'

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: 'RESTAURANT_OWNER' as const,
    restaurantName: '',
    restaurantAddress: '',
    restaurantDescription: '',
    restaurantPhone: '',
    restaurantEmail: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate restaurant fields
    if (!formData.restaurantName.trim()) {
      setError('Restaurant name is required')
      setIsLoading(false)
      return
    }
    if (!formData.restaurantAddress.trim()) {
      setError('Restaurant address is required')
      setIsLoading(false)
      return
    }

    try {
      const response = await authAPI.register(formData)
      login(response.token, {
        id: response.id,
        username: response.username,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
        restaurantId: response.restaurantId
      })

      // Redirect based on role
      if (response.role === 'SUPER_ADMIN') {
        navigate('/admin')
      } else if (response.role === 'RESTAURANT_OWNER') {
        navigate('/dashboard')
      } else {
        navigate('/')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <QrCode className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">Menu.X</span>
          </div>
          <CardTitle className="text-2xl">Create Your Restaurant Account</CardTitle>
          <CardDescription>
            Register your restaurant to start using Menu.X's digital solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Choose a username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+880 1234 567890"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Restaurant Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="restaurantName">Restaurant Name *</Label>
                      <Input
                        id="restaurantName"
                        name="restaurantName"
                        type="text"
                        value={formData.restaurantName}
                        onChange={handleChange}
                        placeholder="Your restaurant name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="restaurantPhone">Restaurant Phone</Label>
                      <Input
                        id="restaurantPhone"
                        name="restaurantPhone"
                        type="tel"
                        value={formData.restaurantPhone}
                        onChange={handleChange}
                        placeholder="+880 1234 567890"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restaurantAddress">Restaurant Address *</Label>
                    <Input
                      id="restaurantAddress"
                      name="restaurantAddress"
                      type="text"
                      value={formData.restaurantAddress}
                      onChange={handleChange}
                      placeholder="Full restaurant address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="restaurantEmail">Restaurant Email</Label>
                      <Input
                        id="restaurantEmail"
                        name="restaurantEmail"
                        type="email"
                        value={formData.restaurantEmail}
                        onChange={handleChange}
                        placeholder="restaurant@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="restaurantDescription">Description</Label>
                      <Input
                        id="restaurantDescription"
                        name="restaurantDescription"
                        type="text"
                        value={formData.restaurantDescription}
                        onChange={handleChange}
                        placeholder="Brief description"
                      />
                    </div>
                  </div>
                </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
              </Link>
            </div>

            <div className="text-center">
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Back to Home
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
