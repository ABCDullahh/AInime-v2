/**
 * Improved Anime Similarity Calculation Engine v2
 *
 * Calculates similarity scores between anime using multiple factors:
 * - Genre overlap (weighted Jaccard similarity)
 * - Studio match (same studio indicates similar production quality/style)
 * - Theme/tag overlap (weighted by tag rank/importance)
 * - Staff overlap (shared directors, writers, composers)
 * - Rating pattern similarity (similar scores appeal to similar audiences)
 * - Format compatibility (TV to TV, Movie to Movie preference)
 */

import { Anime, AnimeCardData, AnimeTag } from '@/types/anime';
import { AnimeStaff } from '@/lib/anilist';

// Similarity score breakdown for transparency
export interface SimilarityScore {
  overall: number;        // 0-100 combined score
  genreScore: number;     // 0-100
  studioScore: number;    // 0-100
  tagScore: number;       // 0-100
  staffScore: number;     // 0-100
  ratingScore: number;    // 0-100
  formatScore: number;    // 0-100
  reasons: string[];      // Human-readable similarity reasons
  matchType: 'on-target' | 'adjacent' | 'wildcard';
}

// Weights for different similarity factors (must sum to 1)
const SIMILARITY_WEIGHTS = {
  genre: 0.30,      // Genres are strong indicators of content type
  tag: 0.25,        // Tags provide more specific thematic matching
  studio: 0.15,     // Studio style matters but is secondary
  staff: 0.10,      // Shared staff indicates similar creative direction
  rating: 0.10,     // Rating patterns help match quality expectations
  format: 0.10,     // Format preference for completion likelihood
};

// Genre similarity weights - some genres are more defining than others
const GENRE_WEIGHTS: Record<string, number> = {
  'Action': 1.0,
  'Adventure': 0.9,
  'Comedy': 1.0,
  'Drama': 1.1,
  'Fantasy': 1.0,
  'Horror': 1.2,
  'Mecha': 1.2,
  'Music': 1.1,
  'Mystery': 1.0,
  'Psychological': 1.2,
  'Romance': 1.1,
  'Sci-Fi': 1.0,
  'Slice of Life': 1.1,
  'Sports': 1.2,
  'Supernatural': 0.9,
  'Thriller': 1.0,
  'Ecchi': 0.8,
  'Hentai': 0.5,
};

// Important/defining tags that strongly indicate similarity
const HIGH_PRIORITY_TAGS = new Set([
  'isekai', 'time travel', 'reincarnation', 'magic', 'martial arts',
  'school', 'military', 'music', 'cooking', 'gambling', 'survival',
  'detective', 'psychological', 'philosophical', 'revenge', 'tragedy',
  'coming of age', 'parody', 'war', 'politics', 'samurai', 'ninja',
  'vampire', 'demons', 'mecha', 'space', 'cyberpunk', 'post-apocalyptic',
  'iyashikei', 'cgdct', 'idols', 'sports', 'mafia', 'yakuza',
]);

/**
 * Calculate genre overlap using weighted Jaccard similarity
 */
export function calculateGenreScore(
  sourceGenres: string[],
  targetGenres: string[]
): { score: number; matchedGenres: string[] } {
  if (!sourceGenres.length || !targetGenres.length) {
    return { score: 0, matchedGenres: [] };
  }

  const sourceSet = new Set(sourceGenres.map(g => g.toLowerCase()));
  const targetSet = new Set(targetGenres.map(g => g.toLowerCase()));

  const matchedGenres: string[] = [];
  let weightedIntersection = 0;
  let weightedUnion = 0;

  // Calculate weighted intersection
  for (const genre of sourceGenres) {
    const normalizedGenre = genre.toLowerCase();
    const weight = GENRE_WEIGHTS[genre] || 1.0;
    weightedUnion += weight;

    if (targetSet.has(normalizedGenre)) {
      weightedIntersection += weight;
      matchedGenres.push(genre);
    }
  }

  // Add target genres not in source to union
  for (const genre of targetGenres) {
    const normalizedGenre = genre.toLowerCase();
    if (!sourceSet.has(normalizedGenre)) {
      const weight = GENRE_WEIGHTS[genre] || 1.0;
      weightedUnion += weight;
    }
  }

  // Weighted Jaccard similarity
  const score = weightedUnion > 0 ? (weightedIntersection / weightedUnion) * 100 : 0;

  return { score: Math.round(score), matchedGenres };
}

/**
 * Calculate studio similarity
 * Same main studio = 100, shared studio = 75, no match = 0
 */
