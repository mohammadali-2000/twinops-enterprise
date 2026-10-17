# Getting Started With TwinOps Enterprise
### A complete, detailed guide for absolute beginners. No coding experience needed.

This guide assumes you have never written code, never opened a terminal, and never
heard of most of these tools before. Every step is spelled out in full. Do not skip
ahead, even if a step looks obvious. Follow them in order, top to bottom.

By the end, TwinOps will be running on your own computer, with your own real data.

---

## Part 0: Words You Will See In This Guide

Before anything else, here is what a few words mean, since they come up constantly.

- **Terminal** (also called PowerShell, Command Prompt, or console): a plain black or blue
  window where you type text commands instead of clicking buttons. This is how you will
  install and run the project. It looks scary at first, but you only ever type the exact
  lines this guide gives you.
- **Folder path**: the exact address of a folder on your computer, for example
  `C:\Users\YourName\Documents`. Every folder on your computer has one.
- **Repository (repo)**: a project's code, stored online (on GitHub) so it can be
  downloaded onto any computer.
- **Package**: a small piece of ready-made code that this project uses so nobody has to
  write everything from scratch. TwinOps uses hundreds of these.
- **API key / token**: a long secret text string that proves to another company's service
  (like OpenAI or GitHub) that it is really you asking for something. Treat these like
  passwords. Never share them, never post them publicly.
- **Environment file (`.env.local`)**: a single text file where all of your secret keys
  live. The project reads this file to know your passwords. This file is never uploaded
  to GitHub, it stays only on your computer.

---

## Part 1: Opening a Terminal (PowerShell) For the First Time

You will use this in almost every step below, so let's open one now and get comfortable.

1. Click the **Start button** (bottom left of your screen, the Windows logo)
2. Type the word `PowerShell`
3. Click on the result that says **Windows PowerShell** (blue icon)
4. A blue or black window opens with some white text and a blinking cursor. This is your terminal.
5. Try typing this and press **Enter**:
   ```
   echo hello
   ```
6. You should see the word `hello` printed back. If you see that, your terminal works.

**Keep this window open.** You will come back to it throughout this guide. If you ever
close it by accident, just repeat steps 1 to 4 to open a new one, then use the `cd`
command (explained in Part 4) to get back to the right folder.

---

## Part 2: Installing Git

Git is the tool that downloads the TwinOps project code onto your computer, and later
lets you download any updates.

1. Open your web browser and go to **git-scm.com**
2. You will see a button that says **Download for Windows**, click it
3. The download starts automatically. Once finished, click on the downloaded file
   (usually appears at the bottom of your browser, or in your Downloads folder)
4. An installer window opens. Here is exactly what to do on each screen:
   - **License screen**: click **Next**
   - **Select Destination Location**: leave the default, click **Next**
   - **Select Components**: leave everything as it is by default, click **Next**
   - **Select Start Menu Folder**: click **Next**
   - **Choosing the default editor**: leave the default selected, click **Next**
   - **Adjusting the name of the initial branch**: leave default, click **Next**
   - **Adjusting your PATH environment**: leave the middle, recommended option selected, click **Next**
   - Every following screen: just click **Next**, keeping defaults, until you see **Install**
   - Click **Install**, wait for the progress bar to finish
   - Click **Finish**

5. **Close your terminal window completely** and open a brand new one (repeat Part 1).
   This step matters, Git will not work in a terminal that was already open before you
   installed it.

6. In the new terminal, type:
   ```
   git --version
   ```
   Press Enter. You should see something like `git version 2.45.0`. Any version number
   appearing means it worked. If you see "git is not recognized", restart your whole
   computer once, then try again.

---

## Part 3: Installing Node.js

Node.js is the actual engine that runs the TwinOps application. Without it, nothing works.

1. Go to **nodejs.org** in your browser
2. You will see two big green buttons, one says **LTS** and one says **Current**.
   **Click the LTS button.** LTS means "Long Term Support", it is the stable, tested
   version. Do not pick Current.
