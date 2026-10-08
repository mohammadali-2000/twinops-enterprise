# Weekly Plan: Monday to Friday
### Understand the Real TwinOps Code, Not Generic Tutorials

This plan does not point you to outside reading. Every day opens real files inside
your own project, explains what each piece actually does and why it is built that way,
then gives you a real hands-on task using your own data. By Friday you should be able
to explain any part of this system in your own words, not just repeat what you read.

5 hours a day. Each day covers one real subsystem deeply instead of many things shallowly.

---

## Monday: How Your Twin Remembers
### Real files: `backend/memory/index.ts`, `supabase/migrations/20260925000000_init_schema.sql`

**What you will actually learn (2.5 hours)**

Your Twin does not "remember" like a brain. Everything it knows sits in one Supabase
table called `memories`. Each row is a small chunk of text (a piece of a Jira ticket,
a piece of a GitHub commit) plus a 1536 number list called an embedding.

We will open `backend/memory/index.ts` together and go through:
- What an embedding actually is (a list of numbers that captures meaning, not keywords)
- What pgvector is and why Supabase needs it (it lets the database compare embeddings fast)
- What HNSW index means (a shortcut structure so the database does not check every single row)
- The function `match_memories` and how it finds the closest embeddings to your question
- Why there is also a keyword fallback (embeddings sometimes miss exact words like "KAN-2")
- The `extractIssueKeys` function and why ticket numbers get a separate exact lookup path

You will read the real code, not a diagram of it. We go line by line on the search function.

**Real hands-on task (2.5 hours)**

- Open Supabase dashboard, go to Table Editor, look at your real `memories` table
- Count how many rows exist for your clone, check a few rows and read the actual chunk text
- Ask your Twin a question that should match by keyword but NOT by meaning
  (example: ask about a ticket number directly, like "KAN-2")
- Ask a question that should match by meaning but uses different words than the ticket
  (example: ask "what are we doing about search speed" instead of "pgvector index")
- Watch which path answers it. Open the code again and find exactly which function ran

**You pass today if:** you can explain, without looking at notes, why a question about
"KAN-2" and a question about "search speed" use two different paths inside the same file

---

## Tuesday: How Your Twin Thinks
### Real files: `lib/agents/answer.ts`, `lib/agents/clone-brain.ts`, `lib/agents/openai.ts`, `lib/agents/collaboration.ts`

**What you will actually learn (2.5 hours)**

