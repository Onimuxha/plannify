"use client"
import { useState, useEffect, useCallback } from "react"
import type { Activity, DaySchedule, ScheduledActivity } from "@/lib/data"
import { useLanguage } from "@/lib/language-context"
import { getActivities, saveActivities, getSchedules, saveSchedules } from "@/lib/storage"
import {
  generateRandomSchedule,
  getWeekDates,
  formatDateKey,
  recalculateScheduleTimes,
  parseTime,
  requestNotificationPermission,
  scheduleNotification,
} from "@/lib/schedule-utils"
import { Header } from "@/components/header"
import { ActivitiesManager } from "@/components/activities-manager"
import { WeeklySchedule } from "@/components/weekly-schedule"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { IconSparkles } from '@tabler/icons-react';

function ScheduleApp() {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [activities, setActivities] = useState<Activity[]>([])
  const [schedules, setSchedules] = useState<Record<string, DaySchedule>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    async function loadData() {
      const [loadedActivities, loadedSchedules] = await Promise.all([getActivities(), getSchedules()])
      setActivities(loadedActivities)
      setSchedules(loadedSchedules)
      setMounted(true)
    }
    loadData()
  }, [])

  const handleUpdateActivities = useCallback(async (newActivities: Activity[]) => {
    setActivities(newActivities)
    await saveActivities(newActivities)
  }, [])

  const handleToggleDayOff = useCallback(
    async (dateKey: string) => {
      const current = schedules[dateKey]
      const isDayOff = !current?.isDayOff
      const newSchedule: DaySchedule = {
        date: dateKey,
        isDayOff,
        activities: generateRandomSchedule(activities, isDayOff),
      }
      const updated = { ...schedules, [dateKey]: newSchedule }
      setSchedules(updated)
      await saveSchedules(updated)

      toast({
        description: language === "kh" ? "បានផ្លាស់ប្តូរស្ថានភាពថ្ងៃ" : "Day status updated",
      })
    },
    [activities, schedules, language, toast],
  )

  const handleToggleActivity = useCallback(
    async (dateKey: string, activityId: string) => {
      const current = schedules[dateKey]
      if (!current) return

      const updated = {
        ...schedules,
        [dateKey]: {
          ...current,
          activities: current.activities.map((a) => (a.id === activityId ? { ...a, completed: !a.completed } : a)),
        },
      }
      setSchedules(updated)
      await saveSchedules(updated)
    },
    [schedules],
  )

  const handleRemind = useCallback(
    async (activity: ScheduledActivity) => {
      const hasPermission = await requestNotificationPermission()

      if (!hasPermission) {
        toast({
          title: language === "kh" ? "ការជូនដំណឹង" : "Notifications",
          description: t.notificationPermission,
          variant: "destructive",
        })
        return
      }

      // Calculate delay until activity start time
      const now = new Date()
      const { hours, minutes } = parseTime(activity.startTime)
      const activityTime = new Date()
      activityTime.setHours(hours, minutes, 0, 0)

      const delayMs = activityTime.getTime() - now.getTime()
      const activityName = language === "kh" ? activity.nameKh : activity.name

      if (delayMs > 0) {
        scheduleNotification(
          language === "kh" ? "ការរំលឹក" : "Reminder",
          `${activityName} - ${activity.startTime}`,
          delayMs,
        )
        toast({
          title: t.reminderSet,
          description: `${t.reminderDescription} ${activity.startTime}`,
        })
      } else {
        // Activity time has passed, notify immediately
        scheduleNotification(language === "kh" ? "ការរំលឹក" : "Reminder", `${activityName} - ${activity.startTime}`, 0)
        toast({
          title: t.reminderSet,
          description: language === "kh" ? "ការជូនដំណឹងភ្លាមៗ" : "Notified immediately",
        })
      }
    },
    [language, toast, t],
  )

  const handleReorderActivities = useCallback(
    async (dateKey: string, reorderedActivities: ScheduledActivity[]) => {
      const current = schedules[dateKey]
      if (!current) return

      // Recalculate times based on the first activity's start time
      const startTime = reorderedActivities[0]?.startTime || "09:00 AM"
      const recalculated = recalculateScheduleTimes(reorderedActivities, startTime)

      const updated = {
        ...schedules,
        [dateKey]: {
          ...current,
          activities: recalculated,
        },
      }
      setSchedules(updated)
      await saveSchedules(updated)
    },
    [schedules],
  )

  const handleUpdateActivityTime = useCallback(
    async (dateKey: string, activityId: string, newStartTime: string) => {
      const current = schedules[dateKey]
      if (!current) return

      const activityIndex = current.activities.findIndex((a) => a.id === activityId)
      if (activityIndex === -1) return

      // Get activities from this one onwards and recalculate their times
      const activitiesBefore = current.activities.slice(0, activityIndex)
      const activitiesFromThis = current.activities.slice(activityIndex)
      const recalculated = recalculateScheduleTimes(activitiesFromThis, newStartTime)

      const updated = {
        ...schedules,
        [dateKey]: {
          ...current,
          activities: [...activitiesBefore, ...recalculated],
        },
      }
      setSchedules(updated)
      await saveSchedules(updated)

      toast({
        description: language === "kh" ? "បានកែម៉ោង" : "Time updated",
      })
    },
    [schedules, language, toast],
  )

  const handleUpdateDayStartTime = useCallback(
    async (dateKey: string, newStartTime: string) => {
      const current = schedules[dateKey]
      if (!current || current.activities.length === 0) return

      const recalculated = recalculateScheduleTimes(current.activities, newStartTime)

      const updated = {
        ...schedules,
        [dateKey]: {
          ...current,
          activities: recalculated,
        },
      }
      setSchedules(updated)
      await saveSchedules(updated)

      toast({
        description: language === "kh" ? "បានកែម៉ោងចាប់ផ្តើមថ្ងៃ" : "Day start time updated",
      })
    },
    [schedules, language, toast],
  )

  const handleGenerateSchedule = useCallback(async () => {
    const weekDates = getWeekDates()
    const newSchedules: Record<string, DaySchedule> = {}

    weekDates.forEach((date) => {
      const dateKey = formatDateKey(date)
      const existing = schedules[dateKey]
      const isDayOff = existing?.isDayOff || false
      newSchedules[dateKey] = {
        date: dateKey,
        isDayOff,
        activities: generateRandomSchedule(activities, isDayOff),
      }
    })

    setSchedules(newSchedules)
    await saveSchedules(newSchedules)
    toast({
      description: language === "kh" ? "បានបង្កើតកាលវិភាគ" : "Schedule generated",
    })
  }, [activities, schedules, language, toast])

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header {...({ title: t.title } as any)} />
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        <ActivitiesManager activities={activities} onUpdateActivities={handleUpdateActivities} />
        <WeeklySchedule
          schedules={schedules}
          onToggleDayOff={handleToggleDayOff}
          onToggleActivity={handleToggleActivity}
          onRemind={handleRemind}
          onReorderActivities={handleReorderActivities}
          onUpdateActivityTime={handleUpdateActivityTime}
          onUpdateDayStartTime={handleUpdateDayStartTime}
        />
        <Button onClick={handleGenerateSchedule} className="w-full glow-button">
          <IconSparkles className="mr-2 h-4 w-4" />
          {t.generateSchedule}
        </Button>
      </main>
    </div>
  )
}

export default ScheduleApp
