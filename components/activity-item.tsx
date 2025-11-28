"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Activity } from "@/lib/data"
import { useLanguage } from "@/lib/language-context"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { IconClock, IconEdit, IconGripVertical, IconTrash } from "@tabler/icons-react"

interface ActivityItemProps {
  activity: Activity
  onToggle: (id: string) => void
  onEdit: (activity: Activity) => void
  onDelete: (id: string) => void
  showTime?: boolean
  startTime?: string
  endTime?: string
}

export function ActivityItem({
  activity,
  onToggle,
  onEdit,
  onDelete,
  showTime,
  startTime,
  endTime,
}: ActivityItemProps) {
  const { language } = useLanguage()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:border-primary/50 ${
        isDragging ? "opacity-50 shadow-lg glow-border-subtle" : ""
      } ${activity.completed ? "opacity-60" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
      >
        <IconGripVertical className="h-4 w-4" />
      </button>

      <Checkbox
        checked={activity.completed}
        onCheckedChange={() => onToggle(activity.id)}
        className="h-5 w-5 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
      />

      <div className="flex-1 min-w-0">
        <p
          className={`truncate font-medium ${activity.completed ? "line-through text-muted-foreground" : ""} ${language === "kh" ? "font-khmer" : ""}`}
        >
          {language === "kh" ? activity.nameKh : activity.name}
        </p>
        {showTime && startTime && endTime && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconClock className="h-3 w-3" />
            {startTime} - {endTime}
          </p>
        )}
      </div>

      <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">{activity.duration}m</span>

      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(activity)}>
          <IconEdit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(activity.id)}
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
