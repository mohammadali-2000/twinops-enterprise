# TwinOps Enterprise — Master Guide
### The single, complete guide to understanding, setting up, and running TwinOps

Written for anyone, including people with no coding background. Read top to bottom,
in order. Every technical word is explained in plain language in the Glossary at the end.

> **Screenshot note:** This guide marks spots like `[SCREENSHOT: ...]` where a picture
> would help. Add your own screenshots there later if you want. The written steps work
> on their own without them.

---

## Table of Contents

1. What TwinOps Is (plain English)
2. How It Works (the big picture)
3. What You Need Before Starting
4. Part A — Install the Tools
5. Part B — Download the Project
6. Part C — Create Your Settings File
7. Part D — Get Every Key (one at a time)
8. Part E — Set Up the Database
9. Part F — Run the App
10. Part G — Create Your First Twin and Use It
11. Connecting Teams and Slack
12. The Live Website (Deployment)
13. Troubleshooting
14. FAQ
15. Glossary

---

## 1. What TwinOps Is (plain English)

TwinOps creates an **AI version of a person**, called a **Twin**.

Your Twin reads your real work, your GitHub code, your Jira tickets, your Slack
messages, and can then answer questions on your behalf. When someone asks it something,
it replies using your actual data and shows **where the answer came from** (a citation),
so it never makes things up.

People can talk to your Twin in three places:
- The **web app** (a website)
- **Microsoft Teams**
- **Slack**

**Why it's useful:** when you're in a meeting or offline, your Twin can still answer
teammates' questions about your projects, instantly, grounded in real facts.

---

## 2. How It Works (the big picture)

```
         YOUR REAL WORK                      PEOPLE ASKING QUESTIONS
   GitHub + Jira + Slack                   Web app / Teams / Slack
          |                                          |
          |  (1) Sync: read the data                 |  (4) Ask a question
          v                                          v
   +---------------------------------------------------------------+
   |                   TwinOps Application                          |
   |   (2) Breaks data into small pieces, turns them into          |
   |       searchable "embeddings"                                 |
   +---------------------------------------------------------------+
          |                                          |
          v                                          v
   +------------------------+              +--------------------------+
   |  Supabase Database      |  <------->  |  OpenRouter AI (GPT-4o)  |
   |  (stores everything,    |   (3)       |  reads the right pieces  |
   |   searchable by meaning)|   search    |  and writes the answer   |
   +------------------------+              +--------------------------+
                                                     |
                                                     v
                                    (5) ANSWER with a citation
                                    e.g. "KAN-2 is In Progress [1]"
```

**In words:**
1. **Sync** pulls your real GitHub/Jira/Slack data into the app
2. The app **chops it into small pieces** and stores them in a database (Supabase)
3. When a question comes in, it **finds the most relevant pieces**
4. It sends those pieces to an **AI model** (GPT-4o via OpenRouter)
5. The AI writes an answer **grounded in your real data, with a citation**

---

## 3. What You Need Before Starting

**Free accounts (sign up as you go, this guide shows you where):**
- A **GitHub** account (you have one: `mohammadali-2000`)
- A **Supabase** account (free database)
- An **OpenRouter** account (for the AI, needs a few dollars of credit)
- Optionally: **Jira**, **Slack**, **Microsoft Teams** (only if you want those)

**Software to install (Part A covers this):**
- Git, Node.js, and a code editor (VS Code)

**No special computer needed**, a normal laptop is fine.

---

## 4. Part A — Install the Tools

### A1. Git (downloads the project code)
1. Go to **git-scm.com** → **Download for Windows**
2. Run the installer, click **Next** on every screen, keep all defaults, then **Install**
3. **Close and reopen** any terminal windows
4. Check it worked: open **PowerShell** (search it in the Start menu) and type:
   ```
   git --version
   ```
   You should see a version number like `git version 2.45.0`

`[SCREENSHOT: terminal showing git version output]`

### A2. Node.js (runs the app)
1. Go to **nodejs.org** → click the **LTS** button (the stable one)
2. Run the installer, accept the license, keep defaults, **Install**
3. Close and reopen your terminal, then check:
   ```
   node --version
   ```
   You should see `v20.x` or `v22.x` (version 20 or higher is required)

### A3. VS Code (to view and edit files)
1. Go to **code.visualstudio.com** → **Download for Windows**
2. Install with defaults (tick "Add Open with Code" options if offered)

---

## 5. Part B — Download the Project

1. Open PowerShell
2. Move into the folder where you want the project (e.g. Documents):
   ```
   cd "C:\Users\YourName\Documents"
   ```
3. Download the project:
   ```
   git clone https://github.com/mohammadali-2000/twinops-enterprise.git
   ```
4. Go into it:
   ```
   cd twinops-enterprise
   ```
5. Install all the building blocks it needs (takes a few minutes):
   ```
   npm install
   ```
