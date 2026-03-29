// Anime Data Orchestrator
// Primary: AniList GraphQL API
// Fallback: Jikan API (MAL)

import * as anilist from './anilist';
import * as jikan from './jikan';
import { Anime, SearchFilters } from '@/types/anime';
import { AnimeCharacter, AnimeStaff } from './anilist';
import { fetchKitsuImages, replaceWithKitsuImage } from './kitsuImages';

/**
 * Replace blocked MAL/AniList image URLs with Kitsu CDN URLs.
 * Called after fetching anime data to fix images on corporate networks.
 */
async function patchImages(animes: Anime[]): Promise<void> {
  const malIds = animes
    .map(a => a.malId || (a.id && a.id < 100000 ? a.id : undefined))
    .filter((id): id is number => id !== undefined);
  if (malIds.length === 0) return;
  try {
    const kitsuMap = await fetchKitsuImages(malIds);
    for (const anime of animes) {
      const malId = anime.malId || (anime.id && anime.id < 100000 ? anime.id : undefined);
      if (malId) replaceWithKitsuImage(anime as Anime & { malId: number }, kitsuMap);
    }
  } catch {
    // Silent fail - keep original URLs
  }
}

async function patchSingleImage(anime: Anime | null): Promise<void> {
  if (!anime) return;
  await patchImages([anime]);
}

export type DataSource = 'anilist' | 'jikan';

interface PaginatedResult<T> {
  data: T;
  source: DataSource;
  hasNextPage: boolean;
  currentPage: number;
  totalPages: number;
}

interface FetchResult<T> {
  data: T;
  source: DataSource;
}

// Global state for diagnostics
let currentSource: DataSource = 'jikan';
let lastRequest: { endpoint: string; variables?: unknown; timestamp: number } | null = null;
let forceJikan = false;
let anilistBlocked = false; // Auto-detected when AniList returns non-JSON (firewall)

// Diagnostics API
export function getDiagnostics() {
  return {
    currentSource,
    lastRequest,
    forceJikan,
    anilistBlocked,
  };
}

export function setForceJikan(force: boolean) {
  forceJikan = force;
  currentSource = force ? 'jikan' : 'anilist';
}

function logRequest(endpoint: string, variables?: unknown) {
  lastRequest = { endpoint, variables, timestamp: Date.now() };
}

