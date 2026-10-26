# TwinOps Enterprise — Complete Documentation

A full, detailed explanation of what this project is, the problem it solves, how it
helps a new team member, how it works inside, and how anyone can access and use it.

Written in plain language. No coding background needed to understand it.

---

## Part 1: The Problem We Are Solving

### 1.1 What happens today when someone new joins a team

When a new engineer, analyst, or team member joins a software team, they walk into
months or years of history they know nothing about. On their first day they do not know:

- What the project is actually about, beyond a one-line description
- Which tasks are being worked on right now, and which are finished
- Why certain decisions were made (why this database, why this approach)
- Who worked on which part of the system
- What was discussed and agreed in past conversations
- Where to even look for any of this

So what do they do? They **ask people**. They ask the team lead. They ask senior
engineers. They interrupt busy people over and over, for days or weeks. Every question
pulls an experienced person away from their own work.

### 1.2 Why this is expensive

This creates two hidden costs that most teams just accept as normal:

1. **The new person is slow to become useful.** They spend their first weeks confused,
   waiting for answers, blocked until someone is free to explain things.

2. **The senior people lose focus.** Every "quick question" breaks their concentration.
   A team lead can lose hours a day just answering things that are technically already
   written down somewhere, in a Jira ticket, a code commit, or an old Slack message, but
   that the new person does not know how to find.

### 1.3 Why existing tools do not fix this

The information the new person needs **already exists**. It is scattered across:
- **GitHub** (the actual code, commits, and pull requests)
- **Jira** (the tickets, tasks, and their statuses)
- **Slack** (the conversations and decisions)

But it is spread across three different systems, written in technical language, and
there is no easy way to just **ask a question in plain English and get a straight answer
with proof**. A normal search only matches keywords. A public AI tool like ChatGPT
cannot see your company's private code or tickets at all.

---

## Part 2: The Solution — What TwinOps Is

### 2.1 The core idea

TwinOps creates an **AI version of a team member**, called a **Twin**.

A Twin is connected to that person's real work, their GitHub repositories, their Jira
tickets, and their Slack conversations. Once connected, the Twin can answer questions on
that person's behalf, using their actual work history as the source of truth.

The important part: **every answer the Twin gives includes a citation**, a link back to
the exact Jira ticket, code file, or message the answer came from. This means the Twin
cannot make things up. If it says "KAN-2 is in progress", it shows you the real KAN-2
ticket so you can verify it yourself.

### 2.2 Where you can talk to a Twin

People can ask a Twin questions in three places, whichever is convenient:

1. **The web app** — a website you open in your browser
2. **Microsoft Teams** — just type a message mentioning the Twin
3. **Slack** — mention the Twin in a channel, or send it a direct message

### 2.3 The one-sentence summary

> TwinOps lets anyone ask questions and get real, sourced answers about a team's work,
> without having to interrupt the busy people who hold that knowledge.

---

## Part 3: How It Helps a New Team Member (In Detail)

This is the most important section for understanding the value.

### 3.1 A new member's first week — WITHOUT TwinOps

- **Day 1:** Reads a short README, still confused. Asks the lead "what is this project?"
- **Day 2:** Tries to understand the code, gets lost, waits for a senior engineer to be
  free, loses half a day.
- **Day 3:** Does not know which tickets matter. Interrupts two people to ask.
- **Day 4:** Makes a change that breaks something, because they did not know about a past
  decision that was only discussed in Slack months ago.
- **Day 5:** Still mostly blocked, still asking, still slow.

Result: a slow, frustrating first week for the new person, and a distracted week for the
seniors who had to keep stopping to help.

### 3.2 A new member's first week — WITH TwinOps

- **Day 1:** Opens the web app. Asks the Twin "What is this project about and what are we
  working on right now?" Gets a clear answer with links to the real tickets.
- **Day 2:** Asks "How does the login feature work and where is its code?" The Twin
  answers from the real GitHub repository, with the exact file linked.
- **Day 3:** Asks "What is the status of KAN-2 and who worked on it?" Gets the real Jira
  status and the person's name, instantly.
- **Day 4:** Before making a change, asks "Was there any past decision about how we handle
  database migrations?" The Twin surfaces the old Slack discussion. Crisis avoided.
- **Day 5:** Already contributing, because they got unblocked in minutes, not days, and
  never had to wait for a busy senior.

Result: the new person becomes useful far faster, and the senior people kept their focus.

### 3.3 The four concrete ways it helps a new member

