"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  type DaySchedule,
  daysOfWeek,
  type ScheduledActivity,
} from "@/lib/data";
import { useLanguage } from "@/lib/language-context";
import { isToday, requestNotificationPermission } from "@/lib/schedule-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SortableActivity } from "./SortableActivity";
import { EditActivityDialog, EditDayTimeDialog } from "./EditDoalogs";
import { Case, CupHot, Settings } from "@solar-icons/react";

interface DayCardProps {
  date: Date;
  dayIndex: number;
  schedule: DaySchedule | null;
  onToggleDayOff: () => void;
  onToggleActivity: (activityId: string) => void;
  onRemind: (activity: ScheduledActivity) => void;
  onReorderActivities: (activities: ScheduledActivity[]) => void;
  onUpdateActivityTime: (activityId: string, startTime: string) => void;
  onUpdateDayStartTime: (startTime: string) => void;
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
  const { t, language } = useLanguage();
  const today = isToday(date);
  const dayName =
    language === "kh" ? daysOfWeek[dayIndex].kh : daysOfWeek[dayIndex].en;
  const isDayOff = schedule?.isDayOff || false;

  const completedCount =
    schedule?.activities.filter((a) => a.completed).length || 0;
  const totalCount = schedule?.activities.length || 0;

  const [editingActivity, setEditingActivity] =
    useState<ScheduledActivity | null>(null);
  const [editingDayTime, setEditingDayTime] = useState(false);
  const [newStartTime, setNewStartTime] = useState("");
  const [dayStartTime, setDayStartTime] = useState("");

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && schedule?.activities) {
      const oldIndex = schedule.activities.findIndex((a) => a.id === active.id);
      const newIndex = schedule.activities.findIndex((a) => a.id === over.id);
      const reordered = arrayMove(schedule.activities, oldIndex, newIndex);
      onReorderActivities(reordered);
    }
  };

  const handleEditActivityTime = (activity: ScheduledActivity) => {
    setEditingActivity(activity);
    setNewStartTime(activity.startTime);
  };

  const handleSaveActivityTime = () => {
    if (editingActivity && newStartTime) {
      onUpdateActivityTime(editingActivity.id, newStartTime);
      setEditingActivity(null);
    }
  };

  const handleEditDayTime = () => {
    const firstActivity = schedule?.activities[0];
    setDayStartTime(firstActivity?.startTime || (isDayOff ? "09:00" : "18:00"));
    setEditingDayTime(true);
  };

  const handleSaveDayTime = () => {
    onUpdateDayStartTime(dayStartTime);
    setEditingDayTime(false);
  };

  return (
    <>
      <Card
        className={`transition-all duration-300 ${
          today
            ? "glow-border border-primary/50 bg-card"
            : "border-border bg-card hover:border-primary/30"
        }`}
      >
        <CardHeader className="space-y-2 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle
              className={`text-lg font-medium ${
                language === "kh" ? "font-khmer" : ""
              } ${today ? "glow-text text-primary" : ""}`}
            >
              {dayName}
            </CardTitle>
            <div className="flex items-center gap-1">
              {today && (
                <Badge
                  variant="outline"
                  className="border border-primary text-primary"
                >
                  {t.today}
                </Badge>
              )}
              <Button variant="ghost" onClick={handleEditDayTime}>
                <Settings weight="LineDuotone" className="w-5 h-5 text-white" />
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
            size="default"
            onClick={onToggleDayOff}
            className="w-full transition-all duration-200"
          >
            {isDayOff ? (
              <>
                <CupHot weight="LineDuotone" className="mr-2 w-5 h-5" />
                <span className={language === "kh" ? "font-khmer" : ""}>
                  {t.dayOff}
                </span>
              </>
            ) : (
              <>
                <Case weight="LineDuotone" className="mr-2 h-5 w-5" />
                <span className={language === "kh" ? "font-khmer" : ""}>
                  {t.workDay}
                </span>
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
              <div className="h-1 w-40 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {schedule?.activities && schedule.activities.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={schedule.activities.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
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
            <p
              className={`py-4 text-center text-sm text-muted-foreground ${
                language === "kh" ? "font-khmer" : ""
              }`}
            >
              {t.noActivities}
            </p>
          )}
        </CardContent>
      </Card>

      <EditActivityDialog
        activity={editingActivity}
        newStartTime={newStartTime}
        language={language}
        onClose={() => setEditingActivity(null)}
        onSave={handleSaveActivityTime}
        onTimeChange={setNewStartTime}
        translations={{
          editSchedule: t.editSchedule,
          startTime: t.startTime,
          cancel: t.cancel,
          save: t.save,
        }}
      />

      <EditDayTimeDialog
        isOpen={editingDayTime}
        dayStartTime={dayStartTime}
        language={language}
        onClose={() => setEditingDayTime(false)}
        onSave={handleSaveDayTime}
        onTimeChange={setDayStartTime}
        translations={{
          editDayTime: t.editDayTime,
          dayStartTime: t.dayStartTime,
          cancel: t.cancel,
          save: t.save,
        }}
      />
    </>
  );
}