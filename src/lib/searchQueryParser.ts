/**
 * Advanced Search Query Parser
 *
 * Supports:
 * - Boolean operators: AND, OR, NOT (case insensitive)
 * - Advanced filters: studio:, year:, genre:, format:, score:, status:, episodes:, tag:
 * - Year ranges: year:2020-2023
 * - Score thresholds: score:>80, score:>=75
 * - Episode ranges: episodes:12-24, episodes:<50
 * - Quoted strings for exact phrase matching: "attack on titan"
 * - Negation prefix: -genre:Horror (excludes Horror)
 *
 * Examples:
 * - action AND romance NOT horror
 * - "Kyoto Animation" year:2020-2023
 * - studio:MAPPA genre:Action score:>80
 * - fantasy OR isekai -genre:Ecchi
 */

import { SearchFilters } from '@/types/anime';

export interface ParsedQuery {
  // The main text query (terms not part of filters)
  textQuery: string;
  // Terms that must be included (from AND)
  includeTerms: string[];
  // Terms that must be excluded (from NOT)
  excludeTerms: string[];
  // Advanced filters parsed from the query
  filters: {
    studios?: string[];
    genres?: string[];
    excludeGenres?: string[];
    tags?: string[];
    excludeTags?: string[];
    yearMin?: number;
    yearMax?: number;
    scoreMin?: number;
    scoreMax?: number;
    format?: string[];
    status?: string[];
    episodesMin?: number;
    episodesMax?: number;
  };
  // Raw parsed tokens for debugging
  tokens: QueryToken[];
}

interface QueryToken {
  type: 'term' | 'operator' | 'filter' | 'phrase';
  value: string;
  filterKey?: string;
  filterValue?: string;
  negated?: boolean;
}

// Filter key mappings (aliases)
const FILTER_ALIASES: Record<string, string> = {
  'studio': 'studio',
  'studios': 'studio',
  'producer': 'studio',
  'year': 'year',
  'yr': 'year',
  'genre': 'genre',
  'genres': 'genre',
  'g': 'genre',
  'format': 'format',
  'type': 'format',
  'f': 'format',
  'score': 'score',
  'rating': 'score',
  's': 'score',
  'status': 'status',
  'st': 'status',
  'episodes': 'episodes',
  'eps': 'episodes',
  'ep': 'episodes',
  'tag': 'tag',
  'tags': 'tag',
  't': 'tag',
};

// Format value mappings
const FORMAT_ALIASES: Record<string, string> = {
  'tv': 'TV',
  'movie': 'MOVIE',
  'movies': 'MOVIE',
  'film': 'MOVIE',
  'ova': 'OVA',
  'ona': 'ONA',
  'special': 'SPECIAL',
  'specials': 'SPECIAL',
  'music': 'MUSIC',
};

// Status value mappings
const STATUS_ALIASES: Record<string, string> = {
  'airing': 'RELEASING',
  'releasing': 'RELEASING',
  'ongoing': 'RELEASING',
  'current': 'RELEASING',
  'finished': 'FINISHED',
  'completed': 'FINISHED',
  'complete': 'FINISHED',
  'ended': 'FINISHED',
  'upcoming': 'NOT_YET_RELEASED',
  'notyet': 'NOT_YET_RELEASED',
  'announced': 'NOT_YET_RELEASED',
  'cancelled': 'CANCELLED',
  'canceled': 'CANCELLED',
  'hiatus': 'HIATUS',
};

/**
 * Tokenize the search query into individual tokens
 */
