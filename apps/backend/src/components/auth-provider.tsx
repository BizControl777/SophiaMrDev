"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { User, UserRole, AuthContextType } from "@/types/auth"
import { authFetch, setAuthToken } from "@/lib/auth-fetch"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCurrentUser = async () => {
    setIsLoading(true)
    try {
      // Cookie httpOnly and/or Bearer localStorage — API accepts both
      const response = await authFetch("/api/user")
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      } else {
        setAuthToken(null)
        setUser(null)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setAuthToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const refreshUser = async () => {
    await fetchCurrentUser()
  }

  const login = (userData: User, token: string) => {
    setAuthToken(token)
    setUser(userData)
  }

  const logout = () => {
    setAuthToken(null)
    localStorage.removeItem("sophia_user_id")
    setUser(null)
    void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
  }

  return (
    <AuthContext.Provider
      value={{ user, role: (user?.role as UserRole) || null, isLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
