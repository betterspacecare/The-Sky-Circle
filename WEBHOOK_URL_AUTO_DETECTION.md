# Webhook URL Auto-Detection

## Problem
When testing webhooks in production, the admin panel was still trying to call `localhost:3000/api/webhooks/test` instead of the production frontend URL.

## Solution
Implemented automatic URL detection that works in both development and production without manual configuration.

## How It Works

### Auto-Detection Logic
```typescript
// 1. Check if VITE_FRONTEND_URL is set
let frontendUrl = import.meta.env.VITE_FRONTEND_URL

if (!frontendUrl) {
    // 2. Auto-detect based on current admin panel URL
    const currentUrl = window.location.origin
    
    if (currentUrl.includes('localhost')) {
        // Development: admin on 5173, frontend on 3000
        frontendUrl = 'http://localhost:3000'
    } else if (currentUrl.includes('admin')) {
        // Production: admin.domain.com -> domain.com
        frontendUrl = currentUrl.replace('admin.', '')
    } else {
        // Fallback: assume same domain
        frontendUrl = currentUrl
    }
}
```

### Examples

#### Development
- Admin Panel: `http://localhost:5173`
- Detected Frontend: `http://localhost:3000`
- Webhook Test URL: `http://localhost:3000/api/webhooks/test`

#### Production (Subdomain)
- Admin Panel: `https://admin.skyguild.com`
- Detected Frontend: `https://skyguild.com`
- Webhook Test URL: `https://skyguild.com/api/webhooks/test`

#### Production (Custom Domain)
- Admin Panel: `https://admin-skyguild.vercel.app`
- Detected Frontend: `https://admin-skyguild.vercel.app` (fallback)
- Webhook Test URL: `https://admin-skyguild.vercel.app/api/webhooks/test`

## Configuration Options

### Option 1: Auto-Detection (Recommended)
Leave `VITE_FRONTEND_URL` empty or unset. The system will automatically detect the correct URL.

**Pros:**
- Works automatically in dev and prod
- No manual configuration needed
- Adapts to different deployment scenarios

**Cons:**
- Assumes standard naming convention (admin.domain.com)

### Option 2: Manual Configuration
Set `VITE_FRONTEND_URL` explicitly in environment variables.

**Development (.env):**
```bash
VITE_FRONTEND_URL=http://localhost:3000
```

**Production (.env.production or deployment platform):**
```bash
VITE_FRONTEND_URL=https://your-frontend-domain.com
```

**Pros:**
- Explicit control
- Works with any domain structure

**Cons:**
- Requires manual configuration
- Different values for dev/prod

### Option 3: Deployment Platform Variables
Set environment variable in Vercel/Netlify dashboard.

**Vercel:**
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add `VITE_FRONTEND_URL` with production URL
4. Redeploy

**Netlify:**
1. Go to Site Settings
2. Navigate to Environment Variables
3. Add `VITE_FRONTEND_URL` with production URL
4. Redeploy

## Deployment Scenarios

### Scenario 1: Separate Subdomains (Recommended)
```
Admin:    https://admin.skyguild.com
Frontend: https://skyguild.com
```
**Configuration:** Leave `VITE_FRONTEND_URL` empty (auto-detects)

### Scenario 2: Different Domains
```
Admin:    https://admin-panel.vercel.app
Frontend: https://skyguild.com
```
**Configuration:** Set `VITE_FRONTEND_URL=https://skyguild.com`

### Scenario 3: Same Domain, Different Paths
```
Admin:    https://skyguild.com/admin
Frontend: https://skyguild.com
```
**Configuration:** Leave `VITE_FRONTEND_URL` empty (auto-detects)

### Scenario 4: Vercel Preview Deployments
```
Admin:    https://admin-pr-123.vercel.app
Frontend: https://frontend-pr-123.vercel.app
```
**Configuration:** Set `VITE_FRONTEND_URL=https://frontend-pr-123.vercel.app`

## Testing

### Test Auto-Detection
1. Open browser console on admin panel
2. Run:
```javascript
console.log('Current URL:', window.location.origin)
console.log('Detected Frontend:', 
    window.location.origin.includes('localhost') 
        ? 'http://localhost:3000'
        : window.location.origin.replace('admin.', '')
)
```

### Test Webhook
1. Create a webhook in admin panel
2. Click "Test" button
3. Check browser Network tab
4. Verify request goes to correct URL
5. Check webhook logs for success

## Troubleshooting

### Issue: Still calling localhost in production
**Cause:** Browser cached old build
**Fix:** 
1. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear browser cache
3. Rebuild and redeploy admin panel

### Issue: 404 on webhook test endpoint
**Cause:** Frontend not deployed or wrong URL
**Fix:**
1. Verify frontend is deployed
2. Check frontend URL is accessible
3. Verify `/api/webhooks/test` endpoint exists
4. Set `VITE_FRONTEND_URL` explicitly

### Issue: CORS error still occurring
**Cause:** Frontend URL is incorrect
**Fix:**
1. Check browser console for actual URL being called
2. Verify frontend is on correct domain
3. Set `VITE_FRONTEND_URL` explicitly to correct URL

### Issue: Works in dev but not prod
**Cause:** Auto-detection logic doesn't match your setup
**Fix:**
1. Set `VITE_FRONTEND_URL` explicitly in production
2. Use deployment platform environment variables
3. Verify domain naming convention

## Best Practices

### For Development
- Use default auto-detection
- Keep admin on `localhost:5173`
- Keep frontend on `localhost:3000`

### For Production
- Use subdomain structure (`admin.domain.com` / `domain.com`)
- Let auto-detection handle URL
- Or set explicit `VITE_FRONTEND_URL` in deployment platform

### For Staging
- Use separate staging domains
- Set `VITE_FRONTEND_URL` explicitly
- Test webhook functionality before prod

## Rebuild Required

After changing environment variables or updating the auto-detection logic:

```bash
# Rebuild admin panel
cd sky-circle-admin
npm run build

# Redeploy
vercel --prod
# or
netlify deploy --prod
```

## Summary

The webhook URL auto-detection:
- ✅ Works automatically in dev and prod
- ✅ No manual configuration needed (for standard setups)
- ✅ Can be overridden with `VITE_FRONTEND_URL`
- ✅ Handles subdomain structure automatically
- ✅ Falls back gracefully for edge cases

For most deployments, simply deploy both apps and it will work automatically! 🚀
