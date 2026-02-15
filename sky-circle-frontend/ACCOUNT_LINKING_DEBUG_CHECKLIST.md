# Account Linking Debug Checklist

Use this checklist to debug the Google account linking issue.

## Pre-Test Setup

- [ ] Browser DevTools Console is open (F12 → Console tab)
- [ ] Console is set to show all logs (not filtered)
- [ ] Signed in with email/password account
- [ ] On profile page (`/dashboard/profile`)
- [ ] Can see "Linked Accounts" section in left column

## During Linking Test

### Step 1: Click "Link" Button
- [ ] Clicked "Link" button next to Google account
- [ ] Console shows: `🔗 Initiating Google account linking...`
- [ ] Console shows: `✅ Redirecting to Google for account linking...`
- [ ] Browser redirects to Google OAuth page

### Step 2: Complete Google OAuth
- [ ] Selected Google account
- [ ] Granted permissions
- [ ] Browser redirects back to your app

### Step 3: Check Redirect URL
Look at the browser address bar immediately after redirect:

**Expected URL:**
```
http://localhost:3000/auth/callback?link=true&code=abc123...
```

**Check:**
- [ ] URL contains `/auth/callback`
- [ ] URL contains `link=true` parameter
- [ ] URL contains `code=` parameter
- [ ] URL does NOT contain `type=recovery`

### Step 4: Check Console Logs

**Expected logs:**
```
Auth callback - All params: { code: "...", link: "true" }
Auth callback - Parsed: { code: true, type: null, isLinking: true }
Session user identities: [{ provider: "email", ... }, { provider: "google", ... }]
✅ Account linking flow detected - redirecting to profile
```

**Check:**
- [ ] Console shows "Auth callback - All params"
- [ ] `link: "true"` is present in params
- [ ] `type` is null or undefined (NOT "recovery")
- [ ] `isLinking: true` in parsed params
- [ ] Console shows "✅ Account linking flow detected"
- [ ] Session has 2 identities (email + google)

### Step 5: Verify Final State
- [ ] Redirected to `/dashboard/profile` (NOT `/reset-password`)
- [ ] Alert shows: "✅ Google account linked successfully!"
- [ ] Google account shows "Linked" status with "Unlink" button
- [ ] No errors in console

## If Test Fails

### Scenario A: Redirected to Reset Password

**Console shows:**
```
🔑 Password recovery flow - redirecting to reset-password
```

**Problem:** Callback thinks this is password recovery, not linking

**Check:**
1. [ ] Look at "Auth callback - All params" log
2. [ ] Is `link: "true"` present? If NO → Problem in AccountLinking component
3. [ ] Is `type: "recovery"` present? If YES → Supabase is adding it incorrectly
4. [ ] Is `isLinking: true`? If NO → Parameter not being parsed correctly

**Possible Fixes:**
- Clear browser cache and cookies
- Try in incognito mode
- Check Supabase redirect URL configuration
- Verify AccountLinking component code

### Scenario B: No Console Logs

**Problem:** Callback route not executing or logs not showing

**Check:**
1. [ ] Console filter is not hiding logs
2. [ ] Browser actually redirected to `/auth/callback`
3. [ ] Check Network tab for the callback request
4. [ ] Check if there are any JavaScript errors

### Scenario C: Error in Console

**Check error message:**
- [ ] "Not authenticated" → Session lost, try signing in again
- [ ] "Google account is already linked" → Already linked, check UI
- [ ] "Failed to link Google account" → Check Supabase logs
- [ ] Other error → Share full error message

## Supabase Configuration Check

### Required Settings

Go to Supabase Dashboard → Authentication → Settings:

- [ ] Email provider is enabled
- [ ] Google provider is enabled
- [ ] Google OAuth credentials are configured
- [ ] "Enable automatic linking" is OFF (we want manual linking)

### Redirect URLs

Go to Supabase Dashboard → Authentication → URL Configuration:

- [ ] `http://localhost:3000/auth/callback` is in allowed redirect URLs
- [ ] `https://yourdomain.com/auth/callback` is in allowed redirect URLs (production)

## Additional Debugging

### Check Current User Identities

In browser console, run:
```javascript
const { data: { user } } = await supabase.auth.getUser()
console.log('User identities:', user.identities)
```

**Expected before linking:**
```javascript
[{ provider: "email", ... }]
```

**Expected after linking:**
```javascript
[
  { provider: "email", ... },
  { provider: "google", ... }
]
```

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Select "Auth" logs
4. Look for recent entries around the time you tried linking
5. Check for any errors or warnings

### Check Network Tab

1. Open DevTools → Network tab
2. Try linking again
3. Look for request to `/auth/callback`
4. Check the request URL and parameters
5. Check the response (should be 302 redirect)

## Report Issues

If still having problems, provide:

1. **Console logs** (copy all logs from "🔗 Initiating" to final redirect)
2. **Callback URL** (from address bar after Google OAuth)
3. **Supabase logs** (screenshot of relevant auth logs)
4. **Network tab** (screenshot of callback request)
5. **User identities** (from console command above)

## Success Criteria

✅ All these should be true:
- Console shows linking flow logs
- Callback URL contains `link=true`
- Redirected to profile page
- Success alert appears
- Google shows as "Linked"
- User has 2 identities (email + google)
- Can sign in with either method