export function calculateStudioScore(
  sourceStudios: { name: string }[] | undefined,
  targetStudios: { name: string }[] | undefined
): { score: number; matchedStudios: string[] } {
  const sourceNames = sourceStudios?.map(s => s.name.toLowerCase()) || [];
  const targetNames = targetStudios?.map(s => s.name.toLowerCase()) || [];

  if (!sourceNames.length || !targetNames.length) {
    return { score: 0, matchedStudios: [] };
  }

  const matchedStudios: string[] = [];
  const sourceSet = new Set(sourceNames);

  for (const studio of targetStudios || []) {
    if (sourceSet.has(studio.name.toLowerCase())) {
      matchedStudios.push(studio.name);
    }
  }

  if (matchedStudios.length === 0) {
    return { score: 0, matchedStudios: [] };
  }

  // Primary studio match (first studio is usually the main one)
  const primaryMatch = sourceNames[0] === targetNames[0];
  const score = primaryMatch ? 100 : (matchedStudios.length > 0 ? 75 : 0);

  return { score, matchedStudios };
}

/**
 * Calculate tag similarity with weighted matching
 * High-priority tags contribute more to the score
 */
export function calculateTagScore(
  sourceTags: AnimeTag[],
  targetTags: AnimeTag[]
): { score: number; matchedTags: string[] } {
  if (!sourceTags?.length || !targetTags?.length) {
    return { score: 0, matchedTags: [] };
  }

  const sourceTagMap = new Map<string, number>();
  sourceTags.forEach(tag => {
    const normalizedName = tag.name.toLowerCase();
    // Use tag rank as importance (lower rank = more important)
    const importance = tag.rank ? Math.max(1, 100 - tag.rank) / 100 : 0.5;
    sourceTagMap.set(normalizedName, importance);
  });

  const matchedTags: string[] = [];
  let matchScore = 0;
  let maxPossibleScore = 0;

  for (const tag of targetTags) {
    const normalizedName = tag.name.toLowerCase();
    const isHighPriority = HIGH_PRIORITY_TAGS.has(normalizedName);
    const tagWeight = isHighPriority ? 2.0 : 1.0;
    const targetImportance = tag.rank ? Math.max(1, 100 - tag.rank) / 100 : 0.5;

    if (sourceTagMap.has(normalizedName)) {
      const sourceImportance = sourceTagMap.get(normalizedName)!;
      // Combined importance from both sides
      const combinedWeight = (sourceImportance + targetImportance) / 2 * tagWeight;
      matchScore += combinedWeight;
      matchedTags.push(tag.name);
    }

    maxPossibleScore += targetImportance * tagWeight;
  }

  // Add source tags to max possible
  for (const [name, importance] of sourceTagMap) {
    const isHighPriority = HIGH_PRIORITY_TAGS.has(name);
    const tagWeight = isHighPriority ? 2.0 : 1.0;
    if (!matchedTags.map(t => t.toLowerCase()).includes(name)) {
      maxPossibleScore += importance * tagWeight;
    }
  }

  const score = maxPossibleScore > 0 ? (matchScore / maxPossibleScore) * 100 : 0;

  return { score: Math.round(score), matchedTags };
}

/**
 * Calculate staff similarity
 * Shared key staff (directors, series composers, writers) indicate creative similarity
 */
export function calculateStaffScore(
  sourceStaff: AnimeStaff[],
  targetStaff: AnimeStaff[]
): { score: number; matchedStaff: Array<{ name: string; role: string }> } {
  if (!sourceStaff?.length || !targetStaff?.length) {
    return { score: 0, matchedStaff: [] };
  }

  // Key creative roles that indicate stylistic similarity
  const keyRoles = new Set([
    'director', 'series director', 'chief director',
    'series composition', 'original creator', 'screenplay',
    'script', 'storyboard', 'character design', 'original character design',
    'music', 'sound director', 'art director'
  ]);

  const roleWeight: Record<string, number> = {
    'director': 3.0,
    'series director': 3.0,
    'chief director': 3.0,
    'original creator': 2.5,
    'series composition': 2.5,
    'screenplay': 2.0,
    'script': 1.5,
    'character design': 2.0,
    'music': 1.5,
    'storyboard': 1.0,
  };

  // Build source staff map with their key roles
  const sourceStaffMap = new Map<number, { name: string; roles: string[] }>();
  for (const staff of sourceStaff) {
    const normalizedRole = staff.role.toLowerCase();
    if (keyRoles.has(normalizedRole)) {
      const existing = sourceStaffMap.get(staff.person.id);
      if (existing) {
        existing.roles.push(normalizedRole);
      } else {
        sourceStaffMap.set(staff.person.id, {
          name: staff.person.name,
          roles: [normalizedRole]
        });
      }
    }
  }

  const matchedStaff: Array<{ name: string; role: string }> = [];
  let matchScore = 0;
  let maxScore = 0;

  // Check for matches in target staff
  for (const staff of targetStaff) {
    const normalizedRole = staff.role.toLowerCase();
    if (!keyRoles.has(normalizedRole)) continue;

    const weight = roleWeight[normalizedRole] || 1.0;
    maxScore += weight;

    const sourceMatch = sourceStaffMap.get(staff.person.id);
    if (sourceMatch) {
      matchScore += weight;
      matchedStaff.push({ name: staff.person.name, role: staff.role });
    }
  }

  // Add source key staff to max score
  for (const [, staffInfo] of sourceStaffMap) {
    for (const role of staffInfo.roles) {
      const weight = roleWeight[role] || 1.0;
      maxScore += weight;
    }
  }

  const score = maxScore > 0 ? (matchScore / maxScore) * 100 : 0;

  return { score: Math.round(score), matchedStaff };
}