3. The installer downloads. Click on it to open.
4. Click **Next** on the welcome screen
5. Accept the license agreement (tick the box), click **Next**
6. Leave the install location as default, click **Next**
7. On the "Custom Setup" screen, leave everything as it is, click **Next**
8. On the screen asking about "tools for native modules", leave the checkbox as it is
   (do not tick it unless it already is), click **Next**
9. Click **Install**
10. Windows may ask "Do you want to allow this app to make changes to your device?",
    click **Yes**
11. Wait for installation to finish, click **Finish**

12. **Close your terminal and open a new one again** (same reason as with Git).

13. Type this and press Enter:
    ```
    node --version
    ```
    You should see something like `v22.11.0` or `v20.18.0`. Any number starting with
    20 or higher is fine.

14. Also check the package manager that comes bundled with Node.js:
    ```
    npm --version
    ```
    You should see a number like `10.8.0`. If both commands show version numbers, you
    are ready for the next part.

---

## Part 4: Installing VS Code (Recommended, Not Required)

VS Code is a program for viewing and editing the project's files comfortably. You could
technically skip this, but every step later assumes you have it, because editing
`.env.local` in Notepad is painful.

1. Go to **code.visualstudio.com**
2. Click **Download for Windows**
3. Open the downloaded installer
4. Accept the license agreement, click **Next**
5. Leave the install location as default, click **Next**
6. Leave Start Menu folder as default, click **Next**
7. On "Select Additional Tasks", it is worth ticking:
   - **Add "Open with Code" action to Windows Explorer file context menu**
   - **Add "Open with Code" action to Windows Explorer directory context menu**

   These let you right-click any folder later and open it directly in VS Code.
8. Click **Next**, then **Install**
9. Wait for it to finish, click **Finish** (leave "Launch Visual Studio Code" ticked)

---

## Part 5: Downloading the TwinOps Project Code

Now you will copy the actual TwinOps project from GitHub onto your own computer.

1. Decide where you want the project folder to live. A simple choice is your Documents
   folder. To find its exact path, open File Explorer, click on Documents in the left
   sidebar, then click once in the address bar at the top, it will show something like:
   ```
   C:\Users\YourName\Documents
   ```
   Copy that text (select it, press Ctrl+C).

2. Go back to your terminal. Type `cd ` (with a space after it), then paste the path
   you copied, and press Enter. The full line looks like:
   ```
   cd "C:\Users\YourName\Documents"
   ```
   (Keep the quote marks if your path has spaces in it, like "All Coding Projects".)

3. Now download the project. Type this exactly and press Enter:
   ```
   git clone https://github.com/mohammadali-2000/twinops-enterprise.git
   ```
   You will see text scrolling, showing files being downloaded. This takes under a
   minute normally.

4. Move into the new project folder that was just created:
   ```
   cd twinops-enterprise
   ```

5. Confirm you are in the right place by typing:
   ```
   dir
   ```
   You should see a list of files and folders like `app`, `lib`, `package.json`,
   `README.md`. If you see these, the download worked.

6. Open this folder in VS Code to look around. In the terminal, still inside the
   twinops-enterprise folder, type:
   ```
   code .
   ```
   (that is "code", a space, then a single period). VS Code opens showing all the
   project's files in the left sidebar. You do not need to understand any of this code,
   just know it is there.

---

## Part 6: Installing the Project's Packages

The project is built using hundreds of small pieces of code written by other people
(called packages or dependencies). One single command downloads every single one of
them automatically.

1. Go back to your terminal (or open the built-in terminal inside VS Code: menu
   **Terminal** then **New Terminal**)
2. Make sure you are inside the twinops-enterprise folder (if unsure, type `dir` and
   check you see `package.json` in the list)
3. Type this and press Enter:
   ```
   npm install
   ```
4. A lot of text will scroll by for one to several minutes depending on your internet
   speed. This is completely normal, it is downloading every package the project needs.
5. When it finishes, you will see your cursor blinking again with no more scrolling
   text, maybe a short summary like "added 1240 packages". That means it worked.
