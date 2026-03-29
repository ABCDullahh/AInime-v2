import { Link } from 'react-router-dom';
import { Heart, Eye, Lock, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TierList, TIER_CONFIG, TIER_ORDER } from '@/types/tierList';
import { useTierListMutations, useHasLiked } from '@/hooks/useTierList';
import { cn, proxyImage, handleImageError } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface TierListCardProps {
  tierList: TierList;
  showUser?: boolean;
}

export function TierListCard({ tierList, showUser = true }: TierListCardProps) {
  const { toggleLike } = useTierListMutations();
  const hasLiked = useHasLiked(tierList.id);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike.mutate(tierList.id);
  };

  // Get a preview of items (first 3 from top tiers)
  const previewItems = tierList.items?.slice(0, 4) || [];

  const visibilityIcon = {
    public: null,
    friends_only: <Users className="w-3 h-3" />,
    private: <Lock className="w-3 h-3" />,
  };

  return (
    <Link
      to={`/tier-lists/${tierList.id}`}
      className="group block"
      data-testid={`tier-list-card-${tierList.id}`}
    >
      <div className="rounded-xl border bg-card overflow-hidden transition-all duration-300 hover:border-coral/50 hover:shadow-lg hover:shadow-coral/10">
        {/* Preview Images */}
        <div className="relative h-32 bg-muted/30 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center gap-1 p-2">
            {previewItems.length > 0 ? (
              previewItems.map((item, idx) => (
                <div
                  key={item.animeId}
                  className={cn(
                    'relative h-full rounded overflow-hidden transition-transform group-hover:scale-105',
                    idx === 0 ? 'flex-[2]' : 'flex-1'
                  )}
                  style={{
                    transform: `translateX(${idx * -4}px)`,
                    zIndex: previewItems.length - idx,
                  }}
                >
                  <img
                    src={proxyImage(item.animeCoverImage) || '/placeholder-anime.png'}
                    alt={item.animeTitle}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                  {/* Tier Badge */}
                  <div
                    className={cn(
                      'absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold',
                      TIER_CONFIG[item.tier].bgColor,
                      TIER_CONFIG[item.tier].color
                    )}
                  >
                    {item.tier}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground text-sm">No items</div>
            )}
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-coral transition-colors">
                {tierList.title}
              </h3>
              {tierList.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {tierList.description}
                </p>
              )}
            </div>

            {visibilityIcon[tierList.visibility] && (
              <div className="text-muted-foreground" title={tierList.visibility.replace('_', ' ')}>
                {visibilityIcon[tierList.visibility]}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {tierList.items?.length || 0} anime
              </span>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'gap-1 h-auto p-1 hover:bg-transparent',
                  hasLiked ? 'text-coral' : 'text-muted-foreground hover:text-coral'
                )}
                onClick={handleLike}
              >
                <Heart className={cn('w-4 h-4', hasLiked && 'fill-current')} />
                {tierList.likesCount}
              </Button>
            </div>

            <span className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(tierList.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* User Info */}
          {showUser && tierList.user && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-coral to-violet flex items-center justify-center text-white text-xs font-bold">
                {tierList.user.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-sm text-muted-foreground">
                {tierList.user.displayName || 'Anonymous'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
