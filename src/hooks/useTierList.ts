import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { isLocalMode } from '@/lib/apiMode';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { TierList, TierItem, TierLevel, TIER_ORDER } from '@/types/tierList';
import { Anime } from '@/types/anime';
import { toast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'ainime_tier_lists';

interface LocalTierList extends Omit<TierList, 'userId'> {
  items: TierItem[];
}

// Helper to get tier lists from localStorage
const getLocalTierLists = (): LocalTierList[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save tier lists to localStorage
const saveLocalTierLists = (lists: LocalTierList[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lists));
};

// Hook for managing tier items in creator
export function useTierListItems(initialItems: TierItem[] = []) {
  const [items, setItems] = useState<TierItem[]>(initialItems);
  const [unrankedItems, setUnrankedItems] = useState<TierItem[]>([]);

  const addAnimeToUnranked = useCallback((anime: Anime) => {
    const exists = [...items, ...unrankedItems].some(item => item.animeId === anime.id);
    if (exists) {
      toast({ title: 'Anime already added', variant: 'destructive' });
      return;
    }

    const newItem: TierItem = {
      animeId: anime.id,
      animeTitle: anime.title.english || anime.title.romaji,
      animeCoverImage: anime.coverImage.large,
      tier: 'C', // Default tier
      position: unrankedItems.length,
    };

    setUnrankedItems(prev => [...prev, newItem]);
  }, [items, unrankedItems]);

  const moveToTier = useCallback((animeId: number, newTier: TierLevel) => {
    // Check if it's in unranked
    const unrankedIndex = unrankedItems.findIndex(item => item.animeId === animeId);
    if (unrankedIndex !== -1) {
      const item = { ...unrankedItems[unrankedIndex], tier: newTier };
      setUnrankedItems(prev => prev.filter((_, i) => i !== unrankedIndex));
      setItems(prev => {
        const tierItems = prev.filter(i => i.tier === newTier);
        return [...prev.filter(i => i.tier !== newTier || i.animeId !== animeId), { ...item, position: tierItems.length }];
      });
      return;
    }

    // Move within ranked items
    setItems(prev => {
      const itemIndex = prev.findIndex(item => item.animeId === animeId);
      if (itemIndex === -1) return prev;

      const item = { ...prev[itemIndex], tier: newTier };
      const withoutItem = prev.filter((_, i) => i !== itemIndex);
      const tierItems = withoutItem.filter(i => i.tier === newTier);

      return [...withoutItem, { ...item, position: tierItems.length }];
    });
  }, [unrankedItems]);

  const removeAnime = useCallback((animeId: number) => {
    setItems(prev => prev.filter(item => item.animeId !== animeId));
    setUnrankedItems(prev => prev.filter(item => item.animeId !== animeId));
  }, []);

  const reorderInTier = useCallback((tier: TierLevel, sourceIndex: number, destinationIndex: number) => {
    setItems(prev => {
      const tierItems = prev.filter(item => item.tier === tier);
      const otherItems = prev.filter(item => item.tier !== tier);

      const [removed] = tierItems.splice(sourceIndex, 1);
      tierItems.splice(destinationIndex, 0, removed);

      // Update positions
      const updatedTierItems = tierItems.map((item, idx) => ({ ...item, position: idx }));

      return [...otherItems, ...updatedTierItems];
    });
  }, []);

  const getItemsByTier = useCallback((tier: TierLevel): TierItem[] => {
    return items
      .filter(item => item.tier === tier)
      .sort((a, b) => a.position - b.position);
  }, [items]);

  const getAllRankedItems = useCallback((): TierItem[] => {
    return TIER_ORDER.flatMap(tier => getItemsByTier(tier));
  }, [getItemsByTier]);

  const clearAll = useCallback(() => {
    setItems([]);
    setUnrankedItems([]);
  }, []);

  return {
    items,
    unrankedItems,
    setItems,
    setUnrankedItems,
    addAnimeToUnranked,
    moveToTier,
    removeAnime,
    reorderInTier,
    getItemsByTier,
    getAllRankedItems,
    clearAll,
  };
}

// Hook for fetching community tier lists
export function useCommunityTierLists(page: number = 1, limit: number = 12) {
  const { user } = useSimpleAuth();

  return useQuery({
    queryKey: ['communityTierLists', page, limit],
    queryFn: async (): Promise<{ lists: TierList[]; total: number }> => {
      if (!isLocalMode()) {
        return api.getCommunityTierLists(page, limit);
      }

      // localStorage fallback
      const offset = (page - 1) * limit;
      const allLists = getLocalTierLists();
      const publicLists = allLists.filter(list => list.visibility === 'public');

      return {
        lists: publicLists.slice(offset, offset + limit) as TierList[],
        total: publicLists.length,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for fetching user's tier lists
export function useUserTierLists() {
  const { user } = useSimpleAuth();

  return useQuery({
    queryKey: ['userTierLists', user?.id],
    queryFn: async (): Promise<TierList[]> => {
      if (user && !isLocalMode()) {
        return api.getMyTierLists();
      }

      // localStorage fallback for guest / local mode
      return getLocalTierLists() as TierList[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Hook for fetching a single tier list
export function useTierListDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['tierList', id],
    queryFn: async (): Promise<TierList | null> => {
      if (!id) return null;

      if (!isLocalMode()) {
        return api.getTierList(id);
      }

      // localStorage fallback
      const allLists = getLocalTierLists();
      const list = allLists.find(l => l.id === id);
      return list as TierList | null;
    },
    enabled: !!id,
  });
}

// Hook for creating/updating tier lists
export function useTierListMutations() {
  const queryClient = useQueryClient();
  const { user } = useSimpleAuth();

  const createTierList = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      templateId?: string;
      visibility: 'public' | 'friends_only' | 'private';
      items: TierItem[];
    }): Promise<TierList> => {
      if (user && !isLocalMode()) {
        return api.createTierList(data);
      }

      // localStorage fallback
      const newList: LocalTierList = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description || null,
        templateId: data.templateId || null,
        visibility: data.visibility,
        likesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: data.items.map((item, idx) => ({
          ...item,
          id: crypto.randomUUID(),
          position: idx,
        })),
      };

      const lists = getLocalTierLists();
      lists.push(newList);
      saveLocalTierLists(lists);

      return newList as TierList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTierLists'] });
      queryClient.invalidateQueries({ queryKey: ['communityTierLists'] });
      toast({ title: 'Tier list created!' });
    },
    onError: () => {
      toast({ title: 'Failed to create tier list', variant: 'destructive' });
    },
  });

  const updateTierList = useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      description?: string;
      visibility?: 'public' | 'friends_only' | 'private';
      items?: TierItem[];
    }): Promise<TierList> => {
      if (user && !isLocalMode()) {
        return api.updateTierList(data);
      }

      // localStorage fallback
      const lists = getLocalTierLists();
      const index = lists.findIndex(l => l.id === data.id);

      if (index === -1) {
        throw new Error('Tier list not found');
      }

      lists[index] = {
        ...lists[index],
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.visibility && { visibility: data.visibility }),
        ...(data.items && { items: data.items }),
        updatedAt: new Date().toISOString(),
      };

      saveLocalTierLists(lists);
      return lists[index] as TierList;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userTierLists'] });
      queryClient.invalidateQueries({ queryKey: ['communityTierLists'] });
      queryClient.invalidateQueries({ queryKey: ['tierList', data.id] });
      toast({ title: 'Tier list updated!' });
    },
    onError: () => {
      toast({ title: 'Failed to update tier list', variant: 'destructive' });
    },
  });

  const deleteTierList = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (user && !isLocalMode()) {
        await api.deleteTierList(id);
        return;
      }

      // localStorage fallback
      const lists = getLocalTierLists();
      const filtered = lists.filter(l => l.id !== id);
      saveLocalTierLists(filtered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTierLists'] });
      queryClient.invalidateQueries({ queryKey: ['communityTierLists'] });
      toast({ title: 'Tier list deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete tier list', variant: 'destructive' });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (tierListId: string): Promise<{ liked: boolean; likesCount: number }> => {
      if (user && !isLocalMode()) {
        return api.toggleTierListLike(tierListId);
      }

      // localStorage fallback
      const lists = getLocalTierLists();
      const index = lists.findIndex(l => l.id === tierListId);

      if (index === -1) {
        throw new Error('Tier list not found');
      }

      const currentLikes = lists[index].likesCount;
      const likedKey = `ainime_liked_${tierListId}`;
      const isLiked = localStorage.getItem(likedKey) === 'true';

      if (isLiked) {
        lists[index].likesCount = Math.max(0, currentLikes - 1);
        localStorage.removeItem(likedKey);
      } else {
        lists[index].likesCount = currentLikes + 1;
        localStorage.setItem(likedKey, 'true');
      }

      saveLocalTierLists(lists);
      return { liked: !isLiked, likesCount: lists[index].likesCount };
    },
    onSuccess: (data, tierListId) => {
      queryClient.invalidateQueries({ queryKey: ['tierList', tierListId] });
      queryClient.invalidateQueries({ queryKey: ['communityTierLists'] });
    },
  });

  return {
    createTierList,
    updateTierList,
    deleteTierList,
    toggleLike,
  };
}

// Check if user has liked a tier list
export function useHasLiked(tierListId: string): boolean {
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    const likedKey = `ainime_liked_${tierListId}`;
    setHasLiked(localStorage.getItem(likedKey) === 'true');
  }, [tierListId]);

  return hasLiked;
}
