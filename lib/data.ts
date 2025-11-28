export interface Activity {
  id: string
  name: string
  nameKh: string
  duration: number // in minutes
  completed: boolean
}

export interface ScheduledActivity extends Activity {
  startTime: string
  endTime: string
}

export interface DaySchedule {
  date: string
  isDayOff: boolean
  activities: ScheduledActivity[]
}

export const defaultActivities: Omit<Activity, "id" | "completed">[] = [
  { name: "Learn C Programming", nameKh: "រៀនភាសា C", duration: 60 },
  { name: "Exercise", nameKh: "ហាត់ប្រាណ", duration: 30 },
  { name: "Relax", nameKh: "សម្រាក", duration: 20 },
  { name: "Post a Video", nameKh: "បង្ហោះវីដេអូ", duration: 45 },
  { name: "Wash Dishes", nameKh: "លាងចាន", duration: 15 },
  { name: "Mop the Floor", nameKh: "ជូតជាន់ផ្ទះ", duration: 20 },
  { name: "Do Laundry", nameKh: "បោកខោអាវ", duration: 30 },
  { name: "Learn from Udemy", nameKh: "រៀនពី Udemy", duration: 60 },
]

export const daysOfWeek = [
  { en: "Monday", kh: "ច័ន្ទ" },
  { en: "Tuesday", kh: "អង្គារ" },
  { en: "Wednesday", kh: "ពុធ" },
  { en: "Thursday", kh: "ព្រហស្បតិ៍" },
  { en: "Friday", kh: "សុក្រ" },
  { en: "Saturday", kh: "សៅរ៍" },
  { en: "Sunday", kh: "អាទិត្យ" },
]

export const translations = {
  en: {
    title: "wexly",
    addActivity: "Add Activity",
    editActivity: "Edit Activity",
    deleteActivity: "Delete",
    generateSchedule: "Random Schedule",
    dayOff: "Day Off",
    workDay: "Work Day",
    completed: "Completed",
    activities: "Activities",
    schedule: "Schedule",
    noActivities: "No activities scheduled",
    activityName: "Activity Name",
    duration: "Duration (min)",
    save: "Save",
    cancel: "Cancel",
    today: "Today",
    progress: "Progress",
    remind: "Remind Me",
    settings: "Settings",
    manageActivities: "Manage Activities",
    startTime: "Start Time",
    dayStartTime: "Day Start Time",
    editSchedule: "Edit Time",
    reminderSet: "Reminder Set",
    reminderDescription: "You will be notified at",
    notificationPermission: "Please allow notifications",
    editDayTime: "Edit Day Time",
  },
  kh: {
    title: "កាលវិភាគប្រចាំសប្តាហ៍",
    addActivity: "បន្ថែមសកម្មភាព",
    editActivity: "កែសម្រួលសកម្មភាព",
    deleteActivity: "លុប",
    generateSchedule: "កាលវិភាគចៃដន្យ",
    dayOff: "ថ្ងៃឈប់សម្រាក",
    workDay: "ថ្ងៃធ្វើការ",
    completed: "បានបញ្ចប់",
    activities: "សកម្មភាព",
    schedule: "កាលវិភាគ",
    noActivities: "គ្មានសកម្មភាពកំណត់",
    activityName: "ឈ្មោះសកម្មភាព",
    duration: "រយៈពេល (នាទី)",
    save: "រក្សាទុក",
    cancel: "បោះបង់",
    today: "ថ្ងៃនេះ",
    progress: "វឌ្ឍនភាព",
    remind: "រំលឹកខ្ញុំ",
    settings: "ការកំណត់",
    manageActivities: "គ្រប់គ្រងសកម្មភាព",
    startTime: "ម៉ោងចាប់ផ្តើម",
    dayStartTime: "ម៉ោងចាប់ផ្តើមថ្ងៃ",
    editSchedule: "កែម៉ោង",
    reminderSet: "បានកំណត់ការរំលឹក",
    reminderDescription: "អ្នកនឹងទទួលបានការជូនដំណឹងនៅម៉ោង",
    notificationPermission: "សូមអនុញ្ញាតការជូនដំណឹង",
    editDayTime: "កែម៉ោងថ្ងៃ",
  },
}
