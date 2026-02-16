# API Keys System - Complete Implementation

## Overview
Fully functional API key management system for Zapier, Make, n8n, and other third-party integrations. Admins can create, manage, and monitor API keys with proper security and logging.

## Features Implemented

### ✅ Webhook Testing (CORS Fix)
- Server-side proxy endpoint at `/api/webhooks/test` in Next.js frontend
- Test webhooks from admin panel without browser CORS restrictions
- Automatic logging of test results to database
- Status updates based on test success/failure
- Response time tracking
- Admin store uses proxy instead of direct fetch

### ✅ Database Schema
- `api_keys` table with secure key storage
- `api_key_logs` table for usage tracking
- `api_key_usage_stats` view for analytics
- Row Level Security (RLS) policies
- Helper functions for key verification and logging

### ✅ Admin Panel UI
- Create API keys with custom permissions
- Edit key details (name, description, permissions, expiration)
- Regenerate keys (old key stops working immediately)
- Delete keys with confirmation
- View usage statistics per key
- Monitor API logs in real-time
- Show/hide key prefixes for security

### ✅ Security Features
- SHA-256 hashing for key storage
- Only key prefix shown in UI (first 12 chars)
- Full key shown only once during creation
- Secure key generation (64 hex characters)
- Permission-based access (read, write, admin)
- Optional expiration dates
- Automatic last_used_at tracking

### ✅ API Endpoints (Frontend)
- `GET /api/v1/triggers/users/new` - Poll for new users
- `GET /api/v1/triggers/observations/new` - Poll for new observations
- `GET /api/v1/triggers/posts/new` - Poll for new posts
- `POST /api/v1/actions/alerts` - Create sky alerts

### ✅ Monitoring & Analytics
- Total requests per key
- Success/failure rates
- Average response times
- Last used timestamps
- Request logs with full details
- IP address and user agent tracking

## Database Schema

