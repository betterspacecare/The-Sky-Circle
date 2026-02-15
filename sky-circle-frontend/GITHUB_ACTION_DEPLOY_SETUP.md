# GitHub Action Auto-Deploy Setup

Since webhooks aren't working, we'll use GitHub Actions to automatically deploy to Vercel when you push to main.

## Setup Steps

### Step 1: Get Vercel Token

1. **Go to Vercel Dashboard**
   - Click on your profile picture (top right)
   - Click "Settings"
   - Click "Tokens" in the left sidebar

2. **Create a new token:**
   - Click "Create"
   - Name: `GitHub Actions Deploy`
   - Scope: `Full Account`
   - Expiration: Choose your preference (recommend "No Expiration" for convenience)
   - Click "Create Token"
   - **Copy the token** (you won't see it again!)

### Step 2: Get Vercel Project IDs

Run these commands in your terminal:

```bash
cd sky-circle-frontend

# Install Vercel CLI if you haven't
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# This creates a .vercel folder with project.json
cat .vercel/project.json
```

You'll see output like:
```json
{
  "projectId": "prj_xxxxxxxxxxxxx",
  "orgId": "team_xxxxxxxxxxxxx"
}
```

**Copy both IDs!**

### Step 3: Add Secrets to GitHub

1. **Go to your GitHub repository**
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"

2. **Add these secrets:**

   **Secret 1: VERCEL_TOKEN**
   - Name: `VERCEL_TOKEN`
   - Value: The token you copied from Vercel
   - Click "Add secret"

   **Secret 2: VERCEL_ORG_ID**
   - Name: `VERCEL_ORG_ID`
   - Value: The `orgId` from project.json
   - Click "Add secret"

   **Secret 3: VERCEL_PROJECT_ID**
   - Name: `VERCEL_PROJECT_ID`
   - Value: The `projectId` from project.json
   - Click "Add secret"

### Step 4: Update GitHub Action

The GitHub Action file has been created at `.github/workflows/deploy-vercel.yml`

Let me update it with the correct environment variables:
