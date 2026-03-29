import { useState, useCallback, useMemo } from 'react';
import { Search, Plus, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAnimeSearch } from '@/hooks/useAnimeData';
import { Anime } from '@/types/anime';
import { cn, proxyImage, handleImageError } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface AnimeSearchForTierProps {
  onAddAnime: (anime: Anime) => void;
  addedAnimeIds: number[];
}

export function AnimeSearchForTier({ onAddAnime, addedAnimeIds }: AnimeSearchForTierProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const searchFilters = useMemo(() =>
    debouncedQuery.length >= 2 ? { query: debouncedQuery, excludeNsfw: true } : undefined,
    [debouncedQuery]
  );

  const { data: searchResults, isLoading } = useAnimeSearch(searchFilters);

  const handleAdd = useCallback((anime: Anime) => {
    onAddAnime(anime);
  }, [onAddAnime]);

  const filteredResults = useMemo(() =>
    (searchResults || []).filter((anime) => !addedAnimeIds.includes(anime.id)),
    [searchResults, addedAnimeIds]
  );

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search anime to add..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[400px] overflow-y-auto rounded-lg border bg-background shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredResults && filteredResults.length > 0 ? (
            <div className="p-2 space-y-1">
              {filteredResults.slice(0, 10).map((anime) => (
                <div
                  key={anime.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer'
                  )}
                  onClick={() => handleAdd(anime)}
                >
                  <img
                    src={proxyImage(anime.coverImage.large)}
                    alt={anime.title.english || anime.title.romaji}
                    className="w-10 h-14 object-cover rounded"
                    onError={handleImageError}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {anime.title.english || anime.title.romaji}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {anime.seasonYear} {anime.format && `- ${anime.format}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No anime found matching "{query}"
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