### api_keys Table
```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    permissions TEXT[] DEFAULT ARRAY['read'],
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### api_key_logs Table
```sql
CREATE TABLE api_key_logs (
    id UUID PRIMARY KEY,
    api_key_id UUID REFERENCES api_keys(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    ip_address INET,
    user_agent TEXT,
    request_body JSONB,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP
);
```

## Admin Store Functions

### Fetch Functions
```typescript
fetchApiKeys() // Load all API keys
fetchApiKeyLogs(apiKeyId?) // Load usage logs
fetchApiKeyStats() // Load usage statistics
```

### CRUD Functions
```typescript
createApiKey(data) // Returns { error, apiKey }
updateApiKey(id, data) // Update key details
deleteApiKey(id) // Delete key
regenerateApiKey(id) // Generate new key, returns { error, apiKey }
```

## API Key Format

### Generated Key
```
skyguild_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0
```

### Key Prefix (Stored & Displayed)
```
skyguild_live_a1b2...
```

### Key Hash (Stored in Database)
```
SHA-256 hash of full key
```

## Usage Flow

### 1. Admin Creates API Key
1. Click "Create API Key"
2. Enter name, description
3. Select permissions (read, write, admin)
4. Optional: Set expiration date
5. Click "Create API Key"
6. **IMPORTANT:** Copy the full key (shown only once!)
7. Store key securely

### 2. Configure in Zapier/Make
1. Copy API key from admin panel
2. Add to Zapier/Make as "Authorization: Bearer YOUR_KEY"
3. Configure webhook URL or polling trigger
4. Test connection
5. Activate automation

### 3. Monitor Usage
1. View API Keys page
2. Check usage statistics
3. Click "View Logs" to see requests
4. Monitor success/failure rates
5. Check response times

### 4. Regenerate if Compromised
1. Click "Regenerate" button
2. Confirm action
3. Copy new key (shown only once!)
4. Update key in Zapier/Make
5. Old key stops working immediately

## Security Best Practices

### For Admins
1. ✅ Generate unique keys per integration
2. ✅ Use descriptive names (e.g., "Zapier Production")
3. ✅ Set appropriate permissions (least privilege)
4. ✅ Set expiration dates for temporary keys
5. ✅ Monitor usage logs regularly
6. ✅ Regenerate keys if compromised
7. ✅ Delete unused keys

### For Developers
1. ✅ Store keys in environment variables
2. ✅ Never commit keys to version control
3. ✅ Use HTTPS only
4. ✅ Implement rate limiting
5. ✅ Log all API requests
6. ✅ Handle errors gracefully
7. ✅ Rotate keys periodically

## Integration Examples

### Zapier Trigger (Polling)
```javascript
// Zapier polls this endpoint every 15 minutes
GET /api/v1/triggers/users/new?since=2024-01-01T12:00:00Z&limit=100
Authorization: Bearer skyguild_live_your_key_here
```

### Make Webhook (Instant)
```javascript
// Configure webhook in admin panel
POST https://hook.integromat.com/YOUR_WEBHOOK_ID
{
  "event": "user.created",
  "data": { ... }
}
```

### n8n Action
```javascript
// n8n calls this endpoint
POST /api/v1/actions/alerts
Authorization: Bearer skyguild_live_your_key_here
{
  "title": "Meteor Shower Tonight",
  "message": "Peak viewing at 2 AM",
  "alert_type": "meteor_shower"
}
```

## Permissions Explained

### Read Permission
- Can call GET endpoints
- Can retrieve data
- Cannot create or modify data
- Suitable for: Analytics, reporting, monitoring

### Write Permission
- Includes Read permission
- Can call POST/PUT endpoints
- Can create and update data
- Cannot delete data or manage users
- Suitable for: Content creation, automation

### Admin Permission
- Full access to all endpoints
- Can create, read, update, delete
- Can manage users and settings
- Use with caution!
- Suitable for: Full platform integration

## Error Handling

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key",
  "code": "AUTH_ERROR"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions",
  "code": "PERMISSION_ERROR"
}
```

### 429 Rate Limit
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests",
  "code": "RATE_LIMIT",
  "retry_after": 60
}
```

## Deployment Steps

### 0. Prerequisites
**IMPORTANT:** For webhook testing to work, both servers must be running:
- Frontend (Next.js): `localhost:3000` (dev) or production URL
- Admin Panel (Vite): `localhost:5173` (dev) or production URL

The admin panel uses the frontend's `/api/webhooks/test` endpoint as a proxy to avoid CORS issues.

### 1. Run Database Migration
```sql
-- Execute api_keys_schema.sql in Supabase SQL editor
```

### 2. Deploy Admin Panel
- Build and deploy admin panel
- Verify API Keys page is accessible
- Test key creation

### 3. Deploy Frontend API
- Deploy Next.js app with API routes
- Verify endpoints are accessible
- Test with Postman/cURL

### 4. Create First API Key
- Log into admin panel
- Navigate to API Keys
- Create test key
- Copy and save key
- Test with cURL

### 5. Configure Integration
- Add key to Zapier/Make
- Configure triggers/actions
- Test integration
- Monitor logs

## Testing Checklist

- [ ] Create API key
- [ ] Copy key to clipboard
- [ ] Edit key details
- [ ] Update permissions
- [ ] Set expiration date
- [ ] Regenerate key
- [ ] Delete key
- [ ] View usage stats
- [ ] View logs
- [ ] Test API endpoint with key
- [ ] Test invalid key (401 error)
- [ ] Test expired key
- [ ] Test disabled key
- [ ] Monitor real-time logs
- [ ] Check response times

## Files Created/Modified

### Database
- `api_keys_schema.sql` - Complete schema with RLS

### Admin Panel
- `sky-circle-admin/src/pages/ApiKeysPage.tsx` - Full UI
- `sky-circle-admin/src/types/database.types.ts` - API key types
- `sky-circle-admin/src/store/adminStore.ts` - State management
- `sky-circle-admin/src/components/Layout.tsx` - Navigation
- `sky-circle-admin/src/App.tsx` - Routing
- `sky-circle-admin/.env` - Environment variables
- `sky-circle-admin/.env.example` - Example config

### Frontend API
- `sky-circle-frontend/app/api/v1/triggers/users/new/route.ts`
- `sky-circle-frontend/app/api/v1/triggers/observations/new/route.ts`
- `sky-circle-frontend/app/api/v1/triggers/posts/new/route.ts`
- `sky-circle-frontend/app/api/v1/actions/alerts/route.ts`
- `sky-circle-frontend/env.example` - Updated with API key

### Documentation
- `ZAPIER_INTEGRATION_API.md` - Complete API docs
- `API_KEYS_SYSTEM_COMPLETE.md` - This file

## Summary

The API Keys system provides:
- ✅ Secure key generation and storage
- ✅ Full CRUD operations
- ✅ Permission-based access control
- ✅ Usage monitoring and analytics
- ✅ Real-time logging
- ✅ Integration with Zapier/Make/n8n
- ✅ Professional admin UI
- ✅ Complete documentation

Perfect for building powerful automations and integrations with SkyGuild!
