"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { User, School, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { UserRole } from "@/types/auth"

export default function CadastroPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<UserRole>("STUDENT")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRegister = async () => {
    const { name, email, password, confirmPassword } = formData
    
    if (!name || !email || !password || !confirmPassword) {
      alert("Por favor, preencha todos os campos.")
      return
    }

    if (password !== confirmPassword) {
      alert("As senhas não coincidem.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          role: selectedRole 
        })
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        const error = await response.text()
        alert(`Erro no cadastro: ${error}`)
      }
    } catch (error) {
      console.error("Registration error:", error)
      alert("Erro ao conectar com o servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm text-center p-8">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Conta Criada!</h2>
          <p className="text-muted-foreground mb-6">Sua conta foi criada com sucesso. Redirecionando para o login...</p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-1 text-center">
          <Link href="/login" className="absolute left-6 top-8 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <CardTitle className="font-mono text-2xl font-bold tracking-tight">Criar Nova Conta</CardTitle>
          <CardDescription className="text-muted-foreground text-xs uppercase tracking-widest font-semibold pt-2">
            Junte-se à revolução educacional
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "STUDENT", label: "Quero Aprender", icon: User },
              { id: "TEACHER", label: "Quero Ensinar", icon: School },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id as UserRole)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  selectedRole === role.id 
                    ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10" 
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <role.icon className="h-6 w-6" />
                <span className="text-[10px] font-bold uppercase">{role.label}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Nome Completo</Label>
              <Input 
                id="name" 
                placeholder="Seu nome" 
                className="bg-muted/50 border-border/50 focus:border-primary" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nome@exemplo.com" 
                className="bg-muted/50 border-border/50 focus:border-primary" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  className="bg-muted/50 border-border/50 focus:border-primary" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Confirmar</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  className="bg-muted/50 border-border/50 focus:border-primary" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
            <Button onClick={handleRegister} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 font-bold h-11 mt-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalizar Cadastro"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-center text-xs text-muted-foreground pb-8">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline ml-1">
            Faça login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
