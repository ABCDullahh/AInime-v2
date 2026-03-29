import { Star, Tv, Users, Film, Trophy } from 'lucide-react';
import { AnimeCardData } from '@/types/anime';
import { getDisplayTitle, formatEpisodes } from '@/lib/anime-utils';
import { cn, proxyImage } from '@/lib/utils';

interface AnimeShareCardProps {
  anime: AnimeCardData;
  className?: string;
}

interface ListShareCardProps {
  title: string;
  animeCount: number;
  watchedCount: number;
  topGenres: { genre: string; count: number }[];
  coverImages: string[];
  className?: string;
}

// Beautiful share card for anime - optimized for social media previews
export function AnimeShareCard({ anime, className }: AnimeShareCardProps) {
  const title = getDisplayTitle(anime);

  return (
    <div
      className={cn(
        'relative w-full max-w-md overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-background via-background to-secondary/30',
        'border border-border/50 shadow-elevated',
        className
      )}
      data-testid="anime-share-card"
    >
      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={proxyImage(anime.coverImage.large)}
          alt=""
          className="w-full h-full object-cover blur-3xl opacity-20 scale-150"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="relative p-6">
        {/* Header with branding */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-coral flex items-center justify-center">
            <Film className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-coral">AInime</span>
        </div>

        {/* Main content */}
        <div className="flex gap-4">
          {/* Cover image */}
          <div className="flex-shrink-0">
            <div className="relative w-24 h-36 rounded-xl overflow-hidden shadow-lg">
              <img
                src={proxyImage(anime.coverImage.large)}
                alt={title}
                className="w-full h-full object-cover"
              />
              {anime.rank && (
                <div className="absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-coral/90 text-xs font-medium text-white">
                  <Trophy className="w-2.5 h-2.5" />
                  #{anime.rank}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground line-clamp-2 mb-1">
              {title}
            </h3>

            {anime.studios?.nodes?.[0] && (
              <p className="text-sm text-muted-foreground mb-2">
                {anime.studios.nodes[0].name}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 mb-3">
              {anime.averageScore && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <span className="text-sm font-semibold">{anime.averageScore}%</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Tv className="w-3.5 h-3.5" />
                <span>{formatEpisodes(anime)}</span>
              </div>
            </div>

            {/* Genre badges */}
            <div className="flex flex-wrap gap-1.5">
              {anime.genres.slice(0, 3).map(genre => (
                <span
                  key={genre}
                  className="px-2 py-0.5 rounded-full bg-coral/20 text-coral text-xs font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Signature widgets bar */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-teal">{anime.finishability}/10</div>
              <div className="text-xs text-muted-foreground">Finishability</div>
            </div>
            <div>
              <div className="text-lg font-bold text-coral capitalize">{anime.energyLevel}</div>
              <div className="text-xs text-muted-foreground">Energy</div>
            </div>
            {anime.tearRisk && (
              <div>
                <div className="text-lg font-bold text-violet capitalize">{anime.tearRisk}</div>
                <div className="text-xs text-muted-foreground">Tear Risk</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Discover more at ainime.app
          </span>
          <div className="flex gap-1">
            {anime.vibeMeter.slice(0, 2).map((vibe, idx) => (
              <span
                key={vibe}
                className={cn(
                  'px-2 py-0.5 rounded text-xs',
                  idx === 0 ? 'bg-coral/20 text-coral' : 'bg-violet/20 text-violet'
                )}
              >
                {vibe}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Beautiful share card for anime lists
export function ListShareCard({
  title,
  animeCount,
  watchedCount,
  topGenres,
  coverImages,
  className,
}: ListShareCardProps) {
  const completionRate = animeCount > 0 ? Math.round((watchedCount / animeCount) * 100) : 0;

  return (
    <div
      className={cn(
        'relative w-full max-w-md overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-background via-background to-violet/10',
        'border border-border/50 shadow-elevated',
        className
      )}
      data-testid="list-share-card"
    >
      {/* Background collage effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-1 opacity-10 blur-sm">
          {coverImages.slice(0, 6).map((img, idx) => (
            <img
              key={idx}
              src={proxyImage(img)}
              alt=""
              className="w-full h-full object-cover"
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      </div>

      {/* Content */}
      <div className="relative p-6">
        {/* Header with branding */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-full bg-violet flex items-center justify-center">
            <Users className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-violet">AInime Collection</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-2xl text-foreground mb-2">
          {title}
        </h3>

        {/* Cover images preview */}
        {coverImages.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <div className="flex -space-x-3">
              {coverImages.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="w-12 h-16 rounded-lg overflow-hidden border-2 border-background shadow-md"
                  style={{ zIndex: 4 - idx }}
                >
                  <img src={proxyImage(img)} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {animeCount > 4 && (
              <span className="text-sm text-muted-foreground">
                +{animeCount - 4} more
              </span>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-coral">{animeCount}</div>
            <div className="text-xs text-muted-foreground">Anime</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-teal">{watchedCount}</div>
            <div className="text-xs text-muted-foreground">Watched</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-violet">{completionRate}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>

        {/* Top genres */}
        {topGenres.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Top Genres</p>
            <div className="flex flex-wrap gap-2">
              {topGenres.slice(0, 4).map(({ genre, count }) => (
                <span
                  key={genre}
                  className="px-3 py-1 rounded-full bg-violet/20 text-violet text-sm font-medium"
                >
                  {genre} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-border/30 text-center">
          <span className="text-xs text-muted-foreground">
            Create your own list at ainime.app
          </span>
        </div>
      </div>
    </div>
  );
}
