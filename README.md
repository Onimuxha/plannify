# Wexly

A futuristic, dark-themed weekly schedule planner app with Supabase integration for data persistence.

## Features

- **Dark Futuristic UI** - Sleek design with soft glow effects and smooth animations
- **Bilingual Support** - Khmer 🇰🇭 and English 🇺🇸 language options
- **Drag & Drop** - Reorder activities within each day
- **Time Editing** - Click on activity times or day settings to adjust schedules
- **Day Off System** - Toggle days between work mode and day off with different start times
- **Random Schedule Generator** - Shuffle activities with random durations
- **Browser Notifications** - Set reminders for activities
- **PWA Support** - Installable as a progressive web app

## Supabase Integration

This app uses Supabase for persistent storage of activities, schedules, and user settings.

### Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. The following environment variables configured:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### Database Setup

Run the SQL migration script to create the required tables. You can do this in two ways:

#### Option 1: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/001_create_tables.sql`
4. Click **Run** to execute the script

#### Option 2: Via v0 (Recommended)

1. Open the `scripts/001_create_tables.sql` file in v0
2. Click the **Run** button to execute the script directly

### Database Schema

The app creates three tables:

#### `activities`

Stores the master list of activities that can be scheduled.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Activity name (e.g., "Morning Exercise") |
| `name_km` | `text` | Activity name in Khmer |
| `icon` | `text` | Emoji icon for the activity |
| `default_duration` | `integer` | Default duration in minutes |
| `is_default` | `boolean` | Whether this is a default activity |
| `created_at` | `timestamptz` | Creation timestamp |

#### `day_schedules`

Stores the schedule configuration for each day of the week.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `day_index` | `integer` | Day of week (0 = Sunday, 6 = Saturday) |
| `is_day_off` | `boolean` | Whether this day is a day off |
| `start_time` | `text` | Day start time (e.g., "06:00") |
| `activities` | `jsonb` | Array of scheduled activities with times |
| `updated_at` | `timestamptz` | Last update timestamp |

The `activities` JSONB column structure:

\`\`\`json
[
  {
    "id": "uuid",
    "name": "Morning Exercise",
    "nameKm": "កីឡាព្រឹក",
    "icon": "🏃",
    "duration": 60,
    "startTime": "06:00",
    "endTime": "07:00",
    "completed": false
  }
]
\`\`\`

#### `user_settings`

Stores user preferences like language selection.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `key` | `text` | Setting key (unique) |
| `value` | `text` | Setting value |
| `updated_at` | `timestamptz` | Last update timestamp |

### How Data Syncs

1. **On App Load**: The app fetches all data from Supabase tables
2. **On Changes**: Any modifications (adding activities, toggling day off, reordering, etc.) are immediately saved to Supabase
3. **Fallback**: If Supabase is unavailable, the app falls back to default data

### Storage Functions

The app uses the following async functions in `lib/storage.ts`:

\`\`\`typescript
// Activities
getActivities(): Promise<Activity[]>
saveActivities(activities: Activity[]): Promise<void>

// Day Schedules
getDaySchedules(): Promise<DaySchedule[]>
saveDaySchedule(schedule: DaySchedule): Promise<void>

// User Settings
getLanguage(): Promise<'en' | 'km'>
saveLanguage(lang: 'en' | 'km'): Promise<void>
\`\`\`

### Supabase Client Setup

The app uses two Supabase clients:

- **Browser Client** (`lib/supabase/client.ts`): For client-side operations
- **Server Client** (`lib/supabase/server.ts`): For server-side operations (SSR)

\`\`\`typescript
// Browser client usage
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase
  .from('activities')
  .select('*')
\`\`\`

### Security Note

This app currently uses public access (no Row Level Security) for simplicity. For production use with user authentication, you should:

1. Enable RLS on all tables
2. Add appropriate policies based on user authentication
3. Use `supabase.auth` for user management

## Development

### Local Development Setup (VS Code)

#### 1. Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [VS Code](https://code.visualstudio.com/)
- [Supabase Account](https://supabase.com/)

#### 2. Clone or Download the Project

Download the project as a ZIP from v0 (click the three dots → "Download ZIP") or use Git:

\`\`\`bash
git clone <your-repo-url>
cd weekly-schedule-app
\`\`\`

#### 3. Install Dependencies

Open the project folder in VS Code, then open the integrated terminal (`Ctrl+`` ` or `Cmd+`` `) and run:

\`\`\`bash
npm install
\`\`\`

#### 4. Set Up Supabase

**4.1 Create a Supabase Project**

1. Go to [supabase.com](https://supabase.com/) and sign in
2. Click **New Project**
3. Enter a project name and database password
4. Wait for the project to be created

**4.2 Get Your API Keys**

1. In your Supabase dashboard, go to **Project Settings** > **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**4.3 Create the Database Tables**

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `scripts/001_create_tables.sql`
4. Click **Run** to create all tables

#### 5. Configure Environment Variables

Create a `.env.local` file in the project root:

\`\`\`bash
touch .env.local
\`\`\`

Add your Supabase credentials:

\`\`\`env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

#### 6. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Recommended VS Code Extensions

| Extension | ID |
|-----------|-----|
| ESLint | `dbaeumer.vscode-eslint` |
| Prettier | `esbenp.prettier-vscode` |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` |

Install via terminal:

\`\`\`bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
\`\`\`

### Troubleshooting

**"Invalid API key" Error**
- Double-check your `.env.local` file has correct Supabase URL and anon key
- Restart the dev server after changing environment variables

**Tables Not Found**
- Make sure you ran the SQL script in `scripts/001_create_tables.sql`
- Check the Supabase dashboard **Table Editor** to verify tables exist

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

Alternatively, you can deploy directly from v0 by clicking the **Publish** button.
