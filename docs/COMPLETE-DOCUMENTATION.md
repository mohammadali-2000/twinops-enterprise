# TwinOps Enterprise — Complete Documentation

A full, in-depth reference for TwinOps Enterprise. It covers the business problem, the
onboarding use case, the complete system architecture, every API endpoint, how each
integration works internally, the RAG and agent pipeline, the database design, security,
deployment, setup, testing, and troubleshooting.

It is written so a non-technical reader can follow the story and value, while an engineer
can find the real technical detail (file names, functions, endpoints, schema).

---

# SECTION A — THE BUSINESS CASE

## A1. The Problem

When a new person joins a software team, they inherit months or years of history they
know nothing about. On day one they do not know what the project is, which tasks are
active, why past decisions were made, who built what, or where any of this is written.

So they ask people, repeatedly, interrupting busy senior engineers for days. This creates
two costs every team silently pays:

1. **The new person is slow to become useful.** They are blocked, waiting for answers.
2. **Senior people lose focus.** Every "quick question" breaks deep work. A lead can lose
   hours a day re-explaining things that already exist in a ticket, a commit, or a chat.

The information the new person needs **already exists**, but it is scattered across three
systems (GitHub, Jira, Slack), written in technical language, with no way to just ask a
plain-English question and get a sourced answer. Keyword search only matches exact words.
A public AI like ChatGPT cannot see private company data at all.

## A2. The Solution

TwinOps builds an **AI Twin** of a team member, connected to that person's real GitHub,
Jira, and Slack work. The Twin answers questions on their behalf, grounded in that real
data, and **every answer carries a citation** linking to the exact source, so it cannot
fabricate. You talk to a Twin in the **web app**, **Microsoft Teams**, or **Slack**.

> One sentence: TwinOps lets anyone get real, sourced answers about a team's work without
> interrupting the people who hold that knowledge.

## A3. How It Helps a New Team Member — Day by Day

**Without TwinOps:**
- Day 1: reads a thin README, still lost, asks the lead "what is this project?"
- Day 2: gets lost in the code, waits half a day for a free senior engineer
- Day 3: does not know which tickets matter, interrupts two people
- Day 4: breaks something because of a past decision only discussed in old Slack messages
- Day 5: still mostly blocked and slow

**With TwinOps:**
- Day 1: asks the Twin "what is this project and what are we working on?" → clear answer, with links to real tickets
- Day 2: asks "how does login work and where is the code?" → answer from the real GitHub repo, file linked
- Day 3: asks "what is the status of KAN-2 and who worked on it?" → real Jira status + name, instantly
- Day 4: asks "any past decision about database migrations?" → the old Slack discussion surfaces; mistake avoided
- Day 5: already contributing, unblocked in minutes not days, zero senior interruptions

**The four concrete wins:**

| New member needs to… | TwinOps delivers |
|---|---|
| Understand active work | Answers from real Jira tickets with status |
| Learn the codebase | Answers from real GitHub repos, commits, PRs |
| Know why decisions were made | Answers from real Slack history |
| Get help when seniors are busy | Instant, 24/7, zero interruptions |

**Why it beats just asking a person:** available 24/7, never forgets, always shows proof,
and there is no social cost to asking "dumb" questions as many times as needed.

## A4. Who Else Benefits

- **Team leads:** their Twin answers teammates while they are in meetings or asleep.
- **The team:** knowledge in one person's head becomes askable by all; it does not leave
  when that person leaves.
- **Managers:** can ask for a grounded status summary based on real tickets and code.

---

# SECTION B — SYSTEM ARCHITECTURE

## B1. The Layers

TwinOps is a single **Next.js 16** application (frontend and backend together) with four
logical layers:

