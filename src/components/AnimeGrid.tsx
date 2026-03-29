import { AnimeCard } from '@/components/AnimeCard';
import { ListStatus } from '@/components/ListStatusDropdown';
import { AnimeCardData } from '@/types/anime';
import { cn } from '@/lib/utils';

export interface AnimeEntryData {
  status?: ListStatus;
  lastEpisodeWatched?: number;
}

interface AnimeGridProps {
  animes: AnimeCardData[];
  onSave?: (anime: AnimeCardData) => void;
  onLove?: (anime: AnimeCardData) => void;
  compact?: boolean;
  className?: string;
  isLoading?: boolean;
  // Optional map of anime ID to entry data for progress display
  entryDataMap?: Map<number, AnimeEntryData>;
}

function LoadingSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-3 rounded-xl bg-card/50 animate-pulse">
            <div className="w-20 h-28 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="flex gap-2 mt-3">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-5 w-14 rounded-full bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card/50 overflow-hidden animate-pulse">
          <div className="aspect-[3/4] bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-4/5 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-5 w-14 rounded-full bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnimeGrid({
  animes,
  onSave,
  onLove,
  compact = false,
  className,
  isLoading = false,
  entryDataMap,
}: AnimeGridProps) {
  if (isLoading) {
    return <LoadingSkeleton compact={compact} />;
  }

  if (animes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No anime found</h3>
        <p className="text-muted-foreground max-w-md">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        {animes.map((anime, index) => {
          const entryData = entryDataMap?.get(anime.id);
          return (
            <div
              key={anime.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <AnimeCard
                anime={anime}
                onSave={onSave}
                onLove={onLove}
                compact
                currentStatus={entryData?.status}
                lastEpisodeWatched={entryData?.lastEpisodeWatched}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn(
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6",
      className
    )}>
      {animes.map((anime, index) => {
        const entryData = entryDataMap?.get(anime.id);
        return (
          <div
            key={anime.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <AnimeCard
              anime={anime}
              onSave={onSave}
              onLove={onLove}
              currentStatus={entryData?.status}
              lastEpisodeWatched={entryData?.lastEpisodeWatched}
            />
          </div>
        );
      })}
    </div>
  );
}