function tokenize(query: string): QueryToken[] {
  const tokens: QueryToken[] = [];
  let remaining = query.trim();

  while (remaining.length > 0) {
    remaining = remaining.trim();
    if (remaining.length === 0) break;

    // Check for quoted phrase
    if (remaining.startsWith('"') || remaining.startsWith("'")) {
      const quote = remaining[0];
      const endQuote = remaining.indexOf(quote, 1);
      if (endQuote > 0) {
        tokens.push({
          type: 'phrase',
          value: remaining.substring(1, endQuote),
        });
        remaining = remaining.substring(endQuote + 1);
        continue;
      }
    }

    // Check for negated filter (-genre:Horror)
    const negatedFilterMatch = remaining.match(/^-(\w+):("[^"]+"|'[^']+'|[^\s]+)/i);
    if (negatedFilterMatch) {
      const key = negatedFilterMatch[1].toLowerCase();
      let value = negatedFilterMatch[2];
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      tokens.push({
        type: 'filter',
        value: `${key}:${value}`,
        filterKey: FILTER_ALIASES[key] || key,
        filterValue: value,
        negated: true,
      });
      remaining = remaining.substring(negatedFilterMatch[0].length);
      continue;
    }

    // Check for filter (key:value)
    const filterMatch = remaining.match(/^(\w+):("[^"]+"|'[^']+'|[^\s]+)/i);
    if (filterMatch) {
      const key = filterMatch[1].toLowerCase();
      let value = filterMatch[2];
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      tokens.push({
        type: 'filter',
        value: filterMatch[0],
        filterKey: FILTER_ALIASES[key] || key,
        filterValue: value,
        negated: false,
      });
      remaining = remaining.substring(filterMatch[0].length);
      continue;
    }

    // Check for boolean operators
    const operatorMatch = remaining.match(/^(AND|OR|NOT)\b/i);
    if (operatorMatch) {
      tokens.push({
        type: 'operator',
        value: operatorMatch[1].toUpperCase(),
      });
      remaining = remaining.substring(operatorMatch[0].length);
      continue;
    }

    // Check for negation prefix on term
    if (remaining.startsWith('-') && remaining.length > 1 && !remaining.startsWith('- ')) {
      const termMatch = remaining.match(/^-([^\s]+)/);
      if (termMatch) {
        tokens.push({
          type: 'term',
          value: termMatch[1],
          negated: true,
        });
        remaining = remaining.substring(termMatch[0].length);
        continue;
      }
    }

    // Regular term
    const termMatch = remaining.match(/^[^\s]+/);
    if (termMatch) {
      tokens.push({
        type: 'term',
        value: termMatch[0],
      });
      remaining = remaining.substring(termMatch[0].length);
    }
  }

  return tokens;
}

/**
 * Parse a year range like "2020-2023" or single year "2020"
 */
function parseYearRange(value: string): { min?: number; max?: number } {
  // Range format: 2020-2023
  const rangeMatch = value.match(/^(\d{4})-(\d{4})$/);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10),
    };
  }

  // Single year
  const yearMatch = value.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    return { min: year, max: year };
  }

  // Comparison operators
  const compMatch = value.match(/^([<>=]+)(\d{4})$/);
  if (compMatch) {
    const op = compMatch[1];
    const year = parseInt(compMatch[2], 10);
    if (op === '>') return { min: year + 1 };
    if (op === '>=') return { min: year };
    if (op === '<') return { max: year - 1 };
    if (op === '<=') return { max: year };
  }

  return {};
}

/**
 * Parse a score value like ">80", ">=75", or "80"
 */
function parseScoreValue(value: string): { min?: number; max?: number } {
  // Comparison operators
  const compMatch = value.match(/^([<>=]+)(\d+)$/);
  if (compMatch) {
    const op = compMatch[1];
    const score = parseInt(compMatch[2], 10);
    if (op === '>') return { min: score + 1 };
    if (op === '>=') return { min: score };
    if (op === '<') return { max: score - 1 };
    if (op === '<=') return { max: score };
  }

  // Range format: 70-90
  const rangeMatch = value.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1], 10),
      max: parseInt(rangeMatch[2], 10),
    };
  }

  // Single value treated as minimum
  const numMatch = value.match(/^(\d+)$/);
  if (numMatch) {
    return { min: parseInt(numMatch[1], 10) };
  }

  return {};
}

/**
 * Parse an episodes value like "12", "12-24", ">50"
 */
function parseEpisodesValue(value: string): { min?: number; max?: number } {
  // Same logic as score
  return parseScoreValue(value);
}

