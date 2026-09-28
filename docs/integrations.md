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
Set the following environment variable:
```env
TEAMS_WEBHOOK_URL=https://prod-xx.eastus.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?api-version=2016-06-01
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
GITHUB_ACCESS_TOKEN=ghp_yourEnterpriseOrPersonalToken
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
- `fetchJiraIssues(jql)`: Queries issues by project key or custom JQL filters.
- Maps Jira issue summaries, descriptions, and assignees into memory embeddings for twin grounding.

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
