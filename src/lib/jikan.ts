// Jikan API (MAL) - Fallback data source
// Documentation: https://docs.api.jikan.moe/

import { Anime, AnimeTag, AnimeTrailer, SearchFilters, StreamingLink } from '@/types/anime';

const JIKAN_BASE = 'https://api.jikan.moe/v4';

// Rate limiting helper
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1000ms between requests (Jikan rate limit is strict)
const MAX_RETRIES = 3;

async function jikanFetch<T>(endpoint: string, params?: Record<string, unknown>, retryCount = 0): Promise<T> {
  // Throttle requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  const url = new URL(`${JIKAN_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    // Retry on rate limit (429) or bad request (400 - often temporary)
    if ((response.status === 429 || response.status === 400) && retryCount < MAX_RETRIES) {
      const waitTime = MIN_REQUEST_INTERVAL * Math.pow(2, retryCount); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return jikanFetch<T>(endpoint, params, retryCount + 1);
    }
    if (response.status === 429) {
      throw new Error('JIKAN_RATE_LIMIT');
    }
    throw new Error(`Jikan API error: ${response.status}`);
  }

  const json = await response.json();
  return json;
}

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  images: {
    jpg: { large_image_url: string; image_url: string };
    webp?: { large_image_url: string };
  };
  synopsis: string | null;
  genres: { mal_id: number; name: string }[];
  themes: { mal_id: number; name: string }[];
  demographics: { mal_id: number; name: string }[];
  type: string | null;
  status: string | null;
  episodes: number | null;
  duration: string | null;
  season: string | null;
  year: number | null;
  aired: { prop: { from: { year: number | null; month: number | null; day: number | null } } };
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  source: string | null;
  rating: string | null;
  studios: { mal_id: number; name: string }[];
  trailer: { youtube_id: string | null; url: string | null } | null;
  streaming: { name: string; url: string }[] | null;
  broadcast?: {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  };
}

interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
}

interface JikanResponse<T> {
  data: T;
  pagination?: JikanPagination;
}

function mapJikanToAnime(jikan: JikanAnime): Anime {
  // Map Jikan type to our format
  const formatMap: Record<string, Anime['format']> = {
    'TV': 'TV',
    'Movie': 'MOVIE',
    'OVA': 'OVA',
    'ONA': 'ONA',
    'Special': 'SPECIAL',
    'Music': 'MUSIC',
  };

  // Map status
  const statusMap: Record<string, Anime['status']> = {
    'Finished Airing': 'FINISHED',
    'Currently Airing': 'RELEASING',
    'Not yet aired': 'NOT_YET_RELEASED',
  };

  // Map season
  const seasonMap: Record<string, Anime['season']> = {
    'winter': 'WINTER',
    'spring': 'SPRING',
    'summer': 'SUMMER',
    'fall': 'FALL',
  };

  // Combine genres, themes, demographics into tags
  const pseudoTags: AnimeTag[] = [
    ...jikan.genres.map(g => ({ name: g.name })),
    ...jikan.themes.map(t => ({ name: t.name })),
    ...jikan.demographics.map(d => ({ name: d.name })),
  ].slice(0, 10);

  // Parse duration (e.g., "24 min per ep" -> 24)
  let duration: number | undefined;
  if (jikan.duration) {
    const match = jikan.duration.match(/(\d+)/);
    if (match) duration = parseInt(match[1]);
  }

  // Build trailers array from Jikan data
  const trailers: AnimeTrailer[] = [];
  if (jikan.trailer?.youtube_id) {
    trailers.push({
      id: jikan.trailer.youtube_id,
      site: 'youtube',
      url: jikan.trailer.url || `https://www.youtube.com/watch?v=${jikan.trailer.youtube_id}`,
      thumbnail: `https://img.youtube.com/vi/${jikan.trailer.youtube_id}/maxresdefault.jpg`,
      title: 'Official Trailer',
    });
  }

  // Build streaming links from Jikan data
  const streamingLinks: StreamingLink[] = (jikan.streaming || []).map(stream => ({
    site: stream.name,
    url: stream.url,
  }));

  const result: Anime = {
    id: jikan.mal_id,
    malId: jikan.mal_id,
    title: {
      romaji: jikan.title,
      english: jikan.title_english || undefined,
      native: jikan.title_japanese || undefined,
    },
    coverImage: {
      large: jikan.images.webp?.large_image_url || jikan.images.jpg.large_image_url,
      medium: jikan.images.jpg.image_url,
    },
    description: jikan.synopsis || undefined,
    genres: jikan.genres.map(g => g.name),
    tags: pseudoTags,
    format: formatMap[jikan.type || ''] || 'TV',
    status: statusMap[jikan.status || ''] || 'FINISHED',
    episodes: jikan.episodes || undefined,
    duration,
    season: seasonMap[jikan.season?.toLowerCase() || ''] || undefined,
    seasonYear: jikan.year || undefined,
    startDate: jikan.aired?.prop?.from || undefined,
    averageScore: jikan.score ? Math.round(jikan.score * 10) : undefined,
    popularity: jikan.popularity || undefined,
    studios: jikan.studios.length > 0 ? { nodes: jikan.studios.map(s => ({ name: s.name })) } : undefined,
    rank: jikan.rank || undefined,
    members: jikan.members || undefined,
    source: jikan.source || undefined,
    rating: jikan.rating || undefined,
    trailerUrl: jikan.trailer?.url || undefined,
    trailers: trailers.length > 0 ? trailers : undefined,
    streamingLinks: streamingLinks.length > 0 ? streamingLinks : undefined,
    broadcast: jikan.broadcast ? {
      day: jikan.broadcast.day || undefined,
      time: jikan.broadcast.time || undefined,
      timezone: jikan.broadcast.timezone || 'JST',
    } : undefined,
  };
  return result;
}

