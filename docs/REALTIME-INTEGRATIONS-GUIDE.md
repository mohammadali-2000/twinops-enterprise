# Real-Time Enterprise Integrations: Jira & Slack

This guide explains how to connect your **real Jira Cloud project** and **real Slack Workspace** to TwinOps Enterprise in real time. Once configured, changes in Jira immediately update the twin's vector memory, and questions asked in Slack receive grounded answers from the twin.

---

## 1. Real-Time Jira Cloud Integration

TwinOps features a native webhook listener at:
```
https://<YOUR_DEPLOYED_URL>/api/jira/webhook
```

### How It Works:
* When an engineer creates a ticket, updates status (e.g., `In Review` ➔ `Done`), or adds an architectural comment in Jira, Jira immediately sends a webhook payload to `/api/jira/webhook`.
* The server flattens Atlassian Document Format (ADF), chunks the update, generates a 1536-dim embedding, and atomically updates the twin's episodic memory in Supabase.
* Stale older versions of the same ticket are automatically purged to prevent hallucinations.

### Step-by-Step Setup in Jira:
1. Open your Jira Cloud instance (`https://your-domain.atlassian.net`).
2. Go to **Settings (Cog icon)** ➔ **System** ➔ **WebHooks** (under Advanced).
3. Click **Create a WebHook**:
   * **Name:** `TwinOps Real-Time Memory Sync`
   * **Status:** `Enabled`
   * **URL:** `https://<YOUR_DEPLOYED_URL>/api/jira/webhook` *(e.g. `https://twinops-enterprise.onrender.com/api/jira/webhook`)*
   * **Issue Related Events:** Check:
     - Issue: `created`, `updated`, `deleted`
     - Comment: `created`, `updated`
   * **JQL Filter (Optional):** Restrict to specific projects (e.g. `project in (KAN, CORE, DEV)`) or leave blank for all delivery pod issues.
4. Scroll to the bottom and click **Create**.

---

## 2. Real-Time Slack Integration

TwinOps features a bi-directional Slack Events listener at:
```
https://<YOUR_DEPLOYED_URL>/api/slack/events
```

### How It Works:
1. **Interactive Q&A:** When a user tags the bot (`@twinops <question>`), DMs the bot, or types `twin: <question>`, the server retrieves relevant Jira tickets and GitHub pull requests from vector memory, and posts the cited answer directly back into the Slack channel or thread.
2. **Ambient Continual Learning:** Messages in channels where the bot is a member are analyzed for technical decisions and stored in episodic memory.

### Step-by-Step Setup in Slack:
1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) and click **Create New App** ➔ **From scratch**.
   * **App Name:** `TwinOps`
   * **Workspace:** Select your company/hackathon workspace.
2. **OAuth & Permissions:**
   * Under **Bot Token Scopes**, add:
     - `app_mentions:read`
     - `chat:write`
     - `channels:history`
     - `channels:read`
     - `im:history`
     - `im:write`
     - `users:read`
   * Click **Install to Workspace** and copy the `xoxb-...` **Bot User OAuth Token**.
3. **Event Subscriptions:**
   * Toggle **Enable Events** to **On**.
   * **Request URL:** Enter `https://<YOUR_DEPLOYED_URL>/api/slack/events`.
   * Slack will verify the endpoint automatically (`url_verification`).
   * Under **Subscribe to bot events**, add:
     - `app_mention`
     - `message.channels`
     - `message.im`
   * Click **Save Changes**.
4. **Invite Bot to Channels:**
   * In any Slack channel, type `/invite @TwinOps`.
   * Ask questions: `@TwinOps what is the current sprint status of KAN-2?`

---

## 3. Environment Variables Summary

Ensure these variables are set in your deployment environment (e.g., Render Dashboard):

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://eooxipxavjywtmwxmjqp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
USE_SUPABASE_MEMORY=true

# AI Inference & Embeddings
OPENAI_API_KEY=... (or OPENROUTER_API_KEY=...)
OPENAI_MODEL=openai/gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Jira Cloud
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_WEBHOOK_SECRET=your-optional-webhook-secret

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# GitHub
GITHUB_TOKEN=ghp_...
GITHUB_USERNAME=mohammadali-2000
```