6. Open it in VS Code to look around:
   ```
   code .
   ```

`[SCREENSHOT: VS Code opened showing the project files]`

---

## 6. Part C — Create Your Settings File

The app keeps all its secret keys in one private file called `.env.local`.

1. In VS Code's file list, find **`.env.example`**
2. Right-click it → **Copy**, then right-click empty space → **Paste**
3. Rename the copy to exactly: **`.env.local`**
4. Open `.env.local`, you'll fill in the blanks using Part D

> **Important:** never share `.env.local` or put it on GitHub. It holds your passwords.
> (The project is already set up to keep it private.)

---

## 7. Part D — Get Every Key (one at a time)

Fill these into `.env.local`, one line each, no spaces around the `=`.
The first three are **required**; the rest unlock extra features.

### D1. Supabase (database) — REQUIRED
1. Go to **supabase.com** → sign up → **New Project**
2. Name it `twinops`, choose a region near you, create it (wait 1-2 minutes)
3. Left sidebar → **Project Settings** → **API**
4. Copy these into `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL=`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
   - **service_role** key (click Reveal) → `SUPABASE_SERVICE_ROLE_KEY=`
5. Also set: `USE_SUPABASE_MEMORY=true`

`[SCREENSHOT: Supabase API settings page showing the three keys]`

### D2. OpenRouter (the AI) — REQUIRED
1. Go to **openrouter.ai** → sign up
2. Profile → **Keys** → **Create Key** → copy it (starts with `sk-or-`)
3. In `.env.local`:
   ```
   OPENAI_API_KEY=sk-or-your-key
   OPENAI_BASE_URL=https://openrouter.ai/api/v1
   OPENAI_MODEL=openai/gpt-4o
   OPENAI_EMBEDDING_MODEL=openai/text-embedding-3-small
   ```
4. Add a little credit: OpenRouter → **Credits** → add $5 (lasts a long time)

### D3. GitHub (read your repos) — optional
1. github.com → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. **Generate new token**, give it read-only **Contents** and **Metadata**
3. Copy it into `.env.local`:
   ```
   GITHUB_TOKEN=github_pat_your-token
   ```

### D4. Jira (read your tickets) — optional
1. **id.atlassian.com** → **Security** → **API tokens** → **Create API token**
2. In `.env.local`:
   ```
   JIRA_BASE_URL=https://yoursite.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-token
   ```

### D5. Slack (read channels + answer in Slack) — optional
1. **api.slack.com/apps** → **Create New App** → **From scratch**
2. **OAuth & Permissions** → add bot scopes: `app_mentions:read`, `channels:history`, `channels:read`, `chat:write`, `users:read`
3. **Install to Workspace** → copy the **Bot User OAuth Token** (`xoxb-`)
4. In `.env.local`:
   ```
   SLACK_BOT_TOKEN=xoxb-your-token
   ```

### D6. Microsoft Teams — optional, advanced (see Section 11)

---

## 8. Part E — Set Up the Database

Your Supabase database starts empty. Create its tables once:

1. In Supabase → **SQL Editor** → **New query**
2. In VS Code, open `supabase/migrations/20260925000000_init_schema.sql`
3. Copy everything, paste into the Supabase SQL editor
4. Click **Run** → you should see "Success"

`[SCREENSHOT: Supabase SQL editor after running the migration]`

This creates all tables and turns on security (Row Level Security).

---

## 9. Part F — Run the App

1. In PowerShell, inside the `twinops-enterprise` folder:
   ```
   npm run dev
   ```
2. Wait for: `Local: http://localhost:3000`
3. Open your browser to: **http://localhost:3000**
4. You should see the TwinOps login page

`[SCREENSHOT: TwinOps login page in the browser]`

> `localhost:3000` means "this app, on my own computer". Only you can see it for now.
> Keep the terminal window open while using the app, closing it stops the app.

---

## 10. Part G — Create Your First Twin and Use It

