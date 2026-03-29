# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 20 security findings from the audit to make AInime production-ready.

**Architecture:** Move Gemini API calls from client to server (new `/api/ai-search` endpoint), add helmet.js security headers, restrict CORS, add input validation with zod on all Express routes, sanitize env.example, run npm audit fix.

**Tech Stack:** Express.js, helmet, express-rate-limit, zod, Firebase Admin SDK, Prisma ORM

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `server/src/index.ts` | Modify | Add helmet, fix CORS, mount new ai-search route |
| `server/src/routes/aiSearch.ts` | Create | New endpoint proxying Gemini calls server-side |
| `server/src/routes/aiRecommendations.ts` | Modify | Move API key from URL query to header |
| `server/src/routes/animeList.ts` | Modify | Add zod input validation |
| `server/src/routes/tierLists.ts` | Modify | Add zod input validation |
| `server/src/routes/users.ts` | Modify | Add zod input validation |
| `server/package.json` | Modify | Add helmet dependency |
| `src/lib/aiSearch.ts` | Modify | Call `/api/ai-search` instead of Gemini directly |
| `src/pages/AISearch.tsx` | Verify | No changes needed if aiSearch.ts interface unchanged |
| `vite.config.ts` | Modify | Remove `/api-proxy/gemini` proxy |
| `.env` | Modify | Remove `VITE_GEMINI_API_KEY` line |
| `env.example` | Modify | Replace real credentials with placeholders |

---

### Task 1: Move Gemini API calls to server-side

**Files:**
- Create: `server/src/routes/aiSearch.ts`
- Modify: `server/src/index.ts` (mount route + add rate limit)
- Modify: `src/lib/aiSearch.ts` (call server endpoint instead)
- Modify: `vite.config.ts` (remove gemini proxy)
- Modify: `.env` (remove VITE_GEMINI_API_KEY)

- [ ] **Step 1: Create server/src/routes/aiSearch.ts**

This endpoint receives the AI search request from the frontend, adds the Gemini API key server-side, calls Gemini, and returns the response. The API key NEVER leaves the server.

```typescript
// server/src/routes/aiSearch.ts
import { Router, Request, Response } from "express";

const router = Router();

const SYSTEM_PROMPT = `You are an anime recommendation expert for AInime...`; // Copy full prompt from src/lib/aiSearch.ts

router.post("/", async (req: Request, res: Response) => {
  try {
    const { query, chatHistory, seedAnime } = req.body;

    if (!query && !seedAnime) {
      res.status(400).json({ error: "query or seedAnime is required" });
      return;
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      res.status(500).json({ error: "AI search not configured" });
      return;
    }

    // Build user message (same logic as client-side)
    let userMessage = query || '';
    if (seedAnime) {
      const seedGenres = seedAnime.genres?.join(', ') || '';
      const seedTags = seedAnime.tags?.join(', ') || '';
      userMessage = query
        ? `Cari anime mirip "${seedAnime.title}" (Genres: ${seedGenres}${seedTags ? `, Tags: ${seedTags}` : ''}). ${query}`
        : `Cari anime mirip "${seedAnime.title}" (Genres: ${seedGenres}${seedTags ? `, Tags: ${seedTags}` : ''}). Rekomendasikan anime dengan vibe serupa.`;
    }

    // Build Gemini contents
    const contents: { role: string; parts: { text: string }[] }[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory.slice(-6)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      }
    );

    if (!geminiRes.ok) {
      res.status(geminiRes.status).json({ error: `Gemini API error: ${geminiRes.status}` });
      return;
    }

    const data = await geminiRes.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]));
      } else {
        res.status(500).json({ error: 'Failed to parse AI response' });
      }
    }
  } catch (err) {
    res.status(500).json({ error: 'AI search failed' });
  }
});

export default router;
```

- [ ] **Step 2: Mount route in server/src/index.ts with rate limit**

Add after existing imports:
```typescript
import aiSearchRouter from "./routes/aiSearch.js";
```

Add rate limiter (10 req/min, same as ai-recommendations):
```typescript
app.use('/api/ai-search', aiLimiter);
app.use("/api/ai-search", aiSearchRouter);
```

- [ ] **Step 3: Modify src/lib/aiSearch.ts to call server endpoint**

Replace the entire `localAISearch` function body — remove `GEMINI_API_KEY` import, remove direct Gemini fetch. Instead call `/api/ai-search`:

```typescript
// Remove: const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
// Remove: client-side rate limiting (server handles it now)

export async function localAISearch(
  query: string,
  chatHistory?: ChatMessage[],
  seedAnime?: { title: string; genres?: string[]; tags?: string[] }
): Promise<AISearchResponse> {
  const res = await fetch('/api/ai-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, chatHistory, seedAnime }),
  });

  if (!res.ok) {
    throw new Error(`AI search error: ${res.status}`);
  }

  return res.json();
}
```

