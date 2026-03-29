import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, X, Loader2, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onAISearch?: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ 
  onSearch, 
  onAISearch, 
  isLoading = false,
  placeholder = "Search anime by title...",
  className 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleAISearch = () => {
    if (query.trim() && onAISearch) {
      onAISearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn(
        "relative flex items-center gap-2",
        className
      )}
    >
      <div className={cn(
        "relative flex-1 group transition-all duration-300",
        isFocused && "scale-[1.01]"
      )}>
        {/* Glow effect */}
        <div className={cn(
          "absolute -inset-1 bg-gradient-to-r from-coral/20 to-violet/20 rounded-xl blur-lg opacity-0 transition-opacity duration-300",
          isFocused && "opacity-100"
        )} />

        <div className="relative flex items-center">
          <Search className={cn(
            "absolute left-4 w-5 h-5 transition-colors duration-200",
            isFocused ? "text-coral" : "text-muted-foreground"
          )} />
          
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={cn(
              "h-12 pl-12 pr-24 text-base rounded-xl border-2",
              "bg-card/80 backdrop-blur-sm",
              isFocused ? "border-coral/50" : "border-border/50",
              "focus:ring-0 focus:border-coral/50"
            )}
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-20 p-1 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Keyboard hint and help */}
          {!query && !isFocused && (
            <div className="absolute right-4 hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-full hover:bg-secondary transition-colors"
                    title="Advanced search help"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 text-sm" side="bottom" align="end">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Advanced Search</h4>
                    <div className="space-y-2 text-muted-foreground">
                      <p className="font-medium text-foreground">Boolean Operators:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><code className="bg-secondary px-1 rounded">action AND romance</code></li>
                        <li><code className="bg-secondary px-1 rounded">fantasy NOT horror</code></li>
                      </ul>

                      <p className="font-medium text-foreground pt-2">Filters:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><code className="bg-secondary px-1 rounded">studio:MAPPA</code></li>
                        <li><code className="bg-secondary px-1 rounded">year:2020-2023</code></li>
                        <li><code className="bg-secondary px-1 rounded">score:&gt;80</code></li>
                        <li><code className="bg-secondary px-1 rounded">genre:Action</code></li>
                        <li><code className="bg-secondary px-1 rounded">-genre:Horror</code></li>
                        <li><code className="bg-secondary px-1 rounded">format:TV</code></li>
                        <li><code className="bg-secondary px-1 rounded">status:airing</code></li>
                        <li><code className="bg-secondary px-1 rounded">episodes:12-24</code></li>
                      </ul>

                      <p className="font-medium text-foreground pt-2">Examples:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><code className="bg-secondary px-1 rounded">"attack on titan"</code></li>
                        <li><code className="bg-secondary px-1 rounded">isekai year:2020-2023 score:&gt;75</code></li>
                      </ul>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono">K</kbd>
            </div>
          )}

          {/* Submit button */}
          {query && (
            <Button
              type="submit"
              variant="coral"
              size="sm"
              className="absolute right-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* AI Search button */}
      {onAISearch && (
        <Button
          type="button"
          variant="hero"
          size="lg"
          onClick={handleAISearch}
          disabled={!query.trim() || isLoading}
          className="hidden sm:flex gap-2"
        >
          <Sparkles className="w-4 h-4" />
          AI Search
        </Button>
      )}
    </form>
  );
}