```
+-------------------------------------------------------------------+
|  CHANNELS (where people ask)                                      |
|  Web app UI  |  Microsoft Teams  |  Slack                         |
+-------------------------------------------------------------------+
                    |  HTTPS requests / webhooks
                    v
+-------------------------------------------------------------------+
|  APPLICATION LAYER (Next.js API routes in app/api/**)            |
|  - Chat endpoints        - Integration webhooks                   |
|  - Sync endpoints        - Health / insights                      |
+-------------------------------------------------------------------+
                    |
                    v
+-------------------------------------------------------------------+
|  AGENT / REASONING LAYER (lib/agents/**)                          |
|  - answerAsClone()  the one shared answer pipeline                |
|  - clone-brain      builds the grounded system prompt             |
|  - collaboration    twin-to-twin consultation (consult_clone)     |
|  - openai           model + embedding calls (via OpenRouter)      |
+-------------------------------------------------------------------+
                    |
          +---------+-----------+
          v                     v
+--------------------+   +-----------------------------+
|  MEMORY LAYER      |   |  INTEGRATION LAYER          |
|  backend/memory    |   |  lib/integrations/**        |
|  lib/memory        |   |  github, jira, slack,       |
|  - chunking        |   |  teams, notion, google,     |
|  - embeddings      |   |  credentials, url-safety    |
|  - vector search   |   +-----------------------------+
|  - keyword search  |              |
+--------------------+              v
          |            +-----------------------------+
          v            |  EXTERNAL SERVICES          |
+--------------------+ |  GitHub, Jira, Slack,       |
|  Supabase (Postgres|  |  Teams, OpenRouter (GPT-4o) |
|  + pgvector)       | +-----------------------------+
+--------------------+
```

## B2. Technology Stack

- **Framework:** Next.js 16.1.6 (App Router, Route Handlers, Server-Sent Events)
- **Language/runtime:** TypeScript 5 (strict), Node.js 20+
- **UI:** React 19, Tailwind CSS 4
- **Database:** PostgreSQL with the `pgvector` extension (hosted on Supabase)
- **AI:** GPT-4o and `text-embedding-3-small`, accessed through OpenRouter (an
  OpenAI-compatible gateway)
- **Hosting:** Render (live), with a Dockerfile included for AWS/Oracle container use
- **Testing:** Node.js native test runner

## B3. Folder Structure (what each part does)

```
app/
  (app)/            Authenticated UI views (dashboard, chat, settings)
  api/              All backend endpoints and webhooks (see Section C)
  page.tsx          Entry page

lib/
  agents/           The "brain": answer pipeline, prompt builder, model calls
    answer.ts         answerAsClone() — the single answer pipeline used everywhere
    clone-brain.ts    buildSystemPrompt() — injects retrieved sources + grounding rules
    collaboration.ts  consult_clone tool — one twin asking another
    openai.ts         getChatModel(), getEmbeddingModel(), generateEmbeddings()
    briefs.ts         onboarding/offboarding brief helpers
  core/
    chunker.ts        chunkText() — splits long text into ~700-char overlapping pieces
    supabase/         database client (server + browser)
    types.ts          shared TypeScript types
  integrations/
    github.ts         GitHub sync (repos, commits, PRs -> memory)
    jira.ts           Jira sync + ADF-to-text + single-issue webhook ingest
    slack.ts          Slack OAuth, channel sync, postSlackMessage()
    teams.ts          Teams Adaptive Card builder + sender
    credentials.ts    resolves keys/URLs (DB first, then env), with safety checks
    url-safety.ts     SSRF guards (block internal/metadata addresses)

backend/
  memory/
    index.ts          getKnowledgeContext(), search logic, learnFromConversation()
    clone-repository.ts  create/read/update/delete twins, parseCloneInput()
    flags.ts          feature flags (e.g. USE_SUPABASE_MEMORY)
    local-store.ts    offline fallback store

supabase/
  migrations/         the database schema (tables, indexes, RLS, match_memories RPC)

tests/                unit + integration tests
docs/                 all documentation (this file lives here)
```

---

# SECTION C — EVERY API ENDPOINT

All endpoints live under `app/api/`. The ones that matter most:

## C1. Chat / answering

| Endpoint | Method | What it does |
|---|---|---|
| `/api/chat` | POST | Streams a twin's answer (Server-Sent Events) for the web chat. Body: `cloneId`, `message`, `conversationHistory`. |
| `/api/twinops/chat` | POST | Same answer pipeline, with the UI's event shape (`chunk`, `citations`, `done`). Body: `cloneId`, `question`. |

