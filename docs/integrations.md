# Enterprise Integrations Specification

This document details the configuration, implementation status, and data flow of enterprise connectors supported by TwinOps Enterprise.

## Integration Summary Matrix

| Integration | Status | Module Path | Authentication Mechanism | Ingestion Data Types |
| :--- | :--- | :--- | :--- | :--- |
| **Microsoft Teams** | Implemented | `lib/integrations/teams.ts` | Power Automate Webhook URL | Outbound Adaptive Cards, alerts, twin stances |
| **GitHub** | Implemented | `lib/integrations/github.ts` | Personal Access Token / App Token | Repositories, issues, PRs, commit diffs, READMEs |
| **Jira Cloud / DC** | Implemented | `lib/integrations/jira.ts` | Basic Auth (Email + API Token) | Boards, sprints, issues, status transitions |
| **Slack** | Implemented | `lib/integrations/slack.ts` | Bot User OAuth Token (`xoxb-`) | Public channels, threads, event webhooks |
| **Notion** | Implemented | `lib/integrations/notion.ts` | Internal Integration Secret Token | Pages, databases, architecture RFCs |
| **Google Workspace** | Partial | `lib/integrations/google.ts` | OAuth 2.0 (Client ID + Secret) | Google Drive documents, Gmail threads |
| **Microsoft Graph** | Planned | Roadmap | Azure AD App Registration (OAuth) | Direct Teams chat reading, Outlook calendar sync |

---

## 1. Microsoft Teams Integration

### Architecture
Office 365 connector webhooks were retired by Microsoft in 2024-2025. TwinOps utilizes modern Power Automate / Workflows Incoming Webhooks compliant with the Adaptive Cards v1.4 schema.

### Configuration
```env
# Outgoing cards only (Teams channel -> ... -> Workflows -> "Post to a channel when a webhook request is received")
TEAMS_WEBHOOK_URL=https://prod-xx.eastus.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?api-version=2016-06-01
# Inbound questions from the Power Automate flow below
TEAMS_FLOW_SECRET=<random 64-char hex>
```

### Inbound: ask the twin from a Teams channel (Power Automate)
The flow posts the question to TwinOps, waits for the answer, and replies in the same thread.
The HTTP action is a **Premium** connector (a Power Automate Premium or trial license is needed).

1. **Expose the app publicly.** For local testing run `npm run dev`, then `ngrok http 3000`
   (or VS Code "Ports" -> forward 3000 -> visibility Public). Note the `https://...` URL.
2. **Create the flow** at make.powerautomate.com -> Create -> Automated cloud flow.
   - Trigger: **Microsoft Teams - When keywords are mentioned**. Message type: Channel. Pick your team and channel. Keywords: `twin:`
3. **Add action: Microsoft Teams - Get message details.** Message: the trigger's *Message ID*. Message type: Channel. Same team/channel.
4. **Add action: HTTP** (Premium).
   - Method `POST`, URI `https://<public-url>/api/teams/events`
   - Headers: `Content-Type: application/json`, `x-twinops-secret: <TEAMS_FLOW_SECRET>`
   - Body:
     ```json
     {
       "question": "@{body('Get_message_details')?['body']?['content']}",
       "sender": "@{body('Get_message_details')?['from']?['user']?['displayName']}",
       "channel": "teams"
     }
     ```
     Add `"cloneId": "<uuid>"` to target a specific clone; otherwise the oldest clone answers.
5. **Add action: Parse JSON.** Content: the HTTP *Body*. Schema:
   ```json
   { "type": "object", "properties": { "answer": { "type": "string" }, "answerHtml": { "type": "string" } } }
   ```
6. **Add action: Microsoft Teams - Reply with a message in a channel.** Post as: Flow bot. Message: the trigger's *Message ID*. Body: `answerHtml`.
7. Save, then post `twin: what is the status of KAN-1?` in the channel. The reply arrives in roughly 5-20 seconds.

The reply never contains `twin:`, so the flow cannot re-trigger itself. Without the correct
`x-twinops-secret` header the endpoint returns `401`.

Test the endpoint without Teams:
```bash
curl -X POST http://localhost:3000/api/teams/events \
  -H "Content-Type: application/json" -H "x-twinops-secret: $TEAMS_FLOW_SECRET" \
  -d '{"question":"twin: what changed in my repos recently?","sender":"Test"}'
```

### Dispatch Format
Outbound notifications generate structured Adaptive Cards containing:
- Accent status indicator (`Good`, `Warning`, `Attention`)
- Pod identity subtitle and badge
- Structured factsets (PR status, consensus confidence, assigned reviewers)
- Action buttons navigating to internal twin logs or pull requests

---

## 2. GitHub Integration

### Architecture
The GitHub connector uses `@octokit/rest` to interface with GitHub Cloud or GitHub Enterprise Server.

### Configuration
Set the following environment variable:
```env
GITHUB_TOKEN=ghp_yourEnterpriseOrPersonalToken
```

### Sync Pipeline (`app/api/github/sync/route.ts`)
1. Fetches authenticated user repositories or specified organization repos.
2. Extracts latest commits, open issues, pull request diffs, and repository documentation.
3. Chunks text content into semantic memory rows.
4. Generates embeddings and writes to the unified `memories` table in PostgreSQL.

---

## 3. Jira Integration

### Architecture
Communicates with the Jira Cloud REST API v3 using HTTP Basic Authentication (`email:api_token`).

### Configuration
```env
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=devops@enterprise.com
JIRA_API_TOKEN=your_jira_api_token
```

### Functionality (`lib/integrations/jira.ts`)
- `POST /api/jira/sync` with optional `{ "cloneId", "jql", "maxResults" }` (default JQL: issues updated in the last 30 days).
- Each issue (summary, status, assignee, ADF description, last 5 comments) becomes one `document` row plus embedded `chunk` rows, with `issue_key` and `url` in metadata.
- Re-syncing replaces rows for the same issue keys instead of duplicating them.

---

## 4. Slack Integration

### Architecture
Built on the `@slack/web-api` client. Supports both active channel synchronization and incoming event webhook processing.

### Configuration
```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
```

### Sync Pipeline (`app/api/slack/sync/route.ts`)
- Lists accessible public and private channels.
- Fetches recent channel conversation histories and thread replies.
- Deduplicates messages and ingests them into the episodic memory store.

---

## 5. Google Workspace (Drive & Gmail)

### Architecture
Uses Google APIs Node.js client (`googleapis`) via OAuth 2.0 authorization code flow.

### Configuration
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Current Status
OAuth token exchange and Drive file listing are implemented. Automated periodic synchronization is partially implemented and requires configuring production GCP consent screens and token refresh storage.