| The new member needs to... | How TwinOps delivers it |
|---|---|
| Understand what is being worked on | Answers drawn from real Jira tickets, with status |
| Learn the codebase | Answers drawn from real GitHub repos, commits, and pull requests |
| Know why past decisions were made | Answers drawn from real Slack conversation history |
| Get help when seniors are busy | Instant answers, any time, with zero interruptions to the team |

### 3.4 Why this is better than just "asking a person"

- **Available 24/7** — the Twin never sleeps, never is in a meeting, never is on leave.
- **Never forgets** — it remembers every ticket, commit, and message it has read.
- **Always shows proof** — every answer links to the real source, so the new member
  learns where information actually lives, not just the answer.
- **No social cost** — new people often feel afraid to "ask a dumb question" to a senior.
  They can ask the Twin anything, as many times as they want, with no embarrassment.

---

## Part 4: Who Else Benefits

While onboarding a new member is the clearest use case, TwinOps helps others too:

- **Team leads:** When they are in a long meeting or a different time zone, their Twin
  keeps answering their teammates' questions, so work does not stall waiting for them.
- **The whole team:** Knowledge that used to live only in one person's head becomes
  askable by everyone. If that person leaves, the knowledge does not leave with them.
- **Managers:** Can ask a Twin for a grounded status summary of what a person or project
  is doing, based on real tickets and code, not guesswork.

---

## Part 5: How It Works Inside (Explained Simply)

You do not need to understand this to use TwinOps, but it helps to know it is real and
not magic. There are two main processes: **learning** and **answering**.

### 5.1 The learning process (called "syncing")

```
GitHub repos      Jira tickets      Slack messages
      \                |                 /
       \               |                /
        v              v               v
        +------------------------------------+
        |  TwinOps reads all of this data    |
        |  and breaks it into small pieces   |
        |  (called "chunks")                 |
        +------------------------------------+
                        |
                        v
        +------------------------------------+
        |  Each piece is turned into an      |
        |  "embedding" (a list of numbers    |
        |  that captures its meaning)        |
        +------------------------------------+
                        |
                        v
        +------------------------------------+
        |  All pieces are stored in a cloud  |
        |  database (Supabase) that can be   |
        |  searched by meaning, not just by  |
        |  matching keywords                 |
        +------------------------------------+
```

In plain words: TwinOps reads your real work, cuts it into small readable pieces, and
files them away in a smart database where it can later find the right piece by *meaning*,
even if the exact words do not match.

### 5.2 The answering process

```
Someone asks a question
   (web app / Teams / Slack)
            |
            v
   +----------------------------+
   |  TwinOps searches its      |
   |  database for the pieces   |
   |  most relevant to the      |
   |  question                  |
   +----------------------------+
            |
            v
   +----------------------------+
   |  It sends ONLY those       |
   |  relevant pieces to an AI  |
   |  model (GPT-4o), with a    |
   |  strict rule: "only answer |
   |  from what is given, never |
   |  make things up"           |
   +----------------------------+
            |
            v
   +----------------------------+
   |  The AI writes an answer   |
   |  and TwinOps attaches a    |
   |  citation to the real      |
   |  source                    |
   +----------------------------+
            |
            v
   Answer appears, e.g.:
   "KAN-2 is In Progress [1]"
   [1] = link to the real ticket
```

In plain words: when you ask something, TwinOps finds the relevant real information
first, then lets the AI write an answer using only that information, and shows you where
it came from.

### 5.3 Why answers can be trusted

Three safeguards keep answers honest:

1. **Grounding:** the AI only sees the real pieces TwinOps retrieved, not the whole
   internet. It answers from your actual data.
2. **The "never invent" rule:** the AI is explicitly instructed to only answer from what
   it was given, and to say so if it does not know.
3. **Citations:** every answer links to its real source, so a human can always verify.

---

## Part 6: What Data It Uses (and Does Not)

| Source | What TwinOps reads | How it is used |
|---|---|---|
| **GitHub** | Repositories, commits, pull requests | To answer questions about the code and who changed what |
| **Jira** | Tickets, their descriptions, statuses, comments | To answer questions about tasks and progress |
| **Slack** | Messages in channels the Twin is invited to | To answer questions about discussions and decisions |

**Important boundaries:**
- The Twin only reads Slack channels it has been **explicitly invited to**.
- It only reads GitHub repos and Jira projects you connect with your own access keys.
- Nothing is shared with the public. The data lives in your own private cloud database.

---

## Part 7: How to Access and Use TwinOps

### 7.1 For a normal user (e.g. a new team member)

This is the easy path, nothing to install.

