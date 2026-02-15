# OAuth Troubleshooting Guide

## Common Issue: Redirecting to Reset Password After Google Login

### Problem
When logging in with Google, users are redirected to `/reset-password?code=...` instead of the dashboard.

### Root Cause
The home page (`app/page.tsx`) was checking for ANY `code` parameter in the URL and assuming it was a password reset code. OAuth callbacks also use a `code` parameter, causing the conflict.

### Solution Applied ✅
Updated the home page to only redirect to reset-password when BOTH conditions are met:
1. `code` parameter exists
2. `type=recovery` parameter exists

This ensures only actual password reset links trigger the redirect, not OAuth callbacks.

### Code Changes

**Before (Problematic):**
```typescript
useEffect(() => {
  const code = searchParams.get('code')
  if (code) {
    router.replace(`/reset-password?code=${code}`)
  }
}, [searchParams, router])
```

**After (Fixed):**
```typescript
useEffect(() => {
  // Only redirect to reset-password if we have both 'code' and 'type=recovery' parameters
  // This prevents OAuth callback codes from being mistaken for password reset codes
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  
  if (code && type === 'recovery') {
    router.replace(`/reset-password?code=${code}`)
  }
}, [searchParams, router])
```

### How OAuth Flow Works

1. **User clicks "Continue with Google"**
   - Redirects to Google sign-in

2. **Google authenticates user**
   - Redirects to: `https://[project-id].supabase.co/auth/v1/callback?code=xxx`

3. **Supabase processes OAuth**
   - Exchanges code for session
   - Redirects to: `https://your-domain.com/auth/callback?code=xxx`

4. **Your app's callback handler**
   - Processes the code
   - Creates/updates user profile
   - Redirects to dashboard or setup-profile

### How Password Reset Works

1. **User clicks "Forgot Password"**
   - Enters email
   - Receives email with link

2. **User clicks link in email**
   - Link format: `https://your-domain.com/?code=xxx&type=recovery`
   - Note the `type=recovery` parameter

3. **App detects recovery type**
   - Redirects to: `/reset-password?code=xxx`

4. **User resets password**
   - Enters new password
   - Redirects to dashboard

### Key Differences

| Feature | OAuth Callback | Password Reset |
|---------|---------------|----------------|
| URL Parameter | `code=xxx` | `code=xxx&type=recovery` |
| Callback URL | `/auth/callback` | `/` (home page) |
| Purpose | Exchange code for session | Reset password |
| Handler | `app/auth/callback/route.ts` | `app/reset-password/page.tsx` |

## Other Common OAuth Issues

### Issue: "User already registered"

**Problem**: Trying to sign up with Google using an email that already exists with password auth.

**Solution**: 
1. User should use "Sign In" instead of "Sign Up"
2. Or, link the Google account to existing account (requires custom implementation)

### Issue: Profile not created

**Problem**: User can log in but profile data is missing.

**Solution**: Check the auth callback handler logs:
```typescript
// In app/auth/callback/route.ts
console.log('Session user:', session.user)
console.log('Existing user:', existingUser)
```

### Issue: Infinite redirect loop

**Problem**: User keeps getting redirected between pages.

**Solution**: 
1. Check middleware isn't blocking auth routes
2. Verify session is being set correctly
3. Check for conflicting redirects in multiple places

### Issue: "redirect_uri_mismatch"

**Problem**: Google OAuth redirect URI doesn't match.

**Solution**: 
1. Check Google Cloud Console → Credentials
2. Ensure these URIs are added:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`
   - `https://[project-id].supabase.co/auth/v1/callback`

## Debugging Tips

### 1. Check URL Parameters
When redirected to an unexpected page, check the URL:
```
Good OAuth: /auth/callback?code=xxx
Good Reset: /?code=xxx&type=recovery
Bad: /reset-password?code=xxx (without type=recovery)
```

### 2. Check Browser Console
Look for errors:
```javascript
// OAuth errors
console.error('Auth callback error:', error)

// Profile creation errors
console.error('Profile creation error:', insertError)
```

### 3. Check Supabase Logs
Dashboard → Logs → Auth logs
- Look for failed auth attempts
- Check for profile creation errors

### 4. Check Network Tab
- Look for failed API calls
- Check redirect chains
- Verify session cookies are set

### 5. Test in Incognito
- Eliminates cached session issues
- Fresh OAuth flow
- Clean cookies

## Prevention Checklist

To avoid similar issues in the future:

- [ ] Always check for specific parameters, not just existence
- [ ] Use `type` parameter to distinguish different flows
- [ ] Add comments explaining redirect logic
- [ ] Test OAuth flow after any auth-related changes
- [ ] Test password reset flow separately
- [ ] Use different callback URLs for different auth methods
- [ ] Log important steps for debugging

## Testing Checklist

After fixing OAuth issues:

- [ ] Test Google sign-in (new user)
- [ ] Test Google sign-in (existing user)
- [ ] Test password reset flow
- [ ] Test email/password login
- [ ] Test logout and re-login
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Check Supabase user creation
- [ ] Verify profile data is saved
- [ ] Check session persistence

## Quick Fixes

### Clear Everything and Start Fresh
```bash
# Clear browser data
1. Open DevTools (F12)
2. Application → Storage → Clear site data

# Restart dev server
npm run dev

# Test again
```

### Force Logout
```typescript
// Add to any page temporarily
const supabase = createClient()
await supabase.auth.signOut()
```

### Check Current Session
```typescript
// Add to any page temporarily
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session)
```

## Support

If issues persist:

1. **Check this guide first** - Most issues are covered here
2. **Check Supabase logs** - Dashboard → Logs
3. **Check browser console** - Look for errors
4. **Test in incognito** - Rule out cache issues
5. **Ask for help** - Supabase Discord or Stack Overflow

## Related Files

- `app/page.tsx` - Home page with redirect logic
- `app/auth/callback/route.ts` - OAuth callback handler
- `app/login/page.tsx` - Login page with Google button
- `app/signup/page.tsx` - Signup page with Google button
- `app/reset-password/page.tsx` - Password reset page
- `middleware.ts` - Session refresh middleware

## Summary

The key fix was making the redirect logic more specific:
- ✅ Check for `type=recovery` parameter
- ✅ Only redirect to reset-password when it's actually a password reset
- ✅ Let OAuth callbacks go through to `/auth/callback`

This ensures each auth flow works independently without interfering with others.
