# TwinOps Enterprise Setup Guide
### How to Connect GitHub, Jira and Microsoft Teams

Written for anyone who wants to set up and use TwinOps Enterprise from scratch.
No technical background needed to follow this guide.

---

## What is TwinOps Enterprise

TwinOps Enterprise creates an AI version of you (called a Twin) that can answer questions on your behalf.
Your Twin reads your real GitHub repos and real Jira tickets to give grounded answers.
Other people can ask your Twin questions through the web app or through Microsoft Teams.

---

## How the Whole System Works (Big Picture)

```
                          YOUR TWIN (AI Version of You)
                                      |
           +--------------------------+-------------------------+
           |                          |                         |
      GitHub API               Jira Cloud API         Microsoft Teams
    (your repos,             (your tickets,          (chat integration)
   commits, PRs)             comments, status)
           |                          |                         |
           +-----------+--------------+                         |
                       |                                        |
                  Supabase DB                        Power Automate Flow
               (stores everything                  (catches "twin:" messages
                as searchable                       and sends to your app)
                 chunks)                                        |
                       |                                        |
                  OpenRouter AI                                 |
                (understands your                               |
                 questions and                                  |
                 writes answers)                                |
                       |                                        |
                       +----------------------------------------+
                                        |
                               ANSWER WITH CITATIONS
                          (e.g. "KAN-2 is In Progress [1]")
```

---

## The Three Flows You Need to Know

### Flow 1: Sync Flow (Loading Data into Your Twin)

```
GitHub API ----+
               |---> /api/clones/sync ---> Supabase (pgvector DB)
Jira API ------+                               |
                                          OpenRouter
                                      (creates embeddings
                                       so data is searchable)
```

This runs when you click "Sync my GitHub and Jira" in the Settings page.
After sync, your Twin knows about all your repos and all your tickets.

---

### Flow 2: Web Chat Flow (Asking Your Twin in the Browser)

```
You type question
       |
       v
  Web App (Next.js)
       |
       v
  /api/twinops/chat
       |
       v
  answerAsClone()  <-----> Supabase (searches for relevant data)
       |
       v
  OpenRouter GPT-4o (writes the answer using found data)
       |
       v
  Answer shown with citation chips
  e.g. "[1] KAN-2: Add pgvector index"
```

---

### Flow 3: Teams Flow (Asking Your Twin in Microsoft Teams)

```
Someone types "twin: what is KAN-2?" in Teams channel
       |
       v
  Power Automate catches the "twin:" keyword
       |
       v
  Power Automate calls your app API
  POST https://your-app-url/api/teams/events
  Header: x-twinops-secret: (your secret key)
       |
       v
  answerAsClone() runs (same as web chat flow)
       |
       v
  Answer sent back to Power Automate
       |
       v
  Power Automate posts the answer as a reply in Teams channel
```

---

## Part 1: Setting Up GitHub Connection

### What You Need
- A GitHub account (personal is fine)
- A GitHub token with read access to your repos

### Step by Step

**Step 1** Go to github.com and log in

**Step 2** Click your profile picture (top right) then go to Settings

**Step 3** Scroll down to "Developer settings" (bottom of left sidebar)

**Step 4** Click "Personal access tokens" then "Fine-grained tokens"

**Step 5** Click "Generate new token"
- Give it a name like "TwinOps"
- Set expiry to 90 days or more
- Under "Repository access" choose "All repositories" or select specific ones
- Under "Permissions" turn on:
  - Repository contents: Read only
  - Metadata: Read only
- Click "Generate token"

**Step 6** Copy the token (you only see it once)

**Step 7** Open your `.env.local` file in the TwinOps folder and add:
```
GITHUB_TOKEN=github_pat_XXXXX_your_token_here
```

### How to Test It
Go to your TwinOps app, open Settings page, click "Test Connections"
You should see GitHub showing a green tick

---

## Part 2: Setting Up Jira Connection

### What You Need
- A Jira Cloud account (free tier at atlassian.com works)
- Your Jira site URL (looks like yourname.atlassian.net)

### Step by Step

**Step 1** Go to id.atlassian.com and log in

