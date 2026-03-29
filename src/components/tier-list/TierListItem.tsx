import { X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TierItem } from '@/types/tierList';
import { cn, proxyImage, handleImageError } from '@/lib/utils';

interface TierListItemProps {
  item: TierItem;
  onRemove?: (animeId: number) => void;
  isDragging?: boolean;
  showDragHandle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TierListItem({
  item,
  onRemove,
  isDragging = false,
  showDragHandle = true,
  size = 'md',
}: TierListItemProps) {
  const sizeClasses = {
    sm: 'w-14 h-20',
    md: 'w-20 h-28',
    lg: 'w-24 h-32',
  };

  return (
    <div
      className={cn(
        'relative group rounded-lg overflow-hidden border-2 border-transparent transition-all duration-200',
        isDragging ? 'opacity-50 scale-95 border-coral' : 'hover:border-coral/50',
        sizeClasses[size]
      )}
      data-testid={`tier-item-${item.animeId}`}
    >
      {/* Cover Image */}
      <img
        src={proxyImage(item.animeCoverImage) || '/placeholder-anime.png'}
        alt={item.animeTitle}
        className="w-full h-full object-cover"
        draggable={false}
        onError={handleImageError}
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5">
          <p className="text-[10px] font-medium text-white line-clamp-2 leading-tight">
            {item.animeTitle}
          </p>
        </div>

        {/* Drag Handle */}
        {showDragHandle && (
          <div className="absolute top-1 left-1 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-white/70" />
          </div>
        )}

        {/* Remove Button */}
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-red-500/80 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.animeId);
            }}
          >
            <X className="w-3 h-3 text-white" />
          </Button>
        )}
      </div>
    </div>
  );
}
