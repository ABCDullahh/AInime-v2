import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, Loader2, TrendingUp, Star, Zap, ChevronDown, ChevronUp, Brain, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimeCard } from '@/components/AnimeCard';
import { useAIRecommendations, AIRecommendation } from '@/hooks/useAIRecommendations';
import { UserListEntry } from '@/hooks/useAnimeData';
import { AnimeCardData } from '@/types/anime';
import { cn } from '@/lib/utils';

interface AIRecommendationsProps {
  entries: UserListEntry[];
  onSave?: (anime: AnimeCardData) => void;
  onLove?: (anime: AnimeCardData) => void;
}

export function AIRecommendations({ entries, onSave, onLove }: AIRecommendationsProps) {
  const navigate = useNavigate();
  const { result, isLoading, error, generate, refresh } = useAIRecommendations();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);

  // Auto-generate on first load if we have entries but no result
  useEffect(() => {
    if (entries.length > 0 && !result && !isLoading) {
      generate(entries);
    }
  }, [entries.length, result, isLoading, generate]);

  const handleGenerate = () => {
    if (entries.length === 0) return;
    generate(entries);
  };

  const handleRefresh = () => {
    if (entries.length === 0) return;
    refresh(entries);
  };

  const handleRecommendationClick = (rec: AIRecommendation) => {
    if (rec.anime) {
      navigate(`/anime/${rec.anime.id}`);
    } else {
      // If we don't have anime data, navigate to AI search with the title
      navigate(`/ai?q=${encodeURIComponent(rec.title)}`);
    }
  };

  if (entries.length === 0) {
    return (
      <section className="mt-8 pt-6 border-t border-border/50" data-testid="ai-recommendations-section">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-violet" />
          <h3 className="text-lg font-semibold">AI-Powered Recommendations</h3>
        </div>
        <div className="glass-card p-6 rounded-xl text-center text-muted-foreground">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium mb-2">Add anime to your list first!</p>
          <p className="text-sm">
            We'll analyze your watch history and preferences to generate personalized recommendations just for you.
          </p>
          <Button
            variant="coral"
            className="mt-4"
            onClick={() => navigate('/')}
          >
            Discover Anime
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 pt-6 border-t border-border/50" data-testid="ai-recommendations-section">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet" />
          <h3 className="text-lg font-semibold">AI-Powered Recommendations</h3>
          {result && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet/20 text-violet">
              Personalized
            </span>
          )}
        </div>
        <Button
          variant={result ? 'outline' : 'coral'}
          size="sm"
          onClick={result ? handleRefresh : handleGenerate}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : result ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate
            </>
          )}
        </Button>
      </div>

      {/* Error state */}
      {error && !result && (
        <div className="glass-card p-4 rounded-xl border border-red-500/30 bg-red-500/10 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !result && (
        <div className="glass-card p-8 rounded-xl text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-violet/30 animate-pulse" />
            <div className="absolute inset-2 rounded-full border-2 border-t-violet border-transparent animate-spin" />
            <Brain className="absolute inset-0 m-auto w-6 h-6 text-violet" />
          </div>
          <p className="text-muted-foreground">
            Analyzing your {entries.length} anime to find your perfect matches...
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Personalized message */}
          <div className="glass-card p-4 rounded-xl border border-violet/20 bg-gradient-to-r from-violet/5 to-coral/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet/20">
                <Target className="w-5 h-5 text-violet" />
              </div>
              <div>
                <p className="text-foreground leading-relaxed">
                  {result.personalizedMessage}
                </p>
              </div>
            </div>
          </div>

          {/* Analysis toggle */}
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Your Taste Analysis</span>
            {showAnalysis ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Analysis panel */}
          {showAnalysis && (
            <div className="glass-card p-4 rounded-xl animate-slide-up" data-testid="taste-analysis">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Top Genres */}
                <div>
                  <h4 className="text-xs text-muted-foreground mb-2">Top Genres</h4>
                  <div className="flex flex-wrap gap-1">
                    {result.analysis.topGenres.map((genre) => (
                      <span
                        key={genre}
                        className="text-xs px-2 py-0.5 rounded-full bg-coral/20 text-coral"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mood Profile */}
                <div>
                  <h4 className="text-xs text-muted-foreground mb-2">Mood Profile</h4>
                  <p className="text-sm text-foreground">{result.analysis.moodProfile}</p>
                </div>

                {/* Watching Patterns */}
                <div>
                  <h4 className="text-xs text-muted-foreground mb-2">Pattern</h4>
                  <p className="text-sm text-foreground">{result.analysis.watchingPatterns}</p>
                </div>

                {/* Preferred Formats */}
                <div>
                  <h4 className="text-xs text-muted-foreground mb-2">Formats</h4>
                  <div className="flex flex-wrap gap-1">
                    {result.analysis.preferredFormats.map((format) => (
                      <span
                        key={format}
                        className="text-xs px-2 py-0.5 rounded-full bg-teal/20 text-teal"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations list */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-gold" />
              {result.recommendations.length} Personalized Picks
            </h4>

            {/* Recommendations with anime data - show as cards */}
            {result.recommendations.some((r) => r.anime) && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {result.recommendations
                  .filter((r) => r.anime)
                  .map((rec) => (
                    <div key={rec.title} className="relative group">
                      <AnimeCard
                        anime={rec.anime!}
                        onSave={onSave}
                        onLove={onLove}
                      />
                      {/* Match score badge */}
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet/90 text-white text-xs font-medium backdrop-blur-sm">
                        <Zap className="w-3 h-3" />
                        {rec.matchScore}%
                      </div>
                      {/* Reason tooltip on hover */}
                      <div className={cn(
                        "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background via-background/95 to-transparent",
                        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                        "pointer-events-none"
                      )}>
                        <p className="text-xs text-foreground line-clamp-2">
                          {rec.reason}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Recommendations without anime data - show as list */}
            {result.recommendations.some((r) => !r.anime) && (
              <div className="space-y-3">
                {result.recommendations
                  .filter((r) => !r.anime)
                  .map((rec) => (
                    <div
                      key={rec.title}
                      className="glass-card p-4 rounded-xl hover:border-coral/30 transition-all cursor-pointer"
                      onClick={() => handleRecommendationClick(rec)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold text-foreground">{rec.title}</h5>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet/20 text-violet text-xs">
                              <Zap className="w-3 h-3" />
                              {rec.matchScore}% match
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rec.genres.map((genre) => (
                              <span
                                key={genre}
                                className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                          <p
                            className={cn(
                              "text-sm text-muted-foreground mt-2 transition-all",
                              expandedRec === rec.title ? "" : "line-clamp-2"
                            )}
                          >
                            {rec.reason}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRec(expandedRec === rec.title ? null : rec.title);
                          }}
                        >
                          {expandedRec === rec.title ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4">
            Powered by Gemini AI with Google Search grounding
          </div>
        </div>
      )}

      {/* Empty state - no result yet */}
      {!result && !isLoading && !error && (
        <div className="glass-card p-6 rounded-xl text-center text-muted-foreground">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium mb-2">Get Personalized Recommendations</p>
          <p className="text-sm mb-4">
            Click "Generate" to analyze your {entries.length} anime and get AI-powered suggestions tailored to your taste.
          </p>
          <Button variant="coral" onClick={handleGenerate} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Recommendations
          </Button>
        </div>
      )}
    </section>
  );
}
