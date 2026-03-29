import { useState, useMemo, useCallback } from 'react';
import { Bookmark, Heart, Eye, Check, X, Sparkles, RefreshCw, Loader2, Play } from 'lucide-react';
import { Header } from '@/components/Header';
import { AnimeGrid } from '@/components/AnimeGrid';
import { EpisodeProgressTracker } from '@/components/EpisodeProgressTracker';
import { ListShareButton } from '@/components/ShareButton';
import { AIRecommendations } from '@/components/AIRecommendations';
import { useUserList, UserListEntry } from '@/hooks/useAnimeData';
import { useMetaTags, getListMetaTags } from '@/hooks/useMetaTags';
import { AnimeCardData } from '@/types/anime';
import { toast } from '@/hooks/use-toast';
import { cn, handleImageError } from '@/lib/utils';

// Kitsu CDN anime covers for decorative empty state
const EMPTY_STATE_ANIME = [
  { id: 1, name: 'Cowboy Bebop' },
  { id: 7442, name: 'Attack on Titan' },
  { id: 8271, name: 'Steins;Gate' },
  { id: 6, name: 'Fullmetal Alchemist' },
  { id: 12, name: 'One Piece' },
  { id: 11, name: 'Naruto' },
  { id: 3, name: 'Trigun' },
  { id: 13, name: 'Samurai Champloo' },
];

type ListStatus = 'ALL' | 'SAVED' | 'LOVED' | 'WATCHING' | 'WATCHED' | 'DROPPED';

const statusConfig = {
  SAVED: { icon: Bookmark, label: 'Saved', color: 'text-teal' },
  LOVED: { icon: Heart, label: 'Loved', color: 'text-coral' },
  WATCHING: { icon: Eye, label: 'Watching', color: 'text-violet' },
  WATCHED: { icon: Check, label: 'Watched', color: 'text-green-500' },
  DROPPED: { icon: X, label: 'Dropped', color: 'text-muted-foreground' },
};

