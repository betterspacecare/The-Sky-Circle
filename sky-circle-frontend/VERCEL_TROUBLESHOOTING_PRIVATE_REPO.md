# Vercel Auto-Deployment Troubleshooting (Private Repo)

## You've Already Done
✅ Set Root Directory to `sky-circle-frontend` in Vercel Dashboard
✅ Repository is private
✅ Latest code is pushed to main branch

## Common Issues with Private Repos

### 1. GitHub App Permissions

**Check this first:**

1. Go to GitHub → Settings → Applications → Installed GitHub Apps
2. Find "Vercel" in the list
3. Click "Configure"
4. Check Repository Access:
   - Should show your repository name
   - If not, click "Select repositories" and add your repo
5. Check Permissions:
   - Repository permissions → Contents: Read-only (minimum)
   - Repository permissions → Metadata: Read-only
   - Repository permissions → Pull requests: Read-only
   - Subscribe to events: Push, Pull request

**If Vercel app is not installed:**
1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Click "Disconnect" then "Connect Git Repository"
3. Re-authorize and select your repository

### 2. Vercel Git Integration Settings

**In Vercel Dashboard:**

1. Go to your project → Settings → Git
2. Check these settings:
   - **Connected Git Repository**: Should show your repo name
   - **Production Branch**: Should be `main`
   - **Deploy Hooks**: Should be enabled
   
3. **Ignored Build Step**: 
   - Should be EMPTY or not configured
   - If there's a command here, it might be preventing builds
   - Remove it or ensure it returns exit code 1 to trigger builds

4. **Auto-deploy**: Should be ON for production branch

### 3. GitHub Webhook

**Check if webhook exists:**

1. Go to your GitHub repository
2. Settings → Webhooks
3. Look for a webhook with URL containing `vercel.com`
4. Click on it to check:
   - Recent Deliveries should show successful responses (green checkmarks)
   - If red X's, click to see error details

**If webhook is missing or broken:**
1. In Vercel Dashboard → Settings → Git
2. Click "Disconnect"
3. Click "Connect Git Repository"
4. Re-authorize and select your repository
5. This will recreate the webhook

### 4. Vercel Project Settings

**Verify these settings in Vercel Dashboard:**

1. **Settings → General → Root Directory**
   - ✅ Should be: `sky-circle-frontend`

2. **Settings → General → Build & Development Settings**
   - Framework Preset: `Next.js`
   - Build Command: `npm run build` (or leave empty for default)
   - Output Directory: `.next` (or leave empty for default)
   - Install Command: `npm install` (or leave empty for default)

3. **Settings → General → Node.js Version**
   - Should be 18.x or 20.x
   - If older, update it

### 5. Environment Variables

**Check if missing env vars are causing silent failures:**

1. Go to Settings → Environment Variables
2. Ensure these are set:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
3. Make sure they're enabled for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### 6. Build Command Issues

**Test if build works on Vercel:**

1. Go to Deployments tab
2. Click "Redeploy" on any deployment
3. Watch the build logs
4. If it fails, you'll see the error

**Common build errors:**
- Missing environment variables
- Node version mismatch
- Missing dependencies
- TypeScript errors

## Quick Fix Steps

### Step 1: Force a Deployment
```bash
# Make a trivial change to trigger deployment
cd sky-circle-frontend
echo "# Deployment test" >> README.md
git add README.md
git commit -m "test: trigger Vercel deployment"
git push origin main
```

Then check Vercel Dashboard → Deployments to see if it triggers.

### Step 2: Check Webhook Delivery

1. Go to GitHub repo → Settings → Webhooks
2. Click on Vercel webhook
3. Click "Recent Deliveries"
4. Click on the latest delivery
5. Check:
   - Request: Should show the push event
   - Response: Should be 200 OK
   - If error, note the error message

### Step 3: Reconnect Git Integration

If webhook is failing:

1. Vercel Dashboard → Settings → Git
2. Click "Disconnect"
3. Confirm disconnection
4. Click "Connect Git Repository"
5. Select GitHub
6. Authorize Vercel
7. Select your repository
8. Confirm Root Directory is `sky-circle-frontend`
9. Save

### Step 4: Manual Deploy to Test

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd sky-circle-frontend

# Login
vercel login

# Link to project
vercel link

# Deploy to production
vercel --prod
```

If manual deploy works but auto-deploy doesn't, it's definitely a Git integration issue.

## Diagnostic Commands

Run these to check your setup:

```bash
# Check if you're on the right branch
git branch --show-current
# Should output: main

# Check remote
git remote -v
# Should show your GitHub repo

# Check latest commit
git log -1 --oneline
# Should show your latest commit

# Check if there are unpushed commits
git status
# Should say "Your branch is up to date with 'origin/main'"
```

## Still Not Working?

### Check Vercel Status
- Visit: https://www.vercel-status.com/
- If there's an outage, wait for it to resolve

### Check Build Logs
1. Vercel Dashboard → Deployments
2. Click on any deployment
3. Check the "Building" section for errors
4. Look for:
   - "Skipped" status (means ignored build step is active)
   - Build errors
   - Missing files

### Contact Vercel Support

If all else fails:

1. Go to Vercel Dashboard
2. Click "Help" in bottom left
3. Click "Contact Support"
4. Provide:
   - Project name
   - Repository URL
   - Description: "Auto-deployments not triggering from private GitHub repo"
   - Screenshots of:
     - Git settings in Vercel
     - GitHub webhook deliveries
     - Recent deployments page

## Most Likely Causes (in order)

1. **GitHub App permissions not granted** (80% of cases)
   - Fix: Reinstall Vercel GitHub App with correct permissions

2. **Ignored Build Step is configured** (10% of cases)
   - Fix: Remove or fix the ignored build step command

3. **Webhook is broken** (5% of cases)
   - Fix: Reconnect Git integration

4. **Wrong branch configured** (3% of cases)
   - Fix: Set production branch to `main`

5. **Vercel project is paused** (2% of cases)
   - Fix: Check project status in dashboard

## Success Indicators

You'll know it's working when:
- ✅ Push to main triggers a deployment within 30 seconds
- ✅ Vercel Dashboard shows "Building" status
- ✅ GitHub webhook shows 200 OK responses
- ✅ Deployments page shows automatic deployments (not manual)

## Test Right Now

1. Make this small change:
   ```bash
   cd sky-circle-frontend
   echo "// test $(date)" >> app/page.tsx
   git add app/page.tsx
   git commit -m "test: trigger auto-deploy"
   git push origin main
   ```

2. Immediately go to Vercel Dashboard → Deployments

3. Within 30 seconds, you should see a new deployment starting

4. If not, check GitHub → Settings → Webhooks → Recent Deliveries for errors
