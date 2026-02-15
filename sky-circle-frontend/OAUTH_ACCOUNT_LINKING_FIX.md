# OAuth Account Linking Issue - Fix Guide

## Problem

When trying to sign in with Google using an email that already exists (created with email/password), you're being redirected to the reset-password page instead of logging in.

## Root Cause

Supabase has security settings that prevent automatic account linking. When you try to sign in with Google using an email that already exists with a different auth method (email/password), Supabase blocks it by default.

## Solution Options

### Option 1: Enable Automatic Account Linking (Recommended for Development)

1. **Go to Supabase Dashboard**
   - Navigate to: Authentication → Settings

2. **Find "Confirm email" setting**
   - Look for "Confirm email" toggle
   - This should be OFF for development (users don't need to confirm email)

3. **Enable Account Linking**
   - Look for "Enable automatic linking of accounts with the same email"
   - Toggle this ON

4. **Save Changes**

### Option 2: Manual Account Linking (More Secure)

If you want to keep accounts separate for security:

1. **User must use the same login method they signed up with**
   - If they signed up with email/password → Use email/password to login
   - If they signed up with Google → Use Google to login

2. **Add a "Link Google Account" feature** (requires custom implementation)
   - User logs in with email/password
   - Goes to settings
   - Clicks "Link Google Account"
   - Authorizes Google
   - Accounts are now linked

### Option 3: Show Better Error Message

Update the login page to detect this issue and show a helpful message:

```typescript
const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            if (error.message.includes('already registered')) {
                setError('This email is already registered with a password. Please sign in with your email and password instead.')
            } else {
                throw error
            }
        }
    } catch (err: any) {
        console.error('Google login error:', err)
        setError(err.message || 'Failed to sign in with Google')
        setLoading(false)
    }
}
```

## Immediate Fix for Your Issue

### Step 1: Check Supabase Settings

1. Go to Supabase Dashboard
2. Authentication → Settings
3. Look for these settings:
   - **Confirm email**: Should be OFF for development
   - **Enable automatic linking**: Should be ON if you want Google to work with existing emails

### Step 2: Clear Your Browser Data

1. Open DevTools (F12)
2. Application → Storage → Clear site data
3. Close and reopen browser

### Step 3: Test Again

Try these scenarios:

**Scenario A: New Email**
1. Use a Google account with an email that doesn't exist in your system
2. Click "Continue with Google"
3. Should work fine → Creates new account

**Scenario B: Existing Email (Same Method)**
1. If you created account with Google before
2. Click "Continue with Google" again
3. Should work fine → Logs you in

**Scenario C: Existing Email (Different Method)**
1. If you created account with email/password
2. Try to login with Google using same email
3. This is where the issue occurs

## Recommended Configuration

For development, use these Supabase settings:

```
Authentication → Settings:

✅ Enable email provider
✅ Enable Google provider
❌ Confirm email (OFF for development)
✅ Enable automatic linking of accounts (ON)
❌ Secure email change (OFF for development)
```

For production, use these settings:

```
Authentication → Settings:

✅ Enable email provider
✅ Enable Google provider
✅ Confirm email (ON for security)
❌ Enable automatic linking (OFF for security)
✅ Secure email change (ON for security)
```

## Testing Checklist

After applying fixes:

- [ ] Clear browser data
- [ ] Test Google login with NEW email → Should create account
- [ ] Test Google login with SAME email (if account exists) → Should login or show clear error
- [ ] Test email/password login → Should still work
- [ ] Check Supabase logs for any errors
- [ ] Verify user profile is created correctly

## Alternative: Use Different Emails

If you want to keep things simple during development:

1. **For email/password auth**: Use `yourname@example.com`
2. **For Google OAuth**: Use `yourname@gmail.com`
3. Keep them separate for testing

## Debugging Steps

If still having issues:

### 1. Check Supabase Logs
```
Dashboard → Logs → Auth logs
Look for: "User already registered" or similar errors
```

### 2. Check Browser Console
```javascript
// Look for errors like:
"User already registered"
"Email already exists"
"Account linking not enabled"
```

### 3. Check Current User
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)
console.log('Auth method:', user?.app_metadata?.provider)
```

### 4. Check Database
```sql
-- In Supabase SQL Editor
SELECT 
  id, 
  email, 
  raw_app_meta_data->>'provider' as provider,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

## Code Changes Applied

I've already made these changes to your code:

1. ✅ Removed problematic redirect from home page
2. ✅ Updated auth callback to handle recovery type
3. ✅ Fixed forgot-password redirect URL
4. ✅ Added better error handling in Google OAuth

## Next Steps

1. **Check Supabase Settings** (most important!)
   - Enable automatic account linking for development
   
2. **Clear Browser Data**
   - Remove all cookies and cache
   
3. **Test with Fresh Account**
   - Use a new Google account that doesn't exist in your system
   
4. **If Still Issues**
   - Check Supabase logs
   - Share the exact error message
   - Check which auth provider the existing account uses

## Summary

The redirect to reset-password is likely happening because:

1. ❌ Account linking is disabled in Supabase
2. ❌ You're trying to use Google with an email that exists with password auth
3. ❌ Supabase is treating this as a security issue

**Quick Fix**: Enable automatic account linking in Supabase settings (for development).

**Production Fix**: Keep accounts separate and show clear error messages to users.
