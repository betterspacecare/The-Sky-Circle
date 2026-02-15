# Google OAuth Quick Start - 5 Minutes Setup

## ⚡ Quick Setup (TL;DR)

### 1. Google Cloud Console (2 min)
```
1. Go to: https://console.cloud.google.com/
2. Create project → "SkyGuild"
3. APIs & Services → OAuth consent screen → External → Fill form
4. Credentials → Create OAuth Client ID → Web application
5. Add redirect URI: https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback
6. Copy Client ID and Client Secret
```

### 2. Supabase Dashboard (1 min)
```
1. Go to: https://app.supabase.com/
2. Authentication → Providers → Google → Enable
3. Paste Client ID and Client Secret
4. Save
```

### 3. Test (2 min)
```bash
npm run dev
# Visit http://localhost:3000/login
# Click "Continue with Google"
# Done! ✅
```

## 📋 Required Information

### From Google Cloud Console:
- ✅ Client ID: `xxxxx.apps.googleusercontent.com`
- ✅ Client Secret: `GOCSPX-xxxxx`

### From Supabase:
- ✅ Callback URL: `https://[project-id].supabase.co/auth/v1/callback`

## 🔗 Important URLs

### Google Cloud Console
- **Main**: https://console.cloud.google.com/
- **OAuth Consent**: https://console.cloud.google.com/apis/credentials/consent
- **Credentials**: https://console.cloud.google.com/apis/credentials

### Supabase
- **Dashboard**: https://app.supabase.com/
- **Auth Settings**: Project → Authentication → Providers

## ⚙️ Redirect URIs to Add

Add these to Google Cloud Console → Credentials:

```
Development:
http://localhost:3000/auth/callback

Production:
https://theskycircle.com/auth/callback
https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback
```

## 🎯 What's Already Done

Your code already has:
- ✅ Google OAuth buttons (login & signup)
- ✅ Auth callback handler
- ✅ User profile creation
- ✅ Profile photo from Google
- ✅ Display name from Google

You just need to configure Google Cloud Console and Supabase!

## 🐛 Common Issues

### "redirect_uri_mismatch"
→ Add the exact redirect URI to Google Console

### "Access blocked"
→ Add test users in OAuth consent screen

### "Invalid client"
→ Check Client ID and Secret in Supabase

## ✅ Verification Checklist

After setup, verify:
- [ ] Can click "Continue with Google" on login page
- [ ] Redirects to Google sign-in
- [ ] After sign-in, redirects back to app
- [ ] User profile created in Supabase
- [ ] Can access dashboard

## 🚀 You're Done!

That's it! Your users can now sign in with Google in one click.

For detailed instructions, see `GOOGLE_OAUTH_SETUP.md`
