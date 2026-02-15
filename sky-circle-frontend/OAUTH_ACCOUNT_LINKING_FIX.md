# OAuth Account Linking Fix - LATEST UPDATE

## Current Problem (After Multiple Fixes)
When linking a Google account from the profile page, users are STILL being redirected to the reset-password page instead of back to their profile.

## Root Cause Analysis

### The Core Issue
Supabase's `linkIdentity()` method uses the same OAuth callback flow as regular sign-in and password recovery. The callback handler needs to distinguish between:
1. **Regular OAuth sign-in** (new user or existing user logging in)
2. **Password recovery flow** (`type=recovery` parameter)
3. **Account linking flow** (user adding Google to existing account)

### Why Previous Fixes Didn't Work
1. First fix: Removed redirect from home page ✅
2. Second fix: Updated forgot-password redirect ✅
3. Third fix: Enhanced auth callback to check recovery type ✅
4. Fourth fix: Reordered checks to prioritize linking ✅
5. **LATEST FIX**: Added comprehensive logging and ensured `link=true` is checked FIRST

## Latest Solution Implemented

### 1. Enhanced Auth Callback (`/app/auth/callback/route.ts`)

**Key Changes:**
- Added comprehensive logging of ALL URL parameters
- **CRITICAL**: Check for `link=true` parameter FIRST, before any other checks
- Added visual indicators in logs (✅, 🔑, 👤, 🏠) for easier debugging
- Log user identities to verify linking worked

```typescript
export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/dashboard'
    const type = requestUrl.searchParams.get('type')
    const isLinking = requestUrl.searchParams.get('link') === 'true'
    
    // Get all params for debugging
    const allParams = Object.fromEntries(requestUrl.searchParams.entries())
    console.log('Auth callback - All params:', allParams)
    console.log('Auth callback - Parsed:', { code: !!code, type, isLinking })

    if (code) {
        const supabase = await createClient()
        
        try {
            const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
            
            if (error) {
                // Handle errors...
                return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
            }
            
            if (session?.user) {
                console.log('Session user identities:', session.user.identities?.map(i => ({ provider: i.provider, id: i.id })))
                
                // CRITICAL: Check for account linking FIRST
                if (isLinking) {
                    console.log('✅ Account linking flow detected - redirecting to profile')
                    return NextResponse.redirect(new URL('/dashboard/profile?linked=success', request.url))
                }

                // Only check for password recovery if NOT linking
                if (type === 'recovery') {
                    console.log('🔑 Password recovery flow - redirecting to reset-password')
                    return NextResponse.redirect(new URL(`/reset-password`, request.url))
                }
                
                // Check if new user
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', session.user.id)
                    .single()

                if (!existingUser) {
                    console.log('👤 New user - redirecting to setup-profile')
                    // Create profile and redirect to setup
                    return NextResponse.redirect(new URL('/setup-profile', request.url))
                }
                
                // Existing user
                console.log('🏠 Existing user - redirecting to dashboard')
                return NextResponse.redirect(new URL(next, request.url))
            }
        } catch (err) {
            console.error('Unexpected error in auth callback:', err)
            return NextResponse.redirect(new URL('/login?error=unexpected', request.url))
        }
    }

    return NextResponse.redirect(new URL('/login', request.url))
}
```

### 2. Improved AccountLinking Component

**Key Changes:**
- Added detailed console logging for debugging
- Added `queryParams` to help distinguish the flow
- Better error handling and user feedback