This is the real brain of the app. `answerAsClone()` in `lib/agents/answer.ts` is the
one function both the web chat and Teams chat call. We will trace through it:
- How it calls `getKnowledgeContext` first (this is Monday's search function, reused)
- How `buildSystemPrompt` in `clone-brain.ts` stitches your retrieved sources into
  a numbered list and tells the AI "cite [1][2], never invent"
- What "function calling" means and why `CONSULT_CLONE_TOOL` is defined as a tool,
  not just a regular function call
- Why there is a `MAX_HOPS = 2` limit on twin-to-twin consultation (so two Twins
  cannot call each other forever in a loop)
- What OpenRouter actually does, it pretends to be OpenAI so your code does not
  need to change, but it routes to `openai/gpt-4o` underneath

**Real hands-on task (2.5 hours)**

- Add one temporary `console.log` right before the OpenAI call in `answer.ts`
  that prints the full system prompt being sent
- Ask your Twin a real question and watch your terminal, read the exact prompt
  the AI received, including the numbered source list
- Remove the console.log once you have seen it
- Create a second Twin (if you have not already) with a different expertise area,
  ask your first Twin something only the second Twin would know, and watch the
  `consult_clone` tool actually fire in the terminal logs

**You pass today if:** you have personally seen the real system prompt text your
AI reads, and you understand why MAX_HOPS exists

---

## Wednesday: How Your Twin Gets Real Data
### Real files: `lib/integrations/jira.ts`, `lib/integrations/github.ts`, `lib/integrations/credentials.ts`

**What you will actually learn (2.5 hours)**

Jira tickets are stored as something called ADF (Atlassian Document Format), which
is JSON, not plain text. If you do not convert it, your Twin cannot read it properly.

We go through:
- The `adfToText()` function and how it walks through nested JSON nodes to pull out text
- Why chunking exists: a whole Jira ticket or GitHub README is too big for one embedding,
  so it gets split into pieces of about 700 characters with 100 characters of overlap
- Why the overlap matters (so a sentence cut in half at a chunk boundary is not lost)
- The idempotent sync pattern: delete old rows for this clone then insert new ones,
  so running sync twice does not create duplicate tickets
- How `credentials.ts` decides where to read your GitHub token and Jira token from
  (database first, then environment variables, in that order)

**Real hands-on task (2.5 hours)**

- Use a tool like Postman or curl to call the real Jira API yourself directly,
  outside your app, and see the raw ADF JSON for one of your tickets
- Compare that raw JSON to what `adfToText()` produces for the same ticket
  (you can call your own `/api/clones/:id/sync` and then look at the chunk in Supabase)
- Create 2 new real Jira tickets with longer descriptions (more than 700 characters)
  and sync again, then check Supabase to see your ticket split into multiple chunks

**You pass today if:** you can point at raw ADF JSON and explain exactly which
part becomes the chunk text your Twin reads

---

## Thursday: How Your Twin Talks to Teams
### Real files: `app/api/teams/events/route.ts`, `app/api/teams/send/route.ts`, `lib/integrations/teams.ts`

**What you will actually learn (2.5 hours)**

This is the part connecting to Microsoft Teams, and it has two real security features
worth understanding properly, not just using blindly:
- `timingSafeEqual` in the secret check, why a normal `===` comparison on secrets
  is actually a small security risk (timing attacks) and how this function avoids it
- The SSRF allowlist in `teams/send/route.ts`, why the webhook URL is checked against
  a fixed list of Microsoft domains before your server is allowed to send data to it
- How Teams messages arrive as HTML (`<at>`, `<p>`, `<br>` tags) and why
  `teamsHtmlToText()` needs to strip all of that before the question reaches your AI
- The Adaptive Card JSON format Microsoft Teams expects for a reply to look nice

**Real hands-on task (2.5 hours)**

- Finish the Power Automate flow if it is not done yet (6 steps, detailed in
  `docs/SETUP-GUIDE.md`)
- Once it works, open your browser's dev tools or your terminal logs and watch
  the real raw body Teams sends when someone mentions "twin:"
- Try sending a message with weird formatting (bold text, a mention, an emoji)
  and see exactly how `teamsHtmlToText()` cleans it before your AI sees it
- Deliberately send the wrong secret key once (curl with a fake header) and confirm
  you get a 401, confirming the security check actually works

**You pass today if:** you have seen one real Teams HTML payload before cleanup
and the clean text after cleanup, side by side

---

## Friday: How It All Connects, End to End
### Real files: `app/api/twinops/chat/route.ts`, full trace Monday to Thursday

**What you will actually learn (2.5 hours)**

Today is not new code, it is connecting everything you learned this week into one
mental map. We trace one single question all the way through:

```
You type a question in the browser
        |
app/api/twinops/chat/route.ts receives it (Server-Sent Events, a way to stream
        |  partial text back to the browser as it is generated, not all at once)
        v
answerAsClone() in lib/agents/answer.ts runs (Tuesday)
        |
getKnowledgeContext() searches backend/memory/index.ts (Monday)
        |
buildSystemPrompt() in clone-brain.ts adds your real sources (Tuesday)
        |
OpenRouter calls gpt-4o, answer streams back chunk by chunk
        |
Citations get attached from the real chunks that were found (Wednesday's synced data)
        |
If Teams asked the question instead of the browser, the same answerAsClone()
runs, just wrapped differently in app/api/teams/events/route.ts (Thursday)
```

We also do a short recap conversation where you explain each box above back to
me in your own words, so gaps show up before your manager finds them.

**Real hands-on task (2.5 hours)**

- Do one complete live run: ask a question in the browser, then ask the exact
  same question in Teams, compare both answers side by side
- Check `/api/health` and confirm every integration shows green
- Write your own one paragraph explanation of what happens between you pressing
  Enter and the answer appearing, using your own words, no copy paste
- Do one full rehearsal of showing this to your manager, out loud, with a timer

**You pass today if:** your own one paragraph explanation is correct without me
correcting more than one or two small things

---

## Why This Plan Is Different From the First One

The first plan pointed you to `claude-howto`, a general guide about Claude Code
features. That is useful but separate from understanding your own project.

This plan only uses files that already exist inside `twinops-enterprise`. Every
hands-on task uses your real Supabase data, your real Jira tickets, your real
GitHub repos. Nothing here is a demo or a sample, it is your actual system.

---

## Daily Rhythm

```
Hour 1 - 2.5     We read the real code together, function by function
                   You ask questions the moment something is unclear
                   No moving on until you can say, in your own words, what it does

Short break

Hour 2.5 - 5     You do the hands-on task using your own real data
                   You try to break it on purpose at least once each day
                   You write down what actually happened, not what you expected
```

---

*Plan for the week of 5 October 2026, built directly from your own TwinOps codebase.*