1. On the login page, click **Create your first twin**
2. Give it a name (usually your own)
3. If you added GitHub/Jira keys, enter your GitHub username and Jira details
4. Click **Create**
5. Open the sidebar → **Sync my GitHub & Jira** → wait for it to finish
   (you'll see something like "10 repos synced, 118 chunks created")
6. Go to the chat and ask a real question:
   ```
   What is the status of KAN-2?
   ```
7. You get an answer grounded in your real data, with a citation `[1]`

`[SCREENSHOT: chat showing an answer with a citation]`

---

## 11. Connecting Teams and Slack

These let people talk to your Twin outside the website.

### Slack
1. Deploy the app first (Section 12), Slack needs a public web address
2. In your Slack app → **Event Subscriptions** → turn ON
3. Request URL: `https://YOUR-APP-URL/api/slack/events` → wait for **Verified**
4. **Turn OFF Socket Mode** (Settings → Socket Mode), it blocks web delivery if on
5. Subscribe to bot events: `app_mention`, `message.channels`, `message.im`
6. **Reinstall** the app, then copy the fresh bot token into your settings
7. In Slack, type `@TwinOps what is the status of KAN-2?`

> **Common gotcha:** reinstalling Slack changes the bot token. If replies stop working,
> update `SLACK_BOT_TOKEN` with the new one.

### Microsoft Teams
1. Deploy the app first (Section 12)
2. Build a Power Automate flow: trigger on the `twin:` keyword → HTTP POST to
   `https://YOUR-APP-URL/api/teams/events` with the secret header → reply with the answer
3. In Teams, type `twin: what is the status of KAN-2?`

(Full detail: `docs/SETUP-GUIDE.md` and `docs/REALTIME-INTEGRATIONS-GUIDE.md`.)

---

## 12. The Live Website (Deployment)

To make the app reachable by Teams/Slack and available when your laptop is off, it runs
on a cloud host. **It is already deployed on Render:**

**Live app:** https://twinops-enterprise.onrender.com

How it works: every time code is pushed to GitHub's `main` branch, Render automatically
rebuilds and redeploys. The same Supabase database and keys are configured there.

> **Free tier note:** the app "sleeps" after ~15 minutes of no use, so the first request
> after a quiet period takes 30-50 seconds to wake up. This is normal for free hosting.

(Full detail: `docs/RENDER-DEPLOYMENT-GUIDE.md`.)

---

## 13. Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `git` or `npm` "not recognized" | Terminal opened before install finished | Close all terminals, open a new one; restart PC if needed |
| `npm install` shows red errors | Internet dropped mid-download | Run `npm install` again |
| `npm run dev` says "port 3000 in use" | App already running elsewhere | Close other terminals, try again |
| Page loads but shows errors | A value in `.env.local` is wrong/missing | Re-check Part D; no spaces around `=` |
| "Cannot connect to Supabase" | Wrong keys, or Part E skipped | Re-check the 3 Supabase values; confirm the migration ran |
| Twin says "I don't have information" for everything | No data synced yet | Click Sync, wait for it to finish |
| AI error about credits | OpenRouter balance is empty | openrouter.ai → Credits → add a little |
| Slack `@TwinOps` gets no reply | Socket Mode still on, OR stale bot token | Turn Socket Mode off; update `SLACK_BOT_TOKEN` after reinstall |

---

## 14. FAQ

**Q: Does the app depend on my laptop being on?**
No. The database (Supabase) and the live app (Render) both run in the cloud. Your laptop
is only needed when developing locally.

**Q: Is my data safe / is anything fake?**
Everything is real, synced from your actual GitHub/Jira/Slack. The database has Row Level
Security on, and secrets live only in `.env.local` (never on GitHub).

**Q: Do I need Docker?**
No. Render runs the app without Docker. A Dockerfile exists in the repo only for a future
AWS/Oracle container deployment, and even then the image would be built on the cloud
server, not your laptop.

**Q: How much does this cost?**
Supabase, Render, GitHub, Slack, Teams all have free tiers. The only paid part is
OpenRouter AI usage, a few dollars goes a long way for testing.

**Q: What AI model does it use?**
GPT-4o, accessed through OpenRouter (a service that gives access to many AI models with
one key).

**Q: Can two people's Twins talk to each other?**
Yes. If one Twin lacks context, it can consult another Twin (limited to 2 hops so they
can't loop forever).

---

## 15. Glossary

| Term | Plain meaning |
|---|---|
| **Twin** | An AI version of a person that answers from their real work |
| **Terminal / PowerShell** | A window where you type text commands instead of clicking |
| **Repository (repo)** | A project's code, stored on GitHub |
| **Clone (git)** | Downloading a copy of the repo to your computer |
| **Package** | Ready-made code the project reuses; `npm install` downloads them |
| **Environment file (.env.local)** | A private file holding all your secret keys |
| **API key / token** | A secret password that proves it's really you to another service |
| **Supabase** | The cloud database that stores the Twin's memory |
| **Embedding** | A list of numbers representing the meaning of text, so it's searchable by meaning, not just keywords |
| **pgvector** | The database feature that searches embeddings quickly |
| **RAG** | "Retrieval-Augmented Generation", finding relevant data first, then letting the AI answer from it |
| **OpenRouter** | A service that gives access to AI models (like GPT-4o) with one key |
| **Citation** | The source link the Twin shows for each answer, so you can verify it |
| **Deployment** | Putting the app on a cloud server so it's reachable on the internet |
| **Render** | The cloud host currently running the live app |
| **Webhook** | A way for one service (like Slack) to send data to your app automatically |
| **Socket Mode** | A Slack setting that must be OFF for web-based event delivery to work |

---

*Master guide for TwinOps Enterprise. For deeper topics see the other files in `docs/`.
Live app: https://twinops-enterprise.onrender.com*
