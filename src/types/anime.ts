export interface AnimeTrailer {
  id: string;
  site: 'youtube' | 'dailymotion';
  url: string;
  thumbnail: string;
  title?: string;
}

export interface StreamingLink {
  site: string;
  url: string;
  icon?: string;
  color?: string;
  language?: string;
  regions?: string[];
}

export interface Anime {
  id: number;
  malId?: number;
  title: {
    romaji: string;
    english?: string;
    native?: string;
  };
  coverImage: {
    large: string;
    medium?: string;
    color?: string;
  };
  bannerImage?: string;
  description?: string;
  genres: string[];
  tags: AnimeTag[];
  format: 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'MUSIC';
  status: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  episodes?: number;
  duration?: number;
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  seasonYear?: number;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  averageScore?: number;
  popularity?: number;
  trending?: number;
  studios?: {
    nodes: { name: string }[];
  };
  // New Jikan-specific fields
  rank?: number;
  members?: number;
  source?: string;
  rating?: string;
  trailerUrl?: string;
  trailers?: AnimeTrailer[];
  broadcast?: {
    day?: string;
    time?: string;
    timezone?: string;
  };
  streamingLinks?: StreamingLink[];
}

export interface AnimeTag {
  name: string;
  rank?: number;
  category?: string;
}

export interface UserAnimeEntry {
  id?: string;
  animeId: number;
  userId: string;
  status: 'SAVED' | 'LOVED' | 'WATCHING' | 'WATCHED' | 'DROPPED';
  rating?: number;
  notes?: string;
  lastEpisodeWatched?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnimeCardData extends Anime {
  // Signature widgets
  vibeMeter: string[];
  finishability: number;
  modernity: {
    release: number;
    setting?: 'modern' | 'fantasy' | 'sci-fi' | 'historical' | 'mixed' | 'unknown';
  };
  energyLevel?: 'low' | 'medium' | 'high';
  tearRisk?: 'low' | 'medium' | 'high';
  // Recommendation specific
  reasons?: string[];
  matchType?: 'on-target' | 'adjacent' | 'wildcard';
}

export interface SearchFilters {
  query?: string;
  genres?: string[];
  excludeGenres?: string[];
  tags?: string[];
  excludeTags?: string[];
  studios?: string[];
  yearMin?: number;
  yearMax?: number;
  season?: string;
  seasonYear?: number;
  format?: string[] | string;
  status?: string[] | string;
  scoreMin?: number;
  scoreMax?: number;
  episodesMin?: number;
  episodesMax?: number;
  excludeNsfw?: boolean;
  sort?: 'TRENDING_DESC' | 'POPULARITY_DESC' | 'SCORE_DESC' | 'START_DATE_DESC';
}

export interface RecommendationRequest {
  seedAnimeIds?: number[];
  userPrompt?: string;
  constraints?: {
    era?: 'modern' | 'classic' | 'any';
    setting?: 'modern' | 'fantasy' | 'sci-fi' | 'any';
    tone?: string[];
    lengthPreference?: 'short' | 'medium' | 'long' | 'any';
    exclude?: string[];
  };
  count?: number;
}
