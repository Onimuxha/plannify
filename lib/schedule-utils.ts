import type { Activity, ScheduledActivity } from "./data"

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function formatTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  const displayMinutes = minutes.toString().padStart(2, "0")
  return `${displayHours}:${displayMinutes} ${period}`
}

export function parseTime(timeStr: string): { hours: number; minutes: number } {
  // Handle both "HH:MM" and "H:MM AM/PM" formats
  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    const [time, period] = timeStr.split(" ")
    const [h, m] = time.split(":").map(Number)
    let hours = h
    if (period === "PM" && h !== 12) hours += 12
    if (period === "AM" && h === 12) hours = 0
    return { hours, minutes: m }
  }
  const [hours, minutes] = timeStr.split(":").map(Number)
  return { hours, minutes }
}

export function generateRandomSchedule(activities: Activity[], isDayOff: boolean): ScheduledActivity[] {
  const shuffled = shuffleArray(activities.filter((a) => !a.completed))
  const startHour = isDayOff ? (Math.random() > 0.5 ? 9 : 10) : Math.random() > 0.5 ? 18 : 19
  let currentHour = startHour
  let currentMinute = 0

  return shuffled.map((activity) => {
    const randomDuration = Math.max(15, activity.duration + Math.floor(Math.random() * 20) - 10)
    const startTime = formatTime(currentHour, currentMinute)

    currentMinute += randomDuration
    while (currentMinute >= 60) {
      currentMinute -= 60
      currentHour += 1
    }

    const endTime = formatTime(currentHour, currentMinute)

    return {
      ...activity,
      duration: randomDuration,
      startTime,
      endTime,
    }
  })
}

export function recalculateScheduleTimes(activities: ScheduledActivity[], startTimeStr: string): ScheduledActivity[] {
  const { hours: startHour, minutes: startMinute } = parseTime(startTimeStr)
  let currentHour = startHour
  let currentMinute = startMinute

  return activities.map((activity) => {
    const startTime = formatTime(currentHour, currentMinute)

    currentMinute += activity.duration
    while (currentMinute >= 60) {
      currentMinute -= 60
      currentHour += 1
    }

    const endTime = formatTime(currentHour, currentMinute)

    return {
      ...activity,
      startTime,
      endTime,
    }
  })
}

export function getWeekDates(): Date[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return date
  })
}

export function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported in this browser")
    return false
  }
  if (Notification.permission === "granted") return true
  if (Notification.permission === "denied") return false

  try {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  } catch (error) {
    console.error("Error requesting notification permission:", error)
    return false
  }
}

export function scheduleNotification(title: string, body: string, delayMs: number) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.warn("Notifications not permitted")
    return
  }

  const showNotification = () => {
    try {
      // Use service worker if available (PWA)
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: "/icon-192x192.jpg",
            badge: "/icon-192x192.jpg",
            tag: "activity-notification",
            requireInteraction: true,
          })
        })
      } else {
        // Fallback for browsers without service worker
        new Notification(title, {
          body,
          icon: "/icon-192x192.jpg",
          badge: "/icon-192x192.jpg",
          tag: "activity-notification",
          requireInteraction: true,
        })
      }
    } catch (error) {
      console.error("Error showing notification:", error)
    }
  }

  if (delayMs <= 0) {
    showNotification()
  } else {
    setTimeout(showNotification, delayMs)
  }
}
