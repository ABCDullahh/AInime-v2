import { Anime, AnimeTag, AnimeTrailer, SearchFilters, StreamingLink } from '@/types/anime';

const ANILIST_ENDPOINT = '/api-proxy/anilist';

// AniList doesn't require API key for public queries
async function anilistFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const json = await response.json();
  
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'AniList API error');
  }

  return json.data;
}

// Common genres for filtering
export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
  'Horror', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
  'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Mecha'
];

interface AniListMedia {
  id: number;
  idMal: number | null;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    large: string;
    medium: string;
    extraLarge: string;
  };
  bannerImage: string | null;
  description: string | null;
  genres: string[];
  tags: { name: string; category: string; rank: number }[];
  format: 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'MUSIC' | 'TV_SHORT';
  status: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  episodes: number | null;
  duration: number | null;
  season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
  seasonYear: number | null;
  startDate: { year: number | null; month: number | null; day: number | null } | null;
  endDate: { year: number | null; month: number | null; day: number | null } | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number;
  trending: number;
  favourites: number;
  source: string | null;
  studios: { nodes: { name: string; isAnimationStudio: boolean }[] };
  trailer: { id: string; site: string } | null;
  rankings: { rank: number; type: string; context: string }[] | null;
  relations: {
    edges: {
      relationType: string;
      node: {
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { large: string };
        format: string;
      };
    }[];
  } | null;
  recommendations: {
    nodes: {
      mediaRecommendation: {
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { large: string };
        averageScore: number | null;
        format: string;
      } | null;
    }[];
  } | null;
  characters: {
    edges: {
      role: string;
      node: {
        id: number;
        name: { full: string };
        image: { large: string };
      };
      voiceActors: {
        id: number;
        name: { full: string };
        image: { large: string };
        languageV2: string;
      }[];
    }[];
  } | null;
  staff: {
    edges: {
      role: string;
      node: {
        id: number;
        name: { full: string };
        image: { large: string };
      };
    }[];
  } | null;
  externalLinks: {
    url: string;
    site: string;
    type: string;
    language: string | null;
    color: string | null;
    icon: string | null;
  }[] | null;
}

interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  perPage: number;
}

// Media fragment for reusable query parts
const MEDIA_FRAGMENT = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  coverImage {
    large
    medium
    extraLarge
  }
  bannerImage
  description(asHtml: false)
  genres
  tags {
    name
    category
    rank
  }
  format
  status
  episodes
  duration
  season
  seasonYear
  startDate {
    year
    month
    day
  }
  averageScore
  meanScore
  popularity
  trending
  favourites
  source
  studios {
    nodes {
      name
      isAnimationStudio
    }
  }
  trailer {
    id
    site
  }
  rankings {
    rank
    type
    context
  }
`;

const MEDIA_FULL_FRAGMENT = `
  ${MEDIA_FRAGMENT}
  endDate {
    year
    month
    day
  }
  relations {
    edges {
      relationType
      node {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        format
      }
    }
  }
  recommendations(perPage: 10) {
    nodes {
      mediaRecommendation {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        averageScore
        format
      }
    }
  }
  characters(perPage: 12, sort: [ROLE, FAVOURITES_DESC]) {
    edges {
      role
      node {
        id
        name {
          full
        }
        image {
          large
        }
      }
      voiceActors(language: JAPANESE, sort: RELEVANCE) {
        id
        name {
          full
        }
        image {
          large
        }
        languageV2
      }
    }
  }
  staff(perPage: 10) {
    edges {
      role
      node {
        id
        name {
          full
        }
        image {
          large
        }
      }
    }
  }
  externalLinks {
    url
    site
    type
    language
    color
    icon
  }
