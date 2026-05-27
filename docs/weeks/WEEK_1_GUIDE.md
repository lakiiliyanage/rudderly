# Week 1 Setup Guide — Mac Edition 🍎

> **Goal:** Get your Mac fully set up as an AI development machine, connect Claude Code CLI, push AgentForge to GitHub, and write your first real code.  
> **Time:** ~4 hours across your weekend sessions  
> **You'll need:** Your Mac, a browser, and an Anthropic account (free to start)

---

## What You're Setting Up

Think of this like getting a new design machine ready. On a fresh Mac you'd install Figma, set up your fonts, connect your cloud storage. For dev, we're doing the same thing — installing the right tools and connecting them to each other.

Here's what we'll install and why:

| Tool | What it is | Design analogy |
|------|-----------|----------------|
| **Homebrew** | Package manager for Mac | Like the App Store, but for developer tools |
| **Node.js** | JavaScript runtime | The engine that runs your app |
| **Git** | Version control | Like Figma's version history, but for code |
| **Claude Code CLI** | AI coding assistant in your terminal | Your AI pair programmer |
| **VS Code** | Code editor | Figma, but for writing code |
| **GitHub** | Cloud repo hosting | Figma cloud, but for code |

---

## Understanding Your Two Environments

Before you start, it helps to know the difference between **Terminal** and **Claude Code** — you'll switch between them throughout Week 1.

**Terminal** is your Mac's command line. It only understands specific commands like `ls`, `cd`, `git`, `brew` etc. Your prompt looks like:
```
lakiiliyanage@Mac ~ %
```

**Claude Code** is an AI app that runs *inside* Terminal. You launch it by typing `claude`, and then you can talk to it in plain English. Your prompt looks like:
```
> 
```

The key rule: **only type natural language when you're inside Claude Code.** If you type a question directly into Terminal, it'll error because Terminal is looking for a command, not a sentence.

To exit Claude Code and return to Terminal at any time, press `Esc` or type `/exit`.

---

## Step 1: Install Homebrew (5 min)

Homebrew is how Mac developers install tools. Think of it as the App Store for your terminal.

**Open Terminal** — press `Cmd + Space`, type "Terminal", press Enter.

Copy and paste this into Terminal, then press Enter:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

It will ask for your Mac password — type it (you won't see characters, that's normal). It takes ~3 minutes.

**Verify it worked:**
```bash
brew --version
```
You should see something like `Homebrew 4.x.x`. ✅

> **If you see "command not found: brew"** — close Terminal completely and reopen it. The installer adds Homebrew to your PATH but Terminal needs a fresh start to pick it up.

---

## Step 2: Install Node.js (3 min)

Node.js is what runs JavaScript on your computer (not just in browsers). Next.js needs it.

```bash
brew install node
```

**Verify:**
```bash
node --version
npm --version
```
You should see `v20.x.x` and `10.x.x`. ✅

---

## Step 3: Install Git + Set It Up (5 min)

Git tracks every change you make to your code — like Figma's version history but for files. It's already on most Macs, but let's make sure it's current:

```bash
brew install git
```

Now tell Git who you are (so your commits are labeled correctly). **Replace "Your Name" with your actual name** — for example `"Lakii Liyanage"`. The email is yours, use it as-is:

```bash
git config --global user.name "Your Name"
git config --global user.email "liyanage.lakii@gmail.com"
git config --global init.defaultBranch main
```

What these three lines do:
- **user.name** — labels every commit with your name (like a signature)
- **user.email** — links commits to your GitHub account
- **init.defaultBranch main** — a one-time preference setting, not creating a branch. You're just telling Git to call the first branch `main` (the modern standard) instead of the old default `master`

The `--global` flag means these apply to every project on your Mac. You only need to run this once ever.

**Verify:**
```bash
git --version
```
You should see `git version 2.x.x`. ✅

---

## Step 4: Install VS Code (if you haven't already)

If you already have VS Code — great, skip to the extensions section below.

Download from: **https://code.visualstudio.com**

