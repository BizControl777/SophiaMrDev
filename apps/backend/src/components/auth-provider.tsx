"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { User, UserRole, AuthContextType } from "@/types/auth"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STUDENT_ID = "99b44874-18f1-4d86-a54d-703561e52c4d"
const TEACHER_ID = "b47ccd52-c637-4987-b91d-ebbe96c8d7a2"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/user?id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Tentar recuperar usuário salvo no navegador primeiro
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem("sophia_user_id") : null;
    
    if (savedUserId) {
      fetchUser(savedUserId);
    } else {
      // Fallback para o protótipo se for a primeira vez
      fetchUser(STUDENT_ID);
    }
  }, [])

  const refreshUser = async () => {
    if (user?.id) {
      await fetchUser(user.id)
    }
  }

  const login = (userData: User) => {
    localStorage.setItem("sophia_user_id", userData.id);
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("sophia_user_id");
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, isLoading, login, logout, refreshUser }}>
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
