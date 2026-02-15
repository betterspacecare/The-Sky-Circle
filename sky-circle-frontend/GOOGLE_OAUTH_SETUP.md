# Google OAuth Setup Guide for SkyGuild

## Overview
This guide will help you enable Google OAuth authentication in your SkyGuild application using Supabase.

## ✅ What's Already Implemented

Your application already has:
- ✅ Google OAuth button on login page
- ✅ Google OAuth button on signup page
- ✅ Auth callback handler (`/auth/callback`)
- ✅ Automatic user profile creation for OAuth users
- ✅ Profile photo and display name from Google account

## 🚀 Setup Steps

### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: "SkyGuild" (or your preferred name)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External" (unless you have Google Workspace)
   - Click "Create"
   
   **Fill in the form:**
   - App name: `SkyGuild`
   - User support email: `your-email@example.com`
   - App logo: Upload your logo (optional)
   - Application home page: `https://theskycircle.com`
   - Application privacy policy: `https://theskycircle.com/privacy`
   - Application terms of service: `https://theskycircle.com/terms`
   - Authorized domains: `theskycircle.com`
   - Developer contact: `your-email@example.com`
   - Click "Save and Continue"

5. **Add Scopes** (optional, default scopes are sufficient)
   - Click "Add or Remove Scopes"
   - Select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click "Update" → "Save and Continue"

6. **Add Test Users** (for development)
   - Add your email and team members' emails
   - Click "Save and Continue"

7. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "SkyGuild Web Client"
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://theskycircle.com
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:3000/auth/callback
   https://theskycircle.com/auth/callback
   https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback
   ```
   
   - Click "Create"
   - **Save your Client ID and Client Secret** (you'll need these)

### Step 2: Configure Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com/
   - Select your project

2. **Navigate to Authentication Settings**
   - Click "Authentication" in sidebar
   - Click "Providers"
   - Find "Google" in the list

3. **Enable Google Provider**
   - Toggle "Enable Sign in with Google" to ON
   
4. **Add Google Credentials**
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
   - Click "Save"

5. **Get Supabase Callback URL**
   - Copy the callback URL shown in Supabase
   - Format: `https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback`
   - Make sure this is added to Google Cloud Console (Step 1.7)

### Step 3: Update Environment Variables

Add to your `.env.local` file (if needed):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These should already be set, but verify they're correct.

### Step 4: Test the Integration

#### Local Testing

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Test Login Flow**
   - Go to http://localhost:3000/login
   - Click "Continue with Google"
   - Sign in with your Google account
   - Should redirect to `/setup-profile` (new users) or `/dashboard` (existing users)

3. **Test Signup Flow**
   - Go to http://localhost:3000/signup
   - Click "Continue with Google"
   - Verify profile creation

#### Production Testing

1. **Deploy your application**
2. **Update Google OAuth redirect URIs** with production URL
3. **Test on production domain**

### Step 5: Verify User Profile Creation

After a user signs in with Google, check Supabase:

1. Go to "Authentication" → "Users"
2. Find the new user
3. Verify:
   - ✅ User exists in auth.users
   - ✅ Profile created in public.users table
   - ✅ Display name populated from Google
   - ✅ Profile photo URL from Google avatar

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution**:
1. Check the error message for the actual redirect URI being used
2. Add that exact URI to Google Cloud Console → Credentials → Authorized redirect URIs
3. Common URIs to add:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`
   - `https://[PROJECT-ID].supabase.co/auth/v1/callback`

### Error: "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not properly configured.

**Solution**:
1. Complete all required fields in OAuth consent screen
2. Add your domain to "Authorized domains"
3. Publish the app (or add test users)

### Error: "User profile not created"

**Problem**: Database trigger or callback handler issue.

**Solution**:
1. Check Supabase logs for errors
2. Verify the `users` table exists with correct schema
3. Check the auth callback handler at `/app/auth/callback/route.ts`

### Users Can't Sign In

**Problem**: Google provider not enabled or misconfigured.

**Solution**:
1. Verify Google provider is enabled in Supabase
2. Check Client ID and Secret are correct
3. Ensure redirect URIs match exactly (including http/https)
4. Check browser console for errors

### Profile Photo Not Showing

**Problem**: Avatar URL not being saved.

**Solution**:
1. Check if `profile_photo_url` column exists in users table
2. Verify the callback handler saves `user_metadata.avatar_url`
3. Check Supabase logs for any errors

## 📋 Checklist

### Google Cloud Console
- [ ] Project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] Test users added (for development)
- [ ] OAuth 2.0 credentials created
- [ ] Authorized JavaScript origins added
- [ ] Authorized redirect URIs added
- [ ] Client ID and Secret saved

### Supabase
- [ ] Google provider enabled
- [ ] Client ID added
- [ ] Client Secret added
- [ ] Callback URL copied to Google Console
- [ ] Users table has required columns

### Application
- [ ] Environment variables set
- [ ] Login page has Google button
- [ ] Signup page has Google button
- [ ] Auth callback handler working
- [ ] Profile creation working
- [ ] Tested locally
- [ ] Tested in production

## 🎯 Expected User Flow

### New User (First Time)
1. User clicks "Continue with Google"
2. Redirected to Google sign-in
3. User authorizes the app
4. Redirected back to app
5. Profile automatically created with:
   - Email from Google
   - Display name from Google
   - Profile photo from Google
   - Generated referral code
6. Redirected to `/setup-profile` to complete profile

### Existing User (Returning)
1. User clicks "Continue with Google"
2. Redirected to Google sign-in
3. User authorizes (or auto-approved if previously authorized)
4. Redirected back to app
5. Existing profile loaded
6. Redirected to `/dashboard`

## 🔐 Security Best Practices

1. **Never commit credentials**
   - Keep Client ID and Secret in environment variables
   - Add `.env.local` to `.gitignore`

2. **Use HTTPS in production**
   - Google OAuth requires HTTPS for production
   - Use http://localhost for development only

3. **Restrict authorized domains**
   - Only add domains you control
   - Remove test domains before production

4. **Review OAuth scopes**
   - Only request necessary permissions
   - Default scopes (email, profile) are sufficient

5. **Monitor usage**
   - Check Google Cloud Console for API usage
   - Set up billing alerts if needed

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

## 🆘 Support

If you encounter issues:

1. **Check Supabase Logs**
   - Dashboard → Logs → Auth logs

2. **Check Browser Console**
   - Look for JavaScript errors
   - Check network tab for failed requests

3. **Supabase Discord**
   - https://discord.supabase.com

4. **Stack Overflow**
   - Tag: `supabase`, `google-oauth`

## ✨ Success!

Once configured, users can:
- ✅ Sign in with one click using Google
- ✅ No password to remember
- ✅ Automatic profile creation
- ✅ Profile photo from Google
- ✅ Faster onboarding experience

Your SkyGuild application is now ready for Google OAuth! 🚀