`;

function mapAniListMediaToAnime(media: AniListMedia): Anime {
  // Build pseudo-tags from AniList tags (more comprehensive than Jikan)
  const pseudoTags: AnimeTag[] = media.tags
    .filter(tag => tag.rank >= 50) // Only include relevant tags
    .slice(0, 10)
    .map(tag => ({
      name: tag.name,
      category: tag.category.toLowerCase(),
    }));

  // Find rank from rankings
  const overallRank = media.rankings?.find(r => r.type === 'RATED' && r.context === 'all time')?.rank;

  // Build trailer URL and trailers array
  let trailerUrl: string | undefined;
  const trailers: AnimeTrailer[] = [];

  if (media.trailer) {
    if (media.trailer.site === 'youtube') {
      trailerUrl = `https://www.youtube.com/watch?v=${media.trailer.id}`;
      trailers.push({
        id: media.trailer.id,
        site: 'youtube',
        url: trailerUrl,
        thumbnail: `https://img.youtube.com/vi/${media.trailer.id}/maxresdefault.jpg`,
        title: 'Official Trailer',
      });
    } else if (media.trailer.site === 'dailymotion') {
      trailerUrl = `https://www.dailymotion.com/video/${media.trailer.id}`;
      trailers.push({
        id: media.trailer.id,
        site: 'dailymotion',
        url: trailerUrl,
        thumbnail: `https://www.dailymotion.com/thumbnail/video/${media.trailer.id}`,
        title: 'Official Trailer',
      });
    }
  }

  // Get main animation studio
  const mainStudio = media.studios.nodes.find(s => s.isAnimationStudio) || media.studios.nodes[0];

  // Build streaming links from external links
  const streamingLinks: StreamingLink[] = (media.externalLinks || [])
    .filter(link => link.type === 'STREAMING')
    .map(link => ({
      site: link.site,
      url: link.url,
      icon: link.icon || undefined,
      color: link.color || undefined,
      language: link.language || undefined,
    }));

  return {
    id: media.id,
    malId: media.idMal || undefined,
    title: {
      romaji: media.title.romaji,
      english: media.title.english || undefined,
      native: media.title.native || undefined,
    },
    coverImage: {
      large: media.coverImage.extraLarge || media.coverImage.large,
      medium: media.coverImage.medium || media.coverImage.large,
    },
    bannerImage: media.bannerImage || undefined,
    description: media.description || undefined,
    genres: media.genres,
    tags: pseudoTags,
    format: media.format === 'TV_SHORT' ? 'TV' : media.format,
    status: media.status,
    episodes: media.episodes || undefined,
    duration: media.duration || undefined,
    season: media.season || undefined,
    seasonYear: media.seasonYear || undefined,
    startDate: media.startDate || undefined,
    averageScore: media.averageScore || undefined,
    popularity: media.popularity,
    studios: mainStudio ? { nodes: [{ name: mainStudio.name }] } : undefined,
    // Extended fields
    rank: overallRank,
    members: media.favourites,
    source: media.source || undefined,
    trailerUrl,
    trailers: trailers.length > 0 ? trailers : undefined,
    streamingLinks: streamingLinks.length > 0 ? streamingLinks : undefined,
  };
}

