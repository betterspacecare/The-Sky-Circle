# Vercel Deployment Setup Guide

## Problem
Vercel is not automatically deploying when you push to the main branch.

## Root Cause
This is a monorepo with multiple projects (sky-circle-frontend, sky-circle-admin, supabase). Vercel needs to be configured to:
1. Know which directory to deploy
2. Detect changes in the correct directory
3. Use the correct build settings

## Solution

### Option 1: Configure in Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project

2. **Configure Project Settings**
   - Go to Settings → General
   - Find "Root Directory" section
   - Set to: `sky-circle-frontend`
   - Click "Save"

3. **Configure Build Settings**
   - Go to Settings → General → Build & Development Settings
   - Framework Preset: `Next.js`
   - Build Command: `npm run build` (or leave default)
   - Output Directory: `.next` (or leave default)
   - Install Command: `npm install` (or leave default)

4. **Configure Environment Variables**
   - Go to Settings → Environment Variables
   - Add these variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id (optional)
     ```

5. **Configure Git Integration**
   - Go to Settings → Git
   - Ensure "Production Branch" is set to `main`
   - Check "Automatically deploy new commits" is enabled
   - Under "Ignored Build Step", ensure it's not set to ignore builds

6. **Trigger Manual Deployment**
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger automatic deployment

### Option 2: Use Vercel CLI

If you prefer command-line setup:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to frontend directory
cd sky-circle-frontend

# Login to Vercel
vercel login

# Link to existing project or create new one
vercel link

# Deploy to production
vercel --prod
```

### Option 3: Create vercel.json (Already Done)

A `vercel.json` file has been created in the sky-circle-frontend directory with the correct configuration.

## Troubleshooting

### Issue 1: Vercel Not Detecting Changes

**Symptoms:** Pushing to main branch doesn't trigger deployment

**Solutions:**
1. Check Vercel dashboard → Settings → Git
2. Ensure "Production Branch" is `main`
3. Ensure "Automatically deploy new commits" is enabled
4. Check if "Ignored Build Step" is configured - it should be empty or return exit code 1

**Add this to package.json if needed:**
```json
{
  "scripts": {
    "vercel-build": "npm run build"
  }
}
```

### Issue 2: Build Fails on Vercel

**Symptoms:** Deployment starts but build fails

**Solutions:**
1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Verify Node.js version compatibility:
   - Add to package.json:
     ```json
     {
       "engines": {
         "node": ">=18.0.0"
       }
     }
     ```

### Issue 3: Wrong Directory Being Deployed

**Symptoms:** Vercel deploys root directory instead of sky-circle-frontend

**Solution:**
1. Go to Vercel Dashboard → Settings → General
2. Set "Root Directory" to `sky-circle-frontend`
3. Save and redeploy

### Issue 4: Environment Variables Missing

**Symptoms:** App works locally but fails on Vercel

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add all variables from `.env.local`
3. Ensure they're set for "Production", "Preview", and "Development"
4. Redeploy

## Vercel Configuration Files

### vercel.json (in sky-circle-frontend/)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID": "@ga_measurement_id"
  }
}
```

Note: The `@variable_name` syntax in vercel.json refers to environment variables you set in the Vercel dashboard.

## Monorepo Considerations

Since this is a monorepo:

1. **Separate Projects on Vercel**
   - Create separate Vercel projects for:
     - sky-circle-frontend (Next.js app)
     - sky-circle-admin (React/Vite app)
   - Each project should have its own root directory configured

2. **Ignored Build Step**
   - To prevent unnecessary builds, you can add a script to check if files changed:
   
   Create `sky-circle-frontend/vercel-ignore-build.sh`:
   ```bash
   #!/bin/bash
   
   # Only build if files in sky-circle-frontend changed
   git diff HEAD^ HEAD --quiet ./sky-circle-frontend/
   ```
   
   Then in Vercel Settings → Git → Ignored Build Step:
   ```
   bash vercel-ignore-build.sh
   ```

## Quick Fix Checklist

- [ ] Vercel project exists and is linked to GitHub repo
- [ ] Root Directory is set to `sky-circle-frontend` in Vercel settings
- [ ] Production Branch is set to `main`
- [ ] Automatic deployments are enabled
- [ ] All environment variables are configured
- [ ] Build command is `npm run build`
- [ ] Framework preset is `Next.js`
- [ ] Latest commit is pushed to main branch
- [ ] No build errors in local `npm run build`

## Testing Deployment

After configuration:

1. **Make a small change:**
   ```bash
   cd sky-circle-frontend
   echo "// deployment test" >> app/page.tsx
   git add .
   git commit -m "test: trigger Vercel deployment"
   git push origin main
   ```

2. **Check Vercel Dashboard:**
   - Go to Deployments tab
   - You should see a new deployment starting
   - Click on it to see build logs

3. **If still not deploying:**
   - Click "Redeploy" button manually
   - Check the build logs for errors
   - Verify webhook is configured in GitHub repo settings

## GitHub Webhook Check

1. Go to your GitHub repository
2. Settings → Webhooks
3. You should see a webhook for Vercel
4. Check recent deliveries for any errors
5. If no webhook exists, reconnect Vercel to GitHub:
   - Vercel Dashboard → Settings → Git
   - Disconnect and reconnect GitHub integration

## Support

If issues persist:
1. Check Vercel Status: https://www.vercel-status.com/
2. Review build logs in Vercel dashboard
3. Contact Vercel support with deployment URL and error logs
4. Check Vercel documentation: https://vercel.com/docs

## Current Status

✅ vercel.json created with correct configuration
✅ Build passes locally (`npm run build`)
✅ All code committed and pushed to main branch

**Next Step:** Configure Root Directory in Vercel Dashboard to `sky-circle-frontend`