After downloading, open the `.zip`, drag `Visual Studio Code.app` into your **Applications** folder, then open it from there.

### Connect VS Code to Terminal (the `code` command)

This lets you type `code .` in Terminal to instantly open any folder in VS Code. To set it up:

1. Open VS Code
2. Press `Cmd + Shift + P` — a search bar drops down from the top (this is the **Command Palette**, VS Code's search-for-everything shortcut, similar to Figma's Quick Actions bar `Cmd + /`)
3. Type `Shell Command: Install 'code' command in PATH`
4. Press Enter
5. Enter your Mac password if prompted

**Verify:**
```bash
code --version
```
✅

> **If you get `ENOTDIR: not a directory` or `rm: /usr/local/bin/code: Not a directory`**
>
> This means something went wrong with `/usr/local/bin` on your Mac — it exists as a file instead of a folder. Fix it with these three commands in order:
> ```bash
> sudo rm /usr/local/bin
> sudo mkdir /usr/local/bin
> sudo chmod 755 /usr/local/bin
> ```
> Then go back to VS Code and run the Shell Command installer again.
>
> **If the above doesn't work**, use this alternative that bypasses `/usr/local/bin` entirely:
> ```bash
> echo 'export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"' >> ~/.zshrc
> source ~/.zshrc
> ```
> Then test with `code --version`.

### Install VS Code Extensions

Extensions add superpowers to VS Code. Install them from inside VS Code:

1. Click the **Extensions icon** in the left sidebar (four squares, one slightly detached) or press `Cmd + Shift + X`
2. Use the search bar to find each extension below
3. Click the blue **Install** button

| Extension | Search for | Made by | What it does |
|-----------|-----------|---------|-------------|
| Tailwind CSS IntelliSense | `Tailwind CSS IntelliSense` | Bradlc | Autocompletes Tailwind class names as you type |
| ES7+ React snippets | `ES7+ React` | dsznajder | Shortcuts that expand into full code blocks (e.g. type `rafce` + Tab = full React component) |
| Prettier | `Prettier` | Prettier | Auto-formats your code every time you save |
| GitLens | `GitLens` | GitKraken | Shows Git history inline — hover any line to see who wrote it and when |

Restart VS Code once after installing all four.

> **Note on GitKraken MCP:** You may see a suggestion to install the GitKraken MCP. Skip this for now — it's an advanced tool for managing complex multi-branch projects. The GitLens extension is all you need for Week 1.

---

## Step 5: Install Claude Code CLI (10 min)

This is your AI coding partner. It lives in your terminal and can write, edit, and explain code in your actual project folder.

**Install it:**
```bash
npm install -g @anthropic-ai/claude-code
```

> **If you get "permission denied"** — run with sudo: `sudo npm install -g @anthropic-ai/claude-code`

**Verify:**
```bash
claude --version
```
✅

### Get Your Anthropic API Key

1. Go to **https://console.anthropic.com**
2. Sign in or create a free account
3. Click **"API Keys"** in the left sidebar
4. Click **"Create Key"** — give it a name like "AgentForge Dev"
5. **Copy the key immediately** — you won't see it again!
   - It looks like: `sk-ant-api03-...`

> ⚠️ **Treat your API key like a password.** Never paste it into code files, never put it in a screenshot, never share it.

**Connect Claude Code to your API key:**
```bash
claude config set apiKey sk-ant-api03-YOUR-KEY-HERE
```

Or just run `claude` and it'll ask for the key interactively on first launch.

### First Launch of Claude Code

Run:
```bash
claude
```

**You'll be asked:** *"Use Claude Code's terminal setup? Option+Enter for newlines and visual bell"*

**Choose option 1 — Yes, use recommended settings.** These are just two small comfort tweaks:
- **Option+Enter for newlines** — press `Option+Enter` to go to a new line in your message without sending it (useful for writing multi-line instructions)
- **Visual bell** — screen flashes instead of a beep sound when something goes wrong

Neither changes how Claude Code works. Press Enter to confirm.

