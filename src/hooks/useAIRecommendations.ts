import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { isLocalMode } from '@/lib/apiMode';
import { UserListEntry } from './useAnimeData';
import { searchAnime } from '@/lib/animeData';
import { enrichAnimeData } from '@/lib/anime-utils';
import { AnimeCardData } from '@/types/anime';

export interface AIRecommendation {
  title: string;
  reason: string;
  matchScore: number;
  genres: string[];
  anime?: AnimeCardData;
}

export interface AIAnalysis {
  topGenres: string[];
  preferredFormats: string[];
  averageRating: number;
  watchingPatterns: string;
  moodProfile: string;
}

export interface AIRecommendationsResult {
  recommendations: AIRecommendation[];
  analysis: AIAnalysis;
  personalizedMessage: string;
}

const CACHE_KEY = 'ainime_ai_recommendations_v2';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedResult {
  data: AIRecommendationsResult;
  timestamp: number;
  listHash: string;
}

function getListHash(entries: UserListEntry[]): string {
  const summary = entries
    .map(e => `${e.animeId}:${e.status}`)
    .sort()
    .join(',');
  return btoa(summary).slice(0, 20);
}

function getCachedResult(): CachedResult | null {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (!saved) return null;
    const cached = JSON.parse(saved) as CachedResult;
    if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached;
  } catch {
    return null;
  }
}