**Step 2** Click your profile picture (top right) then "Manage account"

**Step 3** Go to the "Security" tab

**Step 4** Under "API tokens" click "Create and manage API tokens"

**Step 5** Click "Create API token"
- Label it "TwinOps"
- Click Create
- Copy the token

**Step 6** Open your `.env.local` file and add:
```
JIRA_BASE_URL=https://yourname.atlassian.net
JIRA_EMAIL=your.email@example.com
JIRA_API_TOKEN=your_token_here
```

**Step 7** Create some tickets in Jira (3 to 5 is enough to test)
- Go to your Jira project
- Create tickets with titles, descriptions and statuses
- Note the ticket IDs (like KAN-1, KAN-2, etc)

### How to Test It
Go to Settings in TwinOps app, click "Test Connections"
You should see Jira showing a green tick with your email address

---

## Part 3: Syncing Your Data (Running the First Sync)

After GitHub and Jira are connected, you need to sync the data.

**Step 1** Open the TwinOps app at http://localhost:3000

**Step 2** Log in as your Twin (click your name on the login page)

**Step 3** Open the left sidebar and click "Sync my GitHub and Jira"

**Step 4** Wait for the sync to finish (takes about 30 to 60 seconds)

**Step 5** You will see a result like:
```
GitHub: 10 repos synced, 118 chunks created
Jira: 5 tickets synced, 5 chunks created
```

**After sync**, try asking your Twin a question like:
"What is the status of KAN-2?"

Your Twin should answer using the real Jira ticket data.

---

## Part 4: Setting Up Microsoft Teams Connection

This is the most involved part but it works very well once set up.

### How It Works

```
Teams Channel
    |
    |  "twin: what is KAN-2?"
    v
Power Automate Flow (detects the word "twin:")
    |
    |  HTTP POST with secret key
    v
TwinOps App (at a public URL)
    |
    |  Searches Jira/GitHub data, asks GPT-4o
    v
Power Automate Flow (receives the answer)
    |
    |  Posts answer as reply in Teams
    v
Teams Channel shows the answer
```

### Step 1: Get a Public URL for Your App

Your app runs on localhost which is not reachable from the internet.
You need a public URL so Power Automate can call your app.

