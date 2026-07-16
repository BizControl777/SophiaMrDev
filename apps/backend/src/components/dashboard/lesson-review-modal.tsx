"use client"

import { authFetch } from "@/lib/auth-fetch"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2, CheckCircle2 } from "lucide-react"

interface LessonReviewModalProps {
  lesson: any
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function LessonReviewModal({ lesson, isOpen, onClose, onUpdate }: LessonReviewModalProps) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!lesson) return
    setIsSubmitting(true)
    
    try {
      const response = await authFetch("/api/lessons/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonRequestId: lesson.id,
          rating,
          comment
        })
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onUpdate()
          onClose()
          setSuccess(false)
          setComment("")
          setRating(5)
        }, 1500)
      }
    } catch (error) {
      console.error("Error submitting review:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!lesson) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-border/50 bg-card">
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-center">Avaliação Enviada!</h3>
            <p className="text-sm text-muted-foreground text-center">Obrigado por partilhar o seu feedback.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Avaliar Aula</DialogTitle>
              <DialogDescription className="text-center">
                Como foi a aula de <strong>{lesson.subject}</strong> com Prof. <strong>{lesson.teacherName}</strong>?
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 flex flex-col items-center space-y-6">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="transition-transform hover:scale-110 focus:outline-none"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="w-full space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Deixe um comentário (Opcional)</label>
                <Textarea
                  placeholder="O professor foi claro? Os materiais ajudaram?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="resize-none h-24"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-accent hover:bg-accent/90 font-bold text-white">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Avaliação"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