/**
 * Calculate rating pattern similarity
 * Anime with similar scores tend to appeal to similar audiences
 */
export function calculateRatingScore(
  sourceScore: number | undefined,
  targetScore: number | undefined,
  sourcePopularity: number | undefined,
  targetPopularity: number | undefined
): { score: number; insight: string } {
  // Score similarity (0-100 scale)
  let scoreMatch = 50; // Default neutral
  let insight = 'New or unrated anime';

  if (sourceScore && targetScore) {
    const scoreDiff = Math.abs(sourceScore - targetScore);
    // Within 10 points = high similarity, scales down from there
    scoreMatch = Math.max(0, 100 - scoreDiff * 2);

    if (scoreDiff <= 5) {
      insight = 'Very similar ratings';
    } else if (scoreDiff <= 10) {
      insight = 'Similar rating range';
    } else if (scoreDiff <= 20) {
      insight = 'Moderately different ratings';
    } else {
      insight = 'Different rating tier';
    }
  }

  // Popularity tier similarity (as bonus)
  let popularityBonus = 0;
  if (sourcePopularity && targetPopularity) {
    const popularityRatio = Math.min(sourcePopularity, targetPopularity) /
                           Math.max(sourcePopularity, targetPopularity);
    // If within same order of magnitude, add bonus
    if (popularityRatio > 0.1) {
      popularityBonus = popularityRatio * 20; // Up to 20 bonus points
    }
  }

  return {
    score: Math.round(Math.min(100, scoreMatch + popularityBonus)),
    insight
  };
}

/**
 * Calculate format compatibility score
 * Users often prefer similar formats (TV series vs movies)
 */
export function calculateFormatScore(
  sourceFormat: Anime['format'],
  targetFormat: Anime['format'],
  sourceEpisodes: number | undefined,
  targetEpisodes: number | undefined
): { score: number; insight: string } {
  // Exact format match
  if (sourceFormat === targetFormat) {
    // Further refine by episode count for TV shows
    if (sourceFormat === 'TV' && sourceEpisodes && targetEpisodes) {
      const epDiff = Math.abs(sourceEpisodes - targetEpisodes);
      const epRatio = Math.min(sourceEpisodes, targetEpisodes) /
                     Math.max(sourceEpisodes, targetEpisodes);

      if (epRatio > 0.8) {
        return { score: 100, insight: 'Similar length series' };
      } else if (epRatio > 0.5) {
        return { score: 85, insight: 'Same format, different length' };
      } else {
        return { score: 70, insight: 'Same format but very different length' };
      }
    }
    return { score: 100, insight: 'Same format' };
  }

  // Format compatibility matrix
  const compatibilityMatrix: Record<string, Record<string, number>> = {
    'TV': { 'ONA': 80, 'OVA': 60, 'SPECIAL': 50, 'MOVIE': 40, 'MUSIC': 20 },
    'ONA': { 'TV': 80, 'OVA': 70, 'SPECIAL': 60, 'MOVIE': 50, 'MUSIC': 30 },
    'OVA': { 'TV': 60, 'ONA': 70, 'SPECIAL': 70, 'MOVIE': 60, 'MUSIC': 40 },
    'MOVIE': { 'TV': 40, 'ONA': 50, 'OVA': 60, 'SPECIAL': 60, 'MUSIC': 30 },
    'SPECIAL': { 'TV': 50, 'ONA': 60, 'OVA': 70, 'MOVIE': 60, 'MUSIC': 40 },
    'MUSIC': { 'TV': 20, 'ONA': 30, 'OVA': 40, 'MOVIE': 30, 'SPECIAL': 40 },
  };

  const score = compatibilityMatrix[sourceFormat]?.[targetFormat] || 30;

  return {
    score,
    insight: score >= 70 ? 'Compatible format' : 'Different format'
  };
}

