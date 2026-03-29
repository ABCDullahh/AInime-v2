import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as animeData from '@/lib/animeData';
import { enrichAnimeData } from '@/lib/anime-utils';
import { AnimeCardData, SearchFilters } from '@/types/anime';
import * as api from '@/lib/api';
import { isLocalMode } from '@/lib/apiMode';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

// Paginated hook for trending anime
export function useTrendingAnime(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['trending-anime', page, perPage],
    queryFn: async () => {
      const result = await animeData.getTrendingAnime(page, perPage);
      return {
        animes: result.data.map(enrichAnimeData),
        hasNextPage: result.hasNextPage,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        source: result.source,
      };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

// Paginated hook for popular anime
export function usePopularAnime(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['popular-anime', page, perPage],
    queryFn: async () => {
      const result = await animeData.getPopularAnime(page, perPage);
      return {
        animes: result.data.map(enrichAnimeData),
        hasNextPage: result.hasNextPage,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        source: result.source,
      };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

// Paginated hook for seasonal anime
export function useSeasonalAnime(page = 1, perPage = 20, season?: string, year?: number) {
  return useQuery({
    queryKey: ['seasonal-anime', page, perPage, season, year],
    queryFn: async () => {
      const result = await animeData.getSeasonalAnime(page, perPage, season, year);
      return {
        animes: result.data.map(enrichAnimeData),
        hasNextPage: result.hasNextPage,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        source: result.source,
      };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

// Paginated search hook
export function useAnimeSearchPaginated() {
  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['anime-search', filters, page],
    queryFn: async () => {
      if (!filters) return null;
      const result = await animeData.searchAnimeWithPagination(filters, page);
      return {
        animes: result.data.map(enrichAnimeData),
        hasNextPage: result.hasNextPage,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        source: result.source,
      };
    },
    enabled: !!filters,
    staleTime: 2 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const search = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const clear = useCallback(() => {
    setFilters(null);
    setPage(1);
  }, []);

  return {
    results: query.data?.animes || [],
    isLoading: query.isLoading || query.isFetching,
    error: query.error?.message || null,
    hasNextPage: query.data?.hasNextPage || false,
    currentPage: query.data?.currentPage || 1,
    totalPages: query.data?.totalPages || 1,
    source: query.data?.source || 'anilist',
    search,
    goToPage,
    clear,
    isActive: !!filters,
  };
}

// Simple search hook (without pagination state)
export function useAnimeSearch(filters?: SearchFilters) {
  return useQuery({
    queryKey: ['anime-search-simple', filters],
    queryFn: async () => {
      if (!filters?.query || filters.query.length < 2) return [];
      const result = await animeData.searchAnime(filters);
      return result.data.map(enrichAnimeData);
    },
    enabled: !!filters?.query && filters.query.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}

// Imperative search hook (for forms that need manual control)
export function useAnimeSearchImperative() {
  const [results, setResults] = useState<AnimeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (filters: SearchFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await animeData.searchAnime(filters);
      const enrichedAnimes = result.data.map(enrichAnimeData);
      setResults(enrichedAnimes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, isLoading, error, search, clear };
}

// Anime detail hook
export function useAnimeDetail(id: number | undefined, malId?: number) {
  return useQuery({
    queryKey: ['anime-detail', id],
    queryFn: async () => {
      if (!id) return null;
      const result = await animeData.getAnimeDetail(id, malId);
      if (result.data) {
        return {
          anime: enrichAnimeData(result.data),
          source: result.source,
        };
      }
      return null;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// Characters hook
export function useAnimeCharacters(id: number | undefined, malId?: number) {
  return useQuery({
    queryKey: ['anime-characters', id],
    queryFn: async () => {
      if (!id) return { characters: [], source: 'anilist' as const };
      const result = await animeData.getAnimeCharacters(id, malId);
      return { characters: result.data, source: result.source };
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// Staff hook
export function useAnimeStaff(id: number | undefined, malId?: number) {
  return useQuery({
    queryKey: ['anime-staff', id],
    queryFn: async () => {
      if (!id) return { staff: [], source: 'anilist' as const };
      const result = await animeData.getAnimeStaff(id, malId);
      return { staff: result.data, source: result.source };
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// Similar anime hook
export function useSimilarAnime(id: number | undefined, malId?: number) {
  return useQuery({
    queryKey: ['similar-anime', id],
    queryFn: async () => {
      if (!id) return { animes: [], source: 'anilist' as const };
      const result = await animeData.getSimilarAnime(id, malId);
      return { 
        animes: result.data.map(enrichAnimeData), 
        source: result.source 
      };
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// Local storage key for guest users
const USER_LIST_KEY = 'animelist_user_entries';

export interface UserListEntry {
  animeId: number;
  anime: AnimeCardData;
  status: 'SAVED' | 'LOVED' | 'WATCHING' | 'WATCHED' | 'DROPPED';
  addedAt: string;
  rating?: number;
  notes?: string;
  lastEpisodeWatched?: number;
  updatedAt?: string;
}

// Helper to get local entries
function getLocalEntries(): UserListEntry[] {
  try {
    const saved = localStorage.getItem(USER_LIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function setLocalEntries(entries: UserListEntry[]) {
  localStorage.setItem(USER_LIST_KEY, JSON.stringify(entries));
}

export function useUserList() {
  const { user } = useSimpleAuth();
  const queryClient = useQueryClient();
  
  const [localEntries, setLocalEntriesState] = useState<UserListEntry[]>(getLocalEntries);

  useEffect(() => {
    if (!user || isLocalMode()) {
      setLocalEntries(localEntries);
    }
  }, [localEntries, user]);

  const { data: remoteEntries = [], isLoading } = useQuery({
    queryKey: ['user-anime-list', user?.id],
    queryFn: async () => {
      if (!user || isLocalMode()) return [];

      const data = await api.getAnimeList();

      return data.map(entry => ({
        animeId: entry.anime_id,
        anime: getAnimeFromCache(entry.anime_id),
        status: entry.status as UserListEntry['status'],
        addedAt: entry.created_at,
        rating: entry.rating ?? undefined,
        notes: entry.notes ?? undefined,
        lastEpisodeWatched: entry.last_episode_watched ?? undefined,
        updatedAt: entry.updated_at,
      })).filter(e => e.anime !== null) as UserListEntry[];
    },
    enabled: !!user && !isLocalMode(),
    staleTime: 30 * 1000,
  });

  const entries = (user && !isLocalMode()) ? remoteEntries : localEntries;

  const addMutation = useMutation({
    mutationFn: async ({ anime, status }: { anime: AnimeCardData; status: UserListEntry['status'] }) => {
      if (!user || isLocalMode()) return null;

      cacheAnime(anime);

      await api.upsertAnimeEntry(anime.id, status);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-anime-list', user?.id] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (animeId: number) => {
      if (!user || isLocalMode()) return null;

      await api.deleteAnimeEntry(animeId);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-anime-list', user?.id] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ animeId, lastEpisodeWatched }: { animeId: number; lastEpisodeWatched: number }) => {
      if (!user || isLocalMode()) return null;

      await api.updateEpisodeProgress(animeId, lastEpisodeWatched);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-anime-list', user?.id] });
    },
  });

  const addToList = useCallback((anime: AnimeCardData, status: UserListEntry['status']) => {
    if (user && !isLocalMode()) {
      addMutation.mutate({ anime, status });
    } else {
      setLocalEntriesState(prev => {
        const existing = prev.find(e => e.animeId === anime.id);
        if (existing) {
          return prev.map(e => 
            e.animeId === anime.id 
              ? { ...e, status, anime } 
              : e
          );
        }
        return [...prev, {
          animeId: anime.id,
          anime,
          status,
          addedAt: new Date().toISOString(),
        }];
      });
    }
  }, [user, addMutation]);

  const removeFromList = useCallback((animeId: number) => {
    if (user && !isLocalMode()) {
      removeMutation.mutate(animeId);
    } else {
      setLocalEntriesState(prev => prev.filter(e => e.animeId !== animeId));
    }
  }, [user, removeMutation]);

  const updateEntry = useCallback((animeId: number, updates: Partial<UserListEntry>) => {
    if (user && !isLocalMode()) {
      const entry = entries.find(e => e.animeId === animeId);
      if (entry && updates.status) {
        addMutation.mutate({ anime: entry.anime, status: updates.status });
      }
    } else {
      setLocalEntriesState(prev => prev.map(e => 
        e.animeId === animeId ? { ...e, ...updates } : e
      ));
    }
  }, [user, entries, addMutation]);

  const getByStatus = useCallback((status: UserListEntry['status']) => {
    return entries.filter(e => e.status === status);
  }, [entries]);

  const isInList = useCallback((animeId: number) => {
    return entries.some(e => e.animeId === animeId);
  }, [entries]);

  const getStatus = useCallback((animeId: number) => {
    return entries.find(e => e.animeId === animeId)?.status;
  }, [entries]);

  const getEntry = useCallback((animeId: number) => {
    return entries.find(e => e.animeId === animeId);
  }, [entries]);

  const updateEpisodeProgress = useCallback((animeId: number, lastEpisodeWatched: number) => {
    if (user && !isLocalMode()) {
      updateProgressMutation.mutate({ animeId, lastEpisodeWatched });
    } else {
      setLocalEntriesState(prev => prev.map(e =>
        e.animeId === animeId
          ? { ...e, lastEpisodeWatched, updatedAt: new Date().toISOString() }
          : e
      ));
    }
  }, [user, updateProgressMutation]);

  return {
    entries,
    addToList,
    removeFromList,
    updateEntry,
    updateEpisodeProgress,
    getByStatus,
    isInList,
    getStatus,
    getEntry,
    isLoading,
  };
}

// Anime cache
const ANIME_CACHE_KEY = 'animelist_anime_cache';

function getAnimeCache(): Record<number, AnimeCardData> {
  try {
    const saved = localStorage.getItem(ANIME_CACHE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function cacheAnime(anime: AnimeCardData) {
  const cache = getAnimeCache();
  cache[anime.id] = anime;
  localStorage.setItem(ANIME_CACHE_KEY, JSON.stringify(cache));
}

function getAnimeFromCache(animeId: number): AnimeCardData | null {
  const cache = getAnimeCache();
  return cache[animeId] || null;
}