Keep the SYSTEM_PROMPT, AISearchResponse interface, and ChatMessage interface in the file but remove everything related to direct Gemini calls.

- [ ] **Step 4: Remove gemini proxy from vite.config.ts**

Delete these lines from the proxy config:
```typescript
'/api-proxy/gemini': {
  target: 'https://generativelanguage.googleapis.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api-proxy\/gemini/, ''),
  secure: false,
},
```

- [ ] **Step 5: Remove VITE_GEMINI_API_KEY from .env**

Remove the line:
```
VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
```

Keep only `GEMINI_API_KEY` (without VITE_ prefix, server-only).

- [ ] **Step 6: Test AI Search still works**

Start both servers:
```bash
cd server && npm run dev &
cd .. && npm run dev
```

Navigate to `http://localhost:3232/ai`, type a search query, verify:
- Results appear from Gemini
- No API key visible in browser Network tab
- `/api/ai-search` endpoint is called (not `/api-proxy/gemini`)

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/aiSearch.ts server/src/index.ts src/lib/aiSearch.ts vite.config.ts .env
git commit -m "security: move Gemini API key to server-side, remove client exposure"
```

---

### Task 2: Add helmet.js security headers

**Files:**
- Modify: `server/package.json` (add helmet)
- Modify: `server/src/index.ts` (use helmet)

- [ ] **Step 1: Install helmet**

```bash
cd server && npm install helmet
```

- [ ] **Step 2: Add helmet to server/src/index.ts**

Add import:
```typescript
import helmet from "helmet";
```

Add after `app.use(express.json(...))`:
```typescript
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for SPA with inline styles
  crossOriginEmbedderPolicy: false, // Allow external images (Kitsu CDN)
}));
```

- [ ] **Step 3: Test server starts without errors**

```bash
cd server && npm run dev
```

Verify health check: `curl http://localhost:3001/api/health`
Expected: `{"status":"ok","timestamp":"..."}`

Check response headers include: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, etc.

- [ ] **Step 4: Commit**

```bash
git add server/package.json server/src/index.ts
git commit -m "security: add helmet.js security headers"
```

---

### Task 3: Fix CORS configuration

**Files:**
- Modify: `server/src/index.ts`

- [ ] **Step 1: Replace wildcard CORS with explicit origins**

```typescript
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3232')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

- [ ] **Step 2: Add CORS_ORIGIN to server/.env.example**

```
CORS_ORIGIN=http://localhost:3232
```

- [ ] **Step 3: Test frontend can still reach API**

Navigate to `http://localhost:3232`, verify anime data loads. Check browser console for CORS errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/index.ts server/.env.example
git commit -m "security: restrict CORS to explicit allowed origins"
```

---

### Task 4: Add input validation with zod on all Express routes

**Files:**
- Modify: `server/src/routes/animeList.ts`
- Modify: `server/src/routes/tierLists.ts`
- Modify: `server/src/routes/users.ts`

- [ ] **Step 1: Install zod in server**

```bash
cd server && npm install zod
```

- [ ] **Step 2: Add validation to animeList.ts**

At the top:
```typescript
import { z } from "zod";

const upsertSchema = z.object({
  animeId: z.number().int().positive(),
  status: z.enum(["SAVED", "LOVED", "WATCHING", "WATCHED", "DROPPED"]),
  rating: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(2000).optional(),
});

const progressSchema = z.object({
  lastEpisodeWatched: z.number().int().min(0).max(10000),
});
```

Replace manual validation in PUT handler with:
```typescript
const parsed = upsertSchema.safeParse(req.body);
if (!parsed.success) {
  res.status(400).json({ error: parsed.error.issues[0].message });
  return;
}
const { animeId, status, rating, notes } = parsed.data;
```

Replace manual validation in PATCH handler with:
```typescript
const parsed = progressSchema.safeParse(req.body);
if (!parsed.success) {
  res.status(400).json({ error: parsed.error.issues[0].message });
  return;
}
```

- [ ] **Step 3: Add validation to tierLists.ts**

```typescript
import { z } from "zod";

const createTierListSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(["public", "friends_only", "private"]).default("public"),
  items: z.array(z.object({
    animeId: z.number().int().positive(),
    animeTitle: z.string().max(255),
    animeCoverImage: z.string().url().max(500).optional(),
    tier: z.enum(["S", "A", "B", "C", "D", "F"]),
    position: z.number().int().min(0).default(0),
  })).max(100).optional(),
});
```

Apply to POST and PUT handlers.

- [ ] **Step 4: Add validation to users.ts**

```typescript
import { z } from "zod";

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  profileVisibility: z.enum(["public", "friends_only", "private"]).optional(),
  listVisibility: z.enum(["public", "friends_only", "private"]).optional(),
  activityVisibility: z.enum(["public", "friends_only", "private"]).optional(),
  showStatsPublicly: z.boolean().optional(),
  searchable: z.boolean().optional(),
});
```

- [ ] **Step 5: Test each endpoint accepts valid input and rejects invalid**

Test valid:
```bash
curl -X PUT http://localhost:3001/api/anime-list \
  -H "Content-Type: application/json" \
  -d '{"animeId": 1, "status": "SAVED"}'