Both call the single shared function `answerAsClone()` (see Section D).

## C2. Twin management

| Endpoint | Method | What it does |
|---|---|---|
| `/api/clones` | GET / POST | List all twins / create a twin (validated by `parseCloneInput`) |
| `/api/clones/[id]` | GET / PATCH / DELETE | Read, edit, delete one twin |
| `/api/clones/[id]/sync` | POST | Sync that twin's GitHub + Jira data into memory |

## C3. Integration sync + webhooks

| Endpoint | Method | What it does |
|---|---|---|
| `/api/github/sync` | POST | Pull repos/commits/PRs for a username into memory |
| `/api/jira/sync` | POST | Pull Jira issues (ADF→text) into memory |
| `/api/jira/webhook` | POST | Real-time Jira updates; fetches the full issue, re-ingests |
| `/api/slack/sync` | POST | Pull recent channel history into memory |
| `/api/slack/events` | POST | Real-time Slack events; ingests messages AND answers @mentions/DMs/`twin:` |
| `/api/slack/send` | POST | Post a message to a Slack channel |
| `/api/teams/events` | POST | Inbound Teams questions (shared-secret auth); returns a grounded answer |
| `/api/teams/send` | POST | Post an Adaptive Card to Teams (SSRF-guarded webhook URL) |
| `/api/integrations` | GET / POST | View/save integration config (validates Jira/Teams URLs before storing) |

## C4. Insights, briefs, health

| Endpoint | Method | What it does |
|---|---|---|
| `/api/twinops/insights` | GET | Aggregated confidence/activity across twins (real data only) |
| `/api/twinops/onboarding` | POST | Generates an onboarding brief from synced sources |
| `/api/twinops/offboarding` | POST | Generates a handoff pack (open tickets, links) |
| `/api/health` | GET | Checks database, AI, GitHub, Jira, Teams config; used for monitoring |

---

# SECTION D — THE RAG + AGENT PIPELINE (how answers are produced)

This is the heart of the system. Two processes: **sync** (learning) and **answer**.

## D1. Sync pipeline (turning real work into searchable memory)

1. **Fetch:** an integration (e.g. `lib/integrations/github.ts`) calls the external API
   and pulls raw data (repos, commits, PRs; or Jira issues; or Slack messages).
2. **Convert:** rich formats are flattened to plain text. For Jira, `adfToText()` walks
   the Atlassian Document Format (a nested JSON) and extracts readable text.
3. **Chunk:** `chunkText()` (in `lib/core/chunker.ts`) splits long text into pieces of
   about **700 characters with 100 characters of overlap**. Overlap prevents a sentence
   cut at a boundary from losing meaning.
4. **Embed:** `generateEmbeddings()` turns each chunk into a **1536-number vector** (an
   "embedding") using `text-embedding-3-small`. The vector captures meaning, so similar
   ideas sit close together even with different words.
5. **Store:** each chunk is saved as a row in the `memories` table with its embedding and
   metadata (source, title, URL, issue key, etc.).
6. **Idempotent:** before inserting, old rows for the same item are deleted, so re-syncing
   never creates duplicates.

## D2. Answer pipeline — `answerAsClone()` (in `lib/agents/answer.ts`)

This single function powers the web app, Teams, and Slack. Steps:

1. **Load the twin** (`getCloneRuntime`) — its persona, expertise, and owner.
2. **Retrieve context** (`getKnowledgeContext` in `backend/memory/index.ts`), which runs
   up to three searches and merges them:
   - **Semantic search:** the question is embedded, then the `match_memories` database
     function finds the closest chunks by cosine similarity using the pgvector **HNSW**
     index (a fast nearest-neighbour index). Threshold ~0.3.
   - **Keyword fallback:** if semantic results are thin, a cleaned keyword search
     (`cleanTerm`, `STOPWORDS`) runs an `ilike` query so exact words still match.
   - **Issue-key exact lookup:** `extractIssueKeys()` detects patterns like `KAN-2` and
     fetches that exact ticket directly, so ticket-number questions always hit.
   - Results are de-duplicated by row ID.
