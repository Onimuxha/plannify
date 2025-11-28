"use client"

import { useState, useEffect } from "react"
import type { Activity } from "@/lib/data"
import { useLanguage } from "@/lib/language-context"
import { generateId } from "@/lib/storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconClock, IconLanguage, IconTypeface } from "@tabler/icons-react"

interface ActivityModalProps {
  open: boolean
  onClose: () => void
  onSave: (activity: Activity) => void
  activity?: Activity | null
}

export function ActivityModal({ open, onClose, onSave, activity }: ActivityModalProps) {
  const { t, language } = useLanguage()
  const [name, setName] = useState("")
  const [nameKh, setNameKh] = useState("")
  const [duration, setDuration] = useState(30)

  useEffect(() => {
    if (activity) {
      setName(activity.name)
      setNameKh(activity.nameKh)
      setDuration(activity.duration)
    } else {
      setName("")
      setNameKh("")
      setDuration(30)
    }
  }, [activity, open])

  const handleSave = () => {
    if (!name.trim()) return

    onSave({
      id: activity?.id || generateId(),
      name: name.trim(),
      nameKh: nameKh.trim() || name.trim(),
      duration,
      completed: activity?.completed || false,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className={`text-2xl font-bold ${language === "kh" ? "font-khmer" : ""}`}>
            {activity ? t.editActivity : t.addActivity}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {activity ? "Update your activity details" : "Create a new activity for your planner"}
          </p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* English Name */}
          <div className="space-y-2.5">
            <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
              <IconTypeface className="h-4 w-4 text-primary" />
              English Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Exercise"
              className="bg-muted/50 border-muted-foreground/20 focus:border-primary h-11 px-4"
              autoFocus
            />
          </div>

          {/* Khmer Name */}
          <div className="space-y-2.5">
            <Label htmlFor="nameKh" className="text-sm font-semibold flex items-center gap-2 font-khmer">
              <IconLanguage className="h-4 w-4 text-primary" />
              ឈ្មោះខ្មែរ
            </Label>
            <Input
              id="nameKh"
              value={nameKh}
              onChange={(e) => setNameKh(e.target.value)}
              placeholder="ឧ. ហាត់ប្រាណព្រឹក"
              className="bg-muted/50 border-muted-foreground/20 focus:border-primary h-11 px-4 font-khmer"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2.5">
            <Label htmlFor="duration" className={`text-sm font-semibold flex items-center gap-2 ${language === "kh" ? "font-khmer" : ""}`}>
              <IconClock className="h-4 w-4 text-primary" />
              {t.duration}
            </Label>
            <div className="relative">
              <Input
                id="duration"
                type="text"
                min={5}
                max={240}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-muted/50 border-muted-foreground/20 focus:border-primary h-11 px-4 pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                minutes
              </span>
            </div>
            <p className="text-xs text-muted-foreground pl-1">
              Recommended: 15-60 minutes per activity
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 h-11"
          >
            <span className={language === "kh" ? "font-khmer" : ""}>{t.cancel}</span>
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim()}
            className="flex-1 h-11 font-semibold"
          >
            <span className={language === "kh" ? "font-khmer" : ""}>{t.save}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}