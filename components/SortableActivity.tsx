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


  const handleReminderToggle = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (!hasReminder) {
        const permitted = await requestBackgroundNotificationPermission();
        
        if (!permitted) {
          setIsProcessing(false);
          return;
        }

        const activityName = language === "kh" ? activity.nameKh : activity.name;
        const success = await scheduleBackgroundNotification(
          activity.id,
          activityName,
          activity.startTime
        );

        if (success) {
          setHasReminder(true);
          onRemind();
        } else {
        }
      } else {
        cancelBackgroundNotification(activity.id);
        setHasReminder(false);
        onRemind();
      }
    } catch (error) {
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
        title={hasReminder ? "Reminder enabled" : "Set reminder"}
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