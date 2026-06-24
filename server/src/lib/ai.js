/**
 * Sellena AI Client
 *
 * Automatically uses real Claude API when ANTHROPIC_API_KEY is set in .env
 * Falls back to a warm, empathetic mock for local dev / testing.
 */

const SELLENA_SYSTEM_PROMPT = `You are Sellena, a warm and caring emotional support companion on the Sanlly platform. You are NOT a therapist or medical professional, and you should never diagnose conditions or provide medical advice.

Your communication style:
- Use active listening language ("I hear you", "That sounds really tough", "Thank you for sharing that with me")
- Ask ONE open-ended follow-up question to help users explore their feelings
- Keep responses conversational — 2-3 short paragraphs max, never essay-length
- Use simple, accessible language (many users may not be native English speakers)
- Be warm, non-judgmental, and validating
- Occasionally use gentle emoji (💚, 🌱) to feel approachable, not clinical
- Never use clinical jargon or medical terminology

CRISIS PROTOCOL — If the user mentions self-harm, suicide, wanting to end their life, or expresses severe hopelessness:
1. Respond with genuine warmth and care first
2. Share these crisis helpline numbers prominently:
   🆘 Vandrevala Foundation: 1860-2662-345 (available 24/7)
   🆘 iCall: 9152987821
   🆘 AASRA: 9820466726
3. Gently suggest connecting with a human therapist on the Sanlly platform
4. Do NOT try to counsel them through a crisis — always defer to professionals
5. Do NOT minimize their feelings or use empty reassurances

You should NEVER:
- Diagnose any mental health condition
- Prescribe or recommend any medication
- Claim to be a therapist, counselor, or doctor
- Make promises about outcomes
- Engage with harmful ideation in a way that normalizes it`;

// Mock responses — empathetic, varied, realistic
const MOCK_RESPONSES = [
  "Thank you for sharing that with me 💚. What you're feeling makes complete sense given what you're going through. Sometimes just putting words to our experience can help us understand it better.\n\nIt sounds like this has been weighing on you for a while. What do you think has been the hardest part of it all?",
  "I hear you, and I'm really glad you're talking about this 🌱. That kind of feeling can be exhausting to carry around, and you don't have to figure it all out at once.\n\nWhen you say that, I'm curious — has there been any moment recently, even a small one, where things felt a little lighter?",
  "That sounds genuinely difficult, and I want you to know your feelings are completely valid. There's no 'right' way to feel when you're going through something like this.\n\nCan you tell me a bit more about what's been going on? I'd love to understand your situation better.",
  "Thank you for trusting me with this 💚. It takes courage to open up, even to a compassionate ear.\n\nWhat you're describing sounds like it's been taking a real toll. How long have you been feeling this way?",
  "I really appreciate you sharing this with me. What you're going through sounds incredibly challenging, and your feelings are completely understandable.\n\nI'm here with you. What feels most pressing for you right now?",
  "That makes a lot of sense 🌱. Sometimes our minds and bodies carry stress in ways we don't even notice until it becomes too much.\n\nI'm wondering — do you have people in your life you feel you can lean on, or does this feel like something you've been navigating alone?",
];

// Detect crisis language
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'self-harm', 'self harm', 'hurt myself', 'cutting', 'no reason to live',
  'better off dead', 'can\'t go on', 'hopeless', 'worthless', 'give up on life',
];

function detectCrisis(text) {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
}

const CRISIS_RESPONSE = `I'm really glad you reached out, and I want you to know I hear you. What you're feeling right now sounds incredibly painful, and you deserve support.

Please know that help is available right now:
🆘 **Vandrevala Foundation**: 1860-2662-345 (24/7, free, confidential)
🆘 **iCall**: 9152987821
🆘 **AASRA**: 9820466726

These are real people who care and are trained to support you through exactly this. You don't have to face this alone 💚.

I'd also gently encourage you to connect with one of the human therapists on Sanlly — having a real person in your corner can make a meaningful difference. Would it be okay if I shared a little more about how that works?`;

/**
 * Get AI response — streams text to a callback function
 * @param {Array} messages - Array of {role, content} objects
 * @param {Function} onChunk - Called with each text chunk
 * @param {Function} onDone - Called when streaming is complete
 */
async function getAIResponse(messages, onChunk, onDone) {
  const lastUserMessage = messages[messages.length - 1]?.content || '';

  // Crisis detection always runs first, regardless of AI mode
  if (detectCrisis(lastUserMessage)) {
    await streamText(CRISIS_RESPONSE, onChunk, onDone);
    return;
  }

  // Use real Claude if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      await getClaudeResponse(messages, onChunk, onDone);
      return;
    } catch (err) {
      console.warn('[AI] Claude API error, falling back to mock:', err.message);
    }
  }

  // Fallback: mock response
  const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
  await streamText(response, onChunk, onDone);
}

/** Stream text character-by-character with realistic typing delay */
async function streamText(text, onChunk, onDone) {
  // Stream in word-sized chunks for a natural feel
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? '' : ' ') + words[i];
    onChunk(chunk);
    // Vary delay slightly for natural rhythm
    const delay = 30 + Math.random() * 40;
    await new Promise(r => setTimeout(r, delay));
  }
  onDone();
}

/** Real Claude API with streaming */
async function getClaudeResponse(messages, onChunk, onDone) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    system: SELLENA_SYSTEM_PROMPT,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      onChunk(chunk.delta.text);
    }
  }

  onDone();
}

module.exports = { getAIResponse, detectCrisis };