// Genre mapping from AniList names to Jikan genre IDs
const JIKAN_GENRE_MAP: Record<string, number> = {
  'Action': 1, 'Adventure': 2, 'Avant Garde': 5, 'Award Winning': 46,
  'Boys Love': 28, 'Comedy': 4, 'Drama': 8, 'Fantasy': 10,
  'Girls Love': 26, 'Gourmet': 47, 'Horror': 14, 'Mystery': 7,
  'Romance': 22, 'Sci-Fi': 24, 'Slice of Life': 36, 'Sports': 30,
  'Supernatural': 37, 'Suspense': 41, 'Psychological': 40, 'Thriller': 41,
  'Mecha': 18, 'Mahou Shoujo': 25, 'Music': 19,
};

// Search anime with filters
export async function searchAnime(filters: SearchFilters): Promise<Anime[]> {
  const params: Record<string, unknown> = {
    limit: 20,
    sfw: filters.excludeNsfw ? true : undefined,
    order_by: 'score',
    sort: 'desc',
  };

  if (filters.query) params.q = filters.query;
  if (filters.genres?.length) {
    const genreIds = filters.genres
      .map(g => JIKAN_GENRE_MAP[g])
      .filter(Boolean)
      .join(',');
    if (genreIds) params.genres = genreIds;
  }
  if (filters.yearMin) params.start_date = `${filters.yearMin}-01-01`;
  if (filters.yearMax) params.end_date = `${filters.yearMax}-12-31`;
  if (filters.scoreMin) params.min_score = Math.floor(filters.scoreMin / 10);
  if (filters.status?.length) {
    const statusMap: Record<string, string> = {
      'FINISHED': 'complete',
      'RELEASING': 'airing',
      'NOT_YET_RELEASED': 'upcoming',
    };
    params.status = statusMap[filters.status[0]];
  }
  if (filters.format?.length) {
    const formatMap: Record<string, string> = {
      'TV': 'tv', 'MOVIE': 'movie', 'OVA': 'ova', 'ONA': 'ona', 'SPECIAL': 'special',
    };
    params.type = formatMap[filters.format[0]];
  }

  const response = await jikanFetch<JikanResponse<JikanAnime[]>>('/anime', params);
  return (response.data || []).map(mapJikanToAnime);
}

// Search with pagination
export async function searchAnimeWithPagination(
  filters: SearchFilters,
  page = 1
): Promise<{ animes: Anime[]; hasNextPage: boolean; currentPage: number; totalPages: number }> {
  const params: Record<string, unknown> = {
    page,
    limit: 20,
    sfw: filters.excludeNsfw ? true : undefined,
    order_by: 'score',
    sort: 'desc',
  };

  if (filters.query) params.q = filters.query;
  if (filters.genres?.length) {
    const genreIds = filters.genres
      .map(g => JIKAN_GENRE_MAP[g])
      .filter(Boolean)
      .join(',');
    if (genreIds) params.genres = genreIds;
  }
  if (filters.yearMin) params.start_date = `${filters.yearMin}-01-01`;
  if (filters.yearMax) params.end_date = `${filters.yearMax}-12-31`;
  if (filters.scoreMin) params.min_score = Math.floor(filters.scoreMin / 10);

  const response = await jikanFetch<JikanResponse<JikanAnime[]>>('/anime', params);
  
  return {
    animes: (response.data || []).map(mapJikanToAnime),
    hasNextPage: response.pagination?.has_next_page || false,
    currentPage: response.pagination?.current_page || page,
    totalPages: response.pagination?.last_visible_page || 1,
  };
}

// Get top anime (trending/popular equivalent)
export async function getTopAnime(page = 1, filter?: 'airing' | 'bypopularity' | 'favorite'): Promise<{ animes: Anime[]; hasNextPage: boolean; currentPage: number; totalPages: number }> {
  const params: Record<string, unknown> = { page, limit: 20 };
  if (filter) params.filter = filter;

  const response = await jikanFetch<JikanResponse<JikanAnime[]>>('/top/anime', params);

  return {
    animes: (response.data || []).map(mapJikanToAnime),
    hasNextPage: response.pagination?.has_next_page || false,
    currentPage: response.pagination?.current_page || page,
    totalPages: response.pagination?.last_visible_page || 1,
  };
}

