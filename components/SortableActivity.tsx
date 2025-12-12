import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ScheduledActivity } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PlayfulCheckbox } from "./ui/playful-checkbox";
import {
  requestBackgroundNotificationPermission,
  scheduleBackgroundNotification,
  cancelBackgroundNotification,
  backgroundNotifications,
} from "@/lib/background-notifications";
import { AlarmAdd, AlarmRemove, ClockCircle, ListVertical } from "@solar-icons/react";

interface SortableActivityProps {
  activity: ScheduledActivity;
  onToggle: () => void;
  onRemind: () => void;
  onEditTime: () => void;
  language: string;
}

export function SortableActivity({
  activity,
  onToggle,
  onRemind,
  onEditTime,
  language,
}: SortableActivityProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: activity.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });
  
  const [hasReminder, setHasReminder] = useState<boolean>(
    () => !!(activity as any).hasReminder
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Cleanup notification when component unmounts
  useEffect(() => {
    return () => {
      if (hasReminder) {
        cancelBackgroundNotification(activity.id);
      }
    };
  }, [activity.id, hasReminder]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: isDragging ? 'transform' : 'auto',
  };

  const showToast = (message: string, isSuccess: boolean = true) => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 ${
      isSuccess ? 'bg-green-500' : 'bg-red-500'
    } text-white px-4 py-3 rounded-lg shadow-lg z-[9999] flex items-center gap-2 font-medium animate-in fade-in slide-in-from-bottom-2`;
    toast.innerHTML = `
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-2');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const handleReminderToggle = async () => {
    if (isProcessing) {
      console.log('Already processing, please wait...');
      return;
    }
    
    setIsProcessing(true);

    try {
      if (!hasReminder) {
        console.log('=== ENABLING REMINDER ===');
        
        // Check if service worker is ready
        if (!backgroundNotifications.isReady()) {
          console.log('Service worker not ready, initializing...');
          showToast('⏳ Initializing notifications...', true);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Request permission
        console.log('Requesting permission...');
        const permitted = await requestBackgroundNotificationPermission();
        
        if (!permitted) {
          console.error('Permission denied');
          showToast('❌ Notifications blocked. Check browser settings.', false);
          setIsProcessing(false);
          return;
        }

        console.log('Permission granted, scheduling notification...');

        // Schedule the background notification
        const activityName = language === "kh" ? activity.nameKh : activity.name;
        
        console.log('Activity details:', {
          id: activity.id,
          name: activityName,
          time: activity.startTime,
        });

        const success = await scheduleBackgroundNotification(
          activity.id,
          activityName,
          activity.startTime
        );

        if (success) {
          setHasReminder(true);
          onRemind();
          showToast(`✅ Reminder set for ${activity.startTime}`, true);
          console.log('✅ Reminder enabled successfully');
        } else {
          console.error('Failed to schedule notification');
          showToast('❌ Failed to set reminder. Check console for errors.', false);
        }
      } else {
        console.log('=== DISABLING REMINDER ===');
        
        // Cancel the notification
        cancelBackgroundNotification(activity.id);
        setHasReminder(false);
        onRemind();
        showToast('🔕 Reminder cancelled', true);
        console.log('✅ Reminder disabled successfully');
      }
    } catch (error) {
      console.error('❌ Reminder error:', error);
      showToast('❌ Something went wrong. Check console.', false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-2 rounded-md border border-border bg-secondary/50 p-2 transition-all duration-200 hover:border-primary/30 ${
        activity.completed ? "opacity-60" : ""
      } ${isDragging ? "opacity-70 shadow-2xl scale-[1.02] z-50" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab touch-none text-muted-foreground transition-all duration-150 hover:text-foreground hover:scale-110 active:cursor-grabbing active:scale-95"
      >
        <ListVertical weight="LineDuotone" className="h-5 w-5" />
      </button>
      <div className="flex flex-col gap-1 w-full">
        <PlayfulCheckbox
          id={`activity-${activity.id}`}
          checked={activity.completed}
          onCheckedChange={onToggle}
          svgWidth={340}
          label={
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium transition-colors duration-150 ${
                  language === "kh" ? "font-khmer" : ""
                } ${
                  activity.completed
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {language === "kh" ? activity.nameKh : activity.name}
              </p>
            </div>
          }
        />
        <button
          onClick={onEditTime}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-all duration-150 ml-[1.9rem] hover:gap-1.5"
        >
          <ClockCircle weight="LineDuotone" className="h-3 w-3" />
          {activity.startTime} - {activity.endTime}
        </button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleReminderToggle}
        disabled={isProcessing}
        title={
          hasReminder 
            ? "🔔 Reminder ON - You'll get notified even if browser is closed!" 
            : "Click to set a reminder for this activity"
        }
        className="transition-all duration-150 hover:scale-110 active:scale-95 disabled:opacity-50"
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : hasReminder ? (
          <AlarmRemove weight="LineDuotone" className="w-5 h-5 text-yellow-500 animate-pulse" />
        ) : (
          <AlarmAdd weight="LineDuotone" className="w-5 h-5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}