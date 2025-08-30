import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { userAPI, profileAPI, notificationAPI } from '../services/api'
import { ensureFcmReadyAndRegister, getStoredFcmToken, removeWebFcmToken } from '../services/fcm'

export interface User {
  id: number
  username: string
  email: string
  fullName: string
  photoPath?: string | null
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
  switchUserContext: (userData: User, newToken: string) => void
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
  const [originalAdminToken, setOriginalAdminToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for stored authentication data on app load
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedAdminUser = localStorage.getItem('originalAdminUser')
    const storedAdminToken = localStorage.getItem('originalAdminToken')

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
            if (storedAdminToken) {
              setOriginalAdminToken(storedAdminToken)
            }
          } catch (adminError) {
            console.error('Error parsing admin user data:', adminError)
            localStorage.removeItem('originalAdminUser')
            localStorage.removeItem('originalAdminToken')
          }
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('originalAdminUser')
        localStorage.removeItem('originalAdminToken')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    // Best-effort: kick off FCM token registration for web
    // Do not await to keep UI responsive
    ensureFcmReadyAndRegister().catch((e) => console.warn('[FCM] registration after login failed', e))
  }

  const logout = () => {
    // Best-effort: remove FCM token on backend before clearing stored auth
    try {
      const fcmToken = getStoredFcmToken()
      if (fcmToken) {
        // Fire-and-forget backend removal while auth token still present in localStorage
        notificationAPI.removeFcmToken(fcmToken).catch((e: any) => {
          console.warn('[FCM] backend token removal on logout failed', e?.message || e)
        })
      }
      // Remove local FCM token from messaging and storage
      removeWebFcmToken(fcmToken || undefined, false).catch(() => {})
      try { localStorage.removeItem('fcm_web_token') } catch {}
    } catch {}

    setToken(null)
    setUser(null)
    setOriginalAdminUser(null)
    setOriginalAdminToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('originalAdminUser')
    localStorage.removeItem('originalAdminToken')
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

  const switchUserContext = (userData: User, newToken: string) => {
    // Save current admin user and token if not already saved
    if (user?.role === 'SUPER_ADMIN' && !originalAdminUser) {
      setOriginalAdminUser(user)
      setOriginalAdminToken(token)
      localStorage.setItem('originalAdminUser', JSON.stringify(user))
      localStorage.setItem('originalAdminToken', token || '')
    }

    // Update to new user and token
    setUser(userData)
    setToken(newToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', newToken)
  }

  const returnToAdmin = () => {
    if (originalAdminUser && originalAdminToken) {
      // Restore original admin user and token
      setUser(originalAdminUser)
      setToken(originalAdminToken)
      setOriginalAdminUser(null)
      setOriginalAdminToken(null)

      // Update localStorage with original admin data
      localStorage.setItem('user', JSON.stringify(originalAdminUser))
      localStorage.setItem('token', originalAdminToken)
      localStorage.removeItem('originalAdminUser')
      localStorage.removeItem('originalAdminToken')

      // Navigate back to admin dashboard
      window.location.href = '/admin'
    }
  }

  const refreshUser = useCallback(async () => {
    try {
      // Fetch fresh user data from the API
      const base = await userAPI.getCurrentProfile()
      // Merge role-specific profile to include photoPath and any updated identity fields
      let merged = { ...base } as User
      try {
        if (base?.role === 'RESTAURANT_OWNER') {
          const owner = await profileAPI.getOwnerProfile()
          merged = {
            ...merged,
            fullName: owner.fullName || merged.fullName,
            email: owner.email || merged.email,
            photoPath: owner.photoPath ?? merged.photoPath,
            restaurantName: owner.restaurant?.name || merged.restaurantName,
            restaurantId: owner.restaurant?.id || merged.restaurantId,
          }
        } else if (base?.role === 'SUPER_ADMIN') {
          const admin = await profileAPI.getAdminProfile()
          merged = {
            ...merged,
            fullName: admin.fullName || merged.fullName,
            email: admin.email || merged.email,
            photoPath: admin.photoPath ?? merged.photoPath,
          }
        }
      } catch (innerErr) {
        // If role-specific profile fails, continue with base
        console.warn('Role profile fetch failed, using base profile:', innerErr)
      }
      setUser(merged)
      localStorage.setItem('user', JSON.stringify(merged))
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

  // Keep in-memory token in sync when backend returns a refreshed token
  useEffect(() => {
    const onTokenRefreshed = (e: Event) => {
      const detail = (e as CustomEvent).detail as { token?: string } | undefined
      if (detail?.token) {
        setToken(detail.token)
        try {
          localStorage.setItem('token', detail.token)
        } catch {}
        // Refresh user profile to reflect potential identity changes (e.g., username)
        refreshUser().catch((err) => console.warn('refreshUser after token refresh failed:', err))
        // Re-register FCM token if needed after auth token refresh
        ensureFcmReadyAndRegister().catch(() => {})
      }
    }
    window.addEventListener('auth:token-refreshed', onTokenRefreshed as EventListener)
    return () => {
      window.removeEventListener('auth:token-refreshed', onTokenRefreshed as EventListener)
    }
  }, [refreshUser])

  // After app load/refresh, if authenticated, ensure FCM is registered
  // This covers the case where a page reload restores auth state but
  // FCM registration hasn't been triggered yet in this session.
  useEffect(() => {
    if (!isLoading && user && token) {
      ensureFcmReadyAndRegister().catch(() => {})
    }
  }, [isLoading, token, user?.id])

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
