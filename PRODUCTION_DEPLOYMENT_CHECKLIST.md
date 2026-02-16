# Production Deployment Checklist

## ✅ Build Status

### Admin Panel (Vite/React)
- ✅ TypeScript compilation successful
- ✅ Production build created
- ✅ Bundle size: 949.50 kB (261.75 kB gzipped)
- ✅ Output: `sky-circle-admin/dist/`
- ⚠️ Note: Large bundle size - consider code splitting for optimization

### Frontend (Next.js)
- ✅ TypeScript compilation successful
- ✅ Production build created
- ✅ All routes compiled successfully
- ✅ API routes ready:
  - `/api/webhooks/test` - Webhook testing proxy
  - `/api/v1/triggers/*` - Zapier polling endpoints
  - `/api/v1/actions/*` - Zapier action endpoints
- ✅ Output: `sky-circle-frontend/.next/`

## Pre-Deployment Checklist

### 1. Database Setup
- [ ] Run all SQL migrations in Supabase
  - [ ] `webhooks_schema.sql`
  - [ ] `api_keys_schema.sql`
  - [ ] Social features tables (if not already done)
- [ ] Verify RLS policies are enabled
- [ ] Create admin user account
- [ ] Update user role to 'admin' in Supabase

### 2. Environment Variables

#### Frontend Production (.env.production)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API Keys
ZAPIER_API_KEY=your_secure_production_key

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

#### Admin Panel Production
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# API Keys
VITE_ZAPIER_API_KEY=your_secure_production_key

# Frontend URL (IMPORTANT for webhook testing)
VITE_FRONTEND_URL=https://your-frontend-domain.com
```

### 3. Security Checklist
- [ ] Generate new secure API keys for production
- [ ] Update CORS settings in Supabase
- [ ] Enable rate limiting on API routes
- [ ] Set up SSL certificates (handled by Vercel/Netlify)
- [ ] Review RLS policies
- [ ] Enable Supabase Auth email confirmation
- [ ] Set up proper error logging (Sentry, etc.)

### 4. Deployment Platform Setup

#### Option A: Vercel (Recommended)

**Frontend Deployment:**
```bash
cd sky-circle-frontend
vercel --prod
```

**Admin Panel Deployment:**
```bash
cd sky-circle-admin
vercel --prod
```

**Vercel Configuration:**
- [ ] Connect GitHub repository
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure custom domain
- [ ] Enable automatic deployments
- [ ] Set up preview deployments for branches

#### Option B: Netlify

**Frontend Deployment:**
```bash
cd sky-circle-frontend
npm run build
netlify deploy --prod --dir=.next
```

**Admin Panel Deployment:**
```bash
cd sky-circle-admin
npm run build
netlify deploy --prod --dir=dist
```

**Netlify Configuration:**
- [ ] Create `netlify.toml` if needed
- [ ] Set environment variables in Netlify dashboard
- [ ] Configure custom domain
- [ ] Enable automatic deployments

### 5. Post-Deployment Verification

#### Frontend Tests
- [ ] Visit homepage: `https://your-domain.com`
- [ ] Test user signup/login
- [ ] Test OAuth (Google, etc.)
- [ ] Navigate to dashboard
- [ ] Create observation
- [ ] Create post
- [ ] Test social features (follow, like, comment)

#### Admin Panel Tests
- [ ] Visit admin panel: `https://admin.your-domain.com`
- [ ] Login as admin
- [ ] View dashboard stats
- [ ] Navigate all sections
- [ ] Create webhook
- [ ] Test webhook (verify CORS fix works)
- [ ] Create API key
- [ ] View logs

#### API Endpoint Tests
```bash
# Test user trigger
curl -X GET "https://your-domain.com/api/v1/triggers/users/new?since=2024-01-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test webhook proxy
curl -X POST "https://your-domain.com/api/webhooks/test" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://hooks.zapier.com/...",
    "secret": "test_secret",
    "webhookId": "test-id",
    "webhookName": "Test Webhook"
  }'

# Test alert action
curl -X POST "https://your-domain.com/api/v1/actions/alerts" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Alert",
    "message": "This is a test",
    "alert_type": "meteor_shower"
  }'
```

### 6. Integration Setup

#### Zapier Configuration
- [ ] Create Zapier account
- [ ] Add SkyGuild as custom app
- [ ] Configure polling triggers
- [ ] Add API key authentication
- [ ] Test trigger with real data
- [ ] Create test Zap
- [ ] Activate Zap

