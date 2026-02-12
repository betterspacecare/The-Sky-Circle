# The Sky Circle 🌟

**Look up. Stay curious.**

A production-ready astronomy community platform where users can log celestial observations, earn badges, join events, complete missions, and connect with fellow stargazers.

## 🚀 Tech Stack

### Frontend (Next.js)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS with custom cosmic theme
- **State Management**: Zustand
- **Authentication**: Supabase Auth (Email + Google OAuth)
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage

### Admin Panel (Vite)
- **Framework**: Vite + React
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Icons**: Lucide React

## ✨ Features

### 🔐 Authentication
- Email/password login and signup
- Google OAuth integration
- Profile setup with photo upload
- Referral code system

### 📊 Dashboard
- User stats (points, level, observations, badges)
- Progress tracking with visual progress bars
- Badge collection showcase
- Upcoming events
- Active missions with progress tracking
- Referral card with copy-to-clipboard
- Recent community photos

### 🎮 Gamification
- 5-level progression system
- Points-based rewards
- Badge achievements
- Seasonal missions
- Leaderboards

### 🔭 Observation Logging
- Log celestial objects (Moon, Planets, Nebulae, Galaxies, Clusters, Constellations)
- Photo uploads
- Points calculation
- Observation history

### 📅 Events
- Create and join observation events
- RSVP system with capacity limits
- Location mapping
- Calendar integration

### 🎯 Missions
- Seasonal challenges
- Progress tracking
- Completion rewards
- Badge unlocks

### 👥 Community
- Astrophotography sharing
- Like and comment system
- User profiles
- Activity feed

### 🔔 Sky Alerts
- Real-time notifications
- Object visibility alerts
- Meteor shower notifications
- Special event announcements

## 📁 Project Structure

```
sky-circle-frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── setup-profile/
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── observations/
│   │   ├── events/
│   │   ├── missions/
│   │   ├── community/
│   │   └── profile/
│   ├── auth/callback/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   │   ├── DashboardNav.tsx
│   │   ├── StatsWidget.tsx
│   │   ├── ProgressCard.tsx
│   │   ├── BadgeShowcase.tsx
│   │   ├── UpcomingEvents.tsx
│   │   ├── MissionCard.tsx
│   │   ├── ReferralCard.tsx
│   │   └── RecentPhotos.tsx
│   └── ui/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── constants/
│   │   └── index.ts
│   └── utils/
│       ├── index.ts
│       └── gamification.ts
├── store/
│   ├── userStore.ts
│   └── alertStore.ts
└── types/
    └── database.types.ts

sky-circle-admin/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   ├── Events.tsx
│   │   ├── Missions.tsx
│   │   ├── Posts.tsx
│   │   ├── Alerts.tsx
│   │   └── Analytics.tsx
│   ├── components/
│   ├── lib/
│   │   └── supabase.ts
│   └── App.tsx
└── index.html
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google Cloud Console account (for OAuth)

### 1. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema:
   ```bash
   # In Supabase SQL Editor, run:
   supabase_schema.sql
   ```
3. Run the seed data:
   ```bash
   seed_data.sql
   ```
4. Create storage buckets in Supabase Dashboard:
   - `profile-photos` (public)
   - `observation-photos` (public)
   - `post-images` (public)
   - `badge-icons` (public)

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret
7. In Supabase Dashboard → Authentication → Providers:
   - Enable Google provider
   - Add Client ID and Client Secret

### 3. Frontend Setup

```bash
cd sky-circle-frontend

# Install dependencies
npm install

# Create environment file
cp env.example .env.local

# Edit .env.local with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Admin Panel Setup

```bash
cd sky-circle-admin

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Supabase credentials:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev
```

The admin panel will be available at `http://localhost:5173`

## 🚀 Deployment

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

### Deploy Admin Panel to Vercel

1. In Vercel, add a new project
2. Select the same repository
3. Set root directory to `sky-circle-admin`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

## 🎨 Design Features

- **Cosmic Dark Theme**: Deep space-inspired color palette
- **Starfield Background**: Animated twinkling stars
- **Glassmorphism**: Frosted glass effects on cards
- **Smooth Animations**: Hover effects, transitions, and micro-interactions
- **Responsive Design**: Mobile-first approach
- **Custom Scrollbar**: Gradient scrollbar matching theme
- **Progress Animations**: Shimmer effects on progress bars

## 📊 Database Schema

Key tables:
- `users` - User profiles with points and levels
- `observations` - Logged celestial objects
- `badges` - Achievement definitions
- `user_badges` - Earned badges
- `events` - Observation events
- `missions` - Seasonal challenges
- `posts` - Community photos
- `sky_alerts` - Notifications

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Authenticated routes protected
- Image uploads validated
- SQL injection prevention
- XSS protection

## 🎯 Points System

- Moon: 5 points
- Planet: 10 points
- Constellation: 8 points
- Cluster: 15 points
- Nebula: 20 points
- Galaxy: 25 points
- Seasonal Rare: 50 points

## 📈 Level System

1. **Level 1**: Naked Eye Explorer (0-100 pts)
2. **Level 2**: Planet Tracker (101-300 pts)
3. **Level 3**: Deep Sky Hunter (301-800 pts)
4. **Level 4**: Nebula Navigator (801-1500 pts)
5. **Level 5**: Cosmic Voyager (1500+ pts)

## 🤝 Contributing

This is a production-ready platform. For feature requests or bug reports, please create an issue.

## 📝 License

MIT License - feel free to use this project as a template for your own astronomy community!

## 🌟 Future Enhancements

- Mobile app (React Native)
- Weather integration
- Telescope equipment marketplace
- Live streaming for events
- AI object identification
- Social media sharing
- Push notifications
- Advanced analytics

---

**Built with ❤️ for the astronomy community**
