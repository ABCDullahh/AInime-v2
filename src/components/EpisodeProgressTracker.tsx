import { useState } from 'react';
import { Plus, Minus, Check, Eye, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn, proxyImage, handleImageError } from '@/lib/utils';
import { UserListEntry } from '@/hooks/useAnimeData';
import { AnimeCardData } from '@/types/anime';
import { getDisplayTitle } from '@/lib/anime-utils';
import { toast } from '@/hooks/use-toast';

interface EpisodeProgressTrackerProps {
  entry: UserListEntry;
  onUpdateProgress: (animeId: number, episode: number) => void;
  onMarkComplete?: (anime: AnimeCardData) => void;
  variant?: 'compact' | 'full' | 'inline';
  className?: string;
}

export function EpisodeProgressTracker({
  entry,
  onUpdateProgress,
  onMarkComplete,
  variant = 'full',
  className,
}: EpisodeProgressTrackerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(entry.lastEpisodeWatched || 0);

  const totalEpisodes = entry.anime.episodes || 0;
  const currentEpisode = entry.lastEpisodeWatched || 0;
  const progressPercent = totalEpisodes > 0 ? Math.round((currentEpisode / totalEpisodes) * 100) : 0;
  const remainingEpisodes = totalEpisodes > 0 ? totalEpisodes - currentEpisode : 0;

  const handleIncrement = () => {
    const newValue = currentEpisode + 1;
    if (totalEpisodes === 0 || newValue <= totalEpisodes) {
      onUpdateProgress(entry.animeId, newValue);
      toast({
        title: `Episode ${newValue} watched`,
        description: totalEpisodes > 0 ? `${totalEpisodes - newValue} episodes remaining` : undefined,
      });

      // Auto-complete if finished
      if (totalEpisodes > 0 && newValue === totalEpisodes && onMarkComplete) {
        onMarkComplete(entry.anime);
      }
    }
  };

  const handleDecrement = () => {
    if (currentEpisode > 0) {
      const newValue = currentEpisode - 1;
      onUpdateProgress(entry.animeId, newValue);
    }
  };

  const handleEditSubmit = () => {
    const newValue = Math.max(0, Math.min(editValue, totalEpisodes || Infinity));
    onUpdateProgress(entry.animeId, newValue);
    setIsEditing(false);
    toast({
      title: `Progress updated`,
      description: `Now at episode ${newValue}${totalEpisodes > 0 ? ` of ${totalEpisodes}` : ''}`,
    });

    // Auto-complete if finished
    if (totalEpisodes > 0 && newValue === totalEpisodes && onMarkComplete) {
      onMarkComplete(entry.anime);
    }
  };

  const handleComplete = () => {
    if (totalEpisodes > 0) {
      onUpdateProgress(entry.animeId, totalEpisodes);
      if (onMarkComplete) {
        onMarkComplete(entry.anime);
      }
    }
  };

  // Inline variant - minimal display for cards
  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Progress
          value={progressPercent}
          className="h-1.5 flex-1 bg-violet/20"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {currentEpisode}/{totalEpisodes || '?'}
        </span>
      </div>
    );
  }

  // Compact variant - for list views
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDecrement}
            disabled={currentEpisode === 0}
          >
            <Minus className="w-3 h-3" />
          </Button>

          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-0.5 rounded bg-violet/20 text-violet font-medium text-sm min-w-[60px] text-center hover:bg-violet/30 transition-colors"
          >
            {isEditing ? (
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                onBlur={handleEditSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
                className="w-full bg-transparent text-center outline-none"
                autoFocus
                min={0}
                max={totalEpisodes || undefined}
              />
            ) : (
              `${currentEpisode}/${totalEpisodes || '?'}`
            )}
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleIncrement}
            disabled={totalEpisodes > 0 && currentEpisode >= totalEpisodes}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <Progress
          value={progressPercent}
          className="h-2 flex-1 min-w-[80px] bg-violet/20"
        />

        <span className="text-xs text-muted-foreground">
          {progressPercent}%
        </span>
      </div>
    );
  }

  // Full variant - detailed progress card
  return (
    <div className={cn("glass-card p-4 rounded-xl space-y-4", className)} data-testid="episode-progress-tracker">
      {/* Header */}
      <div className="flex items-start gap-3">
        <img
          src={proxyImage(entry.anime.coverImage.large)}
          alt={getDisplayTitle(entry.anime)}
          className="w-16 h-24 object-cover rounded-lg"
          onError={handleImageError}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground line-clamp-1">
            {getDisplayTitle(entry.anime)}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Eye className="w-4 h-4 text-violet" />
            <span className="text-sm text-muted-foreground">Currently Watching</span>
          </div>
          {entry.updatedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date(entry.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-violet">{progressPercent}%</span>
        </div>
        <Progress
          value={progressPercent}
          className="h-3 bg-violet/20"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Episode {currentEpisode} of {totalEpisodes || '?'}</span>
          {remainingEpisodes > 0 && (
            <span>{remainingEpisodes} episodes remaining</span>
          )}
        </div>
      </div>

      {/* Episode controls */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecrement}
            disabled={currentEpisode === 0}
            className="h-9 w-9 p-0"
          >
            <Minus className="w-4 h-4" />
          </Button>

          <button
            onClick={() => {
              setEditValue(currentEpisode);
              setIsEditing(true);
            }}
            className="px-4 py-2 rounded-lg bg-violet/20 text-violet font-semibold text-lg min-w-[80px] text-center hover:bg-violet/30 transition-colors"
            data-testid="episode-display"
          >
            {isEditing ? (
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                onBlur={handleEditSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
                className="w-full bg-transparent text-center outline-none"
                autoFocus
                min={0}
                max={totalEpisodes || undefined}
                data-testid="episode-input"
              />
            ) : (
              currentEpisode
            )}
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleIncrement}
            disabled={totalEpisodes > 0 && currentEpisode >= totalEpisodes}
            className="h-9 w-9 p-0"
            data-testid="increment-episode"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="coral"
            size="sm"
            onClick={handleIncrement}
            disabled={totalEpisodes > 0 && currentEpisode >= totalEpisodes}
            className="gap-1.5"
            data-testid="next-episode-btn"
          >
            <ChevronRight className="w-4 h-4" />
            Next Episode
          </Button>

          {totalEpisodes > 0 && currentEpisode < totalEpisodes && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleComplete}
              className="gap-1.5"
              data-testid="mark-complete-btn"
            >
              <Check className="w-4 h-4" />
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple progress bar component for displaying in AnimeCard
interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-1.5 w-full bg-violet/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Ep {current}/{total || '?'}</span>
        <span>{percent}%</span>
      </div>
    </div>
  );
}