#### Make (Integromat) Configuration
- [ ] Create Make account
- [ ] Add webhook module
- [ ] Configure webhook URL from admin panel
- [ ] Add secret key
- [ ] Test webhook from admin panel
- [ ] Create test scenario
- [ ] Activate scenario

### 7. Monitoring Setup

#### Application Monitoring
- [ ] Set up error tracking (Sentry, Rollbar)
- [ ] Configure performance monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Enable Vercel/Netlify analytics
- [ ] Set up Google Analytics (if using)

#### Database Monitoring
- [ ] Monitor Supabase usage
- [ ] Set up database backups
- [ ] Configure alerts for high usage
- [ ] Review slow queries

#### API Monitoring
- [ ] Monitor API endpoint response times
- [ ] Track API key usage
- [ ] Set up alerts for failed webhooks
- [ ] Monitor rate limits

### 8. Documentation Updates
- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document rollback procedure
- [ ] Update API documentation with production endpoints

### 9. Performance Optimization

#### Frontend
- [ ] Enable Next.js image optimization
- [ ] Configure CDN for static assets
- [ ] Enable compression
- [ ] Optimize bundle size (code splitting)
- [ ] Enable caching headers

#### Admin Panel
- [ ] Consider code splitting for large bundle
- [ ] Enable lazy loading for routes
- [ ] Optimize images
- [ ] Enable compression

### 10. Backup & Recovery
- [ ] Set up automated database backups
- [ ] Document restore procedure
- [ ] Test backup restoration
- [ ] Set up version control for database schema
- [ ] Document rollback procedure

## Deployment Commands

### Quick Deploy (Vercel)
```bash
# Deploy both apps
cd sky-circle-frontend && vercel --prod
cd ../sky-circle-admin && vercel --prod
```

### Build Locally First
```bash
# Test builds locally
cd sky-circle-frontend && npm run build
cd ../sky-circle-admin && npm run build

# Then deploy
cd sky-circle-frontend && vercel --prod
cd ../sky-circle-admin && vercel --prod
```

## Environment Variable Template

### Frontend (.env.production)
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ZAPIER_API_KEY=
NEXT_PUBLIC_GA_ID=
```

### Admin Panel (.env.production)
```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ZAPIER_API_KEY=
VITE_FRONTEND_URL=
```

## Common Issues & Solutions

### Issue: Webhook test fails with CORS error
**Solution:** Verify `VITE_FRONTEND_URL` in admin panel points to production frontend URL

### Issue: API endpoints return 401
**Solution:** Check API key is correctly set in environment variables and matches database

### Issue: Admin panel shows blank page
**Solution:** Check browser console for errors, verify environment variables are set

### Issue: Database connection fails
**Solution:** Verify Supabase URL and anon key are correct, check RLS policies

### Issue: Build fails with TypeScript errors
**Solution:** Run `npm run type-check` locally to identify issues before deploying

## Rollback Procedure

### If deployment fails:
1. Revert to previous deployment in Vercel/Netlify dashboard
2. Check error logs
3. Fix issues locally
4. Test build locally
5. Redeploy

### If database migration fails:
1. Restore from backup
2. Review migration SQL
3. Test migration on staging database
4. Rerun migration

## Success Criteria

Deployment is successful when:
- ✅ Frontend loads without errors
- ✅ Admin panel loads without errors
- ✅ Users can sign up and login
- ✅ API endpoints respond correctly
- ✅ Webhooks can be tested successfully
- ✅ API keys can be created and used
- ✅ All integrations work (Zapier, Make, etc.)
- ✅ No console errors
- ✅ Performance is acceptable (< 3s load time)
- ✅ Mobile responsive
- ✅ SSL certificate valid

## Post-Launch Tasks

### Week 1
- [ ] Monitor error rates
- [ ] Check API usage
- [ ] Review webhook logs
- [ ] Gather user feedback
- [ ] Fix critical bugs

### Week 2-4
- [ ] Optimize performance based on metrics
- [ ] Implement user feedback
- [ ] Add missing features
- [ ] Improve documentation
- [ ] Plan next iteration

## Support Resources

- **Documentation:** See all `*.md` files in project root
- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Zapier Developer:** https://developer.zapier.com

## Summary

Both applications are built and ready for production deployment:
- ✅ Admin panel: `sky-circle-admin/dist/`
- ✅ Frontend: `sky-circle-frontend/.next/`
- ✅ All TypeScript errors fixed
- ✅ All features implemented
- ✅ Documentation complete

Follow this checklist to ensure a smooth production deployment! 🚀
