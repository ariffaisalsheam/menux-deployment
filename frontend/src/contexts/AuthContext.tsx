import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { userAPI } from '../services/api'

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
  originalAdminUser: User | null
  returnToAdmin: () => void
  isViewingAsUser: boolean
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
  const [originalAdminUser, setOriginalAdminUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for stored authentication data on app load
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedAdminUser = localStorage.getItem('originalAdminUser')

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)

        // Restore admin session if exists
        if (storedAdminUser) {
          try {
            const parsedAdminUser = JSON.parse(storedAdminUser)
            setOriginalAdminUser(parsedAdminUser)
          } catch (adminError) {
            console.error('Error parsing admin user data:', adminError)
            localStorage.removeItem('originalAdminUser')
          }
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('originalAdminUser')
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
    setOriginalAdminUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('originalAdminUser')
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
    // Save current admin user if not already saved
    if (user?.role === 'SUPER_ADMIN' && !originalAdminUser) {
      setOriginalAdminUser(user)
      localStorage.setItem('originalAdminUser', JSON.stringify(user))
    }

    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const returnToAdmin = () => {
    if (originalAdminUser) {
      setUser(originalAdminUser)
      setOriginalAdminUser(null)
      localStorage.setItem('user', JSON.stringify(originalAdminUser))
      localStorage.removeItem('originalAdminUser')
      // Navigate back to admin dashboard
      window.location.href = '/admin'
    }
  }

  const refreshUser = useCallback(async () => {
    try {
      // Fetch fresh user data from the API
      const freshUserData = await userAPI.getCurrentProfile()
      setUser(freshUserData)
      localStorage.setItem('user', JSON.stringify(freshUserData))
    } catch (error) {
      console.error('Error refreshing user data:', error)
      // Fallback to localStorage data
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError)
        }
      }
    }
  }, [])

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
    isAdmin: user?.role === 'SUPER_ADMIN',
    originalAdminUser,
    returnToAdmin,
    isViewingAsUser: !!originalAdminUser && user?.role !== 'SUPER_ADMIN'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
