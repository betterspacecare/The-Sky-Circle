# Local Testing Guide - The Sky Circle

## Quick Start (5 Minutes)

Your dev server is already running at `http://localhost:3000`! Here's how to test it:

### Step 1: Set Up Supabase (Required)

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose organization and name (e.g., "sky-circle")
   - Wait for project to be created (~2 minutes)

2. **Get Your Credentials**
   - In Supabase Dashboard, go to Settings → API
   - Copy:
     - `Project URL` (looks like: `https://xxxxx.supabase.co`)
     - `anon public` key (long string starting with `eyJ...`)

3. **Add Environment Variables**
   ```bash
   cd d:\Community\sky-circle-frontend
   
   # Create .env.local file
   echo NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co > .env.local
   echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key >> .env.local
   ```
   
   Or manually create `d:\Community\sky-circle-frontend\.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_key_here
   ```

4. **Run Database Schema**
   - In Supabase Dashboard → SQL Editor
   - Click "New Query"
   - Copy entire contents of `d:\Community\supabase_schema.sql`
   - Paste and click "Run"
   - Wait for success message

5. **Run Seed Data**
   - In SQL Editor, create another new query
   - Copy entire contents of `d:\Community\seed_data.sql`
   - Paste and click "Run"

6. **Create Storage Buckets**
   - Go to Storage in Supabase Dashboard
   - Create 4 new buckets (all public):
     - `profile-photos`
     - `observation-photos`
     - `post-images`
     - `badge-icons`

7. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C in terminal)
   # Then restart:
   npm run dev
   ```

### Step 2: Test the App

1. **Open Browser**
   - Go to `http://localhost:3000`
   - You should see the homepage

2. **Test Signup**
   - Click "Sign up" or go to `http://localhost:3000/signup`
   - Enter email and password
   - Click "Sign Up"
   - Complete profile setup

3. **Test Dashboard**
   - After signup, you'll be redirected to dashboard
   - You should see:
     - ✅ Stats widgets (0 points, Level 1, etc.)
     - ✅ Progress bar
     - ✅ Badge showcase (all locked initially)
     - ✅ Your referral code
     - ✅ Empty states for events/photos

4. **Test Navigation**
   - Click through nav items
   - Most pages aren't built yet, but nav should work

### Step 3: Verify Database

1. **Check Users Table**
   - In Supabase → Table Editor → users
   - You should see your new user with:
     - Email
     - Referral code
     - Level 1
     - 0 points

2. **Check Badges**
   - Table Editor → badges
   - Should see 14 pre-seeded badges

---

## Testing Without Supabase (Limited)

If you want to see the UI without setting up Supabase:

1. **View Static Pages**
   - Login page: `http://localhost:3000/login`
   - Signup page: `http://localhost:3000/signup`
   
   These will render but won't work without Supabase.

2. **What You'll See**
   - ✅ Beautiful cosmic theme
   - ✅ Starfield background
   - ✅ Glassmorphism effects
   - ✅ Form layouts
   - ❌ Authentication won't work
   - ❌ Dashboard won't load

---

## Common Issues

### "Invalid API Key" Error
- Check your `.env.local` file
- Make sure keys are correct
- Restart dev server after adding env vars

### "Relation does not exist" Error
- Run the SQL schema file
- Make sure all tables were created

### "Storage bucket not found"
- Create the 4 storage buckets in Supabase
- Make them public

### Dev Server Not Running
```bash
cd d:\Community\sky-circle-frontend
npm run dev
```

---

## Quick Test Checklist

- [ ] Supabase project created
- [ ] Environment variables added to `.env.local`
- [ ] SQL schema executed
- [ ] Seed data executed
- [ ] Storage buckets created
- [ ] Dev server restarted
- [ ] Browser opened to `http://localhost:3000`
- [ ] Signup works
- [ ] Dashboard loads
- [ ] Navigation works

---

## What's Testable Right Now

### ✅ Working Features
- Login/Signup pages (UI)
- Profile setup page (UI)
- Dashboard layout
- Stats widgets
- Badge showcase
- Progress tracking
- Referral code display
- Navigation
- Cosmic theme & animations

### ⏳ Not Yet Built
- Observation logging
- Events pages
- Missions pages
- Community feed
- Profile page
- Admin panel

---

## Next Steps After Testing

1. **Test Google OAuth** (optional)
   - Set up Google Cloud Console
   - Add OAuth credentials to Supabase
   - Test Google login

2. **Build More Features**
   - Observation logging form
   - Events module
   - Community feed

3. **Deploy to Vercel**
   - Follow DEPLOYMENT.md guide
   - Test in production

---

## Screenshots to Expect

When you open `http://localhost:3000`, you should see:

1. **Login Page**
   - Dark cosmic background with stars
   - Purple gradient logo
   - Email/password inputs
   - Google OAuth button
   - Glassmorphic card

2. **Dashboard**
   - Welcome message
   - 4 stat cards (purple, pink, blue, green gradients)
   - Progress bar with shimmer effect
   - Badge grid (locked badges)
   - Referral card with copy button

---

## Testing Tips

1. **Use Chrome DevTools**
   - Open DevTools (F12)
   - Check Console for errors
   - Check Network tab for API calls

2. **Test Responsive Design**
   - Resize browser window
   - Test mobile view (DevTools → Toggle device toolbar)

3. **Check Supabase Logs**
   - Supabase Dashboard → Logs
   - See all database queries

---

**Ready to test! 🚀**

Your server is already running at `http://localhost:3000`