// Search anime with filters
export async function searchAnime(filters: SearchFilters): Promise<Anime[]> {
  const query = `
    query ($page: Int, $perPage: Int, $search: String, $genre_in: [String], $genre_not_in: [String], $tag_in: [String], $format_in: [MediaFormat], $status_in: [MediaStatus], $seasonYear: Int, $startDate_greater: FuzzyDateInt, $startDate_lesser: FuzzyDateInt, $averageScore_greater: Int, $averageScore_lesser: Int, $episodes_greater: Int, $episodes_lesser: Int, $sort: [MediaSort], $isAdult: Boolean) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, search: $search, genre_in: $genre_in, genre_not_in: $genre_not_in, tag_in: $tag_in, format_in: $format_in, status_in: $status_in, seasonYear: $seasonYear, startDate_greater: $startDate_greater, startDate_lesser: $startDate_lesser, averageScore_greater: $averageScore_greater, averageScore_lesser: $averageScore_lesser, episodes_greater: $episodes_greater, episodes_lesser: $episodes_lesser, sort: $sort, isAdult: $isAdult) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;

  const variables: Record<string, unknown> = {
    page: 1,
    perPage: 20,
    isAdult: filters.excludeNsfw ? false : undefined,
  };

  if (filters.query) {
    variables.search = filters.query;
  }

  if (filters.genres?.length) {
    variables.genre_in = filters.genres;
  }

  if (filters.excludeGenres?.length) {
    variables.genre_not_in = filters.excludeGenres;
  }

  if (filters.tags?.length) {
    variables.tag_in = filters.tags;
  }

  if (filters.format?.length) {
    variables.format_in = filters.format;
  }

  if (filters.status?.length) {
    variables.status_in = filters.status;
  }

  if (filters.yearMin) {
    variables.startDate_greater = filters.yearMin * 10000; // FuzzyDateInt format YYYYMMDD
  }

  if (filters.yearMax) {
    variables.startDate_lesser = (filters.yearMax + 1) * 10000;
  }

  if (filters.scoreMin) {
    variables.averageScore_greater = filters.scoreMin;
  }

  if (filters.scoreMax) {
    variables.averageScore_lesser = filters.scoreMax;
  }

  if (filters.episodesMin) {
    variables.episodes_greater = filters.episodesMin - 1;
  }

  if (filters.episodesMax) {
    variables.episodes_lesser = filters.episodesMax + 1;
  }

  // Sort mapping
  const sortMap: Record<string, string[]> = {
    'TRENDING_DESC': ['TRENDING_DESC', 'POPULARITY_DESC'],
    'POPULARITY_DESC': ['POPULARITY_DESC'],
    'SCORE_DESC': ['SCORE_DESC'],
    'START_DATE_DESC': ['START_DATE_DESC'],
  };
  variables.sort = sortMap[filters.sort || 'SCORE_DESC'] || ['SCORE_DESC'];

  let data = await anilistFetch<{ Page: { media: AniListMedia[]; pageInfo: PageInfo } }>(query, variables);

  // Post-filter by studio if specified (AniList doesn't have native studio filter)
  if (filters.studios?.length) {
    const studioFilters = filters.studios.map(s => s.toLowerCase());
    data = {
      ...data,
      Page: {
        ...data.Page,
        media: data.Page.media.filter(anime =>
          anime.studios.nodes.some(studio =>
            studioFilters.some(sf =>
              studio.name.toLowerCase().includes(sf)
            )
          )
        ),
      },
    };
  }

  return data.Page.media.map(mapAniListMediaToAnime);
}

// Get trending anime (currently airing with high trending score)
export async function getTrendingAnime(perPage = 10): Promise<Anime[]> {
  const query = `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: [TRENDING_DESC], status: RELEASING, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;

  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(query, { perPage });
  return data.Page.media.map(mapAniListMediaToAnime);
}

// Get popular anime (all time)
export async function getPopularAnime(perPage = 10): Promise<Anime[]> {
  const query = `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: [POPULARITY_DESC], isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;

  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(query, { perPage });
  return data.Page.media.map(mapAniListMediaToAnime);
}

// Get current season anime
export async function getSeasonalAnime(perPage = 20, seasonParam?: string, yearParam?: number): Promise<Anime[]> {
  // Determine current season if not provided
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = yearParam || now.getFullYear();

  let season: string = seasonParam || '';
  if (!season) {
    if (month >= 1 && month <= 3) season = 'WINTER';
    else if (month >= 4 && month <= 6) season = 'SPRING';
    else if (month >= 7 && month <= 9) season = 'SUMMER';
    else season = 'FALL';
  }

  const query = `
    query ($perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: [POPULARITY_DESC], isAdult: false, status_in: [RELEASING, NOT_YET_RELEASED, FINISHED]) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;

  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(query, { perPage, season, seasonYear: year });
  return data.Page.media.map(mapAniListMediaToAnime);
}

