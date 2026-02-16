# Webhook WWW Redirect Fix

## Problem Identified
The webhook test was failing with:
```
Access to fetch at 'https://skyguild.club/api/webhooks/test' from origin 
'https://admin.skyguild.club' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
Redirect is not allowed for a preflight request.
```

## Root Cause
`skyguild.club` redirects to `www.skyguild.club` (HTTP 307 redirect). CORS preflight requests (OPTIONS) cannot follow redirects, causing the request to fail.

## Verification
```bash
# Non-www redirects to www
curl -I https://skyguild.club/api/webhooks/test
# HTTP/2 307
# location: https://www.skyguild.club/api/webhooks/test

# www works directly (no redirect)
curl -I https://www.skyguild.club/api/webhooks/test
# HTTP/2 405 (endpoint exists, CORS headers present)

# CORS preflight works on www
curl -X OPTIONS "https://www.skyguild.club/api/webhooks/test" \
  -H "Origin: https://admin.skyguild.club" \
  -H "Access-Control-Request-Method: POST"
# Returns proper CORS headers ✅
```

## Solution
Updated auto-detection logic to use `www` subdomain:

### Before
```typescript
// admin.domain.com -> domain.com
frontendUrl = currentUrl.replace('admin.', '')
// Result: https://skyguild.club (redirects, breaks CORS)
```

### After
```typescript
// admin.domain.com -> www.domain.com
frontendUrl = currentUrl.replace('admin.', 'www.')
// Result: https://www.skyguild.club (no redirect, CORS works)
```

## Auto-Detection Logic Now

### Development
- Admin: `http://localhost:5173`
- Frontend: `http://localhost:3000`

### Production
- Admin: `https://admin.skyguild.club`
- Frontend: `https://www.skyguild.club` ✅ (changed from skyguild.club)

## Deployment Steps

### 1. Rebuild Admin Panel
```bash
cd sky-circle-admin
npm run build
```
✅ **Status:** Build completed successfully

### 2. Deploy to Production
```bash
# Vercel
vercel --prod

# Or Netlify
netlify deploy --prod --dir=dist
```

### 3. Test Webhook
1. Open `https://admin.skyguild.club`
2. Navigate to Webhooks page
3. Create/select a webhook
4. Click "Test" button
5. Should now call `https://www.skyguild.club/api/webhooks/test`
6. Should succeed without CORS errors ✅

## Verification Commands

### Test endpoint exists
```bash
curl https://www.skyguild.club/api/webhooks/test
# Should return 405 Method Not Allowed (GET not supported)
```

### Test CORS preflight
```bash
curl -X OPTIONS "https://www.skyguild.club/api/webhooks/test" \
  -H "Origin: https://admin.skyguild.club" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Expected headers:
```
access-control-allow-origin: *
access-control-allow-methods: POST, OPTIONS
access-control-allow-headers: Content-Type, Authorization
access-control-max-age: 86400
```

### Test actual webhook
```bash
curl -X POST "https://www.skyguild.club/api/webhooks/test" \
  -H "Content-Type: application/json" \
  -H "Origin: https://admin.skyguild.club" \
  -d '{
    "url": "https://hooks.zapier.com/hooks/catch/15561037/ucoiley/",
    "secret": "test_secret",
    "webhookId": "test-id",
    "webhookName": "Test Webhook"
  }'
```

Expected response:
```json
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "responseTime": 123,
  "responseBody": "...",
  "error": null
}
```

## Alternative Solutions

### Option 1: Set Explicit URL (Override Auto-Detection)
If you prefer to use non-www or have a different setup:

**In Vercel/Netlify Dashboard:**
```
VITE_FRONTEND_URL=https://www.skyguild.club
```

### Option 2: Fix Domain Redirect
Configure your domain to not redirect:
1. Go to domain DNS settings
2. Remove www redirect
3. Or set up both www and non-www to work without redirect

### Option 3: Use Vercel Domain Alias
Add both domains as aliases in Vercel:
- `skyguild.club` (primary)
- `www.skyguild.club` (alias)
- Both serve the same content without redirect

## Why This Happens

### CORS Preflight Flow
1. Browser sends OPTIONS request to check CORS
2. If server responds with redirect (307), browser stops
3. CORS spec doesn't allow following redirects in preflight
4. Request fails before actual POST is sent

### The Fix
By using `www.skyguild.club` directly:
1. No redirect occurs
2. OPTIONS request succeeds
3. CORS headers are checked
4. POST request is allowed
5. Webhook test works ✅

## Summary

✅ Identified redirect issue (skyguild.club → www.skyguild.club)
✅ Updated auto-detection to use www subdomain
✅ Rebuilt admin panel
✅ Pushed to GitHub
⏳ **Next:** Deploy admin panel to production

After deployment, webhook testing will work without CORS errors! 🚀