function setCachedResult(data: AIRecommendationsResult, listHash: string) {
  const cached: CachedResult = {
    data,
    timestamp: Date.now(),
    listHash,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
}

// Fallback recommendations when API is unavailable
function generateFallbackRecommendations(entries: UserListEntry[]): AIRecommendationsResult {
  const genreCounts: Record<string, number> = {};
  entries.forEach(entry => {
    entry.anime.genres.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);

  const topGenre = topGenres[0] || 'Action';

  const genreRecommendations: Record<string, { title: string; genres: string[]; reason: string }[]> = {
    'Action': [
      { title: 'Jujutsu Kaisen', genres: ['Action', 'Supernatural'], reason: 'Intense battles with compelling characters and dark themes that action fans love.' },
      { title: 'Demon Slayer', genres: ['Action', 'Supernatural'], reason: 'Beautiful animation and emotional storytelling wrapped in thrilling action sequences.' },
      { title: 'Chainsaw Man', genres: ['Action', 'Horror'], reason: 'Unique premise with brutal action and surprisingly deep character moments.' },
      { title: 'Mob Psycho 100', genres: ['Action', 'Comedy'], reason: 'Perfectly balances intense psychic battles with heartfelt character growth.' },
      { title: 'Vinland Saga', genres: ['Action', 'Drama'], reason: 'Epic Viking saga with stunning fight choreography and profound themes.' },
    ],
    'Romance': [
      { title: 'Your Name', genres: ['Romance', 'Drama'], reason: 'Masterfully crafted romance with beautiful visuals and emotional depth.' },
      { title: 'Horimiya', genres: ['Romance', 'Slice of Life'], reason: 'Refreshingly natural romance without unnecessary drama.' },
      { title: 'Toradora!', genres: ['Romance', 'Comedy'], reason: 'Classic romcom with excellent character development and satisfying payoff.' },
      { title: 'Kaguya-sama: Love Is War', genres: ['Romance', 'Comedy'], reason: 'Hilarious mind games that evolve into genuine romance.' },
      { title: 'Fruits Basket', genres: ['Romance', 'Drama'], reason: 'Emotionally rich story about healing and finding love.' },
    ],
    'Fantasy': [
      { title: "Frieren: Beyond Journey's End", genres: ['Fantasy', 'Adventure'], reason: 'Beautifully contemplative fantasy about time, memories, and connections.' },
      { title: 'Mushoku Tensei', genres: ['Fantasy', 'Adventure'], reason: 'Immersive world-building with genuine character redemption arc.' },
      { title: 'Made in Abyss', genres: ['Fantasy', 'Adventure'], reason: 'Deceptively cute art hiding a dark, mysterious adventure.' },
      { title: 'Re:Zero', genres: ['Fantasy', 'Psychological'], reason: 'Gripping isekai with real consequences and character depth.' },
      { title: 'Delicious in Dungeon', genres: ['Fantasy', 'Comedy'], reason: 'Creative take on dungeon crawling with lovable characters.' },
    ],
    'Drama': [
      { title: 'Violet Evergarden', genres: ['Drama', 'Fantasy'], reason: 'Stunningly beautiful exploration of emotions and human connection.' },
      { title: 'A Silent Voice', genres: ['Drama', 'Romance'], reason: 'Powerful story about redemption, forgiveness, and understanding.' },
      { title: 'March Comes in Like a Lion', genres: ['Drama', 'Slice of Life'], reason: 'Intimate character study with beautiful visual storytelling.' },
      { title: 'Odd Taxi', genres: ['Drama', 'Mystery'], reason: 'Clever, interconnected mystery with surprisingly deep themes.' },
      { title: 'Bocchi the Rock!', genres: ['Drama', 'Comedy'], reason: 'Relatable anxiety portrayed through creative animation and humor.' },
    ],
    'Comedy': [
      { title: 'Spy x Family', genres: ['Comedy', 'Action'], reason: 'Wholesome family comedy with perfect comedic timing.' },
      { title: 'Grand Blue', genres: ['Comedy', 'Slice of Life'], reason: 'Hilarious college comedy that never lets up on the laughs.' },
      { title: 'Nichijou', genres: ['Comedy', 'Slice of Life'], reason: 'Absurdist masterpiece with incredible animation.' },
      { title: 'The Devil is a Part-Timer!', genres: ['Comedy', 'Fantasy'], reason: 'Fish-out-of-water comedy with great character dynamics.' },
      { title: 'Saiki K', genres: ['Comedy', 'Supernatural'], reason: 'Rapid-fire jokes with a deadpan psychic protagonist.' },
    ],
    'Supernatural': [
      { title: 'Mob Psycho 100', genres: ['Action', 'Supernatural'], reason: 'Unique take on psychic powers with amazing character growth.' },
      { title: 'Noragami', genres: ['Supernatural', 'Action'], reason: 'Fun god-fighting action with likable characters.' },
      { title: 'Bungo Stray Dogs', genres: ['Supernatural', 'Action'], reason: 'Literary-inspired abilities with stylish action.' },
      { title: 'The Devil is a Part-Timer!', genres: ['Supernatural', 'Comedy'], reason: 'Great comedy premise with solid execution.' },
      { title: 'Blue Exorcist', genres: ['Supernatural', 'Action'], reason: 'Classic demon-fighting with good world-building.' },
    ],
    'Slice of Life': [
      { title: 'Bocchi the Rock!', genres: ['Slice of Life', 'Comedy'], reason: 'Relatable social anxiety with incredible visual creativity.' },
      { title: 'K-On!', genres: ['Slice of Life', 'Music'], reason: 'Comfy and heartwarming friendship story.' },
      { title: 'Yuru Camp', genres: ['Slice of Life', 'Adventure'], reason: 'Relaxing camping adventures perfect for unwinding.' },
      { title: 'Non Non Biyori', genres: ['Slice of Life', 'Comedy'], reason: 'Peaceful countryside life that soothes the soul.' },
      { title: 'Barakamon', genres: ['Slice of Life', 'Comedy'], reason: 'Heartfelt story about finding yourself.' },
    ],
  };

  const existingTitles = new Set(entries.map(e => (e.anime.title.english || e.anime.title.romaji).toLowerCase()));
  const recPool = genreRecommendations[topGenre] || genreRecommendations['Action'];

  const recommendations = recPool
    .filter(r => !existingTitles.has(r.title.toLowerCase()))
    .slice(0, 5)
    .map((r, idx) => ({
      title: r.title,
      reason: r.reason,
      matchScore: 90 - idx * 5,
      genres: r.genres,
    }));

  const lovedCount = entries.filter(e => e.status === 'LOVED').length;
  const watchedCount = entries.filter(e => e.status === 'WATCHED').length;

  return {
    recommendations,
    analysis: {
      topGenres,
      preferredFormats: ['TV'],
      averageRating: 7.5,
      watchingPatterns: watchedCount > 5 ? 'Aktif menonton dan menyelesaikan anime' : 'Masih membangun koleksi',
      moodProfile: `Penggemar ${topGenre} dengan ${lovedCount} anime favorit`,
    },
    personalizedMessage: `Berdasarkan koleksi ${entries.length} anime kamu dengan preferensi ${topGenre}, berikut rekomendasi yang dipilih khusus untukmu! Kami menganalisis pola menonton dan genre favoritmu untuk menemukan anime yang pasti kamu suka.`,
  };
}

export function useAIRecommendations() {
  const [result, setResult] = useState<AIRecommendationsResult | null>(() => {
    const cached = getCachedResult();
    return cached?.data || null;
  });

  const mutation = useMutation({
    mutationFn: async (entries: UserListEntry[]): Promise<AIRecommendationsResult> => {
      // Check cache first
      const listHash = getListHash(entries);
      const cached = getCachedResult();
      if (cached && cached.listHash === listHash) {
        return cached.data;
      }

      // Prepare user list for the API
      const userList = entries.map(e => ({
        animeId: e.animeId,
        title: e.anime.title.english || e.anime.title.romaji,
        genres: e.anime.genres,
        rating: e.rating,
        status: e.status,
        score: e.anime.averageScore,
        episodes: e.anime.episodes,
        format: e.anime.format,
      }));

      try {
        if (isLocalMode()) {
          throw new Error('Local mode - skip API call');
        }

        // Call the Express API
        const apiResult = await api.getAIRecommendations(userList) as AIRecommendationsResult;

        // Try to fetch actual anime data for recommendations
        const enrichedRecs = await Promise.all(
          apiResult.recommendations.map(async (rec) => {
            try {
              const searchResult = await searchAnime({ query: rec.title });
              if (searchResult.data.length > 0) {
                const enrichedAnime = enrichAnimeData(searchResult.data[0]);
                return { ...rec, anime: enrichedAnime };
              }
            } catch (err) {
              console.warn(`Could not fetch anime data for ${rec.title}:`, err);
            }
            return rec;
          })
        );

        const enrichedResult: AIRecommendationsResult = {
          ...apiResult,
          recommendations: enrichedRecs,
        };

        // Cache the result
        setCachedResult(enrichedResult, listHash);

        return enrichedResult;
      } catch (err) {
        console.error('AI Recommendations API failed, using fallback:', err);
        // Use fallback recommendations
        const fallback = generateFallbackRecommendations(entries);

        // Try to enrich fallback with actual anime data
        const enrichedRecs = await Promise.all(
          fallback.recommendations.map(async (rec) => {
            try {
              const searchResult = await searchAnime({ query: rec.title });
              if (searchResult.data.length > 0) {
                const enrichedAnime = enrichAnimeData(searchResult.data[0]);
                return { ...rec, anime: enrichedAnime };
              }
            } catch (err) {
              console.warn(`Could not fetch anime data for ${rec.title}:`, err);
            }
            return rec;
          })
        );

        const enrichedFallback: AIRecommendationsResult = {
          ...fallback,
          recommendations: enrichedRecs,
        };

        setCachedResult(enrichedFallback, listHash);
        return enrichedFallback;
      }
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const generate = useCallback((entries: UserListEntry[]) => {
    if (entries.length === 0) {
      return;
    }
    mutation.mutate(entries);
  }, [mutation]);

  const refresh = useCallback((entries: UserListEntry[]) => {
    // Clear cache and regenerate
    localStorage.removeItem(CACHE_KEY);
    setResult(null);
    if (entries.length > 0) {
      mutation.mutate(entries);
    }
  }, [mutation]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    setResult(null);
  }, []);

  return {
    result,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
    generate,
    refresh,
    clearCache,
  };
}