// Get seasonal anime with pagination
export async function getSeasonalAnimePaginated(
  page = 1,
  perPage = 20,
  seasonParam?: string,
  yearParam?: number
): Promise<{ animes: Anime[]; hasNextPage: boolean; currentPage: number; totalPages: number }> {
  // Determine current season if not provided
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = yearParam || now.getFullYear();

  let season: string = seasonParam || '';
  if (!season) {
    if (month >= 1 && month <= 3) season = 'WINTER';
    else if (month >= 4 && month <= 6) season = 'SPRING';
    else if (month >= 7 && month <= 9) season = 'SUMMER';
    else season = 'FALL';
  }

  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: [POPULARITY_DESC], isAdult: false, status_in: [RELEASING, NOT_YET_RELEASED, FINISHED]) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;

  const data = await anilistFetch<{ Page: { media: AniListMedia[]; pageInfo: PageInfo } }>(query, {
    page,
    perPage,
    season,
    seasonYear: year
  });

  return {
    animes: data.Page.media.map(mapAniListMediaToAnime),
    hasNextPage: data.Page.pageInfo.hasNextPage,
    currentPage: data.Page.pageInfo.currentPage,
    totalPages: data.Page.pageInfo.lastPage,
  };
}

// Get anime by ID with full details
export async function getAnimeById(id: number): Promise<Anime | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FULL_FRAGMENT}
      }
    }
  `;

  const data = await anilistFetch<{ Media: AniListMedia }>(query, { id });
  return mapAniListMediaToAnime(data.Media);
}

// Character and staff types
export interface AnimeCharacter {
  character: {
    id: number;
    name: string;
    image: string;
  };
  role: string;
  voiceActor?: {
    id: number;
    name: string;
    image: string;
    language: string;
  };
}

export interface AnimeStaff {
  person: {
    id: number;
    name: string;
    image: string;
  };
  role: string;
}

// Get anime characters
export async function getAnimeCharacters(id: number): Promise<AnimeCharacter[]> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        characters(perPage: 12, sort: [ROLE, FAVOURITES_DESC]) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
            voiceActors(language: JAPANESE, sort: RELEVANCE) {
              id
              name {
                full
              }
              image {
                large
              }
              languageV2
            }
          }
        }
      }
    }
  `;

  const data = await anilistFetch<{ Media: { characters: AniListMedia['characters'] } }>(query, { id });

  if (!data.Media.characters) return [];

  return data.Media.characters.edges.map(edge => ({
    character: {
      id: edge.node.id,
      name: edge.node.name.full,
      image: edge.node.image.large,
    },
    role: edge.role,
    voiceActor: edge.voiceActors[0] ? {
      id: edge.voiceActors[0].id,
      name: edge.voiceActors[0].name.full,
      image: edge.voiceActors[0].image.large,
      language: edge.voiceActors[0].languageV2,
    } : undefined,
  }));
}

