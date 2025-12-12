class BackgroundNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.checkSupport();
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private checkSupport() {
    this.isSupported = 
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'Notification' in window;
  }

  async initialize(): Promise<boolean> {
    if (!this.isSupported || this.isInitialized) return this.isInitialized;

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      
      if (this.registration.installing) {
        await new Promise((resolve) => {
          this.registration!.installing!.addEventListener('statechange', (e: any) => {
            if (e.target.state === 'activated') resolve(true);
          });
        });
      } else if (this.registration.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      await navigator.serviceWorker.ready;
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      alert('Your browser does not support notifications');
      return false;
    }

    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        alert('Failed to initialize notification service');
        return false;
      }
    }

    if (Notification.permission === 'granted') {
      // Don't send test notification - removed to avoid duplicate
      return true;
    }

    if (Notification.permission === 'denied') {
      alert('Notifications blocked. Enable them in browser settings:\n\n1. Click the lock icon in address bar\n2. Allow notifications\n3. Refresh the page');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Permission granted, no test notification needed
        return true;
      } else {
        alert('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async scheduleNotification(
    id: string,
    title: string,
    body: string,
    scheduledTime: Date
  ): Promise<boolean> {
    if (!this.isInitialized) await this.initialize();
    if (!this.registration || Notification.permission !== 'granted') return false;

    try {
      const sw = this.registration.active || this.registration.waiting || this.registration.installing;
      if (!sw) return false;

      sw.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        id,
        title,
        body,
        scheduledTime: scheduledTime.toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return false;
    }
  }

  cancelNotification(id: string) {
    if (this.registration?.active) {
      this.registration.active.postMessage({
        type: 'CANCEL_NOTIFICATION',
        id,
      });
    }
  }

  hasPermission(): boolean {
    return Notification.permission === 'granted';
  }

  isReady(): boolean {
    return this.isSupported && this.isInitialized && this.registration !== null;
  }
}

export const backgroundNotifications = new BackgroundNotificationManager();

export async function requestBackgroundNotificationPermission(): Promise<boolean> {
  return backgroundNotifications.requestPermission();
}

export async function scheduleBackgroundNotification(
  activityId: string,
  activityName: string,
  time: string
): Promise<boolean> {
  const scheduledTime = parseTimeToDate(time);
  return backgroundNotifications.scheduleNotification(
    activityId,
    activityName, // Just the activity name, not "Time to: ..."
    `${time}`, // Just show the time
    scheduledTime
  );
}

export function cancelBackgroundNotification(activityId: string) {
  backgroundNotifications.cancelNotification(activityId);
}

function parseTimeToDate(timeStr: string): Date {
  const now = new Date();
  const scheduledTime = new Date();
  
  let hours: number, minutes: number;
  timeStr = timeStr.trim();
  
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    const isPM = timeStr.toLowerCase().includes('pm');
    const cleanTime = timeStr.replace(/AM|PM|am|pm/gi, '').trim();
    const parts = cleanTime.split(':');
    hours = parseInt(parts[0]);
    minutes = parts[1] ? parseInt(parts[1]) : 0;
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  } else {
    const parts = timeStr.split(':');
    hours = parseInt(parts[0]);
    minutes = parts[1] ? parseInt(parts[1]) : 0;
  }
  
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    const fallback = new Date();
    fallback.setMinutes(fallback.getMinutes() + 1);
    return fallback;
  }
  
  scheduledTime.setHours(hours, minutes, 0, 0);
  
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  return scheduledTime;
}