# Zapier & Third-Party Integration API

## Overview
REST API endpoints for integrating SkyGuild with Zapier, Make (Integromat), n8n, and other automation platforms.

## Base URL
```
Production: https://your-domain.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication

### API Key Authentication
All requests require an API key in the header:
```
Authorization: Bearer YOUR_API_KEY
```

### Generate API Key (Admin Only)
Admins can generate API keys in the admin panel under Settings > API Keys.

## Endpoints

### 1. Webhooks (Outgoing)
These are the webhook URLs you configure in the admin panel to send data TO Zapier/Make.

**Zapier Webhook URL:**
```
https://hooks.zapier.com/hooks/catch/YOUR_ZAPIER_ID/
```

**Make (Integromat) Webhook URL:**
```
https://hook.integromat.com/YOUR_MAKE_WEBHOOK_ID
```

**n8n Webhook URL:**
```
https://your-n8n-instance.com/webhook/YOUR_WEBHOOK_ID
```

---

### 2. Trigger Endpoints (Incoming)
These endpoints allow Zapier/Make to PULL data from your platform.

#### GET /api/v1/triggers/users/new
Get recently created users (for Zapier polling trigger).

**Query Parameters:**
- `since` (optional): ISO timestamp, default: last 15 minutes
- `limit` (optional): Number of results, default: 100

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "John Doe",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "count": 1,
    "since": "2024-01-01T11:45:00Z"
  }
}
```

#### GET /api/v1/triggers/observations/new
Get recently created observations.

**Query Parameters:**
- `since` (optional): ISO timestamp
- `limit` (optional): Number of results

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "object_name": "Andromeda Galaxy",
      "category": "Galaxy",
      "points_awarded": 50,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "count": 1,
    "since": "2024-01-01T11:45:00Z"
  }
}
```

#### GET /api/v1/triggers/posts/new
Get recently created posts.

#### GET /api/v1/triggers/events/new
Get recently created events.

#### GET /api/v1/triggers/badges/earned
Get recently earned badges.

#### GET /api/v1/triggers/follows/new
Get recent follow relationships.

---

### 3. Action Endpoints (Incoming)
These endpoints allow Zapier/Make to CREATE/UPDATE data in your platform.

#### POST /api/v1/actions/users
Create a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "display_name": "John Doe",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

#### POST /api/v1/actions/observations
Create a new observation.

**Request Body:**
```json
{
  "user_id": "uuid",
  "object_name": "Andromeda Galaxy",
  "category": "Galaxy",
  "observation_date": "2024-01-01",
  "location": "Backyard",
  "notes": "Clear night, great visibility"
}
```

#### POST /api/v1/actions/posts
Create a new post.

**Request Body:**
```json
{
  "user_id": "uuid",
  "image_url": "https://example.com/image.jpg",
  "caption": "Amazing view tonight!"
}
```

#### POST /api/v1/actions/events
Create a new event.

**Request Body:**
```json
{
  "title": "Star Party",
  "description": "Join us for stargazing",
  "location": "Observatory",
  "event_date": "2024-02-01T19:00:00Z",
  "capacity": 50
}
```

#### POST /api/v1/actions/alerts
Create a sky alert.

**Request Body:**
```json
{
  "title": "Meteor Shower Tonight",
  "message": "Peak viewing at 2 AM",
  "alert_type": "meteor_shower"
}
```

#### POST /api/v1/actions/badges/award
Award a badge to a user.

**Request Body:**
```json
{
  "user_id": "uuid",
  "badge_id": "uuid"
}
```

#### PUT /api/v1/actions/users/:id
Update user information.

**Request Body:**
```json
{
  "display_name": "New Name",
  "bio": "Updated bio"
}
```

---

### 4. Search Endpoints

#### GET /api/v1/search/users
Search for users.

**Query Parameters:**
- `q`: Search query
- `limit`: Number of results

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "display_name": "John Doe",
      "email": "user@example.com"
    }
  ]
}
```

#### GET /api/v1/search/observations
Search observations.

