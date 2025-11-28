"use client"

import { useState } from "react"
import type { Activity } from "@/lib/data"
import { useLanguage } from "@/lib/language-context"
import { ActivityModal } from "./activity-modal"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { IconClipboardData, IconClock, IconEdit, IconPlus, IconTrash, IconX } from "@tabler/icons-react"
import { Icon } from "@radix-ui/react-select"

interface ActivitiesManagerProps {
  activities: Activity[]
  onUpdateActivities: (activities: Activity[]) => void
}

export function ActivitiesManager({ activities, onUpdateActivities }: ActivitiesManagerProps) {
  const { t, language } = useLanguage()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null)

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingActivityId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deletingActivityId) {
      onUpdateActivities(activities.filter((a) => a.id !== deletingActivityId))
      setDeletingActivityId(null)
    }
    setIsDeleteDialogOpen(false)
  }

  const handleSave = (activity: Activity) => {
    if (editingActivity) {
      onUpdateActivities(activities.map((a) => (a.id === activity.id ? activity : a)))
    } else {
      onUpdateActivities([...activities, activity])
    }
    setEditingActivity(null)
  }

  const handleOpenModal = () => {
    setEditingActivity(null)
    setIsModalOpen(true)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="gap-2 border border-white/30"
      >
        <IconClipboardData className="h-4 w-4" />
        <span className={language === "kh" ? "font-khmer" : ""}>{t.manageActivities}</span>
      </Button>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-border">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconClipboardData className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${language === "kh" ? "font-khmer" : ""}`}>
                    {t.manageActivities}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {activities.length} {activities.length === 1 ? "activity" : "activities"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activities.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                    <IconClipboardData className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${language === "kh" ? "font-khmer" : ""}`}>
                    {t.noActivities}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Create your first activity to get started
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="group relative bg-card hover:bg-accent/50 rounded-lg border border-border hover:border-primary/50 p-4 transition-all duration-200"
                    >

                      <div className="flex items-start justify-between gap-3 pl-2">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold mb-1 truncate ${language === "kh" ? "font-khmer" : ""}`}>
                            {language === "kh" ? activity.nameKh : activity.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IconClock className="h-3 w-3" />
                            <span>{activity.duration} min</span>
                          </div>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(activity)}
                            className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                            title="Edit"
                          >
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(activity.id)}
                            className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                            title="Delete"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border">
              <Button
                onClick={handleOpenModal}
                className="w-full gap-2"
                size="lg"
              >
                <IconPlus className="h-5 w-5" />
                <span className={language === "kh" ? "font-khmer" : ""}>{t.addActivity}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={language === "kh" ? "font-khmer" : ""}>
              {language === "kh" ? "លុបសកម្មភាព?" : "Delete Activity?"}
            </AlertDialogTitle>
            <AlertDialogDescription className={language === "kh" ? "font-khmer" : ""}>
              {language === "kh"
                ? "សកម្មភាពនេះនឹងត្រូវបានលុបចេញជាស្ថាយី។ សកម្មភាពនេះមិនអាចត្រលប់វិញបានទេ។"
                : "This activity will be permanently deleted. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={language === "kh" ? "font-khmer" : ""}>
              {t.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              <span className={language === "kh" ? "font-khmer" : ""}>
                {language === "kh" ? "លុប" : "Delete"}
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ActivityModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingActivity(null)
        }}
        onSave={handleSave}
        activity={editingActivity}
      />
    </>
  )
}