# TwinOps Enterprise — Render Live Deployment Guide

This guide walks you through deploying TwinOps Enterprise to **Render** (Free Web Service) connected to your live **Supabase** cloud database.

---

## 1. Live Supabase Database Status

Your cloud Supabase database is already created, linked, and migrated:
- **Project URL:** `https://eooxipxavjywtmwxmjqp.supabase.co`
- **Region:** `ap-south-1` (Mumbai)
- **Status:** `ACTIVE_HEALTHY`
- **Vector Extension & Tables:** Initialized (`clones`, `memories`, `messages`, `integrations`, and `match_memories` vector search function)

---

## 2. Deploy to Render (2-Minute Blueprint Setup)

We have added a `render.yaml` Blueprint to the repository.

### Step 1: Open Render Dashboard
1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Sign in with GitHub (`mohammadali-2000`).

### Step 2: Create New Blueprint
1. Click the **"New +"** button in the top right.
2. Select **"Blueprint"**.
3. Choose the repository: **`mohammadali-2000/twinops-enterprise`**.
4. Render will read `render.yaml` and configure:
   - **Service Name:** `twinops-enterprise`
   - **Runtime:** `Node` (v20+)
   - **Plan:** `Free`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check:** `/api/health`

### Step 3: Fill in Secret Environment Variables
During setup (or in the Environment tab), enter the following values:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://eooxipxavjywtmwxmjqp.supabase.co` | Pre-configured in blueprint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Your Supabase anon key)* | Generated from your project |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Your Supabase service_role key)* | Generated from your project |
| `USE_SUPABASE_MEMORY` | `true` | Required for RAG retrieval |
| `OPENAI_API_KEY` | *(Your OpenAI or OpenRouter Key)* | For embedding & chat inference |
| `OPENAI_BASE_URL` | `https://openrouter.ai/api/v1` (or `https://api.openai.com/v1`) | |
| `OPENAI_MODEL` | `openai/gpt-4o-mini` (or `gpt-4o`) | |
| `GITHUB_TOKEN` | *(Your GitHub PAT token)* | For repository/commit sync |
| `GITHUB_USERNAME` | `mohammadali-2000` | |
| `JIRA_BASE_URL` | `https://your-domain.atlassian.net` | (Optional, if using Jira) |
| `JIRA_EMAIL` | *(Your Atlassian account email)* | (Optional) |
| `JIRA_API_TOKEN` | *(Your Atlassian API token)* | (Optional) |
| `TEAMS_WEBHOOK_URL` | *(Teams Power Automate URL)* | (Optional, for MS Teams) |
| `TEAMS_FLOW_SECRET` | *(Random 32-byte secret)* | (Optional) |

5. Click **"Apply"** / **"Create Web Service"**.

---

## 3. Verify Your Live Deployment

Once the build finishes on Render:
1. Access your public Render URL: `https://twinops-enterprise.onrender.com`
2. Check the live health endpoint:
   ```bash
   curl https://twinops-enterprise.onrender.com/api/health?live=1
   ```
3. Navigate to `/settings` in your browser to test syncing your GitHub repos (`mohammadali-2000`) and creating your Twin persona!