3. **Build the prompt** (`buildSystemPrompt` in `lib/agents/clone-brain.ts`): the retrieved
   chunks are inserted as a **numbered source list**, with a strict rule: *"Answer only
   from these sources. Cite them as [1], [2]. Never invent."*
4. **Call the model** (GPT-4o via OpenRouter) with that prompt plus recent history.
5. **Tool loop (optional):** the model has one tool, `CONSULT_CLONE_TOOL`. If the question
   needs another person's expertise, it calls `consult_clone`, which runs the same
   pipeline on a teammate's twin and feeds the result back. A `MAX_HOPS = 2` limit stops
   two twins from consulting each other forever.
6. **Attach citations:** sources actually referenced as `[N]` in the answer are returned as
   structured citations (title + URL).
7. **Return** `{ answer, sources, consultations }`. Callers stream or post it as needed.

## D3. Why answers are trustworthy

- **Grounding:** the model only sees retrieved real chunks, not the open internet.
- **Never-invent rule:** enforced in the system prompt; it will say "I don't have that"
  rather than guess (verified by a real test case).
- **Citations:** every answer links to its real source for human verification.

---

# SECTION E — INTEGRATIONS IN DETAIL

## E1. GitHub (`lib/integrations/github.ts`)
- Authenticates with a fine-grained personal access token (read-only Contents + Metadata).
- Pulls repositories, recent commits, and pull requests for a username.
- Stores each as a document + embedded chunks, with the real `html_url` in metadata so
  answers can link back.
- Idempotent per repo (delete-then-insert).

## E2. Jira (`lib/integrations/jira.ts`)
- Authenticates with email + API token (HTTP Basic).
- **ADF conversion:** Jira descriptions/comments come as Atlassian Document Format (nested
  JSON). `adfToText()` flattens them to plain text so they are usable.
- **Bulk sync:** `syncJiraContext()` fetches recent issues (JQL `updated >= -30d`), chunks
  and embeds them, idempotent by issue key.
- **Real-time webhook:** `/api/jira/webhook` receives live events. It calls
  `fetchJiraIssueFields()` to pull the *full* issue (description + comments) so a sparse
  webhook payload never overwrites rich data, then re-ingests. On reassignment it deletes
  the issue across all twins before inserting, so no orphaned copies remain.

## E3. Slack (`lib/integrations/slack.ts` + `app/api/slack/events/route.ts`)
- **OAuth + sync:** connects via bot token; `syncSlackContextToSupabase()` lists member
  channels, fetches history, resolves user names, chunks, embeds, and stores.
- **Bidirectional answering:** `/api/slack/events` receives real-time events. It:
  - ingests normal messages into memory (deduped by `slack_ts` to avoid duplicates),
  - detects a question (an `@mention`, a DM, or a `twin:` prefix), runs `answerAsClone()`,
    and posts the reply back with `postSlackMessage()`, including citations.
- **Requirement:** Socket Mode must be OFF so Slack delivers events to the web URL; and
  reinstalling the app rotates the bot token (must be updated if it changes).

## E4. Microsoft Teams (`lib/integrations/teams.ts` + routes)
- **Inbound:** a Power Automate flow detects the `twin:` keyword and POSTs to
  `/api/teams/events` with a shared secret. The route verifies the secret with a
  constant-time compare (`timingSafeEqual`), strips Teams HTML, runs `answerAsClone()`,
  and returns the answer for the flow to post back.
- **Outbound:** `/api/teams/send` builds an Adaptive Card v1.4 and posts it to a Power
  Automate webhook. The webhook URL is checked against an allowlist of Microsoft domains
  (SSRF protection).

---

# SECTION F — DATABASE DESIGN

Schema is in `supabase/migrations/20260925000000_init_schema.sql`. Four tables:

