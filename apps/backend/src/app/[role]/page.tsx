"use client"

import { useParams } from "next/navigation"

export default function RoleIndexPage() {
  const params = useParams()
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Role: {params.role}</h1>
      <p>Se você está vendo isso, a rota dinâmica está funcionando.</p>
    </div>
  )
}
