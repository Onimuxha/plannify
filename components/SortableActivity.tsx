import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ScheduledActivity } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PlayfulCheckbox } from "./ui/playful-checkbox";
import {
  requestNotificationPermission,
  scheduleNotification,
  parseTime,
} from "@/lib/schedule-utils";
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
  } = useSortable({ id: activity.id });
  
  const [hasReminder, setHasReminder] = useState<boolean>(
    () => !!(activity as any).hasReminder
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleReminderToggle = async () => {
    if (!hasReminder) {
      const permitted = await requestNotificationPermission();
      if (permitted) {
        setHasReminder(true);
        const activityName =
          language === "kh" ? activity.nameKh : activity.name;
        const { hours, minutes } = parseTime(activity.startTime);
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const delayMs = scheduledTime.getTime() - now.getTime();
        scheduleNotification(
          "Activity Reminder",
          `Time to: ${activityName}`,
          delayMs
        );
        onRemind();
      }
    } else {
      setHasReminder(false);
      onRemind();
    }
  };

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
                className={`text-sm font-medium ${
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
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors ml-[1.9rem]"
        >
          <ClockCircle weight="LineDuotone" className="h-3 w-3" />
          {activity.startTime} - {activity.endTime}
        </button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleReminderToggle}
        title={hasReminder ? "Reminder enabled" : "Reminder disabled"}
      >
        {hasReminder ? (
          <AlarmRemove weight="LineDuotone" className="w-5 h-5 text-yellow-500" />
        ) : (
          <AlarmAdd weight="LineDuotone" className="w-5 h-5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}