6. You will now notice a new folder appeared called `node_modules`. This folder can get
   very large (hundreds of MB), that is normal, it holds all the downloaded packages.
   Never delete files inside it by hand.

**If you see red error text:** usually this means your internet connection dropped
partway through. Simply run `npm install` again, it will pick up where it left off.

---

## Part 7: Creating Your Settings File (.env.local)

The project needs real secret keys to talk to the database and the AI model. These
must never be typed directly into the project's code, instead they go into one private
file that only exists on your computer.

1. In VS Code's file sidebar (left side), find the file named **`.env.example`**
2. Right-click on it, choose **Copy**
3. Right-click on empty space in the same file list, choose **Paste**
4. A new file appears, probably named `.env copy.example` or similar. Right-click it,
   choose **Rename**, and rename it to exactly:
   ```
   .env.local
   ```
   (Make sure there is a dot at the very start, and no other extension like `.txt` at
   the end.)

5. Double-click `.env.local` to open it. You will see many lines like this, each one
   currently empty after the equals sign:
   ```
   OPENAI_API_KEY=
   NEXT_PUBLIC_SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

6. You are going to fill in the blank after each equals sign with a real value, one
   setting at a time, using Part 8 below. Do not put quote marks or spaces around the
   value, just paste it directly after the equals sign, for example:
   ```
   OPENAI_API_KEY=sk-or-v1-abc123yourrealkeyhere
   ```

7. After editing, always save the file: press **Ctrl+S**.

---

## Part 8: Getting Every Single Real Key (Step By Step)

Work through these one at a time. The first three are required for the app to start
at all. The rest unlock specific features (GitHub, Jira, Slack, Teams) and can be
added later, whenever you are ready for that feature.

### 8.1 Create a free Supabase database (required)

Supabase is where all of your Twin's data and memory lives.

1. Go to **supabase.com**
2. Click **Start your project**, sign up using your email or GitHub account
3. Once logged in, click **New Project**
4. Fill in:
   - **Name**: type `twinops` (or anything you like)
   - **Database Password**: click "Generate a password" or type your own strong
     password, then **copy it somewhere safe**, you may need it later
   - **Region**: pick the one closest to you
5. Click **Create new project**
6. Wait 1 to 2 minutes while Supabase sets up your database (you will see a progress
   screen)
7. Once ready, on the left sidebar click the gear icon **Project Settings**, then
   click **API** in that settings menu
8. You will see three values. Copy each one into the matching line in your
   `.env.local` file:
   - **Project URL** → paste into `NEXT_PUBLIC_SUPABASE_URL=`
   - **anon public** key → paste into `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
   - **service_role** key (click "Reveal" first, it is hidden by default) → paste into
     `SUPABASE_SERVICE_ROLE_KEY=`
9. Also find the line `USE_SUPABASE_MEMORY=` in `.env.local` and make it say exactly:
   ```
   USE_SUPABASE_MEMORY=true
   ```

### 8.2 Create the database tables

Your Supabase project is empty right now, it has no tables yet.

1. Still inside your Supabase project, click **SQL Editor** on the left sidebar
2. Click **New query**
3. Go back to VS Code, open the file
   `supabase/migrations/20260925000000_init_schema.sql`
4. Select everything in that file (Ctrl+A), copy it (Ctrl+C)
5. Go back to the Supabase SQL Editor, click inside the empty query box, paste
   (Ctrl+V)
6. Click the **Run** button (usually bottom right, or press Ctrl+Enter)
7. You should see a success message like "Success. No rows returned." This means all
   your tables, indexes, and security rules were just created.

### 8.3 Get an AI model key (required)

TwinOps needs an AI model to actually write answers. The simplest option for a
beginner is OpenRouter, which gives access to many AI models including the one this
project uses by default.

1. Go to **openrouter.ai**
2. Click **Sign Up** (top right), create an account with email or Google
3. Once logged in, click your profile picture, then **Keys**
4. Click **Create Key**, give it a name like "twinops", click **Create**
5. Copy the key shown (it starts with `sk-or-`)
6. In `.env.local`, paste it into:
   ```
   OPENAI_API_KEY=sk-or-v1-yourkeyhere
   ```