/**
 * Parse the query string into a structured ParsedQuery object
 */
export function parseSearchQuery(query: string): ParsedQuery {
  const tokens = tokenize(query);
  const result: ParsedQuery = {
    textQuery: '',
    includeTerms: [],
    excludeTerms: [],
    filters: {},
    tokens,
  };

  const textParts: string[] = [];
  let currentOperator: 'AND' | 'OR' | 'NOT' | null = null;
  let previousWasNot = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'operator') {
      currentOperator = token.value as 'AND' | 'OR' | 'NOT';
      previousWasNot = token.value === 'NOT';
      continue;
    }

    if (token.type === 'filter' && token.filterKey && token.filterValue) {
      const key = token.filterKey;
      const value = token.filterValue;
      const negated = token.negated || previousWasNot;

      switch (key) {
        case 'studio':
          if (!result.filters.studios) result.filters.studios = [];
          result.filters.studios.push(value);
          break;

        case 'genre':
          if (negated) {
            if (!result.filters.excludeGenres) result.filters.excludeGenres = [];
            result.filters.excludeGenres.push(value);
          } else {
            if (!result.filters.genres) result.filters.genres = [];
            result.filters.genres.push(value);
          }
          break;

        case 'tag':
          if (negated) {
            if (!result.filters.excludeTags) result.filters.excludeTags = [];
            result.filters.excludeTags.push(value);
          } else {
            if (!result.filters.tags) result.filters.tags = [];
            result.filters.tags.push(value);
          }
          break;

        case 'year': {
          const yearRange = parseYearRange(value);
          if (yearRange.min !== undefined) result.filters.yearMin = yearRange.min;
          if (yearRange.max !== undefined) result.filters.yearMax = yearRange.max;
          break;
        }

        case 'score': {
          const scoreRange = parseScoreValue(value);
          if (scoreRange.min !== undefined) result.filters.scoreMin = scoreRange.min;
          if (scoreRange.max !== undefined) result.filters.scoreMax = scoreRange.max;
          break;
        }

        case 'format': {
          const normalizedFormat = FORMAT_ALIASES[value.toLowerCase()] || value.toUpperCase();
          if (!result.filters.format) result.filters.format = [];
          result.filters.format.push(normalizedFormat);
          break;
        }

        case 'status': {
          const normalizedStatus = STATUS_ALIASES[value.toLowerCase()] || value.toUpperCase();
          if (!result.filters.status) result.filters.status = [];
          result.filters.status.push(normalizedStatus);
          break;
        }

        case 'episodes': {
          const epsRange = parseEpisodesValue(value);
          if (epsRange.min !== undefined) result.filters.episodesMin = epsRange.min;
          if (epsRange.max !== undefined) result.filters.episodesMax = epsRange.max;
          break;
        }
      }

      previousWasNot = false;
      continue;
    }

    if (token.type === 'term' || token.type === 'phrase') {
      const isExcluded = token.negated || previousWasNot;

      if (isExcluded) {
        // Check if it looks like a genre name
        const genreLike = token.value.charAt(0).toUpperCase() + token.value.slice(1).toLowerCase();
        const commonGenres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
          'Mystery', 'Psychological', 'Romance', 'Sci-fi', 'Slice of life', 'Sports',
          'Supernatural', 'Thriller', 'Mecha', 'Ecchi', 'Hentai', 'Gore'];

        if (commonGenres.some(g => g.toLowerCase() === token.value.toLowerCase())) {
          if (!result.filters.excludeGenres) result.filters.excludeGenres = [];
          result.filters.excludeGenres.push(genreLike);
        } else {
          result.excludeTerms.push(token.value);
        }
      } else if (currentOperator === 'AND' || currentOperator === null) {
        // Check if it looks like a genre name for AND operator
        const genreLike = token.value.charAt(0).toUpperCase() + token.value.slice(1).toLowerCase();
        const commonGenres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
          'Mystery', 'Psychological', 'Romance', 'Sci-fi', 'Slice of life', 'Sports',
          'Supernatural', 'Thriller', 'Mecha'];

        if (commonGenres.some(g => g.toLowerCase() === token.value.toLowerCase())) {
          if (!result.filters.genres) result.filters.genres = [];
          result.filters.genres.push(genreLike);
        } else {
          result.includeTerms.push(token.value);
          textParts.push(token.value);
        }
      } else {
        textParts.push(token.value);
      }

      previousWasNot = false;
    }
  }

  // Build final text query
  result.textQuery = textParts.join(' ');

  return result;
}