**Option A: VS Code Port Forwarding (recommended)**
1. Open VS Code
2. Open the PORTS tab at the bottom (next to Terminal)
3. Click "Forward a Port"
4. Type 3000 and press Enter
5. Right click on the 3000 row
6. Click "Port Visibility" then "Public"
7. Copy the URL shown (looks like https://abc123-3000.devtunnels.ms)

**Option B: Deploy to Vercel (permanent URL)**
1. Create a free account at vercel.com using your personal GitHub
2. In your terminal run: `vercel deploy`
3. Follow the prompts to link your GitHub repo
4. Vercel gives you a URL like https://twinops-enterprise.vercel.app

### Step 2: Find Your Secret Key

Open your `.env.local` file and find the line:
```
TEAMS_FLOW_SECRET=b2f255a8201810df43308b9d2e6b444181f608b551b28091b36e415c4569bbae
```
Copy the long value after the equals sign. You will need it in Power Automate.

### Step 3: Create the Power Automate Flow

1. Go to make.powerautomate.com and sign in with your Microsoft account

2. Click "Create" then "Automated cloud flow"

3. Give the flow a name like "TwinOps Teams Bot"

4. Search for "When keywords are mentioned" and select it as the trigger
   - Keywords to watch: `twin:`
   - Team: select your Teams group
   - Channel: select your channel

5. Click "New step" and search for "Get message details"
   - Select the Teams connector version
   - Team: same as trigger
   - Channel: same as trigger
   - Message ID: click the lightning bolt icon, pick "Message ID" from the trigger

6. Click "New step" and search for "HTTP"
   - Select the HTTP action (this is a Premium connector)
   - Method: POST
   - URI: paste your public URL plus /api/teams/events
     For example: `https://abc123-3000.devtunnels.ms/api/teams/events`
   - Headers: add two headers
     - Key: `Content-Type` Value: `application/json`
     - Key: `x-twinops-secret` Value: paste your secret key from Step 2
   - Body: paste this exactly
     ```json
     {
       "question": "@{outputs('Get_message_details')?['body/body/content']}",
       "sender": "@{triggerOutputs()?['body/from/user/displayName']}"
     }
     ```

7. Click "New step" and search for "Parse JSON"
   - Content: select "Body" from the HTTP step
   - Schema: paste this
     ```json
     {
       "type": "object",
       "properties": {
         "answer": { "type": "string" },
         "answerHtml": { "type": "string" }
       }
     }
     ```

8. Click "New step" and search for "Reply with a message in a channel"
   - Team: same as trigger
   - Channel: same as trigger
   - Message ID: from the trigger (the original message)
   - Message: select "answer" from the Parse JSON step

9. Click "Save"

### Step 4: Test the Teams Integration

1. Go to your Teams channel
2. Type this message and send it:
   ```
   twin: what is the status of KAN-2?
   ```
3. Within 15 to 30 seconds you should see a reply appear in the thread
4. The reply will look like:
   ```
   KAN-2 is currently In Progress. It involves adding a pgvector index
   for faster search in the Supabase database.

   Sources:
   [1] KAN-2: Add pgvector index for faster search
       https://yourname.atlassian.net/browse/KAN-2
   ```

---

## Your .env.local File (All Settings in One Place)

Here is what your complete `.env.local` should look like:

```
# Supabase (database where your Twin's memory lives)
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...your anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhb...your service role key
USE_SUPABASE_MEMORY=true

# OpenRouter (AI that powers answers)
OPENAI_API_KEY=sk-or-...your openrouter key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o
OPENAI_EMBEDDING_MODEL=openai/text-embedding-3-small

# GitHub (reads your repos)
GITHUB_TOKEN=github_pat_...your token

# Jira (reads your tickets)
JIRA_BASE_URL=https://yourname.atlassian.net
JIRA_EMAIL=your.email@example.com
JIRA_API_TOKEN=...your api token

# Teams (secret key for the Power Automate flow)
TEAMS_FLOW_SECRET=...your secret key
```

---

## Quick Health Check

After setting everything up, go to:
`http://localhost:3000/api/health`

You will see a response like this:
```json
{
  "supabase": { "ok": true, "tables": 3 },
  "openai": { "ok": true, "model": "openai/gpt-4o" },
  "github": { "ok": true, "user": "mohammadali-2000" },
  "jira": { "ok": true, "email": "your.email@example.com" },
  "teams": { "ok": true, "secretConfigured": true }
}
```

All items should show `"ok": true` before you present this to your manager.

---

## Common Problems and Fixes

| Problem | Cause | Fix |
|---|---|---|
| GitHub shows error | Token expired or wrong permissions | Create a new token with repo read access |
| Jira shows 401 error | Wrong email or token | Check JIRA_EMAIL matches your Atlassian login |
| Jira base URL error | URL has typo | Must be `https://yourname.atlassian.net` with no trailing slash |
| Twin gives wrong answers | Data not synced | Click "Sync" in the sidebar and wait for it to finish |
| Teams flow not triggering | Keyword wrong | Message must contain `twin:` with a colon |
| Teams flow HTTP 401 | Wrong secret key | Copy the exact value from TEAMS_FLOW_SECRET in .env.local |
| Teams flow timeout | App not reachable | Make sure your public URL is active and the app is running |

---

## Summary of What You Did

```
Step 1   Created GitHub token
           Added GITHUB_TOKEN to .env.local

Step 2   Created Jira API token
           Added JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN to .env.local

Step 3   Clicked Sync in the app
           Twin now knows your GitHub repos and Jira tickets

Step 4   Got a public URL (VS Code tunnel or Vercel)
           Power Automate can now reach your app

Step 5   Built Power Automate flow (6 steps)
           Teams messages with "twin:" now trigger the flow

Step 6   Tested by typing "twin: what is KAN-2?" in Teams
           Got a real answer with real citations
```

Your Twin is now live and ready to answer questions from your team.

---

*Generated for TwinOps Enterprise. Last updated October 2026.*
