/**
 * Enhanced Similar Anime Hook (v2)
 *
 * Combines API-based recommendations with local similarity calculations
 * for more accurate and transparent anime recommendations.
 */

import { useQuery } from '@tanstack/react-query';
import * as animeData from '@/lib/animeData';
import { enrichAnimeData } from '@/lib/anime-utils';
import {
  calculateAnimeSimilarity,
  rankSimilarAnime,
  analyzeUserPreferences,
  applyUserPreferenceBoost,
  SimilarityScore,
} from '@/lib/similarity-utils';
import { AnimeCardData } from '@/types/anime';
import { useUserList, UserListEntry } from '@/hooks/useAnimeData';

export interface EnhancedSimilarAnime {
  anime: AnimeCardData;
  similarity: SimilarityScore;
}

export interface EnhancedSimilarAnimeResult {
  animes: EnhancedSimilarAnime[];
  source: 'anilist' | 'jikan';
  isUsingUserPreferences: boolean;
}

/**
 * Hook that provides enhanced similar anime with detailed similarity scores
 */
export function useEnhancedSimilarAnime(
  sourceAnime: AnimeCardData | undefined,
  malId?: number,
  options?: {
    limit?: number;
    includeUserPreferences?: boolean;
  }
) {
  const { limit = 12, includeUserPreferences = true } = options || {};
  const { entries: userListEntries } = useUserList();

  return useQuery({
    queryKey: ['enhanced-similar-anime', sourceAnime?.id, limit, includeUserPreferences, userListEntries.length],
    queryFn: async (): Promise<EnhancedSimilarAnimeResult> => {
      if (!sourceAnime) {
        return { animes: [], source: 'anilist', isUsingUserPreferences: false };
      }

      // Fetch base similar anime from API
      const result = await animeData.getSimilarAnime(sourceAnime.id, malId, limit * 2);
      const enrichedCandidates = result.data.map(enrichAnimeData);

      // Fetch staff for source anime
      let sourceStaff;
      try {
        const staffResult = await animeData.getAnimeStaff(sourceAnime.id, malId);
        sourceStaff = staffResult.data;
      } catch {
        // Staff fetch is optional, continue without it
        sourceStaff = [];
      }

      // Calculate similarity scores for each candidate
      const rankedCandidates = rankSimilarAnime(
        sourceAnime,
        enrichedCandidates,
        sourceStaff
      );

      // Apply user preference boost if available and enabled
      let enhancedResults = rankedCandidates;
      let isUsingUserPreferences = false;

      if (includeUserPreferences && userListEntries.length > 0) {
        const userPrefs = analyzeUserPreferences(
          userListEntries.map(entry => ({
            anime: entry.anime,
            status: entry.status,
            rating: entry.rating,
          }))
        );

        enhancedResults = rankedCandidates.map(item => ({
          anime: item.anime,
          similarity: applyUserPreferenceBoost(item.similarity, item.anime, userPrefs),
        }));

        // Re-sort after boosting
        enhancedResults.sort((a, b) => b.similarity.overall - a.similarity.overall);
        isUsingUserPreferences = true;
      }

      // Filter out anime that user has already in their list (optional)
      const userAnimeIds = new Set(userListEntries.map(e => e.animeId));
      const filteredResults = enhancedResults.filter(
        item => !userAnimeIds.has(item.anime.id)
      );

      // Take top results
      const topResults = filteredResults.slice(0, limit);

      return {
        animes: topResults.map(item => ({
          anime: item.anime as AnimeCardData,
          similarity: item.similarity,
        })),
        source: result.source,
        isUsingUserPreferences,
      };
    },
    enabled: !!sourceAnime,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get a quick similarity score between two specific anime
 * Useful for inline comparisons
 */
export function useAnimeSimilarity(
  anime1: AnimeCardData | undefined,
  anime2: AnimeCardData | undefined
) {
  return useQuery({
    queryKey: ['anime-similarity', anime1?.id, anime2?.id],
    queryFn: async (): Promise<SimilarityScore | null> => {
      if (!anime1 || !anime2) return null;

      return calculateAnimeSimilarity(anime1, anime2);
    },
    enabled: !!anime1 && !!anime2,
    staleTime: 30 * 60 * 1000, // 30 minutes - static data
  });
}

/**
 * Get similarity breakdown as a formatted description
 */
export function formatSimilarityBreakdown(similarity: SimilarityScore): string {
  const parts: string[] = [];

  if (similarity.genreScore >= 50) {
    parts.push(`Genre: ${similarity.genreScore}%`);
  }
  if (similarity.tagScore >= 40) {
    parts.push(`Themes: ${similarity.tagScore}%`);
  }
  if (similarity.studioScore >= 50) {
    parts.push(`Studio: ${similarity.studioScore}%`);
  }
  if (similarity.staffScore >= 30) {
    parts.push(`Staff: ${similarity.staffScore}%`);
  }

  return parts.join(' | ') || 'General similarity';
}

/**
 * Get a color class for similarity score visualization
 */
export function getSimilarityColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-teal';
  if (score >= 40) return 'text-gold';
  if (score >= 20) return 'text-orange-500';
  return 'text-muted-foreground';
}

/**
 * Get badge variant based on match type
 */
export function getMatchTypeBadge(matchType: SimilarityScore['matchType']): {
  label: string;
  className: string;
} {
  switch (matchType) {
    case 'on-target':
      return { label: 'Strong Match', className: 'bg-emerald-500/20 text-emerald-500' };
    case 'adjacent':
      return { label: 'Related', className: 'bg-teal/20 text-teal' };
    case 'wildcard':
      return { label: 'Discovery', className: 'bg-violet/20 text-violet' };
  }
}