/**
 * Convert a ParsedQuery to SearchFilters for the API
 */
export function parsedQueryToFilters(parsed: ParsedQuery, existingFilters?: Partial<SearchFilters>): SearchFilters {
  const filters: SearchFilters = {
    ...existingFilters,
  };

  // Text query
  if (parsed.textQuery) {
    filters.query = parsed.textQuery;
  }

  // Genres
  if (parsed.filters.genres?.length) {
    filters.genres = [...(filters.genres || []), ...parsed.filters.genres];
    // Remove duplicates
    filters.genres = [...new Set(filters.genres)];
  }

  // Exclude genres
  if (parsed.filters.excludeGenres?.length) {
    filters.excludeGenres = [...(filters.excludeGenres || []), ...parsed.filters.excludeGenres];
    filters.excludeGenres = [...new Set(filters.excludeGenres)];
  }

  // Tags
  if (parsed.filters.tags?.length) {
    filters.tags = [...(filters.tags || []), ...parsed.filters.tags];
    filters.tags = [...new Set(filters.tags)];
  }

  // Year range
  if (parsed.filters.yearMin !== undefined) {
    filters.yearMin = parsed.filters.yearMin;
  }
  if (parsed.filters.yearMax !== undefined) {
    filters.yearMax = parsed.filters.yearMax;
  }

  // Score
  if (parsed.filters.scoreMin !== undefined) {
    filters.scoreMin = parsed.filters.scoreMin;
  }

  // Format
  if (parsed.filters.format?.length) {
    filters.format = parsed.filters.format;
  }

  // Status
  if (parsed.filters.status?.length) {
    filters.status = parsed.filters.status;
  }

  // Episodes
  if (parsed.filters.episodesMin !== undefined) {
    filters.episodesMin = parsed.filters.episodesMin;
  }
  if (parsed.filters.episodesMax !== undefined) {
    filters.episodesMax = parsed.filters.episodesMax;
  }

  return filters;
}

/**
 * Main function to parse a search query and convert to filters
 */
export function parseAdvancedSearch(query: string, existingFilters?: Partial<SearchFilters>): {
  filters: SearchFilters;
  parsed: ParsedQuery;
  studios: string[];
} {
  const parsed = parseSearchQuery(query);
  const filters = parsedQueryToFilters(parsed, existingFilters);

  return {
    filters,
    parsed,
    studios: parsed.filters.studios || [],
  };
}

/**
 * Get help text for advanced search syntax
 */
export function getAdvancedSearchHelp(): string {
  return `
Advanced Search Syntax:

Boolean Operators:
  action AND romance     - Must match both terms
  action OR comedy       - Match either term
  fantasy NOT horror     - Exclude horror

Filters:
  studio:"Kyoto Animation"  - By studio name
  year:2020                 - Released in 2020
  year:2020-2023            - Released between 2020-2023
  genre:Action              - Include genre
  -genre:Horror             - Exclude genre
  score:>80                 - Score above 80
  score:>=75                - Score 75 or above
  format:TV                 - TV series only
  format:movie              - Movies only
  status:airing             - Currently airing
  status:finished           - Completed series
  episodes:12               - Exactly 12 episodes
  episodes:12-24            - 12 to 24 episodes

Examples:
  "attack on titan"         - Exact phrase search
  action genre:Fantasy year:2020-2023 score:>80
  studio:MAPPA -genre:Horror status:finished
  isekai NOT harem format:TV
`.trim();
}
