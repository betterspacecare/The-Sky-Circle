# Deploy Webhook URL Auto-Detection Fix

## What Was Fixed
The admin panel was calling `localhost:3000/api/webhooks/test` in production instead of the actual production frontend URL.

## Solution Implemented
Added automatic URL detection that works in both development and production:
- Development: Detects `localhost:5173` → uses `localhost:3000`
- Production: Detects `admin.domain.com` → uses `domain.com`
- Can be overridden with `VITE_FRONTEND_URL` environment variable

## Files Changed
- ✅ `sky-circle-admin/src/store/adminStore.ts` - Added auto-detection logic
- ✅ `sky-circle-admin/.env.production` - Created production env file
- ✅ `WEBHOOK_URL_AUTO_DETECTION.md` - Complete documentation

## Deployment Steps

### 1. Rebuild Admin Panel
```bash
cd sky-circle-admin
npm run build
```
✅ **Status:** Build completed successfully

### 2. Deploy to Production

#### Option A: Vercel
```bash
cd sky-circle-admin
vercel --prod
```

#### Option B: Netlify
```bash
cd sky-circle-admin
netlify deploy --prod --dir=dist
```

### 3. Verify Deployment

#### Test Auto-Detection
1. Open admin panel in production
2. Open browser console
3. Run:
```javascript
console.log('Admin URL:', window.location.origin)
console.log('Will use Frontend:', 
    window.location.origin.replace('admin.', '')
)
```

#### Test Webhook
1. Navigate to Webhooks page
2. Create or select a webhook
3. Click "Test" button (Play icon)
4. Check browser Network tab
5. Verify request goes to production frontend URL (not localhost)
6. Check webhook logs for success

### 4. Optional: Set Explicit URL

If auto-detection doesn't work for your setup, set the frontend URL explicitly:

#### In Vercel Dashboard
1. Go to Project Settings
2. Environment Variables
3. Add: `VITE_FRONTEND_URL` = `https://your-frontend-domain.com`
4. Redeploy

#### In Netlify Dashboard
1. Site Settings
2. Environment Variables
3. Add: `VITE_FRONTEND_URL` = `https://your-frontend-domain.com`
4. Redeploy

## Expected Behavior

### Before Fix
```
Admin Panel: https://admin.skyguild.com
Webhook Test: http://localhost:3000/api/webhooks/test ❌
Result: Failed to fetch (localhost not accessible)
```

### After Fix
```
Admin Panel: https://admin.skyguild.com
Webhook Test: https://skyguild.com/api/webhooks/test ✅
Result: Success (200 OK)
```

## Deployment Scenarios

### Scenario 1: Standard Subdomain Setup
```
Admin:    https://admin.skyguild.com
Frontend: https://skyguild.com
```
**Action:** Just deploy, auto-detection handles it ✅

### Scenario 2: Different Domains
```
Admin:    https://admin-panel.vercel.app
Frontend: https://skyguild.com
```
**Action:** Set `VITE_FRONTEND_URL=https://skyguild.com` in deployment platform

### Scenario 3: Same Domain
```
Admin:    https://skyguild.com/admin
Frontend: https://skyguild.com
```
**Action:** Just deploy, auto-detection handles it ✅

## Verification Checklist

After deployment:
- [ ] Admin panel loads without errors
- [ ] Navigate to Webhooks page
- [ ] Create test webhook with Zapier URL
- [ ] Click "Test" button
- [ ] Check browser Network tab shows correct URL (not localhost)
- [ ] Webhook test succeeds (200 OK)
- [ ] Webhook log shows success in database
- [ ] No CORS errors in console

## Troubleshooting

### Still seeing localhost:3000
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Verify new build was deployed
4. Check deployment logs

### 404 Error on webhook test
1. Verify frontend is deployed
2. Check `/api/webhooks/test` endpoint exists
3. Test endpoint directly: `curl https://your-domain.com/api/webhooks/test`

### CORS Error
1. Verify frontend URL is correct
2. Check auto-detection logic matches your setup
3. Set `VITE_FRONTEND_URL` explicitly

## Rollback

If issues occur, rollback to previous deployment:
1. Go to Vercel/Netlify dashboard
2. Find previous deployment
3. Click "Promote to Production"

## Summary

The webhook URL auto-detection fix:
- ✅ Built successfully
- ✅ Ready to deploy
- ✅ Works automatically for standard setups
- ✅ Can be overridden if needed
- ✅ Fully documented

Deploy the new build and webhook testing will work correctly in production! 🚀
