import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

interface UserAnimeEntry {
  animeId: number;
  title: string;
  genres: string[];
  rating?: number;
  status: "SAVED" | "LOVED" | "WATCHING" | "WATCHED" | "DROPPED";
  score?: number;
  episodes?: number;
  format?: string;
}

interface RecommendationResult {
  recommendations: {
    title: string;
    reason: string;
    matchScore: number;
    genres: string[];
  }[];
  analysis: {
    topGenres: string[];
    preferredFormats: string[];
    averageRating: number;
    watchingPatterns: string;
    moodProfile: string;
  };
  personalizedMessage: string;
}

const SYSTEM_PROMPT = `You are an expert anime recommendation AI for AInime. Your job is to analyze a user's anime watch history, ratings, and preferences to generate highly personalized recommendations.

ANALYSIS GUIDELINES:
1. Identify patterns in the user's watched/loved anime:
   - Preferred genres (what they watch most)
   - Rating patterns (what they rate highly)
   - Completion patterns (do they finish series?)
   - Format preferences (TV series, movies, short anime)

2. Consider emotional and thematic preferences:
   - Action-heavy vs. character-driven
   - Dark/mature vs. lighthearted
   - Fantasy vs. slice-of-life
   - Romance importance

3. Generate recommendations that:
   - Match their demonstrated preferences
   - Introduce variety they might enjoy
   - Avoid genres they've dropped or rated poorly
   - Include both popular and hidden gems

RESPONSE FORMAT (strict JSON only, no markdown):
{
  "recommendations": [
    {
      "title": "Anime Title",
      "reason": "Why this matches their taste (2-3 sentences)",
      "matchScore": 95,
      "genres": ["Genre1", "Genre2"]
    }
  ],
  "analysis": {
    "topGenres": ["Genre1", "Genre2", "Genre3"],
    "preferredFormats": ["TV", "Movie"],
    "averageRating": 8.2,
    "watchingPatterns": "Brief description of their watching habits",
    "moodProfile": "Brief mood preference (e.g., 'Prefers intense action with emotional depth')"
  },
  "personalizedMessage": "A friendly 2-3 sentence message in Indonesian about their anime taste and the recommendations"
}

RULES:
1. Only recommend REAL anime - use your knowledge to verify titles exist
2. Provide 5-8 recommendations
3. Each recommendation must have a unique, specific reason
4. Match scores should be 70-100 based on how well it fits
5. Personalized message MUST be in Indonesian
6. Avoid recommending anime already in their list
7. Consider both their highly-rated and loved anime as strong preference indicators`;

/**
 * POST /api/ai-recommendations
 * Generate AI-powered anime recommendations based on user's watch list
 * Body: { userList: UserAnimeEntry[] }
 */