7. Also update these two lines in `.env.local` so the app knows to use OpenRouter:
   ```
   OPENAI_BASE_URL=https://openrouter.ai/api/v1
   OPENAI_MODEL=openai/gpt-4o
   OPENAI_EMBEDDING_MODEL=openai/text-embedding-3-small
   ```
8. OpenRouter requires a small amount of credit to actually use the models. Click
   **Credits** in the OpenRouter menu and add a small amount (even $5 lasts a long
   time for testing).

### 8.4 Connect GitHub (optional, do this when ready)

1. Go to **github.com**, log in
2. Click your profile picture (top right), then **Settings**
3. Scroll down the left menu to **Developer settings**
4. Click **Personal access tokens**, then **Fine-grained tokens**
5. Click **Generate new token**
6. Give it a name like "twinops", set an expiry (90 days is fine)
7. Under **Repository access**, choose which repos it can read
8. Under **Permissions**, find **Repository permissions**, set:
   - **Contents**: Read-only
   - **Metadata**: Read-only
9. Click **Generate token**, copy the value shown (starts with `github_pat_`)
10. In `.env.local`:
    ```
    GITHUB_TOKEN=github_pat_yourtokenhere
    ```

### 8.5 Connect Jira (optional, do this when ready)

1. Go to **id.atlassian.com**, log in with your Jira account
2. Click your profile picture, then **Manage account**
3. Click the **Security** tab
4. Under **API tokens**, click **Create and manage API tokens**
5. Click **Create API token**, name it "twinops", click **Create**
6. Copy the token shown
7. In `.env.local`:
   ```
   JIRA_BASE_URL=https://yourcompany.atlassian.net
   JIRA_EMAIL=your.login.email@example.com
   JIRA_API_TOKEN=thetokenyoujustcopied
   ```
   (Replace `yourcompany` with your actual Jira site name, visible in your browser's
   address bar when you use Jira normally.)

### 8.6 Connect Slack (optional, do this when ready)

1. Go to **api.slack.com/apps**
2. Click **Create New App**, choose **From scratch**
3. Name it "TwinOps", pick your workspace, click **Create App**
4. Click **OAuth & Permissions** in the left menu
5. Scroll to **Bot Token Scopes**, click **Add an OAuth Scope**, add each of these one
   at a time: `channels:history`, `channels:read`, `users:read`, `chat:write`
6. Scroll to the top of the page, click **Install to Workspace**, then **Allow**
7. Copy the **Bot User OAuth Token** shown (starts with `xoxb-`)
8. In `.env.local`:
   ```
   SLACK_BOT_TOKEN=xoxb-yourtokenhere
   ```
9. In Slack itself, open a real channel and type `/invite @TwinOps` to let the bot
   read that channel.

### 8.7 Set up Microsoft Teams (optional, more advanced, do this last)

This one needs a working internet-facing address for your app, so it is best done
only after everything else already works locally. See `docs/SETUP-GUIDE.md` for the
full walkthrough once you are ready for it. For now, you can generate a placeholder
secret so the setting is not empty:
```
TEAMS_FLOW_SECRET=any-long-random-text-you-make-up-yourself
```

---

## Part 9: Running the Application For the First Time

This is the step where everything comes together.

1. Go to your terminal, make sure you are inside the twinops-enterprise folder
2. Type this and press Enter:
   ```
   npm run dev
   ```
3. Wait a few seconds. You will see text like:
   ```
   ▲ Next.js 16.1.6
   - Local:  http://localhost:3000
   ✓ Ready in 2.1s
   ```
4. Open your web browser and type this exact address into the address bar:
   ```
   http://localhost:3000
   ```
5. Press Enter. **You should now see the TwinOps Enterprise login page.**

**Leave the terminal window open while you use the app.** Closing it stops the
application. If you accidentally close it, just repeat steps 1 and 2 to start it again.

### What "localhost:3000" actually means

```
http://localhost:3000
         |          |
   "this computer"   "door number 3000 on this computer"
```
This means the app is only visible to you right now, on this one computer. That is
expected and fine for learning and testing.

