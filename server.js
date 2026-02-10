/**
 * Chitkara Qualifier 1 - BFHL API
 * POST /bfhl | GET /health
 * Node.js + Express
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;
const OFFICIAL_EMAIL = process.env.OFFICIAL_EMAIL || 'bharam0226.be23@chitkara.edu.in';

// Middleware: JSON body, CORS for public accessibility
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// --- Helpers: Fibonacci ---
function fibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const out = [0, 1];
  for (let i = 2; i < n; i++) out.push(out[i - 1] + out[i - 2]);
  return out;
}

// --- Helpers: Prime ---
function isPrime(num) {
  if (num < 2 || !Number.isInteger(num)) return false;
  for (let i = 2; i * i <= num; i++) if (num % i === 0) return false;
  return true;
}

function primesFromArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((n) => Number.isInteger(n) && n >= 0 && isPrime(n));
}

// --- Helpers: GCD / HCF ---
function gcd(a, b) {
  a = Math.abs(Math.floor(a));
  b = Math.abs(Math.floor(b));
  while (b) [a, b] = [b, a % b];
  return a;
}

function hcfOfArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const nums = arr.map((n) => Math.abs(Math.floor(Number(n)))).filter((n) => !isNaN(n) && n >= 0);
  if (nums.length === 0) return null;
  let result = nums[0];
  for (let i = 1; i < nums.length; i++) result = gcd(result, nums[i]);
  return result;
}

// --- Helpers: LCM ---
function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs(Math.floor(a) * Math.floor(b)) / gcd(a, b);
}

function lcmOfArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const nums = arr.map((n) => Math.abs(Math.floor(Number(n)))).filter((n) => !isNaN(n) && n >= 0);
  if (nums.length === 0) return null;
  let result = nums[0];
  for (let i = 1; i < nums.length; i++) result = lcm(result, nums[i]);
  return result;
}

// --- AI: Single-word answer (OpenRouter or Gemini) ---
async function getSingleWordAIAnswer(question) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const prompt = `Answer the following question with exactly ONE word only. No explanation. Question: ${question}`;

  // Prefer OpenRouter if key is set (e.g. sk-or-v1-...)
  if (openRouterKey && openRouterKey.trim()) {
    // Common mistake: pasting a Google API key (starts with "AIza") into OPENROUTER_API_KEY.
    if (openRouterKey.trim().startsWith('AIza')) {
      throw new Error('OPENROUTER_API_KEY appears to be a Google API key (starts with "AIza"). Move that key into GEMINI_API_KEY and set OPENROUTER_API_KEY to your OpenRouter key (starts with "sk-or-") if you have one.');
    }
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `OpenRouter ${res.status}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('No AI response');
    const singleWord = text.split(/\s+/)[0] || text;
    return singleWord.replace(/[^\w-]/g, '');
  }

  if (geminiKey && geminiKey.trim()) {
    // Ensure the provided API key can access a supported model.
    // If the configured model name is invalid for this API version you'll get a 404 (seen previously).
    // Query the Generative Language models endpoint to find available models for this key.
    const key = geminiKey.trim();
    let availableModels = [];
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
      const listJson = await listRes.json();
      availableModels = Array.isArray(listJson.models) ? listJson.models.map((m) => m.name).filter(Boolean) : [];
    } catch (e) {
      // ignore - we'll surface a helpful error below if listing fails
    }

    // Prefer common Gemini model names if available, otherwise pick the first model returned.
    const preferred = ['models/gemini-1.5-flash', 'models/gemini-1.5', 'models/gemini-1.0', 'models/text-bison-001'];
    const chosen = availableModels.find((m) => preferred.includes(m)) || availableModels[0];

    if (!chosen) {
      const names = availableModels.length ? availableModels.join(', ') : 'none (model list failed or key lacks permissions)';
      throw new Error(`[GoogleGenerativeAI Error]: models/gemini-1.5-flash is not available for this key. Available models: ${names}`);
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: chosen });
    const result = await model.generateContent(prompt);
    const response = result.response;
    if (!response || !response.text) throw new Error('No AI response');
    const text = response.text().trim();
    const singleWord = text.split(/\s+/)[0] || text;
    return singleWord.replace(/[^\w-]/g, '');
  }

  throw new Error('Set OPENROUTER_API_KEY or GEMINI_API_KEY in .env');
}

// --- GET /health ---
app.get('/health', (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL,
  });
});

// --- POST /bfhl ---
app.post('/bfhl', async (req, res) => {
  try {
    const body = req.body || {};
    const keys = Object.keys(body).filter((k) => body[k] !== undefined && body[k] !== '');

    // Exactly one functional key allowed
    const allowed = ['fibonacci', 'prime', 'lcm', 'hcf', 'AI'];
    const present = keys.filter((k) => allowed.includes(k));
    if (present.length !== 1) {
      return res.status(400).json({
        is_success: false,
        official_email: OFFICIAL_EMAIL,
        error: 'Request must contain exactly one of: fibonacci, prime, lcm, hcf, AI',
      });
    }

    const key = present[0];
    let data;

    if (key === 'fibonacci') {
      const val = body.fibonacci;
      const n = typeof val === 'number' ? Math.floor(val) : parseInt(val, 10);
      if (isNaN(n) || n < 0 || n > 1000) {
        return res.status(400).json({
          is_success: false,
          official_email: OFFICIAL_EMAIL,
          error: 'fibonacci must be a non-negative integer (max 1000)',
        });
      }
      data = fibonacci(n);
    } else if (key === 'prime') {
      const val = body.prime;
      if (!Array.isArray(val)) {
        return res.status(400).json({
          is_success: false,
          official_email: OFFICIAL_EMAIL,
          error: 'prime must be an array of integers',
        });
      }
      const nums = val
        .map((x) => (typeof x === 'number' ? Math.floor(x) : parseInt(String(x), 10)))
        .filter((n) => !isNaN(n));
      if (nums.length > 100) {
        return res.status(400).json({
          is_success: false,
          official_email: OFFICIAL_EMAIL,
          error: 'prime array too large (max 100)',
        });
      }
      data = primesFromArray(nums);
    } else if (key === 'lcm') {
      const val = body.lcm;
      if (!Array.isArray(val) || val.length === 0) {
        return res.status(400).json({
          is_success: false,
          official_email: OFFICIAL_EMAIL,
          error: 'lcm must be a non-empty array of integers',
        });
      }
      const lcmVal = lcmOfArray(val);
      if (lcmVal === null) {
        return res.status(400).json({
          is_success: false,
          official_email: OFFICIAL_EMAIL,
          error: 'lcm array must contain valid integers',
        });
      }
      data = lcmVal;
    } else if (key === 'hcf') {
      const val = body.hcf;
      if (!Array.isArray(val) || val.length === 0) {
        return res.status(400).json({
          is_success: false,
          official_email: OFFICIAL_EMAIL,
          error: 'hcf must be a non-empty array of integers',
        });
      }
      const hcfVal = hcfOfArray(val);
      if (hcfVal === null) {
        return res.status(400).json({
          is_success: false,
          official_email: OFFICIAL_EMAIL,
          error: 'hcf array must contain valid integers',
        });
      }
      data = hcfVal;
    } else if (key === 'AI') {
      const question = body.AI;
      if (typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({
          is_success: false,
          official_email: OFFICIAL_EMAIL,
          error: 'AI must be a non-empty string (question)',
        });
      }
      if (question.length > 500) {
        return res.status(400).json({
          is_success: false,
          official_email: OFFICIAL_EMAIL,
          error: 'AI question too long',
        });
      }
      try {
        data = await getSingleWordAIAnswer(question.trim());
      } catch (aiErr) {
        const msg = aiErr && aiErr.message ? String(aiErr.message) : 'Unknown AI error';
        return res.status(503).json({
          is_success: false,
          official_email: OFFICIAL_EMAIL,
          error: `AI service unavailable: ${msg}. Check OPENROUTER_API_KEY or GEMINI_API_KEY.`,
        });
      }
    }

    return res.status(200).json({
      is_success: true,
      official_email: OFFICIAL_EMAIL,
      data,
    });
  } catch (err) {
    console.error('POST /bfhl error:', err);
    res.status(500).json({
      is_success: false,
      official_email: OFFICIAL_EMAIL,
      error: 'Internal server error',
    });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({
    is_success: false,
    official_email: OFFICIAL_EMAIL,
    error: 'Not found',
  });
});

// Start server only when not running on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`BFHL API running on http://localhost:${PORT}`);
    console.log('GET /health | POST /bfhl');
  });
}

module.exports = app;