| Table | Purpose | Key columns |
|---|---|---|
| `clones` | One row per Twin | `id` (UUID), name, owner, persona/expertise |
| `memories` | All synced knowledge | `id`, `clone_id`, `type` (document/chunk), `source` (github/jira/slack), `content`, `embedding VECTOR(1536)`, `metadata`, `occurred_at` |
| `messages` | Conversation storage (schema present) | `id`, `clone_id`, `conversation_id`, `role`, `content` |
| `integrations` | Saved integration config | `id`, `provider`, `config` |

**Indexes:** standard b-tree indexes on `clone_id`, `type`, `source`, `occurred_at`, and
crucially an **HNSW index** on `embedding` (`vector_cosine_ops`) for fast semantic search.

**`match_memories` function:** a PostgreSQL function that takes a query embedding and
returns the closest memory rows by cosine similarity, optionally scoped to one clone.

**Security:** Row Level Security is **enabled on all four tables**, and direct access is
revoked for anonymous and authenticated roles, only the server's service-role key can
read/write. This means the database cannot be read from the public internet.

---

# SECTION G — SECURITY

- **Row Level Security (RLS):** on every table; public/anon access revoked. Only the
  server's secure service key touches data.
- **Secret handling:** all real keys live only in `.env.local` (git-ignored). The public
  repo contains only `.env.example` placeholders. A test (`security-boundaries.test.mjs`)
  actively scans for leaked secret patterns.
- **SSRF protection (`lib/integrations/url-safety.ts`):** any user-supplied URL (Jira base
  URL, Teams webhook) is checked to be HTTPS and NOT pointing at localhost, private
  networks, or the cloud metadata address (`169.254.169.254`). Teams webhooks must also be
  on a Microsoft-owned host.
- **Constant-time secret check:** the Teams inbound endpoint compares its shared secret
  with `timingSafeEqual` to prevent timing attacks.
- **Scoped access:** a Twin only reads the repos, projects, and Slack channels it is given
  access to.
- **Known accepted gap:** twin-management endpoints currently have no login (deliberate,
  to keep the demo simple; documented, not an oversight).

---

# SECTION H — DEPLOYMENT

## H1. Current live deployment (Render)
- Live at **https://twinops-enterprise.onrender.com**.
- Defined by `render.yaml`; every push to the `main` branch auto-rebuilds and redeploys.
- Environment variables (Supabase, OpenRouter, GitHub, Jira, Slack, Teams) are set in
  Render's environment, pointing at the same cloud Supabase database as local development.
- **Free-tier behaviour:** the service sleeps after ~15 minutes idle; the first request
  then takes 30-50 seconds to wake. Normal for free hosting.

## H2. Container option (Docker) — for future AWS/Oracle
- A multi-stage `Dockerfile` is included. It opts into Next.js standalone output only when
  `BUILD_STANDALONE=1` (set inside the Dockerfile), so it does not interfere with Render's
  `next start`.
- No image has been built yet, because building requires Docker, which the development
  laptop cannot run. On AWS/Oracle the image would be built on the cloud server, not the
  laptop.

---

# SECTION I — SETUP (for the administrator)

Full beginner steps are in `docs/MASTER-GUIDE.md`. Summary:

1. Install Git, Node.js (20+), VS Code.
2. `git clone` the repo, `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Fill in keys: Supabase (3 keys + `USE_SUPABASE_MEMORY=true`), OpenRouter, and optionally
   GitHub / Jira / Slack / Teams.
5. Run the migration SQL in Supabase to create the tables.
6. `npm run dev`, open `http://localhost:3000`.
7. Create a Twin, click Sync, start asking questions.

Normal users do **not** do any of this, they just open the website (or Teams/Slack).

---

# SECTION J — TESTING

- **Unit + integration tests:** `npm test` runs the Node test suite (20 tests) covering the
  agent prompt builder, memory repository, search term extraction, Teams card builder,
  Jira ADF conversion, and security boundaries (no leaked secrets).
- **End-to-end:** `npm run e2e` runs ~20 checks against a live instance: health of every
  integration, GitHub/Jira sync counts, no-duplicate re-sync, a real cited answer, Teams
  auth rejection, insights, onboarding, and offboarding.
- **Quality gates:** `npx tsc --noEmit` (types) and `npm run lint` (style) must be clean.

---

