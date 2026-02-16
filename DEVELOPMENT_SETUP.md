# Development Setup Guide

## Quick Start

To work on the SkyGuild platform, you need to run both the frontend and admin panel simultaneously.

## Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- Supabase project configured
- Environment variables set up

## Running Both Servers

### Terminal 1: Frontend (Next.js)
```bash
cd sky-circle-frontend
npm install  # First time only
npm run dev
```
- Runs on: `http://localhost:3000`
- Provides: Main app + API routes for webhooks/integrations

### Terminal 2: Admin Panel (Vite/React)
```bash
cd sky-circle-admin
npm install  # First time only
npm run dev
```
- Runs on: `http://localhost:5173`
- Provides: Admin dashboard for managing platform

## Environment Variables

### Frontend (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys
ZAPIER_API_KEY=your_secure_api_key
```

### Admin Panel (.env)
```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys
VITE_ZAPIER_API_KEY=your_secure_api_key

# Frontend URL (for webhook testing proxy)
VITE_FRONTEND_URL=http://localhost:3000
```

## Why Both Servers?

### Frontend (Next.js)
- Main user-facing application
- API routes for Zapier/Make/n8n integrations
- Webhook testing proxy (avoids CORS)
- Server-side rendering
- Authentication flows

### Admin Panel (Vite/React)
- Admin dashboard for platform management
- Manage users, content, webhooks, API keys
- Monitor platform activity
- Configure automations
- View analytics

## Common Issues

### Issue: "Failed to fetch" when testing webhooks
**Cause:** Frontend server not running
**Fix:** Start frontend server on `localhost:3000`

### Issue: Admin panel shows blank page
**Cause:** Environment variables not set
**Fix:** Copy `.env.example` to `.env` and fill in values

### Issue: "Unauthorized" errors in admin panel
**Cause:** Not logged in as admin
**Fix:** 
1. Sign up/login through frontend
2. Update user role to 'admin' in Supabase
3. Refresh admin panel

### Issue: API routes return 404
**Cause:** Frontend server not running or wrong URL
**Fix:** Check `VITE_FRONTEND_URL` matches frontend server

## Development Workflow

### 1. Start Servers
```bash
# Terminal 1
cd sky-circle-frontend && npm run dev

# Terminal 2
cd sky-circle-admin && npm run dev
```

### 2. Access Applications
- Frontend: `http://localhost:3000`
- Admin Panel: `http://localhost:5173`
- Supabase Studio: Your Supabase project URL

### 3. Make Changes
- Frontend changes: Hot reload automatically
- Admin changes: Hot reload automatically
- Database changes: Run migrations in Supabase

### 4. Test Features
- Test user features in frontend
- Test admin features in admin panel
- Test webhooks (both servers must be running)
- Test API endpoints with Postman/cURL

## Production Deployment

### Frontend (Vercel/Netlify)
```bash
cd sky-circle-frontend
vercel deploy --prod
```
- Update `VITE_FRONTEND_URL` in admin panel to production URL

### Admin Panel (Vercel/Netlify)
```bash
cd sky-circle-admin
vercel deploy --prod
```
- Update environment variables in deployment settings

### Environment Variables in Production
- Set all environment variables in deployment platform
- Use production Supabase URL and keys
- Update `VITE_FRONTEND_URL` to production frontend URL
- Generate secure API keys for production

## Useful Commands

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

### Admin Panel
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Database Management

### Run Migrations
1. Open Supabase Studio
2. Go to SQL Editor
3. Paste migration SQL
4. Click "Run"

### View Data
1. Open Supabase Studio
2. Go to Table Editor
3. Select table to view/edit

### Check Logs
1. Open Supabase Studio
2. Go to Logs
3. Filter by API, Auth, or Database

## Testing Integrations

### Test Zapier Integration
1. Start both servers
2. Create API key in admin panel
3. Create webhook in admin panel
4. Test webhook (uses frontend proxy)
5. Configure Zapier with API key
6. Test Zapier trigger/action

### Test API Endpoints
```bash
# Test with cURL
curl -X GET "http://localhost:3000/api/v1/triggers/users/new" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test webhook
curl -X POST "http://localhost:3000/api/webhooks/test" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://hooks.zapier.com/...",
    "secret": "your_secret",
    "webhookId": "uuid",
    "webhookName": "Test Webhook"
  }'
```

## Summary

For full development experience:
1. ✅ Run frontend on `localhost:3000`
2. ✅ Run admin panel on `localhost:5173`
3. ✅ Configure environment variables
4. ✅ Set up Supabase project
5. ✅ Run database migrations
6. ✅ Create admin user
7. ✅ Start building!

Both servers work together to provide the complete SkyGuild platform experience.
