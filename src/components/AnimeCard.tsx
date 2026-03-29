import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Zap, Droplets, Clock, Users, Trophy, Tv, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListStatusDropdown, ListStatus } from '@/components/ListStatusDropdown';
import { ProgressBar } from '@/components/EpisodeProgressTracker';
import { AnimeCardData } from '@/types/anime';
import { formatEpisodes, getDisplayTitle, cleanDescription } from '@/lib/anime-utils';
import { cn, proxyImage, handleImageError } from '@/lib/utils';

interface AnimeCardProps {
  anime: AnimeCardData;
  currentStatus?: ListStatus;
  onStatusChange?: (anime: AnimeCardData, status: ListStatus) => void;
  onRemove?: (anime: AnimeCardData) => void;
  // Legacy props for backwards compatibility
  onSave?: (anime: AnimeCardData) => void;
  onLove?: (anime: AnimeCardData) => void;
  compact?: boolean;
  // Progress tracking props
  lastEpisodeWatched?: number;
}

export function AnimeCard({
  anime,
  currentStatus,
  onStatusChange,
  onRemove,
  onSave,
  onLove,
  compact = false,
  lastEpisodeWatched,
}: AnimeCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const title = getDisplayTitle(anime);
  const description = cleanDescription(anime.description);

  const vibeColorMap: Record<string, string> = {
    cozy: 'vibe-chip-teal',
    emotional: 'vibe-chip-coral',
    intense: 'vibe-chip-coral',
    comedic: 'vibe-chip-gold',
    romantic: 'vibe-chip-coral',
    'action-packed': 'vibe-chip-coral',
    reflective: 'vibe-chip-violet',
    dark: 'vibe-chip-violet',
    journey: 'vibe-chip-teal',
    fantastical: 'vibe-chip-violet',
    futuristic: 'vibe-chip-teal',
  };

  // Format members count
  const formatMembers = (count?: number) => {
    if (!count) return null;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/anime/${anime.id}`);
  };

  if (compact) {
    return (
      <div
        className="group relative flex gap-4 p-3 rounded-xl glass-card glow-card transition-all duration-300 hover:border-coral/30 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Cover Image */}
        <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={proxyImage(anime.coverImage.large)}
            alt={title}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              imageLoaded ? "opacity-100" : "opacity-0",
              isHovered && "scale-105"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <h3 className="font-semibold text-foreground truncate group-hover:text-coral transition-colors">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{anime.modernity.release}</span>
              <span>•</span>
              <span>{formatEpisodes(anime)}</span>
              {anime.averageScore && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-gold text-gold" />
                    {anime.averageScore}%
                  </span>
                </>
              )}
            </div>
            {/* Studios */}
            {anime.studios?.nodes && anime.studios.nodes.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {anime.studios.nodes.slice(0, 2).map(s => s.name).join(', ')}
              </div>
            )}
          </div>

          {/* Progress bar for WATCHING status in compact mode */}
          {currentStatus === 'WATCHING' && lastEpisodeWatched !== undefined && anime.episodes && (
            <div className="flex items-center gap-2 mt-2 px-2 py-1 rounded bg-violet/10 border border-violet/20">
              <Eye className="w-3 h-3 text-violet flex-shrink-0" />
              <div className="flex-1 h-1 bg-violet/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet rounded-full"
                  style={{ width: `${Math.round((lastEpisodeWatched / anime.episodes) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{lastEpisodeWatched}/{anime.episodes}</span>
            </div>
          )}

          {/* Vibe chips */}
          {!(currentStatus === 'WATCHING' && lastEpisodeWatched !== undefined && anime.episodes) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {anime.vibeMeter.slice(0, 2).map((vibe) => (
                <span key={vibe} className={cn('vibe-chip', vibeColorMap[vibe] || 'vibe-chip')}>
                  {vibe}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={cn(
          "transition-all duration-500 ease-out",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        )}>
          <ListStatusDropdown
            currentStatus={currentStatus}
            onStatusChange={(status) => {
              if (onStatusChange) {
                onStatusChange(anime, status);
              } else if (status === 'SAVED' && onSave) {
                onSave(anime);
              } else if (status === 'LOVED' && onLove) {
                onLove(anime);
              }
            }}
            onRemove={onRemove ? () => onRemove(anime) : undefined}
            variant="icon"
            size="sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative rounded-xl overflow-hidden cursor-pointer bg-[#151b2d] transition-[background-color,box-shadow] duration-500 ease-out hover:bg-[#1d2438]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={proxyImage(anime.coverImage.large)}
          alt={title}
          className={cn(
            "w-full h-full object-cover transition-transform duration-500 ease-out will-change-transform",
            imageLoaded ? "opacity-100" : "opacity-0",
            isHovered ? "scale-110" : "scale-100"
          )}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
        />

        {/* Gradient overlay */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300 ease-out",
          isHovered
            ? "bg-gradient-to-t from-[#0c1324] via-[#0c1324]/40 to-transparent opacity-90"
            : "bg-gradient-to-t from-[#0c1324] via-[#0c1324]/20 to-transparent opacity-70"
        )} />

        {/* Score badge */}
        {anime.averageScore && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-sm font-medium">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            <span>{anime.averageScore}%</span>
          </div>
        )}

        {/* Rank badge */}
        {anime.rank && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-coral/90 backdrop-blur-sm text-sm font-medium text-white">
            <Trophy className="w-3.5 h-3.5" />
            <span>#{anime.rank}</span>
          </div>
        )}

        {/* Quick actions overlay */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-[#0c1324]/50 backdrop-blur-[6px] transition-all duration-300 ease-out",
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <ListStatusDropdown
            currentStatus={currentStatus}
            onStatusChange={(status) => {
              if (onStatusChange) {
                onStatusChange(anime, status);
              } else if (status === 'SAVED' && onSave) {
                onSave(anime);
              } else if (status === 'LOVED' && onLove) {
                onLove(anime);
              }
            }}
            onRemove={onRemove ? () => onRemove(anime) : undefined}
            variant="button"
            size="md"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title and meta */}
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-coral transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>{anime.modernity.release}</span>
            <span>•</span>
            <span>{anime.format}</span>
            <span>•</span>
            <span>{formatEpisodes(anime)}</span>
          </div>
        </div>

        {/* Progress bar for WATCHING status */}
        {currentStatus === 'WATCHING' && lastEpisodeWatched !== undefined && anime.episodes && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-violet/10 border border-violet/20">
            <Eye className="w-4 h-4 text-violet flex-shrink-0" />
            <ProgressBar
              current={lastEpisodeWatched}
              total={anime.episodes}
              className="flex-1"
            />
          </div>
        )}

        {/* Studios & Source */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Tv className="w-3 h-3" />
            {anime.studios?.nodes && anime.studios.nodes.length > 0
              ? anime.studios.nodes[0].name
              : 'Unknown Studio'}
          </div>
          {anime.source && (
            <span className="px-1.5 py-0.5 rounded bg-secondary/50 text-secondary-foreground">
              {anime.source}
            </span>
          )}
        </div>

        {/* Members & Rating */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {anime.members && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{formatMembers(anime.members)} members</span>
            </div>
          )}
          {anime.rating && (
            <span className="px-1.5 py-0.5 rounded bg-violet/20 text-violet">
              {anime.rating}
            </span>
          )}
        </div>

        {/* Vibe chips */}
        <div className="flex flex-wrap gap-1.5">
          {anime.vibeMeter.map((vibe) => (
            <span key={vibe} className={cn('vibe-chip', vibeColorMap[vibe] || 'vibe-chip')}>
              {vibe}
            </span>
          ))}
        </div>

        {/* Signature widgets */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
          {/* Finishability */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-teal">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-semibold text-sm">{anime.finishability}/10</span>
            </div>
            <span className="text-xs text-muted-foreground">Finishability</span>
          </div>

          {/* Energy */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-coral">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-semibold text-sm capitalize">{anime.energyLevel}</span>
            </div>
            <span className="text-xs text-muted-foreground">Energy</span>
          </div>

          {/* Tear risk */}
          {anime.tearRisk && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-violet">
                <Droplets className="w-3.5 h-3.5" />
                <span className="font-semibold text-sm capitalize">{anime.tearRisk}</span>
              </div>
              <span className="text-xs text-muted-foreground">Tear Risk</span>
            </div>
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {anime.genres.slice(0, 3).map((genre) => (
            <span key={genre} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
              {genre}
            </span>
          ))}
        </div>

        {/* Description — smooth expand on hover using grid-template-rows trick */}
        {description && (
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: isHovered ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
                {description}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
