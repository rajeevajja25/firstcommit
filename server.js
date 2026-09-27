// Conversation Bridge — server
//
// Why a server at all, instead of calling the Anthropic API straight from
// the browser? Two reasons: (1) it keeps our API key secret — anything in
// browser JS is visible to anyone who opens dev tools, and (2) it lets us
// write one clear "system prompt" per feature in one place instead of
// scattering prompt text through the frontend.

require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// Prompt design
// ---------------------------------------------------------------------------
// These two system prompts are the actual "product" — the UI just displays
// what comes back. Both are written to (a) preserve the user's own voice
// instead of generifying it, and (b) return JSON so the frontend can render
// clean sections instead of one wall of text.

const REWRITE_SYSTEM_PROMPT = `You help neurodivergent people (ADHD, autistic, or socially anxious) phrase messages for work or school. They will give you a draft message, who it's going to, and the tone they want.

Rewrite the message so it reads clearly and lands well socially, but keep it recognizably THEIRS: keep their vocabulary, sentence rhythm, and level of directness where possible. Do not make it sound like generic corporate email. Do not add unnecessary hedging, exclamation points, or flattery the person didn't ask for.

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON, in this exact shape:
{
  "rewritten": "the rewritten message",
  "why": "one or two short sentences explaining what you changed and why, written directly to the user (e.g. 'I softened the opening line so it doesn't read as abrupt, and made the ask explicit instead of implied.')",
  "alt": "an optional second phrasing that takes a different tradeoff (e.g. more direct, or shorter) — or an empty string if there's no useful alternative"
}`;

const DECODE_SYSTEM_PROMPT = `You help neurodivergent people (ADHD, autistic, or socially anxious) figure out what someone likely meant in a confusing message from work or school. They will paste the confusing message and optionally some context.

Explain the likely plain meaning directly and concretely — including any implied subtext, like a soft request, indirect criticism, or politeness hiding an actual ask. Don't hedge more than the situation warrants. If the message is genuinely ambiguous even with context, say so plainly and suggest one short, low-stakes clarifying question the user could send back.

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON, in this exact shape:
{
  "meaning": "the likely plain-language meaning, 1-3 sentences",
  "subtext": "what's implied beneath the literal words, if anything — or an empty string if the message is already literal",
  "is_ambiguous": true or false,
  "suggested_question": "a short clarifying question the user could send, or an empty string if not needed"
}`;

// ---------------------------------------------------------------------------
// Shared helper: call the Anthropic API and parse the JSON it returns
// ---------------------------------------------------------------------------

async function callClaude(systemPrompt, userMessage) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = data.content.find((block) => block.type === "text");
  const raw = (textBlock?.text || "").trim();

  // Claude is asked to return only JSON, but strip code fences just in case.
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.post("/api/rewrite", async (req, res) => {
  const { message, recipient, tone } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  const userMessage = [
    `Draft message: "${message.trim()}"`,
    recipient ? `Recipient / setting: ${recipient}` : null,
    tone ? `Desired tone: ${tone}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await callClaude(REWRITE_SYSTEM_PROMPT, userMessage);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong rewriting that message." });
  }
});

app.post("/api/decode", async (req, res) => {
  const { message, context } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  const userMessage = [
    `Confusing message: "${message.trim()}"`,
    context ? `Context: ${context}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await callClaude(DECODE_SYSTEM_PROMPT, userMessage);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong decoding that message." });
  }
});

app.listen(PORT, () => {
  console.log(`Conversation Bridge running at http://localhost:${PORT}`);
});