// Probe AniList once on startup to detect if blocked
async function probeAniList(): Promise<void> {
  try {
    const res = await fetch('/api-proxy/anilist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    const text = await res.text();
    if (text.startsWith('<!') || !text.startsWith('{')) {
      anilistBlocked = true;
      forceJikan = true;
      currentSource = 'jikan';
      console.info('[AInime] AniList blocked by network — using Jikan exclusively');
    }
  } catch {
    anilistBlocked = true;
    forceJikan = true;
    currentSource = 'jikan';
    console.info('[AInime] AniList unreachable — using Jikan exclusively');
  }
}
// Run probe immediately
probeAniList();

// Retry helper with fallback
async function withFallback<T>(
  anilistFn: () => Promise<T>,
  jikanFn: () => Promise<T>,
  operationName: string
): Promise<FetchResult<T>> {
  // If AniList is blocked or Jikan forced, skip AniList entirely
  if (forceJikan || anilistBlocked) {
    logRequest(`jikan:${operationName}`);
    currentSource = 'jikan';
    const data = await jikanFn();
    return { data, source: 'jikan' };
  }

  // Try AniList first
  try {
    logRequest(`anilist:${operationName}`);
    currentSource = 'anilist';
    const data = await anilistFn();
    return { data, source: 'anilist' };
  } catch (error) {
    // Auto-detect AniList block (HTML response = firewall)
    if (error instanceof SyntaxError && String(error.message).includes('Unexpected token')) {
      anilistBlocked = true;
      forceJikan = true;
      console.info('[AInime] AniList blocked detected — switching to Jikan permanently');
    }

    // Try Jikan as fallback
    try {
      logRequest(`jikan:${operationName} (fallback)`);
      currentSource = 'jikan';
      const data = await jikanFn();
      return { data, source: 'jikan' };
    } catch (jikanError) {
      console.error(`Jikan ${operationName} also failed:`, jikanError);
      throw jikanError;
    }
  }
}

// ========== SEARCH ==========

export async function searchAnime(filters: SearchFilters): Promise<FetchResult<Anime[]>> {
  const result = await withFallback(
    () => anilist.searchAnime(filters),
    () => jikan.searchAnime(filters),
    'searchAnime'
  );
  await patchImages(result.data);
  return result;
}

export async function searchAnimeWithPagination(
  filters: SearchFilters,
  page = 1
): Promise<PaginatedResult<Anime[]>> {
  const result = await withFallback(
    async () => {
      const r = await anilist.searchAnimeWithPagination(filters, page);
      return { animes: r.animes, hasNextPage: r.hasNextPage, currentPage: r.currentPage, totalPages: r.totalPages };
    },
    async () => {
      const r = await jikan.searchAnimeWithPagination(filters, page);
      return { animes: r.animes, hasNextPage: r.hasNextPage, currentPage: r.currentPage, totalPages: r.totalPages };
    },
    'searchAnimeWithPagination'
  );

  await patchImages(result.data.animes);
  return {
    data: result.data.animes,
    source: result.source,
    hasNextPage: result.data.hasNextPage,
    currentPage: result.data.currentPage,
    totalPages: result.data.totalPages,
  };
}

// ========== DISCOVER LISTS ==========

export async function getTrendingAnime(page = 1, perPage = 20): Promise<PaginatedResult<Anime[]>> {
  const result = await withFallback(
    async () => {
      // AniList doesn't have native pagination for trending, simulate it
      if (page === 1) {
        const animes = await anilist.getTrendingAnime(perPage);
        return { animes, hasNextPage: animes.length >= perPage, currentPage: 1, totalPages: 5 };
      }
      // For subsequent pages, use search with trending sort
      const r = await anilist.searchAnimeWithPagination({ sort: 'TRENDING_DESC', status: ['RELEASING'] }, page);
      return { animes: r.animes, hasNextPage: r.hasNextPage, currentPage: r.currentPage, totalPages: r.totalPages };
    },
    async () => {
      const r = await jikan.getTrendingAnimePaginated(page, perPage);
      return { animes: r.animes, hasNextPage: r.hasNextPage, currentPage: r.currentPage, totalPages: r.totalPages };
    },
    'getTrendingAnime'
  );

  await patchImages(result.data.animes);
  return {
    data: result.data.animes,
    source: result.source,
    hasNextPage: result.data.hasNextPage,
    currentPage: result.data.currentPage,
    totalPages: result.data.totalPages,
  };
}

export async function getPopularAnime(page = 1, perPage = 20): Promise<PaginatedResult<Anime[]>> {
  const result = await withFallback(
    async () => {
      if (page === 1) {
        const animes = await anilist.getPopularAnime(perPage);
        return { animes, hasNextPage: animes.length >= perPage, currentPage: 1, totalPages: 10 };
      }
      const r = await anilist.searchAnimeWithPagination({ sort: 'POPULARITY_DESC' }, page);
      return { animes: r.animes, hasNextPage: r.hasNextPage, currentPage: r.currentPage, totalPages: r.totalPages };
    },
    async () => {
      const r = await jikan.getPopularAnimePaginated(page, perPage);
      return { animes: r.animes, hasNextPage: r.hasNextPage, currentPage: r.currentPage, totalPages: r.totalPages };
    },
    'getPopularAnime'
  );

  await patchImages(result.data.animes);
  return {
    data: result.data.animes,
    source: result.source,
    hasNextPage: result.data.hasNextPage,
    currentPage: result.data.currentPage,
    totalPages: result.data.totalPages,
  };
}

export async function getSeasonalAnime(page = 1, perPage = 20, season?: string, year?: number): Promise<PaginatedResult<Anime[]>> {
  // Always use Jikan for seasonal data — only Jikan provides broadcast day/time info
  // AniList doesn't have broadcast schedules, making the calendar day filter useless
  const result = await withFallback(
    async () => {
      const r = await jikan.getSeasonalAnimePaginated(page, perPage, season, year);
      return { animes: r.animes, hasNextPage: r.hasNextPage, currentPage: r.currentPage, totalPages: r.totalPages };
    },
    async () => {
      const r = await jikan.getSeasonalAnimePaginated(page, perPage, season, year);
      return { animes: r.animes, hasNextPage: r.hasNextPage, currentPage: r.currentPage, totalPages: r.totalPages };
    },
    'getSeasonalAnime'
  );

  await patchImages(result.data.animes);
  return {
    data: result.data.animes,
    source: result.source,
    hasNextPage: result.data.hasNextPage,
    currentPage: result.data.currentPage,
    totalPages: result.data.totalPages,
  };
}

// ========== DETAIL ==========

export async function getAnimeDetail(id: number, malId?: number): Promise<FetchResult<Anime | null>> {
  const result = await withFallback(
    () => anilist.getAnimeById(id),
    async () => {
      const effectiveId = malId || id;
      return jikan.getAnimeById(effectiveId);
    },
    'getAnimeDetail'
  );
  await patchSingleImage(result.data);
  return result;
}

export async function getAnimeCharacters(id: number, malId?: number): Promise<FetchResult<AnimeCharacter[]>> {
  return withFallback(
    () => anilist.getAnimeCharacters(id),
    async () => {
      const effectiveId = malId || id;
      return jikan.getAnimeCharacters(effectiveId);
    },
    'getAnimeCharacters'
  );
}

export async function getAnimeStaff(id: number, malId?: number): Promise<FetchResult<AnimeStaff[]>> {
  return withFallback(
    () => anilist.getAnimeStaff(id),
    async () => {
      const effectiveId = malId || id;
      return jikan.getAnimeStaff(effectiveId);
    },
    'getAnimeStaff'
  );
}

export async function getSimilarAnime(id: number, malId?: number, limit = 10): Promise<FetchResult<Anime[]>> {
  const result = await withFallback(
    () => anilist.getSimilarAnime(id, limit),
    async () => {
      const effectiveId = malId || id;
      return jikan.getSimilarAnime(effectiveId, limit);
    },
    'getSimilarAnime'
  );
  await patchImages(result.data);
  return result;
}

// Re-export types and utilities
export { GENRES } from './anilist';
export type { AnimeCharacter, AnimeStaff } from './anilist';