### Understanding the Claude Code Interface

Once launched, you'll see a `>` prompt. This is where you talk to Claude in plain English.

**Common mistake:** If you accidentally type a command like `config` as your first input, Claude Code will open its configuration menu. That's fine — just press `Esc` or type `/exit` to get back to the normal `>` prompt.

**Try these as your first commands:**
```
> What files are in my current folder?
```
```
> Explain what's in my index.html file
```
```
> What would the Next.js folder structure look like for this project?
```

> **Designer tip:** Think of Claude Code like a very fast, very knowledgeable design intern. You direct the vision, they execute. The better your brief, the better the output. If you'd write a Figma annotation like "the button should be purple, rounded, with a glow effect" — you can say the same thing to Claude Code.

**To exit Claude Code** and go back to regular Terminal: press `Esc` or type `/exit`. You'll see the `lakiiliyanage@Mac ~ %` prompt return. You can always re-enter by typing `claude`.

---

## Step 6: Set Up GitHub (10 min)

> ⚠️ **Make sure you've exited Claude Code before this step.** You need to be at the regular Terminal prompt (`lakiiliyanage@Mac ~ %`). If you're still in Claude Code, press `Esc` or type `/exit` first.

GitHub is where your code lives in the cloud. It's your version control system and the place where your private Rudderly repository is hosted.