// Get trending anime (currently airing top)
export async function getTrendingAnime(perPage = 10): Promise<Anime[]> {
  const response = await jikanFetch<JikanResponse<JikanAnime[]>>('/top/anime', {
    filter: 'airing',
    limit: perPage
  });
  return (response.data || []).map(mapJikanToAnime);
}

// Get popular anime (all time)
export async function getPopularAnime(perPage = 10): Promise<Anime[]> {
  const response = await jikanFetch<JikanResponse<JikanAnime[]>>('/top/anime', {
    filter: 'bypopularity',
    limit: perPage
  });
  return (response.data || []).map(mapJikanToAnime);
}

// Get seasonal anime
export async function getSeasonalAnime(perPage = 20, season?: string, year?: number): Promise<Anime[]> {
  let endpoint = '/seasons/now';
  if (season && year) {
    endpoint = `/seasons/${year}/${season.toLowerCase()}`;
  }

  const response = await jikanFetch<JikanResponse<JikanAnime[]>>(endpoint, { limit: perPage });
  return (response.data || []).map(mapJikanToAnime);
}

// Get anime by MAL ID
export async function getAnimeById(malId: number): Promise<Anime | null> {
  try {
    const response = await jikanFetch<JikanResponse<JikanAnime>>(`/anime/${malId}/full`);
    return mapJikanToAnime(response.data);
  } catch {
    return null;
  }
}

// Get anime characters
export interface JikanCharacter {
  character: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string } };
  };
  role: string;
  voice_actors: {
    person: { mal_id: number; name: string; images: { jpg: { image_url: string } } };
    language: string;
  }[];
}

export async function getAnimeCharacters(malId: number): Promise<{ character: { id: number; name: string; image: string }; role: string; voiceActor?: { id: number; name: string; image: string; language: string } }[]> {
  try {
    const response = await jikanFetch<JikanResponse<JikanCharacter[]>>(`/anime/${malId}/characters`);
    return response.data.slice(0, 12).map(char => ({
      character: {
        id: char.character.mal_id,
        name: char.character.name,
        image: char.character.images.jpg.image_url,
      },
      role: char.role,
      voiceActor: char.voice_actors.find(va => va.language === 'Japanese') ? {
        id: char.voice_actors[0].person.mal_id,
        name: char.voice_actors[0].person.name,
        image: char.voice_actors[0].person.images.jpg.image_url,
        language: char.voice_actors[0].language,
      } : undefined,
    }));
  } catch {
    return [];
  }
}

// Get anime staff
export async function getAnimeStaff(malId: number): Promise<{ person: { id: number; name: string; image: string }; role: string }[]> {
  try {
    const response = await jikanFetch<JikanResponse<{ person: { mal_id: number; name: string; images: { jpg: { image_url: string } } }; positions: string[] }[]>>(`/anime/${malId}/staff`);
    return response.data.slice(0, 10).map(s => ({
      person: {
        id: s.person.mal_id,
        name: s.person.name,
        image: s.person.images.jpg.image_url,
      },
      role: s.positions.join(', '),
    }));
  } catch {
    return [];
  }
}

// Get anime recommendations
export async function getSimilarAnime(malId: number, limit = 10): Promise<Anime[]> {
  try {
    const response = await jikanFetch<JikanResponse<{ entry: JikanAnime }[]>>(`/anime/${malId}/recommendations`);
    return response.data.slice(0, limit).map(r => mapJikanToAnime(r.entry));
  } catch {
    return [];
  }
}

// Paginated functions for consistency with AniList
export async function getTrendingAnimePaginated(page = 1, perPage = 20): Promise<{ animes: Anime[]; hasNextPage: boolean; currentPage: number; totalPages: number }> {
  return getTopAnime(page, 'airing');
}

export async function getPopularAnimePaginated(page = 1, perPage = 20): Promise<{ animes: Anime[]; hasNextPage: boolean; currentPage: number; totalPages: number }> {
  return getTopAnime(page, 'bypopularity');
}

export async function getSeasonalAnimePaginated(
  page = 1,
  perPage = 20,
  season?: string,
  year?: number
): Promise<{ animes: Anime[]; hasNextPage: boolean; currentPage: number; totalPages: number }> {
  // Determine endpoint based on season and year
  let endpoint = '/seasons/now';
  if (season && year) {
    endpoint = `/seasons/${year}/${season.toLowerCase()}`;
  } else if (year) {
    // If only year is provided, get current season of that year
    const month = new Date().getMonth() + 1;
    let currentSeason = 'winter';
    if (month >= 4 && month <= 6) currentSeason = 'spring';
    else if (month >= 7 && month <= 9) currentSeason = 'summer';
    else if (month >= 10 && month <= 12) currentSeason = 'fall';
    endpoint = `/seasons/${year}/${currentSeason}`;
  }

  const response = await jikanFetch<JikanResponse<JikanAnime[]>>(endpoint, { page, limit: Math.min(perPage, 25) });
  return {
    animes: (response.data || []).map(mapJikanToAnime),
    hasNextPage: response.pagination?.has_next_page || false,
    currentPage: response.pagination?.current_page || page,
    totalPages: response.pagination?.last_visible_page || 1,
  };
}
