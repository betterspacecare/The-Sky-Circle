# OAuth Debug Guide

## Quick Diagnosis

Run these checks to find the exact issue:

### 1. Check What's in the URL

When you get redirected to reset-password, look at the full URL:

```
❌ BAD: https://www.skyguild.club/reset-password?code=xxx
   (No type parameter - this is wrong)

✅ GOOD: https://www.skyguild.club/reset-password?code=xxx&type=recovery
   (Has type=recovery - this is correct for password reset)

🔍 OAUTH: https://www.skyguild.club/auth/callback?code=xxx
   (Should go here first, not directly to reset-password)
```

### 2. Check Supabase Settings

Go to: https://app.supabase.com/ → Your Project → Authentication → Settings

Look for these settings and note their values:

```
Confirm email: [ ] ON  [ ] OFF
Enable automatic linking: [ ] ON  [ ] OFF
Secure email change: [ ] ON  [ ] OFF
```

**For Development (Recommended):**
- Confirm email: OFF
- Enable automatic linking: ON
- Secure email change: OFF

### 3. Check Your Account

In Supabase Dashboard → Authentication → Users

Find your email and check:
- Provider: `email` or `google`?
- Created at: When was it created?
- Last sign in: When did you last sign in?

### 4. Test Scenarios

Try these in order:

**Test A: Fresh Google Account**
```
1. Use a Google account you've NEVER used with SkyGuild
2. Click "Continue with Google"
3. Expected: Should create new account and go to /setup-profile
4. Actual: _________________
```

**Test B: Existing Password Account**
```
1. Create account with email/password (if you haven't)
2. Logout
3. Try to login with Google using SAME email
4. Expected: Error or account link (depending on settings)
5. Actual: _________________
```

**Test C: Existing Google Account**
```
1. If you created account with Google before
2. Logout
3. Login with Google again
4. Expected: Should login and go to /dashboard
5. Actual: _________________
```

## Common Issues & Fixes

### Issue 1: Redirecting to reset-password without type=recovery

**Cause**: Old code was checking for any `code` parameter

**Fix**: ✅ Already fixed - removed that redirect

**Verify**: Check `app/page.tsx` - should NOT have redirect logic

### Issue 2: Account already exists with different provider

**Cause**: Trying to use Google with email that exists with password auth

**Fix**: Enable automatic linking in Supabase settings

**Steps**:
1. Supabase Dashboard → Authentication → Settings
2. Find "Enable automatic linking of accounts with the same email"
3. Toggle ON
4. Save

### Issue 3: Supabase redirecting to wrong URL

**Cause**: Redirect URL in Google Cloud Console doesn't match

**Fix**: Verify these URLs in Google Cloud Console:

```
Authorized redirect URIs should include:
✅ https://[your-project-id].supabase.co/auth/v1/callback
✅ https://www.skyguild.club/auth/callback
✅ http://localhost:3000/auth/callback (for development)
```

## Debug Commands

### Check Current Session
```typescript
// Add this to any page temporarily
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User:', session?.user)
console.log('Provider:', session?.user?.app_metadata?.provider)
```

### Force Logout
```typescript
// Add this to any page temporarily
const supabase = createClient()
await supabase.auth.signOut()
console.log('Logged out')
```

### Check Auth State
```typescript
// Add this to any page temporarily
const supabase = createClient()
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session)
})
```

## Step-by-Step Fix

Follow these steps in order:

### Step 1: Clear Everything
```
1. Open DevTools (F12)
2. Application → Storage → Clear site data
3. Close browser completely
4. Reopen browser
```

### Step 2: Check Supabase Settings
```
1. Go to Supabase Dashboard
2. Authentication → Settings
3. Enable automatic linking: ON
4. Confirm email: OFF (for development)
5. Save changes
```

### Step 3: Check Google Cloud Console
```
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Find your OAuth client
4. Verify redirect URIs include:
   - https://[project-id].supabase.co/auth/v1/callback
   - https://www.skyguild.club/auth/callback
```

### Step 4: Test with New Email
```
1. Use a Google account you've never used
2. Go to https://www.skyguild.club/login
3. Click "Continue with Google"
4. Should work and create new account
```

### Step 5: Check Logs
```
1. Supabase Dashboard → Logs → Auth logs
2. Look for errors
3. Note any "already registered" or "linking" messages
```

## What to Share if Still Broken

If it's still not working, share these details:

1. **Full URL when redirected**:
   ```
   Example: https://www.skyguild.club/reset-password?code=xxx&type=???
   ```

2. **Supabase Settings**:
   ```
   Confirm email: ON/OFF
   Automatic linking: ON/OFF
   ```

3. **Account Details**:
   ```
   Email: your-email@example.com
   Original signup method: email/password or Google?
   ```

4. **Browser Console Errors**:
   ```
   Copy any red errors from console
   ```

5. **Supabase Auth Logs**:
   ```
   Copy any relevant error messages
   ```

## Expected Behavior

### New User (Google)
```
1. Click "Continue with Google"
2. → Google sign-in page
3. → Authorize app
4. → Redirect to /auth/callback?code=xxx
5. → Create user profile
6. → Redirect to /setup-profile
7. ✅ Success
```

### Existing User (Google)
```
1. Click "Continue with Google"
2. → Google sign-in page (or auto-approved)
3. → Redirect to /auth/callback?code=xxx
4. → Load existing profile
5. → Redirect to /dashboard
6. ✅ Success
```

### Existing User (Different Method)
```
1. Click "Continue with Google"
2. → Google sign-in page
3. → Authorize app
4. → Redirect to /auth/callback?code=xxx
5. → Check if linking enabled
   
   If linking ON:
   6a. → Link accounts
   7a. → Redirect to /dashboard
   8a. ✅ Success
   
   If linking OFF:
   6b. → Show error
   7b. → Redirect to /login with error message
   8b. ⚠️ User must use original method
```

## Quick Test Script

Add this to your login page temporarily to debug:

```typescript
// Add after imports
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  console.log('=== DEBUG INFO ===')
  console.log('Current URL:', window.location.href)
  console.log('Search params:', Object.fromEntries(params))
  console.log('Has code:', params.has('code'))
  console.log('Has type:', params.has('type'))
  console.log('Type value:', params.get('type'))
}, [])
```

This will log important info to help diagnose the issue.
