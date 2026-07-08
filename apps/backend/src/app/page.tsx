"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function HomePage() {
  const router = useRouter()
  const { role, user } = useAuth()

  useEffect(() => {
    if (user && role) {
      router.push("/" + role.toLowerCase() + "/dashboard")
    } else {
      router.push("/login")
    }
  }, [router, role, user])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-pulse font-mono text-primary">Carregando SophIA...</div>
    </div>
  )
}
