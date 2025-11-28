"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { type DaySchedule, daysOfWeek, type ScheduledActivity } from "@/lib/data"
import { useLanguage } from "@/lib/language-context"
import { isToday } from "@/lib/schedule-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { IconBell, IconBriefcase, IconClock, IconGripVertical, IconSettings2, IconSun } from "@tabler/icons-react"

function SortableActivity({
  activity,
  onToggle,
  onRemind,
  onEditTime,
  language,
}: {
  activity: ScheduledActivity
  onToggle: () => void
  onRemind: () => void
  onEditTime: () => void
  language: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-2 rounded-md border border-border bg-secondary/50 p-2 transition-all duration-200 hover:border-primary/30 ${
        activity.completed ? "opacity-60" : ""
      } ${isDragging ? "opacity-50 shadow-lg z-50" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab touch-none text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
      >
        <IconGripVertical className="h-4 w-4" />
      </button>
      <Checkbox
        checked={activity.completed}
        onCheckedChange={onToggle}
        className="mt-0.5 h-4 w-4 border-primary/50 data-[state=checked]:bg-primary"
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${activity.completed ? "line-through text-muted-foreground" : ""} ${language === "kh" ? "font-khmer" : ""}`}
        >
          {language === "kh" ? activity.nameKh : activity.name}
        </p>
        <button
          onClick={onEditTime}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <IconClock className="h-3 w-3" />
          {activity.startTime} - {activity.endTime}
        </button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onRemind}
      >
        <IconBell className="h-3 w-3" />
      </Button>
    </div>
  )
}

interface DayCardProps {
  date: Date
  dayIndex: number
  schedule: DaySchedule | null
  onToggleDayOff: () => void
  onToggleActivity: (activityId: string) => void
  onRemind: (activity: ScheduledActivity) => void
  onReorderActivities: (activities: ScheduledActivity[]) => void
  onUpdateActivityTime: (activityId: string, startTime: string) => void
  onUpdateDayStartTime: (startTime: string) => void
}

export function DayCard({
  date,
  dayIndex,
  schedule,
  onToggleDayOff,
  onToggleActivity,
  onRemind,
  onReorderActivities,
  onUpdateActivityTime,
  onUpdateDayStartTime,
}: DayCardProps) {
  const { t, language } = useLanguage()
  const today = isToday(date)
  const dayName = language === "kh" ? daysOfWeek[dayIndex].kh : daysOfWeek[dayIndex].en
  const isDayOff = schedule?.isDayOff || false

  const completedCount = schedule?.activities.filter((a) => a.completed).length || 0
  const totalCount = schedule?.activities.length || 0

  const [editingActivity, setEditingActivity] = useState<ScheduledActivity | null>(null)
  const [editingDayTime, setEditingDayTime] = useState(false)
  const [newStartTime, setNewStartTime] = useState("")
  const [dayStartTime, setDayStartTime] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id && schedule?.activities) {
      const oldIndex = schedule.activities.findIndex((a) => a.id === active.id)
      const newIndex = schedule.activities.findIndex((a) => a.id === over.id)
      const reordered = arrayMove(schedule.activities, oldIndex, newIndex)
      onReorderActivities(reordered)
    }
  }

  const handleEditActivityTime = (activity: ScheduledActivity) => {
    setEditingActivity(activity)
    setNewStartTime(activity.startTime)
  }

  const handleSaveActivityTime = () => {
    if (editingActivity && newStartTime) {
      onUpdateActivityTime(editingActivity.id, newStartTime)
      setEditingActivity(null)
    }
  }

  const handleEditDayTime = () => {
    const firstActivity = schedule?.activities[0]
    setDayStartTime(firstActivity?.startTime || (isDayOff ? "09:00" : "18:00"))
    setEditingDayTime(true)
  }

  const handleSaveDayTime = () => {
    onUpdateDayStartTime(dayStartTime)
    setEditingDayTime(false)
  }

  return (
    <>
      <Card
        className={`transition-all duration-300 ${
          today ? "glow-border border-primary/50 bg-card" : "border-border bg-card hover:border-primary/30"
        }`}
      >
        <CardHeader className="space-y-2 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle
              className={`text-lg ${language === "kh" ? "font-khmer" : ""} ${today ? "glow-text text-primary" : ""}`}
            >
              {dayName}
            </CardTitle>
            <div className="flex items-center gap-1">
              {today && (
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  {t.today}
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleEditDayTime}>
                <IconSettings2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {date.toLocaleDateString(language === "kh" ? "km-KH" : "en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
          <Button
            variant={isDayOff ? "default" : "secondary"}
            size="sm"
            onClick={onToggleDayOff}
            className="w-full transition-all duration-200"
          >
            {isDayOff ? (
              <>
                <IconSun className="mr-2 h-4 w-4" />
                <span className={language === "kh" ? "font-khmer" : ""}>{t.dayOff}</span>
              </>
            ) : (
              <>
                <IconBriefcase className="mr-2 h-4 w-4" />
                <span className={language === "kh" ? "font-khmer" : ""}>{t.workDay}</span>
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {totalCount > 0 && (
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {completedCount}/{totalCount} {t.completed}
              </span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {schedule?.activities && schedule.activities.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={schedule.activities.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {schedule.activities.map((activity) => (
                    <SortableActivity
                      key={activity.id}
                      activity={activity}
                      onToggle={() => onToggleActivity(activity.id)}
                      onRemind={() => onRemind(activity)}
                      onEditTime={() => handleEditActivityTime(activity)}
                      language={language}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className={`py-4 text-center text-sm text-muted-foreground ${language === "kh" ? "font-khmer" : ""}`}>
              {t.noActivities}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingActivity} onOpenChange={() => setEditingActivity(null)}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className={language === "kh" ? "font-khmer" : ""}>{t.editSchedule}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className={`font-medium ${language === "kh" ? "font-khmer" : ""}`}>
              {language === "kh" ? editingActivity?.nameKh : editingActivity?.name}
            </p>
            <div className="space-y-2">
              <Label htmlFor="startTime">{t.startTime}</Label>
              <Input
                id="startTime"
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="bg-secondary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingActivity(null)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSaveActivityTime}>{t.save}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editingDayTime} onOpenChange={setEditingDayTime}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className={language === "kh" ? "font-khmer" : ""}>{t.editDayTime}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dayStartTime">{t.dayStartTime}</Label>
              <Input
                id="dayStartTime"
                type="time"
                value={dayStartTime}
                onChange={(e) => setDayStartTime(e.target.value)}
                className="bg-secondary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingDayTime(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSaveDayTime}>{t.save}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