/**
 * Generate human-readable similarity reasons
 */
function generateReasons(
  genreResult: ReturnType<typeof calculateGenreScore>,
  studioResult: ReturnType<typeof calculateStudioScore>,
  tagResult: ReturnType<typeof calculateTagScore>,
  staffResult: ReturnType<typeof calculateStaffScore>,
  ratingResult: ReturnType<typeof calculateRatingScore>,
  formatResult: ReturnType<typeof calculateFormatScore>
): string[] {
  const reasons: string[] = [];

  // Genre reasons
  if (genreResult.matchedGenres.length >= 3) {
    reasons.push(`Shares ${genreResult.matchedGenres.length} genres: ${genreResult.matchedGenres.slice(0, 3).join(', ')}`);
  } else if (genreResult.matchedGenres.length > 0) {
    reasons.push(`Both are ${genreResult.matchedGenres.join(' and ')}`);
  }

  // Studio reasons
  if (studioResult.matchedStudios.length > 0) {
    reasons.push(`Same studio: ${studioResult.matchedStudios[0]}`);
  }

  // Staff reasons
  if (staffResult.matchedStaff.length > 0) {
    const topStaff = staffResult.matchedStaff[0];
    reasons.push(`Same ${topStaff.role.toLowerCase()}: ${topStaff.name}`);
  }

  // Tag reasons (pick high-priority matches)
  const priorityMatches = tagResult.matchedTags.filter(t =>
    HIGH_PRIORITY_TAGS.has(t.toLowerCase())
  );
  if (priorityMatches.length > 0) {
    reasons.push(`Similar themes: ${priorityMatches.slice(0, 2).join(', ')}`);
  } else if (tagResult.matchedTags.length >= 3) {
    reasons.push(`${tagResult.matchedTags.length} matching tags`);
  }

  // Rating reason
  if (ratingResult.score >= 80) {
    reasons.push(ratingResult.insight);
  }

  // Format reason
  if (formatResult.score >= 80) {
    reasons.push(formatResult.insight);
  }

  return reasons.slice(0, 4); // Max 4 reasons
}

/**
 * Determine match type based on overall score
 */
function getMatchType(score: number): 'on-target' | 'adjacent' | 'wildcard' {
  if (score >= 70) return 'on-target';
  if (score >= 45) return 'adjacent';
  return 'wildcard';
}

/**
 * Main similarity calculation function
 * Calculates a comprehensive similarity score between two anime
 */
export function calculateAnimeSimilarity(
  sourceAnime: Anime | AnimeCardData,
  targetAnime: Anime | AnimeCardData,
  sourceStaff?: AnimeStaff[],
  targetStaff?: AnimeStaff[]
): SimilarityScore {
  // Calculate individual scores
  const genreResult = calculateGenreScore(sourceAnime.genres, targetAnime.genres);
  const studioResult = calculateStudioScore(
    sourceAnime.studios?.nodes,
    targetAnime.studios?.nodes
  );
  const tagResult = calculateTagScore(sourceAnime.tags, targetAnime.tags);
  const staffResult = calculateStaffScore(sourceStaff || [], targetStaff || []);
  const ratingResult = calculateRatingScore(
    sourceAnime.averageScore,
    targetAnime.averageScore,
    sourceAnime.popularity,
    targetAnime.popularity
  );
  const formatResult = calculateFormatScore(
    sourceAnime.format,
    targetAnime.format,
    sourceAnime.episodes,
    targetAnime.episodes
  );

  // Calculate weighted overall score
  const overall = Math.round(
    genreResult.score * SIMILARITY_WEIGHTS.genre +
    studioResult.score * SIMILARITY_WEIGHTS.studio +
    tagResult.score * SIMILARITY_WEIGHTS.tag +
    staffResult.score * SIMILARITY_WEIGHTS.staff +
    ratingResult.score * SIMILARITY_WEIGHTS.rating +
    formatResult.score * SIMILARITY_WEIGHTS.format
  );

  // Generate reasons
  const reasons = generateReasons(
    genreResult,
    studioResult,
    tagResult,
    staffResult,
    ratingResult,
    formatResult
  );

  return {
    overall,
    genreScore: genreResult.score,
    studioScore: studioResult.score,
    tagScore: tagResult.score,
    staffScore: staffResult.score,
    ratingScore: ratingResult.score,
    formatScore: formatResult.score,
    reasons,
    matchType: getMatchType(overall),
  };
}

