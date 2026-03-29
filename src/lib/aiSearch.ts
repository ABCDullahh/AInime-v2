/**
 * Local AI Search - calls server-side endpoint which proxies to Gemini API.
 * API key is kept server-side only (never exposed to the browser).
 */

export interface AISearchResponse {
  interpretation: string;
  searchSpec: {
    query?: string;
    genres?: string[];
    excludeGenres?: string[];
    yearMin?: number;
    yearMax?: number;
    scoreMin?: number;
    status?: string;
    format?: string;
    sort?: string;
    episodesMax?: number;
    specificTitles?: string[];
    similarTo?: string;
    similarityReason?: string;
  };
  vibeDescription?: string;
  suggestions?: string[];
  reasoning?: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

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
  if (!res.ok) throw new Error(`AI search error: ${res.status}`);
  return res.json();
}
