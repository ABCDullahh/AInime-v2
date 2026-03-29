import { Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  onAISearch: (query: string) => void;
  isLoading?: boolean;
}

export function HeroSection({ onSearch, onAISearch, isLoading }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-coral/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-violet/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border/50 text-sm">
            <Sparkles className="w-4 h-4 text-coral" />
            <span className="text-muted-foreground">Powered by AI • AniList Data</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Discover Your Next
            <span className="block gradient-text">Favorite Anime</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered recommendations that understand your taste. 
            Search naturally—"fantasy like Frieren tapi modern"—and get perfect matches.
          </p>

          {/* Search Bar */}
          <div className="pt-4">
            <SearchBar
              onSearch={onSearch}
              onAISearch={onAISearch}
              isLoading={isLoading}
              placeholder="Cari anime atau tanya AI: 'romance yang bikin nangis'..."
              className="max-w-2xl mx-auto"
            />
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <span className="text-sm text-muted-foreground">Popular:</span>
            <button 
              onClick={() => onAISearch('fantasy adventure dengan MC OP')}
              className="text-sm px-3 py-1 rounded-full bg-secondary hover:bg-coral/20 hover:text-coral transition-colors"
            >
              Fantasy Adventure MC OP
            </button>
            <button 
              onClick={() => onAISearch('slice of life yang cozy dan healing')}
              className="text-sm px-3 py-1 rounded-full bg-secondary hover:bg-coral/20 hover:text-coral transition-colors"
            >
              Cozy Slice of Life
            </button>
            <button 
              onClick={() => onAISearch('psychological thriller yang mind-blowing')}
              className="text-sm px-3 py-1 rounded-full bg-secondary hover:bg-coral/20 hover:text-coral transition-colors"
            >
              Mind-blowing Thriller
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-coral" />
              <span>50,000+ Anime</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal" />
              <span>Updated Daily</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet" />
              <span>AI Powered</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
