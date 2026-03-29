import { Heart, Share2, Edit, Calendar, Eye, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TierRow } from './TierRow';
import { TierList, TierLevel, TIER_ORDER } from '@/types/tierList';
import { useTierListMutations, useHasLiked } from '@/hooks/useTierList';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface TierListViewProps {
  tierList: TierList;
}

export function TierListView({ tierList }: TierListViewProps) {
  const { user } = useSimpleAuth();
  const { toggleLike } = useTierListMutations();
  const hasLiked = useHasLiked(tierList.id);

  const isOwner = user?.id === tierList.userId;

  const getItemsByTier = (tier: TierLevel) => {
    return (tierList.items || [])
      .filter(item => item.tier === tier)
      .sort((a, b) => a.position - b.position);
  };

  const handleLike = () => {
    toggleLike.mutate(tierList.id);
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: tierList.title,
          text: tierList.description || `Check out this anime tier list: ${tierList.title}`,
          url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard!' });
    }
  };

  const totalAnime = tierList.items?.length || 0;

  return (
    <div className="space-y-6" data-testid="tier-list-view">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">{tierList.title}</h1>
            {tierList.description && (
              <p className="text-muted-foreground max-w-2xl">{tierList.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLike}
              className={cn(
                'gap-2',
                hasLiked && 'text-coral border-coral hover:bg-coral/10'
              )}
            >
              <Heart className={cn('w-4 h-4', hasLiked && 'fill-current')} />
              {tierList.likesCount}
            </Button>

            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>

            {isOwner && (
              <Link to={`/tier-lists/${tierList.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {totalAnime} anime ranked
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(tierList.createdAt), 'MMM d, yyyy')}
          </span>
          {tierList.user && (
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              by {tierList.user.displayName || 'Anonymous'}
            </span>
          )}
        </div>
      </div>

      {/* Tier List Display */}
      <div className="space-y-2" data-testid="tier-list-display">
        {TIER_ORDER.map((tier) => {
          const items = getItemsByTier(tier);
          // Only show tiers that have items when viewing
          if (items.length === 0) return null;

          return (
            <TierRow
              key={tier}
              tier={tier}
              items={items}
              isEditable={false}
              size="md"
            />
          );
        })}

        {totalAnime === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            This tier list is empty.
          </div>
        )}
      </div>
    </div>
  );
}
