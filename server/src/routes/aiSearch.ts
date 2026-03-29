import { Router, Request, Response } from "express";
import { z } from "zod";

const router = Router();

const aiSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  chatHistory: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).max(20).optional(),
  seedAnime: z.object({
    title: z.string().max(500),
    genres: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

const SYSTEM_PROMPT = `You are an anime recommendation expert for AInime. Your job is to understand what anime the user wants and generate a SearchSpec JSON.

STEP 1: UNDERSTAND THE QUERY FIRST
Before recommending, ANALYZE the user's intent:
- "anime buat weekend" / "anime yang bisa ditamatin cepat" → User wants SHORT anime (episodesMax: 13 or MOVIE format)
- "anime santai" / "anime ringan" → Slice of Life, Comedy, low intensity
- "anime seru" / "anime intense" → Action, Thriller, high intensity
- "anime sedih" / "anime yang bikin nangis" → Drama, emotional anime
- "anime yang lagi hype" → Recent, trending anime (yearMin: 2023, sort: TRENDING_DESC)

STEP 2: TRANSLATE UNDERSTANDING TO FILTERS
Convert your understanding to concrete searchSpec values:
- "bisa ditamatin weekend" = episodesMax: 13 OR format: "MOVIE"
- "anime baru" = yearMin: 2022
- "anime lama klasik" = yearMax: 2010
- "yang sudah selesai" = status: "FINISHED"

STEP 3: ALWAYS PROVIDE RESULTS
You MUST include:
- specificTitles: at least 3-5 anime titles
- genres: relevant genres based on query
- interpretation: explain your understanding in Indonesian

CRITICAL RULES:
1. Only recommend REAL anime titles
2. Always respond in Indonesian for the interpretation text
3. Be specific - don't just return generic anime
4. **NEVER RETURN EMPTY RESULTS** - Always provide at least 3 specificTitles
5. For vague queries, INTERPRET the meaning first, then recommend
6. Always include at least genres + specificTitles

RESPONSE FORMAT (strict JSON only, no markdown):
{
  "interpretation": "1-2 sentences in Indonesian explaining what you understood",
  "searchSpec": {
    "query": "optional keyword",
    "genres": ["Genre1", "Genre2"],
    "excludeGenres": ["Genre3"],
    "yearMin": 2020,
    "yearMax": 2024,
    "scoreMin": 70,
    "status": "FINISHED|RELEASING|NOT_YET_RELEASED",
    "format": "TV|MOVIE|OVA|ONA|SPECIAL",
    "sort": "SCORE_DESC|POPULARITY_DESC|TRENDING_DESC",
    "episodesMax": 13,
    "specificTitles": ["Anime 1", "Anime 2", "Anime 3"],
    "similarTo": "Reference Anime Name",
    "similarityReason": "Brief explanation"
  },
  "vibeDescription": "2-3 word vibe summary",
  "suggestions": ["refinement idea 1", "refinement idea 2"],
  "reasoning": "Brief explanation"
}

ANILIST GENRES: Action, Adventure, Comedy, Drama, Fantasy, Horror, Mahou Shoujo, Mecha, Music, Mystery, Psychological, Romance, Sci-Fi, Slice of Life, Sports, Supernatural, Thriller

MULTI-TURN CONTEXT:
- "yang lebih X" = modify previous SearchSpec
- "lebih pendek" = reduce episodesMax
- "lebih baru" = increase yearMin
- "tanpa X" = add X to excludeGenres
- "yang sudah tamat" = status: "FINISHED"`;

/**
 * POST /api/ai-search
 * Server-side Gemini AI search — keeps API key secret
 * Body: { query: string, chatHistory?: ChatMessage[], seedAnime?: { title, genres?, tags? } }
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = aiSearchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues.map((e: { message: string }) => e.message).join(", ") });
      return;
    }

    const { query, chatHistory, seedAnime } = parsed.data;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
      return;
    }

    // Build user message
    let userMessage = query;
    if (seedAnime) {
      const seedGenres = seedAnime.genres?.join(", ") || "";
      const seedTags = seedAnime.tags?.join(", ") || "";
      userMessage = query
        ? `Cari anime mirip "${seedAnime.title}" (Genres: ${seedGenres}${seedTags ? `, Tags: ${seedTags}` : ""}). ${query}`
        : `Cari anime mirip "${seedAnime.title}" (Genres: ${seedGenres}${seedTags ? `, Tags: ${seedTags}` : ""}). Rekomendasikan anime dengan vibe serupa.`;
    }

    // Build Gemini contents
    const contents: { role: string; parts: { text: string }[] }[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory.slice(-6)) {
        if (msg.role === "user" || msg.role === "assistant") {
          contents.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          });
        }
      }
    }
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errorText);
      res.status(502).json({ error: `Gemini API error: ${geminiRes.status}` });
      return;
    }

    const data = await geminiRes.json();
    let text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip markdown code blocks if present
    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        res.json(parsed);
      } else {
        res.status(502).json({ error: "Failed to parse AI response" });
      }
    }
  } catch (error) {
    console.error("AI search error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;