/**
 * Sort and rank similar anime by their similarity scores
 */
export function rankSimilarAnime(
  sourceAnime: Anime | AnimeCardData,
  candidates: (Anime | AnimeCardData)[],
  sourceStaff?: AnimeStaff[],
  candidateStaffMap?: Map<number, AnimeStaff[]>
): Array<{
  anime: Anime | AnimeCardData;
  similarity: SimilarityScore;
}> {
  return candidates
    .map(candidate => ({
      anime: candidate,
      similarity: calculateAnimeSimilarity(
        sourceAnime,
        candidate,
        sourceStaff,
        candidateStaffMap?.get(candidate.id)
      ),
    }))
    .sort((a, b) => b.similarity.overall - a.similarity.overall);
}

/**
 * Get anime from user list that might affect recommendations
 * Analyzes user's watched/loved anime for pattern matching
 */
export function analyzeUserPreferences(
  userAnimeList: Array<{ anime: AnimeCardData; status: string; rating?: number }>
): {
  favoriteGenres: Map<string, number>;
  favoriteStudios: Map<string, number>;
  favoriteTags: Map<string, number>;
  averagePreferredScore: number;
  preferredFormats: Map<string, number>;
} {
  const genreCounts = new Map<string, number>();
  const studioCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const formatCounts = new Map<string, number>();
  let totalScore = 0;
  let scoreCount = 0;

  // Weight by status (LOVED > WATCHED > WATCHING > SAVED)
  const statusWeights: Record<string, number> = {
    'LOVED': 3.0,
    'WATCHED': 2.0,
    'WATCHING': 1.5,
    'SAVED': 1.0,
    'DROPPED': 0.3,
  };

  for (const entry of userAnimeList) {
    const weight = statusWeights[entry.status] || 1.0;
    const ratingBonus = entry.rating ? (entry.rating / 10) : 0.7;
    const finalWeight = weight * ratingBonus;

    // Count genres
    for (const genre of entry.anime.genres || []) {
      const current = genreCounts.get(genre) || 0;
      genreCounts.set(genre, current + finalWeight);
    }

    // Count studios
    for (const studio of entry.anime.studios?.nodes || []) {
      const current = studioCounts.get(studio.name) || 0;
      studioCounts.set(studio.name, current + finalWeight);
    }

    // Count tags
    for (const tag of entry.anime.tags || []) {
      const current = tagCounts.get(tag.name) || 0;
      tagCounts.set(tag.name, current + finalWeight);
    }

    // Count formats
    const format = entry.anime.format;
    const currentFormat = formatCounts.get(format) || 0;
    formatCounts.set(format, currentFormat + finalWeight);

    // Track scores
    if (entry.anime.averageScore) {
      totalScore += entry.anime.averageScore;
      scoreCount++;
    }
  }

  return {
    favoriteGenres: genreCounts,
    favoriteStudios: studioCounts,
    favoriteTags: tagCounts,
    averagePreferredScore: scoreCount > 0 ? totalScore / scoreCount : 70,
    preferredFormats: formatCounts,
  };
}

/**
 * Boost similarity scores based on user preferences
 */
export function applyUserPreferenceBoost(
  baseScore: SimilarityScore,
  targetAnime: Anime | AnimeCardData,
  userPrefs: ReturnType<typeof analyzeUserPreferences>
): SimilarityScore {
  let boost = 0;
  const boostedReasons = [...baseScore.reasons];

  // Genre preference boost
  let genreBoost = 0;
  for (const genre of targetAnime.genres || []) {
    const prefScore = userPrefs.favoriteGenres.get(genre) || 0;
    if (prefScore > 2) {
      genreBoost += 3;
    } else if (prefScore > 1) {
      genreBoost += 2;
    }
  }
  if (genreBoost > 5) {
    boost += 5;
    boostedReasons.push('Matches your favorite genres');
  }

  // Studio preference boost
  for (const studio of targetAnime.studios?.nodes || []) {
    const prefScore = userPrefs.favoriteStudios.get(studio.name) || 0;
    if (prefScore > 1) {
      boost += 3;
      boostedReasons.push(`From a studio you enjoy: ${studio.name}`);
      break;
    }
  }

  // Format preference boost
  const formatPref = userPrefs.preferredFormats.get(targetAnime.format) || 0;
  if (formatPref > 2) {
    boost += 2;
  }

  const newOverall = Math.min(100, baseScore.overall + boost);

  return {
    ...baseScore,
    overall: newOverall,
    reasons: boostedReasons.slice(0, 4),
    matchType: getMatchType(newOverall),
  };
}
