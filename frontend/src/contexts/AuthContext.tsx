import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: 'DINER' | 'RESTAURANT_OWNER' | 'SUPER_ADMIN'
  restaurantId?: number
  restaurantName?: string
  subscriptionPlan?: 'BASIC' | 'PRO'
}

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
  updateUserPlan: (plan: 'BASIC' | 'PRO') => void
  switchUserContext: (userData: User) => void
  refreshUser: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored authentication data on app load
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    // Check for test data that might override stored user
    const testPlan = localStorage.getItem('test_user_plan')
    const testUserData = localStorage.getItem('test_user_data')

    if (storedToken && storedUser) {
      try {
        let parsedUser = JSON.parse(storedUser)

        // Override with test data if available
        if (testPlan && testUserData) {
          try {
            const parsedTestUser = JSON.parse(testUserData)
            parsedUser = { ...parsedUser, ...parsedTestUser, subscriptionPlan: testPlan }
          } catch (testError) {
            console.error('Error parsing test user data:', testError)
          }
        }

        setToken(storedToken)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('test_user_plan')
    localStorage.removeItem('test_user_data')
  }

  const updateUserPlan = (plan: 'BASIC' | 'PRO') => {
    if (user) {
      const updatedUser = { ...user, subscriptionPlan: plan }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      localStorage.setItem('test_user_plan', plan)
      localStorage.setItem('test_user_data', JSON.stringify(updatedUser))
    }
  }

  const switchUserContext = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('test_user_plan', userData.subscriptionPlan || 'BASIC')
    localStorage.setItem('test_user_data', JSON.stringify(userData))
  }

  const refreshUser = async () => {
    // Check for test data first
    const testPlan = localStorage.getItem('test_user_plan')
    const testUserData = localStorage.getItem('test_user_data')

    if (testPlan && testUserData && user) {
      try {
        const parsedTestUser = JSON.parse(testUserData)
        setUser(parsedTestUser)
        return
      } catch (error) {
        console.error('Error parsing test user data:', error)
      }
    }

    // In a real app, this would fetch fresh user data from the API
    // For now, we'll just update from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
      }
    }
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isLoading,
    updateUserPlan,
    switchUserContext,
    refreshUser,
    isAdmin: user?.role === 'SUPER_ADMIN'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
