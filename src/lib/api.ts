import { UserListEntry } from '@/hooks/useAnimeData';
import { TierList, TierItem } from '@/types/tierList';
import { PrivacyLevel } from '@/types/privacy';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { auth } = await import('@/lib/firebase');
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── Anime List ──────────────────────────────────────────────────────────

export interface AnimeListEntryResponse {
  anime_id: number;
  status: string;
  rating: number | null;
  notes: string | null;
  last_episode_watched: number | null;
  created_at: string;
  updated_at: string;
}

export function getAnimeList(): Promise<AnimeListEntryResponse[]> {
  return apiFetch('/anime-list');
}

export function upsertAnimeEntry(animeId: number, status: string): Promise<void> {
  return apiFetch('/anime-list', {
    method: 'PUT',
    body: JSON.stringify({ animeId, status }),
  });
}

export function deleteAnimeEntry(animeId: number): Promise<void> {
  return apiFetch(`/anime-list/${animeId}`, {
    method: 'DELETE',
  });
}

export function updateEpisodeProgress(animeId: number, lastEpisodeWatched: number): Promise<void> {
  return apiFetch(`/anime-list/${animeId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ lastEpisodeWatched }),
  });
}

// ── User ────────────────────────────────────────────────────────────────

export function updateUser(data: { display_name?: string }): Promise<void> {
  return apiFetch('/user', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export interface UserPrivacyResponse {
  profile_visibility: PrivacyLevel;
  list_visibility: PrivacyLevel;
  activity_visibility: PrivacyLevel;
  show_stats_publicly: boolean;
  searchable: boolean;
}

export function getUserPrivacy(userId: string): Promise<UserPrivacyResponse> {
  return apiFetch(`/user/${userId}/privacy`);
}

export function checkFriendship(userId: string, friendId: string): Promise<{ isFriend: boolean }> {
  return apiFetch(`/user/${userId}/friendship/${friendId}`);
}

// ── Tier Lists ──────────────────────────────────────────────────────────

export interface TierListsPage {
  lists: TierList[];
  total: number;
}

export function getCommunityTierLists(page: number = 1, limit: number = 12): Promise<TierListsPage> {
  return apiFetch(`/tier-lists/community?page=${page}&limit=${limit}`);
}

export function getMyTierLists(): Promise<TierList[]> {
  return apiFetch('/tier-lists/mine');
}

export function getTierList(id: string): Promise<TierList | null> {
  return apiFetch(`/tier-lists/${id}`);
}

export function createTierList(data: {
  title: string;
  description?: string;
  templateId?: string;
  visibility: 'public' | 'friends_only' | 'private';
  items: TierItem[];
}): Promise<TierList> {
  return apiFetch('/tier-lists', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTierList(data: {
  id: string;
  title?: string;
  description?: string;
  visibility?: 'public' | 'friends_only' | 'private';
  items?: TierItem[];
}): Promise<TierList> {
  return apiFetch(`/tier-lists/${data.id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteTierList(id: string): Promise<void> {
  return apiFetch(`/tier-lists/${id}`, {
    method: 'DELETE',
  });
}

export function toggleTierListLike(tierListId: string): Promise<{ liked: boolean; likesCount: number }> {
  return apiFetch(`/tier-lists/${tierListId}/like`, {
    method: 'POST',
  });
}

// ── AI Recommendations ──────────────────────────────────────────────────

export function getAIRecommendations(userList: {
  animeId: number;
  title: string;
  genres: string[];
  rating?: number;
  status: string;
  score: number;
  episodes: number | null;
  format: string;
}[]): Promise<{
  recommendations: {
    title: string;
    reason: string;
    matchScore: number;
    genres: string[];
  }[];
  analysis: {
    topGenres: string[];
    preferredFormats: string[];
    averageRating: number;
    watchingPatterns: string;
    moodProfile: string;
  };
  personalizedMessage: string;
}> {
  return apiFetch('/ai/recommendations', {
    method: 'POST',
    body: JSON.stringify({ userList }),
  });
}