#### GET /api/v1/search/events
Search events.

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Missing required field: email",
  "code": "VALIDATION_ERROR"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key",
  "code": "AUTH_ERROR"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found",
  "code": "NOT_FOUND"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "code": "INTERNAL_ERROR"
}
```

---

## Rate Limiting

- **Default:** 100 requests per minute per API key
- **Burst:** 10 requests per second
- **Headers:**
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Zapier Integration Setup

### Step 1: Create Zapier Account
1. Sign up at zapier.com
2. Create a new Zap

### Step 2: Configure Trigger
1. Choose "Webhooks by Zapier"
2. Select "Catch Hook"
3. Copy the webhook URL
4. Add webhook in SkyGuild admin panel
5. Select events to trigger
6. Test the webhook

### Step 3: Configure Action
1. Choose destination app (Gmail, Slack, etc.)
2. Map fields from webhook payload
3. Test the action
4. Turn on Zap

### Example Zaps

**Zap 1: New User → Send Welcome Email**
- Trigger: Webhook (user.created)
- Action: Gmail (Send Email)

**Zap 2: New Observation → Post to Slack**
- Trigger: Webhook (observation.created)
- Action: Slack (Send Channel Message)

**Zap 3: Badge Earned → Add to Google Sheets**
- Trigger: Webhook (badge.earned)
- Action: Google Sheets (Create Row)

---

## Make (Integromat) Integration Setup

### Step 1: Create Scenario
1. Sign up at make.com
2. Create new scenario

### Step 2: Add Webhook Module
1. Add "Webhooks" module
2. Choose "Custom webhook"
3. Copy webhook URL
4. Add to SkyGuild admin panel

### Step 3: Add Action Modules
1. Add modules for actions (Email, Slack, etc.)
2. Map data from webhook
3. Test scenario
4. Activate scenario

---

## n8n Integration Setup

### Step 1: Create Workflow
1. Install n8n (self-hosted or cloud)
2. Create new workflow

### Step 2: Add Webhook Node
1. Add "Webhook" node
2. Set method to POST
3. Copy webhook URL
4. Add to SkyGuild admin panel

### Step 3: Add Action Nodes
1. Add nodes for processing
2. Connect to other services
3. Test workflow
4. Activate workflow

---

## Common Integration Patterns

### Pattern 1: Event Notification
```
SkyGuild Event → Webhook → Zapier → Slack/Email/SMS
```

### Pattern 2: Data Sync
```
SkyGuild User Created → Webhook → Make → CRM (Salesforce/HubSpot)
```

### Pattern 3: Content Distribution
```
SkyGuild Observation → Webhook → n8n → Social Media (Twitter/Instagram)
```

### Pattern 4: Analytics
```
SkyGuild Events → Webhook → Zapier → Google Sheets/Analytics
```

### Pattern 5: Moderation
```
SkyGuild Post Reported → Webhook → Make → Moderation Tool
```

---

## Security Best Practices

### 1. API Key Management
- Generate unique keys per integration
- Rotate keys regularly
- Revoke unused keys
- Store keys securely

### 2. Webhook Security
- Use HTTPS only
- Verify webhook signatures
- Implement IP whitelisting
- Rate limit webhook endpoints

### 3. Data Privacy
- Don't expose sensitive data
- Implement field-level permissions
- Log all API access
- Comply with GDPR/privacy laws

---

## Testing & Debugging

### Test Webhook Locally
Use ngrok to expose local server:
```bash
ngrok http 3000
```

Use ngrok URL in webhook configuration.

### Test with cURL
```bash
curl -X POST https://your-domain.com/api/v1/actions/users \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "display_name": "Test User"
  }'
```

### Webhook Testing Tools
- RequestBin: https://requestbin.com
- Webhook.site: https://webhook.site
- Postman: https://postman.com

---

## Monitoring & Analytics

### Track Metrics
- API requests per endpoint
- Response times
- Error rates
- Most used integrations
- API key usage

### Logging
- Log all API requests
- Track webhook deliveries
- Monitor failed requests
- Alert on anomalies

---

## Support Resources

### Documentation
- API Reference: /docs/api
- Integration Guides: /docs/integrations
- Code Examples: /docs/examples

### Community
- Discord: discord.gg/skyguild
- Forum: community.skyguild.com
- GitHub: github.com/skyguild

### Support
- Email: api-support@skyguild.com
- Status Page: status.skyguild.com
- Changelog: changelog.skyguild.com