// Get anime staff
export async function getAnimeStaff(id: number): Promise<AnimeStaff[]> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        staff(perPage: 10) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
      }
    }
  `;

  const data = await anilistFetch<{ Media: { staff: AniListMedia['staff'] } }>(query, { id });

  if (!data.Media.staff) return [];

  return data.Media.staff.edges.map(edge => ({
    person: {
      id: edge.node.id,
      name: edge.node.name.full,
      image: edge.node.image.large,
    },
    role: edge.role,
  }));
}

// Get similar/recommended anime
export async function getSimilarAnime(id: number, perPage = 10): Promise<Anime[]> {
  const query = `
    query ($id: Int, $perPage: Int) {
      Media(id: $id, type: ANIME) {
        recommendations(perPage: $perPage, sort: [RATING_DESC]) {
          nodes {
            mediaRecommendation {
              ${MEDIA_FRAGMENT}
            }
          }
        }
      }
    }
  `;

  const data = await anilistFetch<{ Media: { recommendations: { nodes: { mediaRecommendation: AniListMedia | null }[] } } }>(query, { id, perPage });

  return data.Media.recommendations.nodes
    .filter(node => node.mediaRecommendation !== null)
    .map(node => mapAniListMediaToAnime(node.mediaRecommendation!));
}

// Search with pagination
export async function searchAnimeWithPagination(
  filters: SearchFilters,
  page = 1
): Promise<{ animes: Anime[]; hasNextPage: boolean; currentPage: number; totalPages: number }> {
  const query = `
    query ($page: Int, $perPage: Int, $search: String, $genre_in: [String], $genre_not_in: [String], $tag_in: [String], $format_in: [MediaFormat], $status_in: [MediaStatus], $startDate_greater: FuzzyDateInt, $startDate_lesser: FuzzyDateInt, $averageScore_greater: Int, $averageScore_lesser: Int, $episodes_greater: Int, $episodes_lesser: Int, $sort: [MediaSort], $isAdult: Boolean) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, search: $search, genre_in: $genre_in, genre_not_in: $genre_not_in, tag_in: $tag_in, format_in: $format_in, status_in: $status_in, startDate_greater: $startDate_greater, startDate_lesser: $startDate_lesser, averageScore_greater: $averageScore_greater, averageScore_lesser: $averageScore_lesser, episodes_greater: $episodes_greater, episodes_lesser: $episodes_lesser, sort: $sort, isAdult: $isAdult) {
          ${MEDIA_FRAGMENT}
        }
      }
    }
  `;

  const variables: Record<string, unknown> = {
    page,
    perPage: 20,
    isAdult: filters.excludeNsfw ? false : undefined,
  };

  if (filters.query) variables.search = filters.query;
  if (filters.genres?.length) variables.genre_in = filters.genres;
  if (filters.excludeGenres?.length) variables.genre_not_in = filters.excludeGenres;
  if (filters.tags?.length) variables.tag_in = filters.tags;
  if (filters.format?.length) variables.format_in = filters.format;
  if (filters.status?.length) variables.status_in = filters.status;
  if (filters.yearMin) variables.startDate_greater = filters.yearMin * 10000;
  if (filters.yearMax) variables.startDate_lesser = (filters.yearMax + 1) * 10000;
  if (filters.scoreMin) variables.averageScore_greater = filters.scoreMin;
  if (filters.scoreMax) variables.averageScore_lesser = filters.scoreMax;
  if (filters.episodesMin) variables.episodes_greater = filters.episodesMin - 1;
  if (filters.episodesMax) variables.episodes_lesser = filters.episodesMax + 1;

  const sortMap: Record<string, string[]> = {
    'TRENDING_DESC': ['TRENDING_DESC', 'POPULARITY_DESC'],
    'POPULARITY_DESC': ['POPULARITY_DESC'],
    'SCORE_DESC': ['SCORE_DESC'],
    'START_DATE_DESC': ['START_DATE_DESC'],
  };
  variables.sort = sortMap[filters.sort || 'SCORE_DESC'] || ['SCORE_DESC'];

  let data = await anilistFetch<{ Page: { media: AniListMedia[]; pageInfo: PageInfo } }>(query, variables);

  // Post-filter by studio if specified (AniList doesn't have native studio filter)
  if (filters.studios?.length) {
    const studioFilters = filters.studios.map(s => s.toLowerCase());
    data = {
      ...data,
      Page: {
        ...data.Page,
        media: data.Page.media.filter(anime =>
          anime.studios.nodes.some(studio =>
            studioFilters.some(sf =>
              studio.name.toLowerCase().includes(sf)
            )
          )
        ),
      },
    };
  }

  return {
    animes: data.Page.media.map(mapAniListMediaToAnime),
    hasNextPage: data.Page.pageInfo.hasNextPage,
    currentPage: data.Page.pageInfo.currentPage,
    totalPages: data.Page.pageInfo.lastPage,
  };
}
