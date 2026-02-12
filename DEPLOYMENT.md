# The Sky Circle - Deployment Guide

## Prerequisites

- Vercel account
- Supabase project (already set up)
- Google OAuth credentials configured
- GitHub repository

## Step 1: Prepare for Deployment

### Frontend (Next.js)

1. Ensure all environment variables are documented:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Test production build locally:
   ```bash
   cd sky-circle-frontend
   npm run build
   npm run start
   ```

### Admin Panel (Vite)

1. Ensure environment variables are set:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Test production build:
   ```bash
   cd sky-circle-admin
   npm run build
   npm run preview
   ```

## Step 2: Deploy Frontend to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Framework Preset: Next.js
   - Root Directory: `sky-circle-frontend`

3. **Configure Environment Variables**
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your deployment URL (e.g., `https://sky-circle.vercel.app`)

5. **Update Google OAuth Redirect URIs**
   - Add `https://your-domain.vercel.app/auth/callback`
   - Update in Supabase Dashboard → Authentication → URL Configuration
   - Add to "Redirect URLs"

## Step 3: Deploy Admin Panel to Vercel

1. **Create New Project in Vercel**
   - Click "Add New Project"
   - Select same repository
   - Framework Preset: Vite
   - Root Directory: `sky-circle-admin`

2. **Configure Environment Variables**
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

3. **Deploy**
   - Click "Deploy"
   - Note admin panel URL (e.g., `https://sky-circle-admin.vercel.app`)

## Step 4: Configure Supabase

1. **Update Site URL**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Set Site URL to your Vercel frontend URL

2. **Add Redirect URLs**
   - Add `https://your-frontend-domain.vercel.app/auth/callback`
   - Add `https://your-frontend-domain.vercel.app/**` for wildcard

3. **Verify Storage Buckets**
   - Ensure all buckets are public
   - Test image uploads

## Step 5: Post-Deployment Verification

### Frontend Checklist
- [ ] Homepage loads correctly
- [ ] Login with email works
- [ ] Google OAuth works
- [ ] Profile setup completes
- [ ] Dashboard displays data
- [ ] Images upload successfully
- [ ] Navigation works
- [ ] Mobile responsive

### Admin Panel Checklist
- [ ] Admin login works
- [ ] Dashboard displays analytics
- [ ] Can create events
- [ ] Can create missions
- [ ] Can manage users
- [ ] Charts render correctly

## Step 6: Set Up Custom Domain (Optional)

### Frontend Domain

1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Add your custom domain (e.g., `skycircle.com`)

2. **Configure DNS**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Wait for DNS propagation

3. **Update Supabase**
   - Update Site URL to custom domain
   - Update redirect URLs

### Admin Panel Domain

1. **Add Subdomain**
   - Add `admin.skycircle.com` in Vercel
   - Configure DNS with CNAME

## Step 7: Monitoring & Analytics

1. **Enable Vercel Analytics**
   - Go to Project Settings → Analytics
   - Enable Web Analytics

2. **Set Up Error Tracking** (Optional)
   - Integrate Sentry or similar
   - Add error boundaries

3. **Monitor Supabase Usage**
   - Check Database size
   - Monitor API requests
   - Review Storage usage

## Troubleshooting

### OAuth Not Working
- Verify redirect URIs in Google Console
- Check Supabase redirect URLs
- Ensure HTTPS is used

### Images Not Uploading
- Check storage bucket policies
- Verify bucket is public
- Check file size limits

### Database Connection Issues
- Verify environment variables
- Check Supabase project status
- Review RLS policies

### Build Failures
- Clear `.next` cache
- Delete `node_modules` and reinstall
- Check for TypeScript errors

## Performance Optimization

1. **Enable Image Optimization**
   - Next.js automatically optimizes images
   - Use `next/image` component

2. **Enable Caching**
   - Configure Vercel edge caching
   - Set appropriate cache headers

3. **Database Optimization**
   - Add indexes for frequently queried fields
   - Use connection pooling

## Security Checklist

- [ ] Environment variables secured
- [ ] RLS policies tested
- [ ] API routes protected
- [ ] File upload validation
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] HTTPS enforced

## Backup Strategy

1. **Database Backups**
   - Supabase provides automatic daily backups
   - Enable point-in-time recovery

2. **Code Backups**
   - GitHub repository serves as backup
   - Tag releases for version control

## Scaling Considerations

### When to Upgrade Supabase Plan
- Database size > 500MB
- API requests > 500K/month
- Storage > 1GB
- Need for more concurrent connections

### When to Upgrade Vercel Plan
- Need for more bandwidth
- Custom domains > 1
- Need for password protection
- Advanced analytics required

## Maintenance

### Weekly Tasks
- Review error logs
- Check performance metrics
- Monitor user feedback

### Monthly Tasks
- Review and optimize database queries
- Update dependencies
- Review security policies
- Backup verification

### Quarterly Tasks
- Performance audit
- Security audit
- Feature planning
- User survey

---

## Quick Deploy Commands

```bash
# Frontend
cd sky-circle-frontend
npm run build
vercel --prod

# Admin Panel
cd sky-circle-admin
npm run build
vercel --prod
```

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Check browser console for errors
4. Verify environment variables

---

**Deployment Complete! 🚀**

Your astronomy community platform is now live and ready for stargazers worldwide!
