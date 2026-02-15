# Email Confirmation & Account Linking Setup Guide

## Overview

This guide covers:
1. Enabling email confirmation for security
2. Manual account linking feature
3. Proper error handling for OAuth conflicts

## ✅ What's Been Implemented

### 1. Manual Account Linking
- ✅ New `AccountLinking` component in profile settings
- ✅ Users can link Google to existing email/password accounts
- ✅ Users can unlink accounts (with safety checks)
- ✅ Visual status indicators for linked accounts
- ✅ Security warnings and requirements

### 2. Improved Error Handling
- ✅ Clear error messages when email already exists
- ✅ Guidance to use correct sign-in method
- ✅ Instructions to link accounts in profile settings
- ✅ Prevents automatic account linking for security

### 3. Auth Callback Improvements
- ✅ Handles account linking flow separately
- ✅ Detects password recovery vs OAuth
- ✅ Better error messages with specific guidance
- ✅ Redirects to appropriate pages based on context

## 🔐 Supabase Configuration

### Step 1: Enable Email Confirmation (REQUIRED for Production)

1. **Go to Supabase Dashboard**
   - Navigate to: Authentication → Settings

2. **Enable Email Confirmation**
   ```
   ✅ Confirm email
   ```
   - Toggle this ON
   - This ensures users verify their email before accessing the app

3. **Disable Automatic Account Linking** (Security Best Practice)
   ```
   ❌ Enable automatic linking of accounts with the same email
   ```
   - Toggle this OFF
   - Users must manually link accounts through profile settings

4. **Configure Email Templates** (Optional but Recommended)
   - Go to: Authentication → Email Templates
   - Customize:
     - Confirmation email
     - Password reset email
     - Email change confirmation
   - Add your branding and clear instructions

5. **Set Redirect URLs**
   ```
   Site URL: https://www.skyguild.club
   Redirect URLs:
   - https://www.skyguild.club/**
   - http://localhost:3000/** (for development)
   ```

### Step 2: Configure OAuth Providers

1. **Google OAuth Settings**
   - Go to: Authentication → Providers → Google
   - Ensure these are set:
     ```
     ✅ Enable Sign in with Google
     Skip nonce check: OFF (keep security)
     ```

2. **Email Provider Settings**
   - Go to: Authentication → Providers → Email
   - Ensure these are set:
     ```
     ✅ Enable Email provider
     ✅ Confirm email
     ✅ Secure email change
     ```

## 📋 User Flows

### Flow 1: New User with Email/Password

```
1. User signs up with email/password
2. → Receives confirmation email
3. → Clicks confirmation link
4. → Email verified
5. → Redirected to /setup-profile
6. → Completes profile
7. → Redirected to /dashboard
8. ✅ Can now use the app
```

### Flow 2: New User with Google

```
1. User clicks "Continue with Google"
2. → Google sign-in page
3. → Authorizes app
4. → Email automatically verified (by Google)
5. → Profile created
6. → Redirected to /setup-profile
7. → Completes profile
8. → Redirected to /dashboard
9. ✅ Can now use the app
```

### Flow 3: Existing User Linking Google Account

```
1. User logs in with email/password
2. → Goes to Profile → Account Linking
3. → Clicks "Link" on Google account
4. → Google sign-in page
5. → Authorizes app
6. → Redirected back to profile
7. → Success message shown
8. ✅ Can now sign in with either method
```

### Flow 4: User Tries to Sign Up with Existing Email

```
1. User tries to sign up with Google
2. → Email already exists with password auth
3. → Error shown: "This email is already registered..."
4. → Directed to sign in with email/password
5. → After sign in, can link Google in profile settings
```

## 🎨 UI Components

### AccountLinking Component

Located in: `components/profile/AccountLinking.tsx`

**Features:**
- Shows all linked accounts (Email, Google)
- Visual status indicators (Linked/Not Linked)
- Link/Unlink buttons
- Security warnings
- Error and success messages
- Loading states

**Usage:**
```tsx
import AccountLinking from '@/components/profile/AccountLinking'

// In your profile page
<AccountLinking />
```

**Props:** None (uses Supabase auth context)

## 🔧 API Methods

### Link Google Account

```typescript
const { error } = await supabase.auth.linkIdentity({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback?link=true`,
  }
})
```

### Unlink Google Account

```typescript
const { data: { user } } = await supabase.auth.getUser()
const googleIdentity = user.identities?.find(i => i.provider === 'google')

const { error } = await supabase.auth.unlinkIdentity(googleIdentity)
```

### Check Linked Accounts

```typescript
const { data: { user } } = await supabase.auth.getUser()
const identities = user.identities || []