```typescript
const handleLinkGoogle = async () => {
    setLinking(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if Google is already linked
      const hasGoogle = linkedAccounts.some(acc => acc.provider === 'google')
      if (hasGoogle) {
        setError('Google account is already linked')
        setLinking(false)
        return
      }

      console.log('🔗 Initiating Google account linking...')
      
      // IMPORTANT: The link=true parameter is critical
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?link=true`,
          queryParams: {
            access_type: 'online',
            prompt: 'select_account'
          }
        }
      })

      if (error) {
        console.error('❌ Link identity error:', error)
        throw error
      }

      console.log('✅ Redirecting to Google for account linking...')
    } catch (err: any) {
      console.error('Link error:', err)
      setError(err.message || 'Failed to link Google account')
      setLinking(false)
    }
}
```

### 3. Profile Page Success Handling

```typescript
useEffect(() => {
    fetchProfile()
    
    // Check for linking success message
    const params = new URLSearchParams(window.location.search)
    if (params.get('linked') === 'success') {
        alert('✅ Google account linked successfully!')
        window.history.replaceState({}, '', '/dashboard/profile')
    }
}, [])
```

## Testing Instructions

### Test Account Linking (Primary Test)

1. **Sign in with email/password**
   - Use an account that doesn't have Google linked yet

2. **Go to Profile page**
   - Scroll down to "Linked Accounts" section in left column

3. **Open Browser DevTools Console**
   - Press F12 or right-click → Inspect
   - Go to Console tab

4. **Click "Link" button next to Google account**

5. **Watch Console Logs** (should see):
   ```
   🔗 Initiating Google account linking...
   ✅ Redirecting to Google for account linking...
   ```

6. **Complete Google OAuth**
   - Select your Google account
   - Grant permissions

7. **After redirect, check Console** (should see):
   ```
   Auth callback - All params: { code: "abc123...", link: "true" }
   Auth callback - Parsed: { code: true, type: null, isLinking: true }
   Session user identities: [
     { provider: "email", id: "..." },
     { provider: "google", id: "..." }
   ]
   ✅ Account linking flow detected - redirecting to profile
   ```

8. **Verify Success**
   - Should see alert: "✅ Google account linked successfully!"
   - Should be on profile page (NOT reset-password)
   - Google account should show "Linked" status

### What to Look For in Console

**Successful Linking Flow:**
```
🔗 Initiating Google account linking...
✅ Redirecting to Google for account linking...
[After OAuth redirect]
Auth callback - All params: { code: "...", link: "true", ... }
Auth callback - Parsed: { code: true, type: null, isLinking: true }
Session user identities: [{ provider: "email", ... }, { provider: "google", ... }]
✅ Account linking flow detected - redirecting to profile
```

**If Still Redirecting to Reset Password:**
```
Auth callback - All params: { code: "...", type: "recovery", ... }
Auth callback - Parsed: { code: true, type: "recovery", isLinking: false }
🔑 Password recovery flow - redirecting to reset-password
```

### Test Password Recovery (Should Still Work)

1. **Go to forgot-password page**
2. **Enter your email**
3. **Check email for reset link**
4. **Click link in email**
5. **Should be redirected to reset-password page** (NOT profile)
6. **Console should show:**
   ```
   Auth callback - All params: { code: "...", type: "recovery" }
   🔑 Password recovery flow - redirecting to reset-password
   ```

## Debugging Guide

### If Linking Still Fails

1. **Check Console Logs**
   - Look for "Auth callback - All params" log
   - Verify `link: "true"` is present
   - Check if `type: "recovery"` is present (it shouldn't be)

2. **Check Supabase Settings**
   - Go to Supabase Dashboard → Authentication → Settings
   - **Disable** "Enable automatic linking of accounts with the same email"
   - This forces manual linking only

3. **Check Redirect URL in Supabase**
   - Go to Authentication → URL Configuration
   - Add `http://localhost:3000/auth/callback` to allowed redirect URLs
   - Add `https://yourdomain.com/auth/callback` for production

4. **Clear Browser Data**
   - Clear cookies and cache
   - Try in incognito mode

5. **Check for Multiple Tabs**
   - Close all other tabs of your app
   - Sometimes session conflicts occur

### Common Issues

**Issue 1: `link` parameter is missing**
- Check AccountLinking component
- Verify `redirectTo` includes `?link=true`

**Issue 2: `type=recovery` is present when linking**
- This shouldn't happen
- Check if Supabase is adding it
- May need to contact Supabase support

**Issue 3: User has no email identity**
- User might have signed up with Google originally
- Can't link Google to Google
- Check user identities in console log

## Priority Order in Callback

The callback now checks in this order:

1. ✅ **Check `link=true` parameter** (account linking) → Profile
2. 🔑 **Check `type=recovery`** (password reset) → Reset Password
3. 👤 **Check if new user** (no profile) → Setup Profile
4. 🏠 **Existing user** → Dashboard

## URL Parameters Reference

| Flow | URL Parameters | Destination |
|------|---------------|-------------|
| Account Linking | `?link=true&code=...` | `/dashboard/profile?linked=success` |
| Password Recovery | `?type=recovery&code=...` | `/reset-password` |
| New User Sign-in | `?code=...` | `/setup-profile` |
| Existing User Sign-in | `?code=...` | `/dashboard` |

## Files Modified

1. ✅ `/app/auth/callback/route.ts` - Enhanced callback with logging
2. ✅ `/components/profile/AccountLinking.tsx` - Added logging and queryParams
3. ✅ `/app/dashboard/profile/page.tsx` - Added success alert
4. ✅ `/app/page.tsx` - Removed problematic redirect
5. ✅ `/app/forgot-password/page.tsx` - Fixed redirect URL

## Security Configuration

### Supabase Settings (Production)

```
Authentication → Settings:

✅ Enable email provider
✅ Enable Google provider
✅ Confirm email (ON for security)
❌ Enable automatic linking (OFF - use manual linking)
✅ Secure email change (ON for security)
```

### Supabase Settings (Development)

```
Authentication → Settings:

✅ Enable email provider
✅ Enable Google provider
❌ Confirm email (OFF for easier testing)
❌ Enable automatic linking (OFF - test manual linking)
❌ Secure email change (OFF for easier testing)
```

## Next Steps

1. **Test the linking flow** with console open
2. **Share console logs** if still having issues
3. **Check Supabase logs** in dashboard
4. **Verify user identities** after linking

## Summary

This fix adds comprehensive logging and ensures the callback checks for account linking FIRST, before any other flow. The `link=true` parameter is the key to distinguishing linking from other OAuth flows.

**If still having issues after this fix:**
- Share the complete console logs
- Check Supabase dashboard logs
- Verify the callback URL in browser address bar
- Try in incognito mode to rule out cache issues
