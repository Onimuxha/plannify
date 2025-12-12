// lib/background-notifications.ts
// Complete notification system that works with your service worker

class BackgroundNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.checkSupport();
    // Auto-initialize when created
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
    if (!this.isSupported) {
      console.error('❌ Background notifications not supported in this browser');
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    try {
      // Register service worker if not already registered
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registered:', this.registration);

      // Wait for service worker to be active
      if (this.registration.installing) {
        console.log('⏳ Service Worker installing...');
        await new Promise((resolve) => {
          this.registration!.installing!.addEventListener('statechange', (e: any) => {
            if (e.target.state === 'activated') {
              resolve(true);
            }
          });
        });
      } else if (this.registration.waiting) {
        console.log('⏳ Service Worker waiting...');
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready!');
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      alert('❌ Your browser does not support notifications.\n\nPlease use:\n• Chrome/Edge (desktop & Android)\n• Firefox\n• Safari (iOS 16.4+)');
      return false;
    }

    // Make sure service worker is initialized
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        alert('❌ Failed to initialize notification service. Please refresh the page and try again.');
        return false;
      }
    }

    // Check current permission
    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      this.sendTestNotification();
      return true;
    }

    if (Notification.permission === 'denied') {
      alert('❌ Notifications are blocked!\n\nTo enable:\n\n1. Click the 🔒 lock icon in the address bar\n2. Find "Notifications" and set to "Allow"\n3. Refresh this page\n4. Try again');
      return false;
    }

    // Request permission
    try {
      console.log('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted!');
        this.sendTestNotification();
        return true;
      } else if (permission === 'denied') {
        alert('❌ You blocked notifications. Please enable them in your browser settings.');
        return false;
      } else {
        alert('⚠️ Notification permission was dismissed. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      alert('❌ Failed to request permission. Please try again.');
      return false;
    }
  }

  private sendTestNotification() {
    if (this.registration && Notification.permission === 'granted') {
      this.registration.showNotification('🔔 Notifications Enabled!', {
        body: 'You will receive activity reminders even when the browser is closed',
        icon: '/icon-192x192.jpg',
        badge: '/icon-192x192.jpg',
        tag: 'test-notification',
        requireInteraction: false,
        // vibrate: [200, 100, 200],
      });
    }
  }

  async scheduleNotification(
    id: string,
    title: string,
    body: string,
    scheduledTime: Date
  ): Promise<boolean> {
    // Ensure initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.registration) {
      console.error('❌ Service worker not registered');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.error('❌ Notification permission not granted');
      return false;
    }

    try {
      // Get active service worker
      const sw = this.registration.active || this.registration.waiting || this.registration.installing;
      
      if (!sw) {
        console.error('❌ No active service worker found');
        return false;
      }

      // Send message to service worker
      sw.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        id,
        title,
        body,
        scheduledTime: scheduledTime.toISOString(),
      });

      const now = new Date();
      const delay = scheduledTime.getTime() - now.getTime();
      
      console.log('📅 Notification scheduled:');
      console.log('   ID:', id);
      console.log('   Title:', title);
      console.log('   Body:', body);
      console.log('   Time:', scheduledTime.toLocaleString());
      console.log('   Delay:', Math.round(delay / 1000), 'seconds');

      return true;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return false;
    }
  }

  cancelNotification(id: string) {
    if (this.registration?.active) {
      this.registration.active.postMessage({
        type: 'CANCEL_NOTIFICATION',
        id,
      });
      console.log('🚫 Notification cancelled:', id);
    }
  }

  hasPermission(): boolean {
    return Notification.permission === 'granted';
  }

  isReady(): boolean {
    return this.isSupported && this.isInitialized && this.registration !== null;
  }
}

// Export singleton instance
export const backgroundNotifications = new BackgroundNotificationManager();

// Helper functions
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
    '⏰ Activity Reminder',
    `Time to: ${activityName}`,
    scheduledTime
  );
}

export function cancelBackgroundNotification(activityId: string) {
  backgroundNotifications.cancelNotification(activityId);
}

// Parse time string to Date object
function parseTimeToDate(timeStr: string): Date {
  const now = new Date();
  const scheduledTime = new Date();
  
  let hours: number, minutes: number;
  
  // Remove any extra spaces
  timeStr = timeStr.trim();
  
  if (timeStr.includes('AM') || timeStr.includes('PM') || timeStr.includes('am') || timeStr.includes('pm')) {
    // 12-hour format
    const isPM = timeStr.toLowerCase().includes('pm');
    const cleanTime = timeStr.replace(/AM|PM|am|pm/gi, '').trim();
    const parts = cleanTime.split(':');
    hours = parseInt(parts[0]);
    minutes = parts[1] ? parseInt(parts[1]) : 0;
    
    if (isPM && hours !== 12) {
      hours += 12;
    }
    if (!isPM && hours === 12) {
      hours = 0;
    }
  } else {
    // 24-hour format
    const parts = timeStr.split(':');
    hours = parseInt(parts[0]);
    minutes = parts[1] ? parseInt(parts[1]) : 0;
  }
  
  // Validate
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.error('Invalid time format:', timeStr);
    // Return current time + 1 minute as fallback
    const fallback = new Date();
    fallback.setMinutes(fallback.getMinutes() + 1);
    return fallback;
  }
  
  scheduledTime.setHours(hours, minutes, 0, 0);
  
  // If time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
    console.log('⏭️ Time has passed today, scheduling for tomorrow');
  }
  
  return scheduledTime;
}