---

## Part 10: Creating Your First Twin

1. On the login page, click **Create your first twin**
2. Type a name for your twin (usually your own name)
3. If you completed Part 8.4 and 8.5, also fill in your GitHub username and your Jira
   details so the twin knows which data belongs to it
4. Click **Create**
5. You will land on the twin's dashboard. Open the left sidebar and click **Sync my
   GitHub & Jira**
6. Wait for the sync to finish, it will show a summary like "10 repos synced, 118
   chunks created"
7. Go to the chat screen and ask a real question, for example:
   ```
   What is the status of <a real Jira ticket key>?
   ```
8. You should get back a real answer that mentions your actual data, with a citation
   showing exactly where that answer came from.

---

## Troubleshooting, In Detail

| Problem | What it actually means | Exactly what to do |
|---|---|---|
| `git is not recognized` | Git did not install correctly, or your terminal was open before installing it | Close every terminal window, open a brand new one, try again. If it still fails, restart your whole computer. |
| `npm is not recognized` | Same issue but with Node.js | Same fix: close all terminals, open a new one, restart computer if needed |
| `npm install` shows many red lines | A package failed to download, usually due to internet connection | Just run `npm install` again. If it keeps failing, check your WiFi/network connection |
| `npm run dev` says "port 3000 is already in use" | Another program, or an old copy of this app, is already using that address | Close any other terminal windows that might be running the app, then try again |
| Browser shows "This site can't be reached" | The app is not actually running | Go back to your terminal and check it still shows "Ready", if not, run `npm run dev` again |
| Page loads but everything looks broken or shows error text | A setting inside `.env.local` is missing, misspelled, or has extra spaces | Open `.env.local` again, carefully re-check each value against Part 8, make sure there are no spaces before or after the equals sign |
| "Cannot connect to Supabase" or database errors | Your Supabase keys are wrong, or Part 8.2 (creating tables) was skipped | Re-check the three Supabase values match exactly what is shown in your Supabase project's API settings page, and confirm Part 8.2 ran successfully |
| Twin answers say "I don't have information about that" for everything | No real data has been synced yet | Go to Settings or the sidebar, click Sync, wait for it to complete, then ask again |
| AI gives an error about credits or billing | Your OpenRouter account has no credit | Go to openrouter.ai, click Credits, add a small amount |

---

## Quick Reference: Commands You Will Use Again and Again

| Command | What it does | When to use it |
|---|---|---|
| `cd foldername` | Moves into a folder | Every time you open a new terminal |
| `npm install` | Downloads all required packages | Only once, or again if you pull new code that added packages |
| `npm run dev` | Starts the app on your computer | Every time you want to use or test the app |
| `npm test` | Runs automatic checks on the code | When you want to confirm nothing is broken |
| `git pull` | Downloads the newest code from GitHub | When you want to get updates other people made |
| `code .` | Opens the current folder in VS Code | Whenever you want to look at or edit files |

---

## Full Summary, Start to Finish

```
Part 1   Open a terminal for the first time
Part 2   Install Git                          -> git --version works
Part 3   Install Node.js                       -> node --version works
Part 4   Install VS Code (optional)
Part 5   Download the project                  -> git clone ...
Part 6   Install its packages                  -> npm install
Part 7   Create .env.local from .env.example
Part 8   Fill in real keys:
           8.1  Supabase (required)
           8.2  Create database tables (required)
           8.3  AI model key via OpenRouter (required)
           8.4  GitHub token (optional)
           8.5  Jira token (optional)
           8.6  Slack bot token (optional)
           8.7  Teams secret (optional, advanced)
Part 9   Run the app:                          npm run dev
Part 10  Create your first twin and sync real data
```

If you get stuck anywhere, stop at that exact step and ask for help with that one
step specifically, including the exact error text you see, rather than trying to
continue past it.

---

*Written for complete beginners with zero prior setup. For advanced integration
details once the app is already running, see `docs/SETUP-GUIDE.md`.*
