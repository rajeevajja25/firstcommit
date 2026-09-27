# Conversation Bridge

An AI-powered assistant that helps neurodivergent people (ADHD, autistic, socially anxious) navigate workplace and classroom conversations — without losing their own voice.

Built for **FirstCommit: Beginner's Paradise**.

## The problem

People with ADHD, autism, or social anxiety often second-guess how a message will land, or get lost trying to figure out what someone *actually* meant. That uncertainty is exhausting, and it can quietly push people out of conversations, meetings, and group work.

## What it does

Two modes, one tool:

- **Help me say this** — type a message you want to send, who it's for, and a tone. Conversation Bridge rewrites it to read clearly and land well socially, while keeping it recognizably *yours* — it explains what it changed and why, and it can offer an alternate phrasing.
- **Help me understand this** — paste a confusing message someone sent you. Conversation Bridge explains the likely plain meaning, flags any subtext, and if the message is genuinely ambiguous, suggests a short clarifying question you could send back.

## Who it's for

Neurodivergent students and early-career people who want a second opinion on a message before sending it, or a plain-language read on one they received — in the moment, without waiting on a friend to be free.

## How it works

- **Frontend:** plain HTML/CSS/JS. No framework, so it's easy to read and modify.
- **Backend:** a small Express server. It holds the Anthropic API key and exposes two endpoints, `/api/rewrite` and `/api/decode`, each with its own system prompt.
- **Model:** [Claude](https://www.anthropic.com/claude) (Anthropic), via the Messages API.

The prompt design is really the core of this project: both prompts explicitly ask the model to preserve the user's own vocabulary and directness rather than flattening everything into generic corporate phrasing, and both return structured JSON so the frontend can show a clean "answer + short explanation" instead of one undifferentiated paragraph.

Nothing the user types is stored anywhere — each request goes straight to the model and back.

## Setup

1. Install [Node.js](https://nodejs.org/) 18 or later.
2. Clone this repo and install dependencies:
   ```bash
   git clone <your-repo-url>
   cd conversation-bridge
   npm install
   ```
3. Copy the example env file and add your own Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com/settings/keys)):
   ```bash
   cp .env.example .env
   ```
   Then edit `.env`:
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```
4. Run it:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000`.

## What's next (if I keep building this)

- Save a short local history of past rewrites/decodes so patterns become learnable over time.
- Let the user pick "workplace" vs. "classroom" as a preset instead of typing recipient context every time.
- A browser extension version, so it works inline in Slack/email/Canvas instead of copy-paste.

## AI assistance disclosure

I used Claude (Anthropic) to help scaffold this project (server structure, prompt drafts, and the initial UI), per the hackathon's AI usage policy. I reviewed, tested, and adjusted the code and prompts myself — see the "How it works" section above for the parts that mattered most.