export default function MyList() {
  const [activeStatus, setActiveStatus] = useState<ListStatus>('ALL');
  const { entries, addToList, removeFromList, getByStatus, updateEpisodeProgress } = useUserList();

  // AI Summary state
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(() => {
    return localStorage.getItem('ainime_generated_summary');
  });
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const filteredEntries = useMemo(() => {
    if (activeStatus === 'ALL') return entries;
    return getByStatus(activeStatus as UserListEntry['status']);
  }, [entries, activeStatus, getByStatus]);

  // Get currently watching entries for progress tracking
  const watchingEntries = useMemo(() => {
    return getByStatus('WATCHING');
  }, [getByStatus]);

  // Calculate total episodes remaining across all watching anime
  const totalEpisodesRemaining = useMemo(() => {
    return watchingEntries.reduce((total, entry) => {
      const episodes = entry.anime.episodes || 0;
      const watched = entry.lastEpisodeWatched || 0;
      return total + Math.max(0, episodes - watched);
    }, 0);
  }, [watchingEntries]);

  // Create a map of anime ID to entry data for progress display in grid
  const entryDataMap = useMemo(() => {
    const map = new Map<number, { status: UserListEntry['status']; lastEpisodeWatched?: number }>();
    entries.forEach(entry => {
      map.set(entry.animeId, {
        status: entry.status,
        lastEpisodeWatched: entry.lastEpisodeWatched,
      });
    });
    return map;
  }, [entries]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: entries.length };
    for (const status of Object.keys(statusConfig)) {
      counts[status] = entries.filter(e => e.status === status).length;
    }
    return counts;
  }, [entries]);

  // Get top genres for sharing
  const topGenres = useMemo(() => getTopGenres(entries), [entries]);

  // Get cover images for share card
  const coverImages = useMemo(() => {
    return entries.slice(0, 6).map(e => e.anime.coverImage.large);
  }, [entries]);

  // Update meta tags for social sharing
  const metaTags = getListMetaTags(entries.length);
  useMetaTags(metaTags);

  const handleSave = (anime: AnimeCardData) => {
    addToList(anime, 'SAVED');
    toast({ title: "Moved to Saved" });
  };

  const handleLove = (anime: AnimeCardData) => {
    addToList(anime, 'LOVED');
    toast({ title: "Moved to Loved" });
  };

  const handleRemove = (animeId: number, title: string) => {
    removeFromList(animeId);
    toast({
      title: "Removed from list",
      description: `${title} has been removed.`
    });
  };

  const handleMarkComplete = (anime: AnimeCardData) => {
    addToList(anime, 'WATCHED');
    toast({
      title: "Completed!",
      description: `${anime.title.english || anime.title.romaji} marked as watched.`
    });
  };

  // Generate AI Summary
  const generateSummary = useCallback(async () => {
    if (entries.length === 0) {
      toast({ title: "Add some anime first!", description: "Your list is empty." });
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const topGenres = getTopGenres(entries);
      const watchedCount = entries.filter(e => e.status === 'WATCHED').length;
      const lovedCount = entries.filter(e => e.status === 'LOVED').length;
      const topGenre = topGenres[0]?.genre || 'beragam';

      const summaries = [
        `Wow! Kamu sudah mengoleksi ${entries.length} anime! Dengan ${topGenre} sebagai genre favorit, sepertinya kamu punya selera yang mantap!`,
        `Sebagai kolektor ${entries.length} anime dengan preferensi ${topGenre}, kamu jelas tau mana anime yang bagus! ${lovedCount > 0 ? `Plus ${lovedCount} anime favorit!` : ''}`,
        `${entries.length} anime dan terus bertambah! Genre ${topGenre} nampaknya jadi andalanmu. ${watchedCount > 0 ? `Sudah namatin ${watchedCount} anime - respect!` : 'Keep watching!'}`,
      ];

      const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];

      setGeneratedSummary(randomSummary);
      localStorage.setItem('ainime_generated_summary', randomSummary);
      toast({ title: "Summary generated!" });
    } catch (error) {
      console.error('Failed to generate summary:', error);
      const fallback = `Kamu adalah otaku sejati dengan ${entries.length} anime di koleksi! Keep watching!`;
      setGeneratedSummary(fallback);
      localStorage.setItem('ainime_generated_summary', fallback);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [entries]);

  const animes = filteredEntries.map(e => e.anime);

  // Derive stats for taste profile
  const completionRate = entries.length > 0
    ? Math.round(((statusCounts.WATCHED || 0) / entries.length) * 100)
    : 0;
  const topGenre = topGenres[0]?.genre || 'N/A';
  const meanScore = entries.length > 0
    ? (entries.reduce((sum, e) => sum + (e.anime.averageScore || 0), 0) / entries.filter(e => e.anime.averageScore).length / 10).toFixed(1)
    : '0.0';

  // Get the first watching entry for the featured card
  const featuredWatching = watchingEntries[0] || null;

  return (
    <div className="min-h-screen bg-dc-bg">
      <Header />

      <main className="pt-32 pb-20 px-[3.5rem] max-w-[1440px] mx-auto">
        {/* Hero Section */}
        <header className="mb-20 flex items-start justify-between relative overflow-hidden">
          {/* Atmospheric anime covers behind the heading */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {[1, 6, 11, 7442, 3936].map((kitsuId, idx) => (
              <div
                key={kitsuId}
                className="absolute rounded-2xl overflow-hidden opacity-[0.05]"
                style={{
                  width: `${140 + idx * 25}px`,
                  aspectRatio: '3/4',
                  top: `${-25 + idx * 15}%`,
                  right: `${8 + idx * 16}%`,
                  transform: `rotate(${-10 + idx * 6}deg)`,
                }}
              >
                <img
                  src={`https://media.kitsu.app/anime/poster_images/${kitsuId}/large.jpg`}
                  alt=""
                  className="w-full h-full object-cover grayscale"
                  onError={handleImageError}
                  loading="lazy"
                />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-dc-bg via-transparent to-dc-bg/60" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dc-bg" />
          </div>

          <div className="relative z-10">
            <h1 className="text-8xl md:text-[10rem] font-black tracking-[-0.06em] leading-none text-dc-on-surface">
              MY <span className="text-dc-primary italic font-light">LIST</span>
            </h1>
            <p className="mt-4 text-slate-400 text-label">Curating your digital library.</p>
          </div>
          {entries.length > 0 && (
            <div className="relative z-10">
              <ListShareButton
                title="My Anime List"
                animeCount={entries.length}
                watchedCount={statusCounts.WATCHED || 0}
                topGenres={topGenres}
                coverImages={coverImages}
                variant="button"
                size="md"
              />
            </div>
          )}
        </header>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-12 mb-20">
          {(['WATCHING', 'SAVED', 'LOVED', 'WATCHED', 'DROPPED'] as const).map((status) => {
            const config = statusConfig[status];
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                onClick={() => setActiveStatus(isActive ? 'ALL' : status)}
                className={cn(
                  'pb-2 tracking-wide transition-all text-sm font-medium',
                  isActive
                    ? 'text-dc-primary font-bold border-b-2 border-dc-primary'
                    : 'text-slate-500 hover:text-dc-on-surface'
                )}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center relative">
            {/* Decorative row of faded anime covers behind the empty state */}
            <div className="absolute inset-x-0 top-8 flex justify-center gap-4 opacity-[0.08] pointer-events-none overflow-hidden">
              {EMPTY_STATE_ANIME.map((anime, idx) => (
                <div
                  key={anime.id}
                  className="w-24 md:w-28 rounded-xl overflow-hidden flex-shrink-0"
                  style={{
                    aspectRatio: '3/4',
                    transform: `rotate(${-6 + idx * 2}deg) translateY(${idx % 2 === 0 ? 0 : 12}px)`,
                  }}
                >
                  <img
                    src={`https://media.kitsu.app/anime/poster_images/${anime.id}/small.jpg`}
                    alt={anime.name}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            <div className="relative z-10">
              <div className="w-24 h-24 mb-6 rounded-full bg-dc-surface-high flex items-center justify-center mx-auto">
                <Bookmark className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-dc-on-surface">Your list is empty</h3>
              <p className="text-slate-400 max-w-md mb-6">
                Start adding anime to your list by clicking the save, love, or watch buttons on any anime card.
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-dc-primary text-dc-bg font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all"
              >
                Discover Anime
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Two-Column Layout: Featured + Taste Profile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-32">
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-16">
                {/* Featured Watching Card */}
                {featuredWatching && (
                  <section>
                    <div className="text-label text-slate-500 tracking-[0.2em] mb-6">Immediate Focus</div>
                    <div className="relative group overflow-hidden rounded-xl bg-dc-surface-low aspect-[21/9] flex items-end">
                      <img
                        src={featuredWatching.anime.bannerImage || featuredWatching.anime.coverImage.large}
                        alt={featuredWatching.anime.title.english || featuredWatching.anime.title.romaji}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dc-bg via-transparent to-transparent" />
                      <div className="relative p-10 w-full">
                        <h2 className="text-4xl font-bold tracking-tight mb-2 text-dc-on-surface">
                          {featuredWatching.anime.title.english || featuredWatching.anime.title.romaji}
                        </h2>
                        <p className="text-slate-400 mb-8 max-w-md">
                          {featuredWatching.lastEpisodeWatched
                            ? `On Episode ${featuredWatching.lastEpisodeWatched} of ${featuredWatching.anime.episodes || '?'} \u2014 ${
                                featuredWatching.anime.episodes
                                  ? `${featuredWatching.anime.episodes - featuredWatching.lastEpisodeWatched} remaining`
                                  : 'ongoing'
                              }`
                            : `${featuredWatching.anime.episodes || '?'} episodes \u2014 not started yet`}
                        </p>
                        <div className="flex items-center gap-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const current = featuredWatching.lastEpisodeWatched || 0;
                              const total = featuredWatching.anime.episodes || 0;
                              if (total === 0 || current < total) {
                                updateEpisodeProgress(featuredWatching.animeId, current + 1);
                                toast({
                                  title: `Episode ${current + 1} watched`,
                                  description: total > 0 ? `${total - (current + 1)} episodes remaining` : undefined,
                                });
                                // Auto-complete if finished
                                if (total > 0 && current + 1 === total) {
                                  handleMarkComplete(featuredWatching.anime);
                                }
                              }
                            }}
                            disabled={
                              (featuredWatching.anime.episodes || 0) > 0 &&
                              (featuredWatching.lastEpisodeWatched || 0) >= (featuredWatching.anime.episodes || 0)
                            }
                            className="bg-dc-primary text-dc-bg font-bold px-8 py-3 rounded-full flex items-center gap-2 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Play className="w-5 h-5 fill-current" />
                            Mark Next Episode
                          </button>
                          <div className="flex-1 max-w-xs">
                            <div className="flex justify-between text-[0.65rem] uppercase tracking-widest text-slate-500 mb-2">
                              <span>Progress</span>
                              <span>
                                {featuredWatching.anime.episodes
                                  ? `${Math.round(((featuredWatching.lastEpisodeWatched || 0) / featuredWatching.anime.episodes) * 100)}%`
                                  : '0%'}
                              </span>
                            </div>
                            <div className="h-1 bg-dc-surface-highest rounded-full overflow-hidden">
                              <div
                                className="h-full bg-dc-primary transition-all"
                                style={{
                                  width: featuredWatching.anime.episodes
                                    ? `${Math.round(((featuredWatching.lastEpisodeWatched || 0) / featuredWatching.anime.episodes) * 100)}%`
                                    : '0%',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Curator Insights */}
                <section className="bg-dc-surface-low p-10 rounded-xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-dc-secondary/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-dc-secondary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-dc-on-surface">Curator Insights</h3>
                      <p className="text-label text-slate-500">AI-Driven Taste Analysis</p>
                    </div>
                    <div className="ml-auto">
                      <button
                        onClick={generateSummary}
                        disabled={isGeneratingSummary}
                        className={cn(
                          'px-5 py-2 rounded-full text-sm font-medium transition-all',
                          generatedSummary
                            ? 'bg-dc-surface-high text-dc-on-surface hover:bg-dc-surface-highest'
                            : 'bg-dc-primary text-dc-bg hover:brightness-110'
                        )}
                      >
                        {isGeneratingSummary ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : generatedSummary ? (
                          <RefreshCw className="w-4 h-4" />
                        ) : (
                          'Generate'
                        )}
                      </button>
                    </div>
                  </div>

                  {generatedSummary ? (
                    <p className="text-lg text-slate-300 leading-relaxed font-light italic">
                      "{generatedSummary}"
                    </p>
                  ) : (
                    <p className="text-slate-500 italic">
                      Click "Generate" to get an AI-powered analysis of your anime taste.
                    </p>
                  )}
                </section>
              </div>

              {/* Right Column: Taste Profile */}
              <div className="lg:col-span-4 space-y-8">
                <div className="text-label text-slate-500 tracking-[0.2em]">Taste Profile</div>
                <div className="grid grid-cols-1 gap-6">
                  {/* Completion Rate */}
                  <div className="bg-dc-surface-low p-8 rounded-xl flex flex-col justify-between h-48 hover:bg-dc-surface-container transition-colors">
                    <Check className="w-8 h-8 text-dc-primary" />
                    <div>
                      <div className="text-5xl font-black tracking-tighter text-dc-on-surface">{completionRate}%</div>
                      <div className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 mt-1">Completion Rate</div>
                    </div>
                  </div>
                  {/* Top Genre */}
                  <div className="bg-dc-surface-low p-8 rounded-xl flex flex-col justify-between h-48 hover:bg-dc-surface-container transition-colors">
                    <Heart className="w-8 h-8 text-dc-secondary" />
                    <div>
                      <div className="text-4xl font-black tracking-tighter uppercase italic text-dc-on-surface">{topGenre}</div>
                      <div className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 mt-1">Top Genre</div>
                    </div>
                  </div>
                  {/* Total Titles */}
                  <div className="bg-dc-surface-low p-8 rounded-xl flex flex-col justify-between h-48 hover:bg-dc-surface-container transition-colors">
                    <Bookmark className="w-8 h-8 text-slate-300" />
                    <div>
                      <div className="text-5xl font-black tracking-tighter text-dc-on-surface">{entries.length}</div>
                      <div className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 mt-1">Total Titles</div>
                    </div>
                  </div>
                  {/* Mean Score */}
                  <div className="bg-dc-surface-low p-8 rounded-xl flex flex-col justify-between h-48 hover:bg-dc-surface-container transition-colors">
                    <Eye className="w-8 h-8 text-dc-primary" />
                    <div>
                      <div className="text-5xl font-black tracking-tighter text-dc-on-surface">{meanScore}</div>
                      <div className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 mt-1">Mean Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Currently Watching Progress Section */}
            {watchingEntries.length > 0 && (
              <section className="mb-32" data-testid="watching-progress-section">
                <div className="mb-8">
                  <div className="text-label text-slate-500 tracking-[0.2em] mb-4">In Progress</div>
                  <h3 className="text-headline">
                    Currently <span className="italic font-light">Watching</span>
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">
                    {watchingEntries.length} anime in progress
                    {totalEpisodesRemaining > 0 && ` \u2014 ${totalEpisodesRemaining} episodes remaining`}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {watchingEntries.map((entry) => (
                    <EpisodeProgressTracker
                      key={entry.animeId}
                      entry={entry}
                      onUpdateProgress={updateEpisodeProgress}
                      onMarkComplete={handleMarkComplete}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Additions Grid */}
            <section className="mb-32">
              <div className="flex justify-between items-end mb-12">
                <h3 className="text-5xl font-black tracking-tight uppercase text-dc-on-surface">
                  Recent <span className="text-slate-500 font-light italic">Additions</span>
                </h3>
              </div>

              {filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-slate-400">
                    No anime with this status. Try a different filter.
                  </p>
                </div>
              ) : (
                <AnimeGrid
                  animes={animes}
                  onSave={handleSave}
                  onLove={handleLove}
                  entryDataMap={entryDataMap}
                />
              )}
            </section>

            {/* AI Recommendations Section */}
            <AIRecommendations
              entries={entries}
              onSave={handleSave}
              onLove={handleLove}
            />
          </>
        )}
      </main>
    </div>
  );
}

function getTopGenres(entries: UserListEntry[]): { genre: string; count: number }[] {
  const genreCounts: Record<string, number> = {};

  for (const entry of entries) {
    for (const genre of entry.anime.genres) {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    }
  }

  return Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count }));
}