**Create a GitHub account** (if you don't have one): https://github.com

**Install GitHub CLI** — makes working with GitHub from Terminal much easier:
```bash
brew install gh
```

**Log in:**
```bash
gh auth login
```

Follow the prompts:
- Select **GitHub.com**
- Select **HTTPS**
- Select **Login with a web browser**
- Copy the code it gives you, open the link, paste the code

**Verify:**
```bash
gh auth status
```
You should see "Logged in to github.com". ✅

---

## Step 7: Create Your AgentForge GitHub Repository (10 min)

Let's get your project live on GitHub.

**Navigate to the agentforge folder:**

Open Finder, find your `agentforge` folder inside "Learn AI", then drag the folder onto your Terminal window — this pastes its full path.

Or navigate manually:
```bash
cd /path/to/your/"Learn AI"/agentforge
```

**Initialize Git:**
```bash
git init
git add .
git commit -m "Week 1: Initial AgentForge scaffold 🚀"
```

**Create the GitHub repo and push:**
```bash
gh repo create agentforge --public --source=. --remote=origin --push
```

This creates the repo on GitHub and pushes your first commit in one command.

**Check it worked** — visit: `https://github.com/YOUR-USERNAME/agentforge`

You should see your files live on the internet. 🎉

---

## Step 8: Scaffold the Real Next.js Project (20 min)

The `index.html` we have is a teaser page. Now let's create the actual Next.js application.

> ⚠️ **If you have existing files in the folder (README.md, WEEK_1_GUIDE.md, index.html)**, Next.js will refuse to install because it doesn't want to overwrite them. Move them temporarily first:
> ```bash
> mkdir ../temp-backup
> mv README.md WEEK_1_GUIDE.md index.html ../temp-backup/
> ```
> Run the installer, then move them back:
> ```bash
> mv ../temp-backup/README.md ../temp-backup/WEEK_1_GUIDE.md ../temp-backup/index.html .
> rmdir ../temp-backup
> ```

**In Terminal, from inside the agentforge folder:**
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

It'll ask a few questions — say **Yes** to all of them.

This creates the full project structure:
```
agentforge/
├── src/
│   └── app/
│       ├── page.tsx       ← Your home page
│       ├── layout.tsx     ← Wraps every page
│       └── globals.css    ← Global styles
├── public/               ← Static files (images, etc.)
├── package.json          ← Project config
├── tsconfig.json         ← TypeScript config
└── next.config.js        ← Next.js config
```

**What is ESLint?** You'll notice `eslint-config-next` in your `package.json` after install. ESLint is a code quality checker that runs in the background — it spots problems before they become bugs, like a spell-checker but for code logic. It's pre-configured for Next.js so you don't need to touch it.

**Check your Next.js version:**
```bash
cat package.json | grep next
```
You'll see `"next": "16.x.x"` — that's your version. ✅

**Run the development server:**
```bash
npm run dev
```

Open your browser to **http://localhost:3000** — you'll see the default Next.js welcome page.

**Press Ctrl+C** to stop the server when you're done.

---

## Step 9: Commit Your Progress (5 min)

Every time you finish a chunk of work, commit it. Think of this like saving a named version in Figma.

```bash
git add .
git commit -m "Week 1: Add Next.js scaffold with TypeScript + Tailwind"
git push
```

Your code is now backed up and version-controlled. If anything ever breaks, you can always go back.

---

## ✅ Week 1 Completion Checklist

Before you mark Week 1 done in Notion, confirm:

- [ ] Homebrew installed (`brew --version` works)
- [ ] Node.js installed (`node --version` shows v20+)
- [ ] Git configured with your name and email
- [ ] VS Code installed with `code` command working
- [ ] Claude Code CLI installed (`claude --version` works)
- [ ] Anthropic API key created and connected
- [ ] GitHub account connected via `gh auth login`
- [ ] AgentForge repo live at `github.com/lakiiliyanage/agentforge`
- [ ] Next.js project scaffolded and running on localhost:3000
- [ ] First commits pushed to GitHub

---

## 🧪 Week 1 Validation Tests

Run each command — if it returns the expected output, the step is truly complete. All 11 must pass before moving to Week 2.

| Test | Command | Expected output |
|------|---------|----------------|
| Homebrew | `brew --version` | `Homebrew 4.x.x` |
| Node.js | `node --version` | `v20.x.x` or higher |
| npm | `npm --version` | `10.x.x` or higher |
| Git | `git --version` | `git version 2.x.x` |
| Git identity | `git config --global user.name` | Your name |
| VS Code | `code --version` | Version number |
| Claude Code | `claude --version` | Version number |
| GitHub | `gh auth status` | Logged in to github.com |
| Next.js version | `cat package.json \| grep next` | `"next": "16.x.x"` |
| Dev server | `npm run dev` → open localhost:3000 | Next.js welcome page loads |
| GitHub repo | Visit github.com/lakiiliyanage/agentforge | Your files visible online |

All 11 pass? **Week 1 is done.** Tick everything off in Notion and move to Week 2.

---

## Troubleshooting

**"command not found: brew"** — Close Terminal and reopen it. If still not working, re-run the Homebrew install command.

**"permission denied" during npm install -g** — Run: `sudo npm install -g @anthropic-ai/claude-code`

**ENOTDIR error on /usr/local/bin/code** — See the fix in Step 4 above.

**"ENOENT" or file not found errors** — You're probably in the wrong folder. Run `pwd` to see where you are.

**Claude Code asks for API key every time** — Run `claude config set apiKey YOUR-KEY` again.

**Port 3000 already in use** — Another app is using it. Either close that app, or run `npm run dev -- -p 3001` to use port 3001.

**Typed a question into Terminal and got an error** — You're not in Claude Code. Terminal only understands commands, not natural language. Run `claude` first, then ask your question.

**Accidentally opened Claude Code's config menu** — You typed `config` as your first command. Press `Esc` or type `/exit` to return to the normal `>` prompt.

---

## What's Next: Week 2 Preview

Next session you'll:
- Learn JavaScript fundamentals (variables, functions, arrays) with real AgentForge examples
- Understand TypeScript (JavaScript with autocomplete superpowers)
- Build your first React component — the AgentForge home page
- Learn the Git branching workflow (feature branch → PR → merge)

**Your Week 2 Claude Code prompt to have ready:**
```
I'm building a web app called AgentForge — a visual AI agent builder. 
I need to build a landing page hero section with a headline, subtitle, 
and two buttons. Use Next.js, TypeScript, and Tailwind CSS. 
Keep it clean and modern, dark theme.
```

---

*Week 1 Guide — AgentForge · Built with Claude Code · April 2026*
