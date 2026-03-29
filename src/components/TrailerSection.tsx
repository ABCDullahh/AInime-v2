import { useState, useCallback } from 'react';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeTrailer } from '@/types/anime';
import { cn, proxyImage, handleImageError } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TrailerSectionProps {
  trailers: AnimeTrailer[];
  className?: string;
}

export function TrailerSection({ trailers, className }: TrailerSectionProps) {
  const [activeTrailer, setActiveTrailer] = useState<AnimeTrailer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openTrailer = useCallback((trailer: AnimeTrailer) => {
    setActiveTrailer(trailer);
    setIsModalOpen(true);
  }, []);

  const closeTrailer = useCallback(() => {
    setIsModalOpen(false);
    setActiveTrailer(null);
  }, []);

  const navigateTrailer = useCallback((direction: 'prev' | 'next') => {
    if (!activeTrailer) return;
    const currentIndex = trailers.findIndex(t => t.id === activeTrailer.id);
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : trailers.length - 1;
    } else {
      newIndex = currentIndex < trailers.length - 1 ? currentIndex + 1 : 0;
    }

    setActiveTrailer(trailers[newIndex]);
  }, [activeTrailer, trailers]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeTrailer();
    } else if (e.key === 'ArrowLeft') {
      navigateTrailer('prev');
    } else if (e.key === 'ArrowRight') {
      navigateTrailer('next');
    }
  }, [closeTrailer, navigateTrailer]);

  if (!trailers || trailers.length === 0) {
    return null;
  }

  const getEmbedUrl = (trailer: AnimeTrailer) => {
    if (trailer.site === 'youtube') {
      return `https://www.youtube.com/embed/${trailer.id}?autoplay=1&rel=0`;
    } else if (trailer.site === 'dailymotion') {
      return `https://www.dailymotion.com/embed/video/${trailer.id}?autoplay=1`;
    }
    return '';
  };

  return (
    <>
      <section className={cn("container py-8", className)} data-testid="trailer-section">
        <h2 className="text-xl font-bold mb-6">Trailers & PVs</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trailers.map((trailer, index) => (
            <button
              key={trailer.id}
              onClick={() => openTrailer(trailer)}
              className="group relative aspect-video rounded-xl overflow-hidden glass-card glow-card transition-all duration-300 hover:border-coral/30 hover:shadow-elevated focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 focus:ring-offset-background"
              data-testid={`trailer-thumbnail-${index}`}
            >
              {/* Thumbnail */}
              <img
                src={proxyImage(trailer.thumbnail)}
                alt={trailer.title || `Trailer ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={handleImageError}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-coral/90 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-coral">
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </div>
              </div>

              {/* Title */}
              {trailer.title && (
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-sm font-medium text-white truncate drop-shadow-lg">
                    {trailer.title}
                  </p>
                </div>
              )}

              {/* Trailer number badge */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium">
                {trailer.site === 'youtube' ? 'YouTube' : 'Dailymotion'}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Video Modal */}
      {isModalOpen && activeTrailer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
          onClick={closeTrailer}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label="Trailer video player"
          data-testid="trailer-modal"
        >
          <div
            className="relative w-full max-w-5xl mx-4 aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={closeTrailer}
              className="absolute -top-12 right-0 text-foreground hover:text-coral z-10"
              aria-label="Close trailer"
              data-testid="close-trailer-button"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Navigation buttons */}
            {trailers.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTrailer('prev');
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-2 text-foreground hover:text-coral"
                  aria-label="Previous trailer"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTrailer('next');
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2 text-foreground hover:text-coral"
                  aria-label="Next trailer"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            {/* Iframe */}
            <iframe
              src={getEmbedUrl(activeTrailer)}
              className="w-full h-full rounded-xl shadow-elevated"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={activeTrailer.title || 'Anime Trailer'}
              data-testid="trailer-iframe"
            />

            {/* Trailer info */}
            <div className="absolute -bottom-10 left-0 right-0 text-center">
              <p className="text-sm text-muted-foreground">
                {activeTrailer.title || `Trailer ${trailers.findIndex(t => t.id === activeTrailer.id) + 1} of ${trailers.length}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
