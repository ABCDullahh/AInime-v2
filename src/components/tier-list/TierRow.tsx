import { TierItem, TierLevel, TIER_CONFIG } from '@/types/tierList';
import { TierListItem } from './TierListItem';
import { cn } from '@/lib/utils';

interface TierRowProps {
  tier: TierLevel;
  items: TierItem[];
  onRemoveItem?: (animeId: number) => void;
  onDropItem?: (animeId: number, tier: TierLevel) => void;
  isEditable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TierRow({
  tier,
  items,
  onRemoveItem,
  onDropItem,
  isEditable = true,
  size = 'md',
}: TierRowProps) {
  const config = TIER_CONFIG[tier];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-coral');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('ring-2', 'ring-coral');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-coral');

    const animeId = parseInt(e.dataTransfer.getData('animeId'), 10);
    if (animeId && onDropItem) {
      onDropItem(animeId, tier);
    }
  };

  return (
    <div
      className={cn(
        'flex rounded-lg overflow-hidden border transition-all duration-200',
        config.borderColor,
        isEditable && 'min-h-[120px]'
      )}
      data-testid={`tier-row-${tier}`}
    >
      {/* Tier Label */}
      <div
        className={cn(
          'flex items-center justify-center font-bold text-2xl min-w-[60px] md:min-w-[80px]',
          config.bgColor,
          config.color
        )}
      >
        {config.label}
      </div>

      {/* Items Container */}
      <div
        className={cn(
          'flex-1 flex flex-wrap gap-2 p-2 bg-background/50 transition-all duration-200',
          isEditable && 'min-h-[100px]'
        )}
        onDragOver={isEditable ? handleDragOver : undefined}
        onDragLeave={isEditable ? handleDragLeave : undefined}
        onDrop={isEditable ? handleDrop : undefined}
      >
        {items.length === 0 && isEditable && (
          <div className="flex items-center justify-center w-full text-muted-foreground text-sm">
            Drop anime here
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.animeId}
            draggable={isEditable}
            onDragStart={(e) => {
              e.dataTransfer.setData('animeId', item.animeId.toString());
              e.dataTransfer.effectAllowed = 'move';
            }}
          >
            <TierListItem
              item={item}
              onRemove={isEditable ? onRemoveItem : undefined}
              showDragHandle={isEditable}
              size={size}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