1. Open the live website: **https://twinops-enterprise.onrender.com**
2. Pick the Twin you want to ask (for example, the team lead's Twin)
3. Type your question in plain English and press send
4. Read the answer, and click the citation link to see the real source

That is the entire experience for someone who just wants answers. No setup, no accounts
to create, no technical steps.

> Note: the live site runs on a free hosting tier that "sleeps" after about 15 minutes of
> no use. The very first question after a quiet period may take 30-50 seconds while it
> wakes up. After that it is fast.

### 7.2 Asking in Microsoft Teams

Once Teams is connected, type a message in the channel:
```
twin: what is the status of KAN-2?
```
The Twin replies right there in the Teams conversation.

### 7.3 Asking in Slack

Once Slack is connected, mention the Twin in a channel:
```
@TwinOps what is the status of KAN-2?
```
The Twin replies in the thread.

### 7.4 For the person setting it up (the administrator)

Setting up a Twin for the first time involves connecting the data sources and running the
app. The full step-by-step instructions, written for someone with no coding background,
are in **docs/MASTER-GUIDE.md** (and the matching PDF). In short, the setup person:

1. Installs a few free tools (Git, Node.js, VS Code)
2. Downloads the project from GitHub
3. Connects the data sources (GitHub, Jira, Slack) with access keys
4. Runs a one-time database setup
5. Creates a Twin and clicks "Sync" to load the real data

After that, everyone else just uses the website, Teams, or Slack, no setup on their end.

---

## Part 8: Real Example Conversations

These are the kinds of questions a new member can ask, and what they get back.

**Example 1 — understanding a task**
> **New member:** What is the status of KAN-2?
> **Twin:** KAN-2, "Add pgvector index for faster search", is currently In Progress. [1]
> *[1] links to the real Jira ticket*

**Example 2 — learning the code**
> **New member:** What repositories are part of this project?
> **Twin:** The project includes the following repositories... [lists the real repos from
> GitHub, each linked]

**Example 3 — recalling a decision**
> **New member:** Was there any discussion about how we handle database security?
> **Twin:** Yes. In the #twinops-test channel, the team discussed enabling Row Level
> Security and blocking anonymous access. [1]
> *[1] links to the real Slack message*

**Example 4 — when the Twin does not know**
> **New member:** What is the office wifi password?
> **Twin:** I do not have information about that in the synced data.

(Notice: it does not invent an answer. That is the grounding and "never invent" rule
working correctly.)

---

## Part 9: Security and Trust

For a manager or security reviewer, here is what protects the data:

- **Private database with Row Level Security:** the database is locked down so no outside
  or anonymous user can read or write it directly, only the app's own secure server key.
- **Secrets never exposed:** all access keys live in a private settings file that is never
  put on GitHub. Only placeholder examples are in the public code.
- **Protection against address-redirection attacks (SSRF):** the app blocks attempts to
  make it fetch internal or hidden network addresses.
- **Verified sources only:** because every answer is grounded and cited, there is a clear
  audit trail of where each answer came from.
- **Scoped access:** the Twin only sees the specific repos, projects, and channels it is
  given access to, nothing more.

---

## Part 10: Current Status

| Capability | Status |
|---|---|
| Web app (ask questions, get cited answers) | Working |
| GitHub sync | Working |
| Jira sync (including real-time updates) | Working |
| Slack (sync + answering in Slack) | Working (final token refresh pending) |
| Microsoft Teams | Working |
| Twin-to-twin consultation | Working |
| Live public deployment | Working, at https://twinops-enterprise.onrender.com |
| Database security | Done |

---

## Part 11: Frequently Asked Questions

**Is this actually useful for a new team member?**
Yes. It lets them get answers about the team's real work, the code, the tasks, and past
decisions, in minutes, without interrupting busy senior people. It turns a slow, blocked
first week into a productive one.

**Does the new member need to install anything?**
No. They just open the website (or use Teams/Slack) and ask questions. Only the person
who sets it up needs to install anything, one time.

**Can it make up wrong answers?**
It is specifically designed not to. It only answers from the real synced data, is
instructed never to invent, and shows a source link for every answer so you can verify.

**What if the knowledgeable person leaves the company?**
Their Twin keeps the knowledge. The team can still ask questions and get answers from the
work that person left behind, so the knowledge does not walk out the door.

**Does it cost money?**
The hosting, database, and integrations all run on free tiers. The only paid part is the
AI usage, which is a few dollars for a lot of questions.

**Is our private data safe?**
Yes. It lives in a private, locked-down cloud database, is never shared publicly, and the
Twin only accesses the specific sources it is given permission to.

---

*Complete documentation for TwinOps Enterprise.
For hands-on setup instructions, see docs/MASTER-GUIDE.md.
Live app: https://twinops-enterprise.onrender.com*
