"use client"

import { Bot, User, Send, Plus, Lightbulb, Pencil, ClipboardList, GraduationCap, BookOpen, CheckCircle2, MessageSquare, Copy, Check, FileUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

import { useAuth } from "@/components/auth-provider"

type Message = { id: string; role: 'user' | 'assistant'; content: string };
type Conversation = { id: string; title: string; messages: Message[]; currentTheme: string | null; progress: number };

export default function TutorPage() {
  const { user, role } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      alert("Por favor, envie apenas arquivos PDF.")
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/pdf-extract", {
        method: "POST",
        body: formData
      })

      if (!res.ok) {
        throw new Error("Erro ao extrair texto do PDF")
      }

      const data = await res.json()
      
      if (data.text) {
        await sendMessage(`Aqui está o conteúdo de um PDF com exercícios que preciso de ajuda para resolver. Por favor, resolva passo a passo:\n\n${data.text.substring(0, 10000)}`) // Limitando tamanho por segurança
      }
    } catch (error) {
      console.error(error)
      alert("Falha ao ler o PDF.")
      setIsLoading(false)
    }
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit"
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`
    }
  }, [input])

  // Carregar histórico do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sophia_chat_history');
    if (saved) {
      setConversations(JSON.parse(saved));
    }
  }, []);

  // Salvar histórico no localStorage
  useEffect(() => {
    localStorage.setItem('sophia_chat_history', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const saveCurrentConversation = () => {
    if (messages.length === 0) return;
    
    const title = messages[0].content.substring(0, 30) + '...';
    if (activeConversationId) {
      setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, messages, currentTheme, progress } : c));
    } else {
      const newConv: Conversation = { id: Date.now().toString(), title, messages, currentTheme, progress };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
    }
  }

  const startNewChat = () => {
    saveCurrentConversation();
    setActiveConversationId(null);
    setMessages([]);
    setCurrentTheme(null);
    setProgress(0);
  }

  const loadConversation = (id: string) => {
    saveCurrentConversation();
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setActiveConversationId(conv.id);
      setMessages(conv.messages);
      setCurrentTheme(conv.currentTheme);
      setProgress(conv.progress);
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Falha ao copiar:", err)
    }
  }

  if (role !== 'STUDENT') {
    return <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center"><h2 className="text-2xl font-bold">Acesso Negado</h2></div>
  }

  const sendMessage = async (text: string) => {
    const newUserMessage = { id: Date.now().toString(), role: 'user' as const, content: text }
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          userId: user?.id
        }),
      })

      if (!response.ok) throw new Error('Falha ao enviar mensagem')

      const data = await response.json()
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.content }])
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return
    
    const currentInput = input
    setInput("")
    await sendMessage(currentInput)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex h-[calc(100vh-160px)] gap-4 overflow-hidden">
      <Card className="hidden w-64 flex-col border-border/50 bg-muted/30 md:flex">
        <div className="p-4 space-y-2">
          <Button className="w-full" variant="outline" onClick={startNewChat}><Plus className="mr-2 h-4 w-4" /> Nova conversa</Button>
        </div>
        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Button key={conv.id} variant={activeConversationId === conv.id ? "secondary" : "ghost"} className="w-full justify-start text-xs" onClick={() => loadConversation(conv.id)}>
                <MessageSquare className="mr-2 h-3 w-3" /> {conv.title}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="flex flex-1 flex-col overflow-hidden border-border/50 bg-muted/30">
        <div ref={scrollRef} className="flex-1 p-6 h-full w-full overflow-y-auto">
          <div className="space-y-8 min-h-max max-w-4xl mx-auto w-full">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0 border border-border/50">
                  <AvatarFallback className={`${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"} font-bold text-[10px]`}>
                    {m.role === "user" ? "VOCÊ" : "SOP"}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col gap-2 max-w-[85%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-card border border-border/50 rounded-tl-none prose dark:prose-invert max-w-none"
                  }`}>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{m.content}</ReactMarkdown>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity self-start"
                    onClick={() => copyToClipboard(m.content, m.id)}
                  >
                    {copiedId === m.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  {/* Fallback button for mobile or non-hover devices */}
                  <button 
                    onClick={() => copyToClipboard(m.content, m.id)}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-1 px-1"
                  >
                    {copiedId === m.id ? (
                      <><Check className="h-3 w-3 text-green-500" /> Copiado</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copiar</>
                    )}
                  </button>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <Avatar className="h-8 w-8 shrink-0 animate-pulse bg-muted"></Avatar>
                <div className="text-sm text-muted-foreground animate-pulse mt-2">SophIA está gerando resposta...</div>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-border/50 bg-card/50 p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3 items-end bg-background border border-border/50 rounded-xl p-2 shadow-sm">
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-lg shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Anexar PDF"
            >
              <FileUp className="h-5 w-5" />
            </Button>
            <Textarea 
              ref={textareaRef}
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={handleKeyDown}
              placeholder="Envie uma mensagem ou anexe um PDF para SophIA..." 
              className="flex-1 min-h-[44px] max-h-[200px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-none py-3 px-3 scrollbar-hide"
            />
            <Button 
              type="submit" 
              disabled={isLoading || (!input.trim() && !fileInputRef.current?.files?.length)} 
              size="icon"
              className="h-9 w-9 rounded-lg shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            SophIA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </Card>
    </div>
  )
}