router.post("/", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userList } = req.body;

    if (!userList || !Array.isArray(userList) || userList.length === 0) {
      res.status(400).json({ error: "User list is required and must not be empty" });
      return;
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      // Return fallback recommendations if no API key
      res.json(generateFallbackRecommendations(userList));
      return;
    }

    // Build user profile for the AI
    const userProfile = buildUserProfile(userList);
    const userMessage = `Analyze this user's anime list and provide personalized recommendations:

USER ANIME LIST:
${userProfile}

Based on their watch history, ratings, and preferences, recommend anime they would love. Remember to respond in the exact JSON format specified.`;

    console.log("AI Recommendations request:", {
      listSize: userList.length,
    });

    let aiContent: string | null = null;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 3000,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const geminiData = await response.json();
      aiContent =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text || null;

      if (!aiContent) {
        throw new Error("No content from Gemini");
      }
    } catch (geminiError) {
      console.error(
        "Gemini failed:",
        geminiError instanceof Error ? geminiError.message : geminiError
      );
      // Fall through to fallback
    }

    if (!aiContent) {
      res.json(generateFallbackRecommendations(userList));
      return;
    }

    // Parse JSON from AI response
    let parsedResponse: RecommendationResult;
    try {
      let jsonStr = aiContent;
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.replace(/```\n?/g, "");
      }
      jsonStr = jsonStr.trim();

      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      res.json(generateFallbackRecommendations(userList));
      return;
    }

    // Validate and normalize response
    const normalizedResponse = normalizeRecommendations(
      parsedResponse,
      userList
    );

    console.log("AI Recommendations success:", {
      recommendationCount: normalizedResponse.recommendations.length,
      topGenres: normalizedResponse.analysis.topGenres,
    });

    res.json(normalizedResponse);
  } catch (error) {
    console.error("AI Recommendations error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

function buildUserProfile(userList: UserAnimeEntry[]): string {
  const sections: string[] = [];

  // Loved anime (highest priority)
  const loved = userList.filter((e) => e.status === "LOVED");
  if (loved.length > 0) {
    sections.push(
      `LOVED ANIME (Favorites):\n${loved
        .map(
          (a) =>
            `- ${a.title} [${a.genres.join(", ")}]${a.rating ? ` Rating: ${a.rating}/10` : ""}`
        )
        .join("\n")}`
    );
  }

  // Watched with ratings
  const watched = userList.filter((e) => e.status === "WATCHED");
  if (watched.length > 0) {
    sections.push(
      `COMPLETED ANIME:\n${watched
        .map(
          (a) =>
            `- ${a.title} [${a.genres.join(", ")}]${a.rating ? ` Rating: ${a.rating}/10` : ""}`
        )
        .join("\n")}`
    );
  }

  // Currently watching
  const watching = userList.filter((e) => e.status === "WATCHING");
  if (watching.length > 0) {
    sections.push(
      `CURRENTLY WATCHING:\n${watching
        .map((a) => `- ${a.title} [${a.genres.join(", ")}]`)
        .join("\n")}`
    );
  }

  // Saved (interested in)
  const saved = userList.filter((e) => e.status === "SAVED");
  if (saved.length > 0) {
    sections.push(
      `SAVED FOR LATER:\n${saved
        .map((a) => `- ${a.title} [${a.genres.join(", ")}]`)
        .join("\n")}`
    );
  }

  // Dropped (negative signal)
  const dropped = userList.filter((e) => e.status === "DROPPED");
  if (dropped.length > 0) {
    sections.push(
      `DROPPED (didn't enjoy):\n${dropped
        .map((a) => `- ${a.title} [${a.genres.join(", ")}]`)
        .join("\n")}`
    );
  }

  // Genre statistics
  const genreCounts: Record<string, number> = {};
  userList.forEach((entry) => {
    entry.genres.forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([g, c]) => `${g} (${c})`);

  sections.push(`TOP GENRES: ${topGenres.join(", ")}`);

  return sections.join("\n\n");
}

function generateFallbackRecommendations(
  userList: UserAnimeEntry[]
): RecommendationResult {
  const genreCounts: Record<string, number> = {};
  userList.forEach((entry) => {
    entry.genres.forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);

  const topGenre = topGenres[0] || "Action";

  const genreRecommendations: Record<
    string,
    { title: string; genres: string[]; reason: string }[]
  > = {
    Action: [
      {
        title: "Jujutsu Kaisen",
        genres: ["Action", "Supernatural"],
        reason:
          "Intense battles with compelling characters and dark themes that action fans love.",
      },
      {
        title: "Demon Slayer",
        genres: ["Action", "Supernatural"],
        reason:
          "Beautiful animation and emotional storytelling wrapped in thrilling action sequences.",
      },
      {
        title: "Chainsaw Man",
        genres: ["Action", "Horror"],
        reason:
          "Unique premise with brutal action and surprisingly deep character moments.",
      },
      {
        title: "Mob Psycho 100",
        genres: ["Action", "Comedy"],
        reason:
          "Perfectly balances intense psychic battles with heartfelt character growth.",
      },
      {
        title: "Vinland Saga",
        genres: ["Action", "Drama"],
        reason:
          "Epic Viking saga with stunning fight choreography and profound themes.",
      },
    ],
    Romance: [
      {
        title: "Your Name",
        genres: ["Romance", "Drama"],
        reason:
          "Masterfully crafted romance with beautiful visuals and emotional depth.",
      },
      {
        title: "Horimiya",
        genres: ["Romance", "Slice of Life"],
        reason: "Refreshingly natural romance without unnecessary drama.",
      },
      {
        title: "Toradora!",
        genres: ["Romance", "Comedy"],
        reason:
          "Classic romcom with excellent character development and satisfying payoff.",
      },
      {
        title: "Kaguya-sama: Love Is War",
        genres: ["Romance", "Comedy"],
        reason: "Hilarious mind games that evolve into genuine romance.",
      },
      {
        title: "Fruits Basket",
        genres: ["Romance", "Drama"],
        reason: "Emotionally rich story about healing and finding love.",
      },
    ],
    Fantasy: [
      {
        title: "Frieren: Beyond Journey's End",
        genres: ["Fantasy", "Adventure"],
        reason:
          "Beautifully contemplative fantasy about time, memories, and connections.",
      },
      {
        title: "Mushoku Tensei",
        genres: ["Fantasy", "Adventure"],
        reason:
          "Immersive world-building with genuine character redemption arc.",
      },
      {
        title: "Made in Abyss",
        genres: ["Fantasy", "Adventure"],
        reason:
          "Deceptively cute art hiding a dark, mysterious adventure.",
      },
      {
        title: "Re:Zero",
        genres: ["Fantasy", "Psychological"],
        reason:
          "Gripping isekai with real consequences and character depth.",
      },
      {
        title: "Delicious in Dungeon",
        genres: ["Fantasy", "Comedy"],
        reason:
          "Creative take on dungeon crawling with lovable characters.",
      },
    ],
    Drama: [
      {
        title: "Violet Evergarden",
        genres: ["Drama", "Fantasy"],
        reason:
          "Stunningly beautiful exploration of emotions and human connection.",
      },
      {
        title: "A Silent Voice",
        genres: ["Drama", "Romance"],
        reason:
          "Powerful story about redemption, forgiveness, and understanding.",
      },
      {
        title: "March Comes in Like a Lion",
        genres: ["Drama", "Slice of Life"],
        reason:
          "Intimate character study with beautiful visual storytelling.",
      },
      {
        title: "Odd Taxi",
        genres: ["Drama", "Mystery"],
        reason:
          "Clever, interconnected mystery with surprisingly deep themes.",
      },
      {
        title: "Bocchi the Rock!",
        genres: ["Drama", "Comedy"],
        reason:
          "Relatable anxiety portrayed through creative animation and humor.",
      },
    ],
    Comedy: [
      {
        title: "Spy x Family",
        genres: ["Comedy", "Action"],
        reason: "Wholesome family comedy with perfect comedic timing.",
      },
      {
        title: "Grand Blue",
        genres: ["Comedy", "Slice of Life"],
        reason:
          "Hilarious college comedy that never lets up on the laughs.",
      },
      {
        title: "Nichijou",
        genres: ["Comedy", "Slice of Life"],
        reason: "Absurdist masterpiece with incredible animation.",
      },
      {
        title: "The Devil is a Part-Timer!",
        genres: ["Comedy", "Fantasy"],
        reason:
          "Fish-out-of-water comedy with great character dynamics.",
      },
      {
        title: "Saiki K",
        genres: ["Comedy", "Supernatural"],
        reason: "Rapid-fire jokes with a deadpan psychic protagonist.",
      },
    ],
  };

  const existingTitles = userList.map((e) => e.title.toLowerCase());
  const recPool =
    genreRecommendations[topGenre] || genreRecommendations["Action"];

  const recommendations = recPool
    .filter((r) => !existingTitles.includes(r.title.toLowerCase()))
    .slice(0, 5)
    .map((r, idx) => ({
      title: r.title,
      reason: r.reason,
      matchScore: 90 - idx * 5,
      genres: r.genres,
    }));

  return {
    recommendations,
    analysis: {
      topGenres,
      preferredFormats: ["TV"],
      averageRating: 7.5,
      watchingPatterns: "Based on your collection",
      moodProfile: `Enjoys ${topGenre} anime`,
    },
    personalizedMessage: `Berdasarkan koleksi ${userList.length} anime kamu dengan preferensi ${topGenre}, berikut rekomendasi yang mungkin kamu suka! Rekomendasi ini dipilih khusus berdasarkan genre favorit dan pola menonton kamu.`,
  };
}

function normalizeRecommendations(
  response: RecommendationResult,
  userList: UserAnimeEntry[]
): RecommendationResult {
  const existingTitles = new Set(
    userList.map((e) => e.title.toLowerCase())
  );

  const filteredRecs = (response.recommendations || [])
    .filter((r) => !existingTitles.has(r.title.toLowerCase()))
    .slice(0, 8)
    .map((r) => ({
      title: r.title || "Unknown",
      reason: r.reason || "Recommended based on your preferences",
      matchScore: Math.min(100, Math.max(0, r.matchScore || 80)),
      genres: Array.isArray(r.genres) ? r.genres : [],
    }));

  return {
    recommendations: filteredRecs,
    analysis: {
      topGenres: Array.isArray(response.analysis?.topGenres)
        ? response.analysis.topGenres.slice(0, 5)
        : ["Action", "Drama"],
      preferredFormats: Array.isArray(response.analysis?.preferredFormats)
        ? response.analysis.preferredFormats
        : ["TV"],
      averageRating: response.analysis?.averageRating || 7.5,
      watchingPatterns:
        response.analysis?.watchingPatterns || "Varied watching patterns",
      moodProfile:
        response.analysis?.moodProfile || "Enjoys diverse anime",
    },
    personalizedMessage:
      response.personalizedMessage ||
      "Berikut rekomendasi anime yang dipersonalisasi berdasarkan koleksi kamu!",
  };
}

export default router;