# SECTION K — USING TWINOPS (for everyday users)

No install needed:

1. Open **https://twinops-enterprise.onrender.com**
2. Pick a Twin
3. Ask in plain English, e.g. "What is the status of KAN-2?"
4. Read the answer; click the citation to see the real source

**In Teams:** `twin: what is the status of KAN-2?`
**In Slack:** `@TwinOps what is the status of KAN-2?`

### Example conversations

- *"What is the status of KAN-2?"* → "KAN-2, 'Add pgvector index for faster search', is
  In Progress [1]." (links the real ticket)
- *"What repositories are in this project?"* → lists the real repos, each linked
- *"Was there a discussion about database security?"* → surfaces the real Slack decision [1]
- *"What is the office wifi password?"* → "I don't have information about that." (does not
  invent, grounding working as designed)

---

# SECTION L — TROUBLESHOOTING

| Problem | Cause | Fix |
|---|---|---|
| `git`/`npm` not recognized | Terminal opened before install | Reopen terminal; restart PC |
| `npm install` red errors | Network dropped | Run it again |
| Port 3000 in use | App already running | Close other terminals |
| Page errors | Bad `.env.local` value | Re-check keys, no spaces around `=` |
| Cannot connect to Supabase | Wrong keys or migration skipped | Re-check keys; run the migration |
| Twin says "no information" for all | No data synced | Click Sync, wait |
| AI credits error | OpenRouter balance empty | Add credit |
| Slack `@TwinOps` no reply | Socket Mode on, or stale bot token | Turn Socket Mode off; update token after reinstall |
| Teams 400 error | Wrong Adaptive Card version or URL | Ensure v1.4 and HTTPS webhook |

---

# SECTION M — FAQ

**Is it genuinely useful for a new team member?** Yes, it gives sourced answers about the
team's real work in minutes, with no interruptions to seniors, turning a blocked first
week into a productive one.

**Does a normal user install anything?** No, just open the website or use Teams/Slack.

**Can it make up wrong answers?** It is designed not to: grounded on real data, instructed
never to invent, and every answer is cited for verification.

**What if the knowledgeable person leaves?** Their Twin keeps the knowledge; the team can
still ask and get answers from the work they left behind.

**Cost?** Hosting, database, and integrations are free-tier; only AI usage costs a little.

**Is private data safe?** Yes, private locked-down database (RLS), secrets off GitHub,
SSRF protection, and scoped access to only the sources you connect.

**What AI model?** GPT-4o, via OpenRouter.

**Can two Twins collaborate?** Yes, `consult_clone` lets one consult another, max 2 hops.

---

# SECTION N — GLOSSARY

| Term | Plain meaning |
|---|---|
| Twin | An AI version of a person that answers from their real work |
| Repository (repo) | A project's code, stored on GitHub |
| Clone (git) | Downloading a copy of the repo to your computer |
| Environment file (.env.local) | Private file holding all secret keys |
| API key / token | A secret password proving it's really you to a service |
| Supabase | The cloud PostgreSQL database storing the Twin's memory |
| pgvector | Postgres extension for storing and searching embeddings |
| Embedding | Numbers capturing the meaning of text, searchable by meaning |
| Chunk | A ~700-character piece of a larger document |
| HNSW index | A fast structure for finding the nearest embeddings |
| RAG | Retrieval-Augmented Generation: find real data first, then let AI answer from it |
| match_memories | The DB function that returns the closest memory chunks |
| OpenRouter | A gateway giving access to AI models (GPT-4o) with one key |
| Citation | The source link shown with each answer |
| ADF | Atlassian Document Format, Jira's rich-text JSON |
| SSRF | An attack that tricks a server into fetching internal addresses; blocked here |
| RLS | Row Level Security, database lockdown so only the server can read/write |
| Socket Mode | A Slack setting that must be OFF for web event delivery |
| Deployment | Putting the app on a cloud server so it's reachable online |
| Render | The cloud host running the live app |

---

*Complete documentation for TwinOps Enterprise.
Hands-on setup: docs/MASTER-GUIDE.md. Live app: https://twinops-enterprise.onrender.com*
