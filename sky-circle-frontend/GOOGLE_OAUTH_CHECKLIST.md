# Google OAuth Setup Checklist

Print this page and check off items as you complete them.

## 📋 Pre-Setup

- [ ] Have access to Google Cloud Console
- [ ] Have access to Supabase Dashboard
- [ ] Know your production domain name
- [ ] Have admin access to the project

## 🔧 Google Cloud Console Setup

### Create Project
- [ ] Go to https://console.cloud.google.com/
- [ ] Create new project named "SkyGuild"
- [ ] Note project ID: ___________________________

### Enable APIs
- [ ] Go to APIs & Services → Library
- [ ] Search for "Google+ API"
- [ ] Click "Enable"

### OAuth Consent Screen
- [ ] Go to APIs & Services → OAuth consent screen
- [ ] Select "External"
- [ ] Fill in App Information:
  - [ ] App name: SkyGuild
  - [ ] User support email: ___________________________
  - [ ] App logo: (uploaded)
  - [ ] Application home page: ___________________________
  - [ ] Privacy policy: ___________________________
  - [ ] Terms of service: ___________________________
  - [ ] Authorized domains: ___________________________
  - [ ] Developer contact: ___________________________
- [ ] Click "Save and Continue"

### Scopes
- [ ] Click "Add or Remove Scopes"
- [ ] Select: .../auth/userinfo.email
- [ ] Select: .../auth/userinfo.profile
- [ ] Click "Update"
- [ ] Click "Save and Continue"

### Test Users (Development Only)
- [ ] Add your email: ___________________________
- [ ] Add team emails: ___________________________
- [ ] Click "Save and Continue"

### Create Credentials
- [ ] Go to APIs & Services → Credentials
- [ ] Click "Create Credentials" → "OAuth client ID"
- [ ] Application type: Web application
- [ ] Name: SkyGuild Web Client

### Authorized JavaScript Origins
- [ ] Add: http://localhost:3000
- [ ] Add: https://___________________________

### Authorized Redirect URIs
- [ ] Add: http://localhost:3000/auth/callback
- [ ] Add: https://___________________________/auth/callback
- [ ] Add: https://___________________________supabase.co/auth/v1/callback

### Save Credentials
- [ ] Copy Client ID: ___________________________
- [ ] Copy Client Secret: ___________________________
- [ ] Store securely (password manager)

## 🗄️ Supabase Setup

### Navigate to Auth Settings
- [ ] Go to https://app.supabase.com/
- [ ] Select your project
- [ ] Click "Authentication" in sidebar
- [ ] Click "Providers"

### Enable Google Provider
- [ ] Find "Google" in the list
- [ ] Toggle "Enable Sign in with Google" to ON

### Add Credentials
- [ ] Paste Client ID: ___________________________
- [ ] Paste Client Secret: ___________________________
- [ ] Click "Save"

### Copy Callback URL
- [ ] Copy Supabase callback URL: ___________________________
- [ ] Verify it's added to Google Console (see above)

## 💻 Application Setup

### Environment Variables
- [ ] Open `.env.local`
- [ ] Verify NEXT_PUBLIC_SUPABASE_URL is set
- [ ] Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is set

### Database Schema
- [ ] Verify `users` table exists
- [ ] Verify columns:
  - [ ] id (UUID, primary key)
  - [ ] email (TEXT)
  - [ ] display_name (TEXT)
  - [ ] profile_photo_url (TEXT)
  - [ ] referral_code (TEXT, unique)
  - [ ] total_points (INTEGER)
  - [ ] level (INTEGER)
  - [ ] created_at (TIMESTAMP)

## 🧪 Testing

### Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Go to http://localhost:3000/login
- [ ] Click "Continue with Google"
- [ ] Sign in with test account
- [ ] Verify redirect to dashboard or setup-profile
- [ ] Check Supabase → Authentication → Users
- [ ] Verify user profile created
- [ ] Check profile photo appears
- [ ] Check display name is set
- [ ] Test logout
- [ ] Test login again (should be faster)

### Production Testing
- [ ] Deploy application
- [ ] Update Google OAuth redirect URIs with production URL
- [ ] Test on production domain
- [ ] Verify HTTPS is working
- [ ] Test with different Google accounts
- [ ] Test on mobile device
- [ ] Test on different browsers

## 🔍 Verification

### Google Cloud Console
- [ ] OAuth consent screen shows "Published" or has test users
- [ ] Credentials show correct redirect URIs
- [ ] No error messages in console

### Supabase
- [ ] Google provider shows as "Enabled"
- [ ] No errors in Auth logs
- [ ] Users appear in Authentication → Users
- [ ] User profiles created in users table

### Application
- [ ] Google button appears on login page
- [ ] Google button appears on signup page
- [ ] No console errors
- [ ] Redirects work correctly
- [ ] Session persists after refresh
- [ ] Logout works correctly

## 🔐 Security Review

### Production Checklist
- [ ] HTTPS enabled on production domain
- [ ] All redirect URIs use HTTPS (except localhost)
- [ ] Client Secret not in source code
- [ ] Client Secret not in git history
- [ ] `.env.local` in `.gitignore`
- [ ] OAuth consent screen published (or test users only)
- [ ] Authorized domains restricted to your domains
- [ ] No test/debug code in production
- [ ] Error messages don't leak sensitive info

### Monitoring Setup
- [ ] Google Cloud Console → APIs & Services → Dashboard
- [ ] Set up billing alerts (if needed)
- [ ] Monitor API usage
- [ ] Check for unusual activity

## 📊 Post-Launch

### Week 1
- [ ] Monitor sign-in success rate
- [ ] Check for error patterns
- [ ] Review user feedback
- [ ] Verify all users can sign in

### Month 1
- [ ] Review OAuth usage statistics
- [ ] Check for security issues
- [ ] Update documentation if needed
- [ ] Consider adding more OAuth providers

## 🐛 Troubleshooting

If something doesn't work:

### Check These First
- [ ] Redirect URIs match exactly (including http/https)
- [ ] Client ID and Secret are correct
- [ ] Google provider is enabled in Supabase
- [ ] OAuth consent screen is configured
- [ ] Test users are added (for development)

### Check Logs
- [ ] Browser console for JavaScript errors
- [ ] Browser network tab for failed requests
- [ ] Supabase logs for auth errors
- [ ] Google Cloud Console for API errors

### Common Fixes
- [ ] Clear browser cache and cookies
- [ ] Try incognito/private browsing
- [ ] Verify environment variables
- [ ] Restart development server
- [ ] Check database schema

## ✅ Final Verification

Before marking as complete:

- [ ] Tested with at least 3 different Google accounts
- [ ] Tested on desktop and mobile
- [ ] Tested in different browsers (Chrome, Firefox, Safari)
- [ ] All team members can sign in
- [ ] Documentation is up to date
- [ ] Credentials are stored securely
- [ ] Backup of credentials exists

## 🎉 Completion

- [ ] Google OAuth is fully functional
- [ ] All tests passed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Team trained on troubleshooting

**Completed by**: ___________________________

**Date**: ___________________________

**Notes**: 
_______________________________________________
_______________________________________________
_______________________________________________

---

## 📞 Emergency Contacts

**Google Cloud Support**: ___________________________

**Supabase Support**: https://discord.supabase.com

**Team Lead**: ___________________________

**DevOps**: ___________________________

---

Keep this checklist for future reference and updates!
