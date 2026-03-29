import { useState, useCallback } from 'react';
import { Save, Share2, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TierRow } from './TierRow';
import { TierListItem } from './TierListItem';
import { AnimeSearchForTier } from './AnimeSearchForTier';
import { TierLevel, TIER_ORDER, TierItem } from '@/types/tierList';
import { useTierListItems, useTierListMutations } from '@/hooks/useTierList';
import { Anime } from '@/types/anime';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TierListCreatorProps {
  initialItems?: TierItem[];
  initialTitle?: string;
  initialDescription?: string;
  initialVisibility?: 'public' | 'friends_only' | 'private';
  tierListId?: string;
  onSaved?: (id: string) => void;
}

export function TierListCreator({
  initialItems = [],
  initialTitle = '',
  initialDescription = '',
  initialVisibility = 'public',
  tierListId,
  onSaved,
}: TierListCreatorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [visibility, setVisibility] = useState<'public' | 'friends_only' | 'private'>(initialVisibility);

  const {
    items,
    unrankedItems,
    setItems,
    addAnimeToUnranked,
    moveToTier,
    removeAnime,
    getItemsByTier,
    getAllRankedItems,
    clearAll,
  } = useTierListItems(initialItems);

  const { createTierList, updateTierList } = useTierListMutations();

  const handleAddAnime = useCallback((anime: Anime) => {
    addAnimeToUnranked(anime);
    toast({ title: `Added ${anime.title.english || anime.title.romaji}` });
  }, [addAnimeToUnranked]);

  const handleDropItem = useCallback((animeId: number, tier: TierLevel) => {
    moveToTier(animeId, tier);
  }, [moveToTier]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast({ title: 'Please enter a title', variant: 'destructive' });
      return;
    }

    const rankedItems = getAllRankedItems();
    if (rankedItems.length === 0) {
      toast({ title: 'Please add at least one anime to a tier', variant: 'destructive' });
      return;
    }

    try {
      if (tierListId) {
        await updateTierList.mutateAsync({
          id: tierListId,
          title,
          description,
          visibility,
          items: rankedItems,
        });
        onSaved?.(tierListId);
      } else {
        const result = await createTierList.mutateAsync({
          title,
          description,
          visibility,
          items: rankedItems,
        });
        onSaved?.(result.id);
      }
    } catch (error) {
      console.error('Failed to save tier list:', error);
    }
  }, [title, description, visibility, tierListId, getAllRankedItems, createTierList, updateTierList, onSaved]);

  const handleClear = useCallback(() => {
    if (items.length > 0 || unrankedItems.length > 0) {
      clearAll();
      toast({ title: 'Cleared all anime' });
    }
  }, [items.length, unrankedItems.length, clearAll]);

  const addedAnimeIds = [...items, ...unrankedItems].map(item => item.animeId);

  return (
    <div className="space-y-6" data-testid="tier-list-creator">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="My Anime Tier List"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
              data-testid="tier-list-title"
            />
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
              <SelectTrigger className="mt-1" data-testid="tier-list-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="friends_only">Friends Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            placeholder="Describe your tier list..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-lg border bg-card">
        <Label className="mb-2 block">Add Anime</Label>
        <AnimeSearchForTier
          onAddAnime={handleAddAnime}
          addedAnimeIds={addedAnimeIds}
        />
      </div>

      {/* Unranked Pool */}
      {unrankedItems.length > 0 && (
        <div className="p-4 rounded-lg border bg-muted/30">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">
            Unranked ({unrankedItems.length}) - Drag to a tier
          </h3>
          <div className="flex flex-wrap gap-2">
            {unrankedItems.map((item) => (
              <div
                key={item.animeId}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('animeId', item.animeId.toString());
                  e.dataTransfer.effectAllowed = 'move';
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                <TierListItem
                  item={item}
                  onRemove={removeAnime}
                  size="md"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier Rows */}
      <div className="space-y-2" data-testid="tier-rows">
        {TIER_ORDER.map((tier) => (
          <TierRow
            key={tier}
            tier={tier}
            items={getItemsByTier(tier)}
            onRemoveItem={removeAnime}
            onDropItem={handleDropItem}
            isEditable
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <Button
          variant="coral"
          onClick={handleSave}
          disabled={createTierList.isPending || updateTierList.isPending}
          className="gap-2"
          data-testid="save-tier-list"
        >
          <Save className="w-4 h-4" />
          {tierListId ? 'Update' : 'Save'} Tier List
        </Button>

        <Button
          variant="outline"
          onClick={handleClear}
          disabled={items.length === 0 && unrankedItems.length === 0}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Clear All
        </Button>
      </div>
    </div>
  );
}
