# Sky Circle Admin Panel

Admin dashboard for managing the Sky Circle astronomy community platform.

## Features

- **Dashboard**: Overview with stats, charts, and recent activity
- **Users Management**: View, edit, and manage user accounts
- **Observations**: Browse all user observations with filtering
- **Events**: Create, edit, and manage astronomy events
- **Missions**: Create and manage observation missions with requirements
- **Badges**: Create and manage achievement badges
- **Posts Moderation**: Review and moderate reported community posts
- **Sky Alerts**: Send notifications about meteor showers, visibility events, etc.
- **Referrals**: Track referral program activity and top referrers

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Environment Variables

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_SUPABASE_SERVICE_ROLE_KEY` - (Optional) Service role key for admin operations

## Admin Access

By default, admin access is restricted to specific email addresses. Update the `ADMIN_EMAILS` array in `src/store/authStore.ts` to add authorized admin emails.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Zustand (state management)
- Recharts (charts)
- Lucide React (icons)
- Supabase (backend)