const hasEmail = identities.some(i => i.provider === 'email')
const hasGoogle = identities.some(i => i.provider === 'google')
```

## 🛡️ Security Features

### 1. Email Verification Required
- Users must verify email before accessing app
- Prevents spam and fake accounts
- Ensures valid contact information

### 2. No Automatic Account Linking
- Prevents unauthorized account takeover
- User must explicitly link accounts
- Requires authentication to link

### 3. Cannot Unlink Last Method
- Users must have at least one sign-in method
- Prevents account lockout
- Shows warning when trying to unlink

### 4. Secure OAuth Flow
- Uses PKCE for OAuth security
- State parameter prevents CSRF
- Tokens stored in httpOnly cookies

## 📧 Email Templates

### Confirmation Email Template

```html
<h2>Confirm your email</h2>
<p>Welcome to SkyGuild! Please confirm your email address to get started.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

### Password Reset Email Template

```html
<h2>Reset your password</h2>
<p>You requested to reset your password for SkyGuild.</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link expires in 1 hour.</p>
```

## 🧪 Testing Checklist

### Email/Password Flow
- [ ] Sign up with email/password
- [ ] Receive confirmation email
- [ ] Click confirmation link
- [ ] Email verified successfully
- [ ] Can sign in
- [ ] Can reset password
- [ ] Receive password reset email
- [ ] Can set new password

### Google OAuth Flow
- [ ] Sign up with Google (new email)
- [ ] Profile created automatically
- [ ] Email verified by Google
- [ ] Can sign in with Google
- [ ] Can sign out and sign in again

### Account Linking Flow
- [ ] Sign in with email/password
- [ ] Go to profile settings
- [ ] See Account Linking section
- [ ] Click "Link" on Google
- [ ] Authorize Google
- [ ] Redirected back to profile
- [ ] Google account now linked
- [ ] Can sign in with either method
- [ ] Can unlink Google account
- [ ] Cannot unlink if it's the only method

### Error Handling
- [ ] Try to sign up with existing email (Google)
- [ ] See clear error message
- [ ] Directed to correct sign-in method
- [ ] Try to unlink last sign-in method
- [ ] See warning and prevented
- [ ] Try to link already linked account
- [ ] See appropriate error

## 🐛 Troubleshooting

### Issue: Not receiving confirmation emails

**Solutions:**
1. Check spam folder
2. Verify email provider settings in Supabase
3. Check Supabase logs for email errors
4. Verify SMTP settings (if using custom SMTP)
5. Test with different email provider (Gmail, Outlook, etc.)

### Issue: Confirmation link doesn't work

**Solutions:**
1. Check redirect URLs in Supabase settings
2. Verify link hasn't expired (default: 24 hours)
3. Check browser console for errors
4. Try in incognito mode
5. Check if email confirmation is enabled

### Issue: Cannot link Google account

**Solutions:**
1. Verify user is signed in
2. Check if Google is already linked
3. Verify Google OAuth is enabled in Supabase
4. Check redirect URLs in Google Cloud Console
5. Check browser console for errors

### Issue: Account linking shows wrong status

**Solutions:**
1. Refresh the page
2. Sign out and sign in again
3. Check Supabase auth logs
4. Verify identities in Supabase dashboard

## 📊 Monitoring

### Metrics to Track

1. **Email Confirmation Rate**
   - How many users confirm their email?
   - Target: >90%

2. **Account Linking Usage**
   - How many users link multiple methods?
   - Target: >30%

3. **OAuth vs Email Signup**
   - Which method is more popular?
   - Optimize based on usage

4. **Error Rates**
   - How often do users encounter errors?
   - Target: <5%

### Supabase Queries

```sql
-- Check email confirmation rate
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed,
  ROUND(COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as confirmation_rate
FROM auth.users;

-- Check linked accounts
SELECT 
  id,
  email,
  (SELECT COUNT(*) FROM auth.identities WHERE user_id = auth.users.id) as identity_count
FROM auth.users
WHERE (SELECT COUNT(*) FROM auth.identities WHERE user_id = auth.users.id) > 1;

-- Check OAuth vs Email signups
SELECT 
  provider,
  COUNT(*) as count
FROM auth.identities
GROUP BY provider;
```

## 🚀 Deployment Checklist

Before going to production:

- [ ] Email confirmation enabled
- [ ] Automatic account linking disabled
- [ ] Email templates customized
- [ ] Redirect URLs configured for production
- [ ] Google OAuth configured for production domain
- [ ] SMTP settings configured (if using custom)
- [ ] Test all flows in production environment
- [ ] Monitor email delivery rates
- [ ] Set up error tracking
- [ ] Document user support procedures

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Confirmation Guide](https://supabase.com/docs/guides/auth/auth-email)
- [OAuth Guide](https://supabase.com/docs/guides/auth/social-login)
- [Account Linking](https://supabase.com/docs/guides/auth/auth-identity-linking)

## ✨ Summary

Your SkyGuild application now has:

✅ **Secure email confirmation** - Users must verify their email
✅ **Manual account linking** - Users can link Google to existing accounts
✅ **Better error handling** - Clear messages guide users to correct actions
✅ **Security best practices** - No automatic linking, proper verification
✅ **User-friendly UI** - Easy to understand and use account linking

**Next Steps:**
1. Enable email confirmation in Supabase
2. Disable automatic account linking
3. Test all flows thoroughly
4. Deploy to production
5. Monitor metrics and user feedback
