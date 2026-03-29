/**
 * Enhanced Similar Anime Section Component
 *
 * Displays similar anime with detailed similarity scores and reasons.
 */

import { Link } from 'react-router-dom';
import { Star, Info, Sparkles, TrendingUp } from 'lucide-react';
import {
  useEnhancedSimilarAnime,
  EnhancedSimilarAnime as EnhancedSimilarAnimeType,
  getSimilarityColor,
  getMatchTypeBadge,
  formatSimilarityBreakdown,
} from '@/hooks/useEnhancedSimilarAnime';
import { AnimeCardData } from '@/types/anime';
import { cn, proxyImage, handleImageError } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EnhancedSimilarAnimeSectionProps {
  sourceAnime: AnimeCardData | undefined;
  malId?: number;
  className?: string;
}

function SimilarityBadge({
  score,
  matchType,
}: {
  score: number;
  matchType: 'on-target' | 'adjacent' | 'wildcard';
}) {
  const badge = getMatchTypeBadge(matchType);

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('text-sm font-semibold', getSimilarityColor(score))}>
        {score}%
      </span>
      <span className={cn('text-xs px-1.5 py-0.5 rounded-full', badge.className)}>
        {badge.label}
      </span>
    </div>
  );
}

function SimilarAnimeCard({ item }: { item: EnhancedSimilarAnimeType }) {
  const { anime, similarity } = item;
  const title = anime.title.english || anime.title.romaji;

  return (
    <Link to={`/anime/${anime.id}`} className="group block">
      <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 group-hover:shadow-elevated group-hover:scale-[1.02]">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={proxyImage(anime.coverImage.large)}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={handleImageError}
          />
          {/* Similarity Score Overlay */}
          <div className="absolute top-2 right-2">
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm',
              similarity.overall >= 70 ? 'bg-emerald-500/90 text-white' :
              similarity.overall >= 50 ? 'bg-teal/90 text-white' :
              'bg-background/90 text-foreground'
            )}>
              {similarity.overall}%
            </div>
          </div>
          {/* Match Type Badge */}
          <div className="absolute bottom-2 left-2">
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full backdrop-blur-sm',
              getMatchTypeBadge(similarity.matchType).className
            )}>
              {getMatchTypeBadge(similarity.matchType).label}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-coral transition-colors">
            {title}
          </h3>

          {/* Score and Quick Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {anime.averageScore && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-gold text-gold" />
                <span>{anime.averageScore}%</span>
              </div>
            )}
            <span>{anime.format}</span>
          </div>

          {/* Similarity Reasons */}
          {similarity.reasons.length > 0 && (
            <div className="pt-1 border-t border-border/50">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground cursor-help">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">
                        {similarity.reasons[0]}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">Why this recommendation:</p>
                      <ul className="text-xs space-y-0.5">
                        {similarity.reasons.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                      <div className="pt-1 mt-1 border-t border-border/50 text-xs text-muted-foreground">
                        {formatSimilarityBreakdown(similarity)}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="rounded-xl bg-muted aspect-[3/4]" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EnhancedSimilarAnimeSection({
  sourceAnime,
  malId,
  className,
}: EnhancedSimilarAnimeSectionProps) {
  const { data, isLoading, error } = useEnhancedSimilarAnime(sourceAnime, malId, {
    limit: 12,
    includeUserPreferences: true,
  });

  if (error) {
    return null; // Silent fail for similar anime
  }

  if (isLoading) {
    return (
      <section className={cn('container py-8', className)}>
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-bold">Similar Anime</h2>
          <Sparkles className="w-5 h-5 text-coral" />
        </div>
        <LoadingSkeleton />
      </section>
    );
  }

  if (!data || data.animes.length === 0) {
    return null;
  }

  return (
    <section className={cn('container py-8 pb-16', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Similar Anime</h2>
          <Sparkles className="w-5 h-5 text-coral" />
        </div>
        {data.isUsingUserPreferences && (
          <div className="flex items-center gap-1.5 text-xs text-teal bg-teal/10 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            <span>Personalized</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {data.animes.map((item, idx) => (
          <SimilarAnimeCard key={`${item.anime.id}-${idx}`} item={item} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Strong Match (70%+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal" />
          <span>Related (45-69%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet" />
          <span>Discovery (&lt;45%)</span>
        </div>
      </div>
    </section>
  );
}