```
Expected: 401 (no auth) — correct behavior

Test invalid (too long notes):
```bash
curl -X PUT http://localhost:3001/api/anime-list \
  -H "Content-Type: application/json" \
  -d '{"animeId": 1, "status": "SAVED", "notes": "'$(python3 -c "print('x'*3000)"))'"}'
```
Expected: 400 with validation error

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/animeList.ts server/src/routes/tierLists.ts server/src/routes/users.ts server/package.json
git commit -m "security: add zod input validation on all Express routes"
```

---

### Task 5: Sanitize env.example and clean up console logs

**Files:**
- Modify: `env.example`
- Modify: `server/src/routes/aiRecommendations.ts` (remove userId logging)

- [ ] **Step 1: Replace real credentials in env.example**

```
# Express API
VITE_API_URL=/api
VITE_USE_LOCAL_ONLY=true

# Google AI Studio API Key (server-side only)
GEMINI_API_KEY="your_gemini_api_key_here"
```

Remove ALL Supabase lines (no longer used).

- [ ] **Step 2: Remove userId logging from aiRecommendations.ts**

Find and remove/comment:
```typescript
console.log("AI Recommendations request:", { listSize: userList.length, userId: req.user?.uid });
```

Replace with:
```typescript
// No sensitive data logging in production
```

- [ ] **Step 3: Commit**

```bash
git add env.example server/src/routes/aiRecommendations.ts
git commit -m "security: sanitize env.example, remove sensitive console logging"
```

---

### Task 6: Run npm audit fix and update dependencies

**Files:**
- Modify: `package.json` (root)
- Modify: `server/package.json`

- [ ] **Step 1: Run audit fix on root**

```bash
npm audit fix
```

Note any unfixable vulnerabilities.

- [ ] **Step 2: Run audit fix on server**

```bash
cd server && npm audit fix
```

- [ ] **Step 3: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json server/package.json server/package-lock.json
git commit -m "security: npm audit fix — patch dependency vulnerabilities"
```

---

### Task 7: Full E2E regression test

**Files:** None (testing only)

- [ ] **Step 1: Start server and dev**

```bash
cd server && GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE" npm run dev &
cd .. && npm run dev
```

- [ ] **Step 2: Test Homepage via Playwright**

Navigate to `http://localhost:3232`. Verify:
- Images load (Kitsu CDN)
- Trending carousel shows anime
- Search works
- No console errors

- [ ] **Step 3: Test AI Search via Playwright**

Navigate to `http://localhost:3232/ai`. Click suggestion pill. Verify:
- AI responds with results
- Results appear in Curated Results sidebar
- Network tab shows `/api/ai-search` (NOT `/api-proxy/gemini`)
- No API key visible in any request

- [ ] **Step 4: Test Auth flow**

Navigate to `http://localhost:3232/auth`. Sign up, verify redirect to homepage.

- [ ] **Step 5: Test Anime Detail + Add to List**

Navigate to `/anime/1`. Verify:
- Image loads, title shows
- "Add to List" dropdown appears ABOVE card (portal positioning)
- Click a status — toast notification appears

- [ ] **Step 6: Test My List**

Navigate to `/my-list`. Verify:
- Saved anime appears
- Status tabs filter correctly
- "Mark Next Episode" works

- [ ] **Step 7: Test Calendar**

Navigate to `/calendar`. Verify:
- Day sections appear (Sun-Sat)
- Anime cards with broadcast times

- [ ] **Step 8: Test all footer pages**

Navigate to `/about`, `/privacy`, `/terms`. Verify pages render with 0 errors.

- [ ] **Step 9: Verify security headers**

```bash
curl -I http://localhost:3001/api/health
```

Verify presence of:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (if HTTPS)

- [ ] **Step 10: Final commit and push**

```bash
git push origin master
```

---

## Post-Deployment Checklist

After all tasks are complete:

1. Rotate the Gemini API key (create new one in Google AI Studio, delete old)
2. Set `CORS_ORIGIN` to production domain in server `.env`
3. Set `NODE_ENV=production` on VPS
4. Verify Firebase authorized domains include production domain
5. Run `npm audit` monthly
6. Enable GitHub Dependabot for automated vulnerability alerts
