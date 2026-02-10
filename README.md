# Chitkara Qualifier 1 – BFHL API

**Date:** 10 Feb 2026 | **Time:** 120 min

REST APIs for Chitkara Qualifier 1: **POST /bfhl** and **GET /health**, implemented in **Node.js** with Express.

---

## APIs

| Method | Path     | Description                    |
|--------|----------|--------------------------------|
| GET    | /health  | Health check                   |
| POST   | /bfhl    | fibonacci, prime, lcm, hcf, AI |

### GET /health

**Response (200):**
```json
{
  "is_success": true,
  "official_email": "YOUR_CHITKARA_EMAIL"
}
```

### POST /bfhl

Exactly **one** of these keys per request:

| Key         | Input           | Output              |
|------------|-----------------|---------------------|
| fibonacci  | Integer         | Fibonacci series    |
| prime      | Integer array   | Prime numbers       |
| lcm        | Integer array   | LCM value           |
| hcf        | Integer array   | HCF value           |
| AI         | Question string | Single-word answer  |

**Success response (200):**
```json
{
  "is_success": true,
  "official_email": "YOUR_CHITKARA_EMAIL",
  "data": ...
}
```

**Error response:** Appropriate HTTP status (4xx/5xx) and `is_success: false`.

---

## Setup

1. **Clone and install**
   ```bash
   cd Bajaj
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set `OFFICIAL_EMAIL` to your Chitkara email
   - Set `GEMINI_API_KEY` (for AI key): get from [Google AI Studio](https://aistudio.google.com) → Get API Key

3. **Run**
   ```bash
   npm start
   ```
   Server: `http://localhost:3000`

---

## Examples

**Fibonacci**
```bash
curl -X POST http://localhost:3000/bfhl -H "Content-Type: application/json" -d "{\"fibonacci\": 7}"
# → {"is_success":true,"official_email":"...","data":[0,1,1,2,3,5,8]}
```

**Prime**
```bash
curl -X POST http://localhost:3000/bfhl -H "Content-Type: application/json" -d "{\"prime\": [2,4,7,9,11]}"
# → {"is_success":true,"official_email":"...","data":[2,7,11]}
```

**LCM**
```bash
curl -X POST http://localhost:3000/bfhl -H "Content-Type: application/json" -d "{\"lcm\": [12,18,24]}"
# → {"is_success":true,"official_email":"...","data":72}
```

**HCF**
```bash
curl -X POST http://localhost:3000/bfhl -H "Content-Type: application/json" -d "{\"hcf\": [24,36,60]}"
# → {"is_success":true,"official_email":"...","data":12}
```

**AI**
```bash
curl -X POST http://localhost:3000/bfhl -H "Content-Type: application/json" -d "{\"AI\": \"What is the capital city of Maharashtra?\"}"
# → {"is_success":true,"official_email":"...","data":"Mumbai"}
```

---

## Deployment

### Vercel

1. Push repo to GitHub (public).
2. [Vercel](https://vercel.com) → Login → New Project → Import repository.
3. Root directory: project root. Framework: Other. Build: leave default.
4. Environment variables: `OFFICIAL_EMAIL`, `GEMINI_API_KEY`.
5. Deploy. Use the generated URL (e.g. `https://your-app.vercel.app`).

### Railway

1. [Railway](https://railway.app) → New Project → Deploy from GitHub.
2. Select this repository.
3. Add variables: `OFFICIAL_EMAIL`, `GEMINI_API_KEY`.
4. Deploy and copy the public URL.

### Render

1. [Render](https://render.com) → New → Web Service → Connect repository.
2. Runtime: Node. Build: `npm install`. Start: `npm start`.
3. Add env: `OFFICIAL_EMAIL`, `GEMINI_API_KEY`.
4. Deploy and copy the URL.

### Local testing (ngrok)

```bash
ngrok http 3000
```

Use the ngrok URL; keep the local server running. URLs change when ngrok restarts.

---

## Checklist (from PDF)

- [x] Strict API response structure (`is_success`, `official_email`, `data` / `error`)
- [x] Correct HTTP status codes (200, 400, 404, 500, 503)
- [x] Robust input validation (exactly one key, types, limits)
- [x] Graceful error handling (no crashes, JSON error responses)
- [x] Security: CORS, body size limit, input limits
- [x] Public accessibility (CORS enabled)
- [x] POST /bfhl: fibonacci, prime, lcm, hcf, AI
- [x] GET /health
- [x] AI integration (Google Gemini)
- [x] Full source in repo; deployable to Vercel / Railway / Render

---

## Tech

- **Node.js** + **Express**
- **@google/generative-ai** (Gemini) for AI key
- **cors**, **dotenv**, **serverless-http** (Vercel)

Share the **GitHub repo URL** and **deployed API base URL** for evaluation.
