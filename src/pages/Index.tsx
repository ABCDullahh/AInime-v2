import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Star, Loader2, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/layout/Footer';
import { AnimeGrid } from '@/components/AnimeGrid';
import { FilterPanel, FilterState } from '@/components/FilterPanel';
import { Pagination } from '@/components/Pagination';
import { DiagnosticsPanel, SourceIndicator } from '@/components/DiagnosticsPanel';
import {
  useTrendingAnime,
  usePopularAnime,
  useSeasonalAnime,
  useAnimeSearchPaginated,
  useUserList
} from '@/hooks/useAnimeData';
import { GENRES } from '@/lib/animeData';
import { AnimeCardData } from '@/types/anime';
import { toast } from '@/hooks/use-toast';
import { parseAdvancedSearch } from '@/lib/searchQueryParser';
import { cn, proxyImage, handleImageError } from '@/lib/utils';
import { getDisplayTitle } from '@/lib/anime-utils';

export default function Index() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'trending' | 'popular' | 'seasonal'>('trending');
  const [heroQuery, setHeroQuery] = useState('');
  const trendingScrollRef = useRef<HTMLDivElement>(null);

  // Advanced filters state
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    format: undefined,
    status: undefined,
    season: undefined,
    year: undefined,
    scoreMin: undefined,
  });

  // Pagination state per tab
  const [trendingPage, setTrendingPage] = useState(1);
  const [popularPage, setPopularPage] = useState(1);
  const [seasonalPage, setSeasonalPage] = useState(1);

  const { data: trendingData, isLoading: trendingLoading } = useTrendingAnime(trendingPage, 20);
  const { data: popularData, isLoading: popularLoading } = usePopularAnime(popularPage, 20);
  const { data: seasonalData, isLoading: seasonalLoading } = useSeasonalAnime(seasonalPage, 20);

  const {
    results: searchResults,
    isLoading: searchLoading,
    search,
    clear: clearSearch,
    isActive: isSearchActive,
    hasNextPage: searchHasNext,
    currentPage: searchPage,
    totalPages: searchTotalPages,
    goToPage: goToSearchPage,
  } = useAnimeSearchPaginated();

  const { addToList } = useUserList();

  const handleSearch = useCallback((query: string) => {
    const { filters: parsedFilters, studios } = parseAdvancedSearch(query, {
      genres: filters.genres.length > 0 ? filters.genres : undefined,
      format: filters.format,
      status: filters.status,
      season: filters.season,
      seasonYear: filters.year,
      scoreMin: filters.scoreMin,
    });

    search({
      ...parsedFilters,
      studios: studios.length > 0 ? studios : undefined,
      excludeNsfw: true
    });
  }, [search, filters]);

  const handleHeroSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      handleSearch(heroQuery.trim());
    }
  }, [heroQuery, handleSearch]);

  const handleAISearch = useCallback((query: string) => {
    navigate(`/ai?q=${encodeURIComponent(query)}`);
  }, [navigate]);

  const handleSave = useCallback((anime: AnimeCardData) => {
    addToList(anime, 'SAVED');
    toast({
      title: "Added to Saved",
      description: `${anime.title.english || anime.title.romaji} has been saved.`,
    });
  }, [addToList]);

  const handleLove = useCallback((anime: AnimeCardData) => {
    addToList(anime, 'LOVED');
    toast({
      title: "Added to Loved",
      description: `${anime.title.english || anime.title.romaji} is now in your favorites!`,
    });
  }, [addToList]);

  const handleApplyFilters = useCallback(() => {
    if (filters.genres.length > 0 || filters.format || filters.status || filters.year) {
      search({
        genres: filters.genres.length > 0 ? filters.genres : undefined,
        format: filters.format,
        status: filters.status,
        season: filters.season,
        seasonYear: filters.year,
        scoreMin: filters.scoreMin,
        excludeNsfw: true
      });
    }
  }, [search, filters]);

  // Get current tab data
  const getCurrentData = () => {
    if (activeTab === 'trending') return trendingData;
    if (activeTab === 'popular') return popularData;
    return seasonalData;
  };

  const getCurrentPage = () => {
    if (activeTab === 'trending') return trendingPage;
    if (activeTab === 'popular') return popularPage;
    return seasonalPage;
  };

  const setCurrentPage = (page: number) => {
    if (activeTab === 'trending') setTrendingPage(page);
    else if (activeTab === 'popular') setPopularPage(page);
    else setSeasonalPage(page);
  };

  const isLoading =
    (activeTab === 'trending' && trendingLoading) ||
    (activeTab === 'popular' && popularLoading) ||
    (activeTab === 'seasonal' && seasonalLoading);

  const currentData = getCurrentData();
  const displayAnime = isSearchActive ? searchResults : (currentData?.animes || []);

  // Trending carousel scroll
  const scrollTrending = (direction: 'left' | 'right') => {
    if (trendingScrollRef.current) {
      const scrollAmount = 480;
      trendingScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Show ALL trending anime (up to 20) for the carousel
  const trendingAll = trendingData?.animes || [];

  // Hero background mosaic images from trending data
  const heroMosaicAnimes = trendingAll.slice(0, 12);

  return (
    <div className="min-h-screen bg-[#0c1324]">
      <Header />
      <SourceIndicator />

      <main className="pt-20">
        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-[750px] md:min-h-[870px] flex flex-col items-center justify-center px-6 md:px-[3.5rem] text-center overflow-hidden">
          {/* Background atmosphere */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#070d1f] to-[#0c1324] opacity-60" />

          {/* Anime cover mosaic background */}
          {heroMosaicAnimes.length > 0 && (
            <div className="absolute inset-0 z-0 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 grid-rows-2 gap-1 opacity-[0.12]">
              {heroMosaicAnimes.map((anime, idx) => (
                <div key={anime.id} className="relative overflow-hidden">
                  <img
                    src={proxyImage(anime.coverImage.large)}
                    alt={`Trending anime ${idx + 1}`}
                    className="w-full h-full object-cover blur-[2px] scale-110"
                    onError={handleImageError}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Gradient overlays to fade mosaic into background */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#070d1f] via-transparent to-[#0c1324]" />
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#0c1324]/80 via-transparent to-[#0c1324]/80" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0c1324] to-transparent z-[2]" />

          <div className="relative z-10 max-w-5xl">
            <span className="text-xs tracking-[0.15em] uppercase text-[#f97316] mb-6 block font-bold">
              Curated for you
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-[5.5rem] font-extrabold tracking-[-0.05em] leading-[0.9] text-[#dce1fb] mb-12">
              Discover Your Next <br />
              <span className="italic text-[#f97316]">FAVORITE</span> Anime
            </h1>
            <form onSubmit={handleHeroSearch} className="relative w-full max-w-xl mx-auto group">
              <input
                type="text"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-[#584237]/30 py-4 px-0 focus:ring-0 focus:border-[#f97316] transition-all placeholder:text-slate-600 text-xl font-light text-[#dce1fb] outline-none"
                placeholder="Describe a vibe, a mood, or a story..."
              />
              <button
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#f97316] hover:drop-shadow-[0_0_10px_rgba(249,115,22,0.4)] transition-all"
              >
                {searchLoading ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Search className="w-7 h-7" />
                )}
              </button>
            </form>
          </div>
        </section>

        {/* ===== ADVANCED FILTERS ===== */}
        <section className="px-6 md:px-[3.5rem] py-4">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onApply={handleApplyFilters}
            genres={GENRES}
          />
        </section>

        {/* ===== SEARCH RESULTS (if active) ===== */}
        {isSearchActive && (
          <section className="px-6 md:px-[3.5rem] py-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-extrabold tracking-tight text-[#dce1fb]">
                  Search <span className="text-[#f97316] italic">Results</span>
                </h2>
                <p className="text-slate-500 mt-2 text-sm">Found {searchResults.length} anime</p>
              </div>
              <button
                onClick={() => {
                  clearSearch();
                  setHeroQuery('');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] bg-[#23293c] text-[#dce1fb] hover:bg-[#2e3447] transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
            <AnimeGrid
              animes={searchResults}
              onSave={handleSave}
              onLove={handleLove}
              isLoading={searchLoading}
            />
            {searchResults.length > 0 && (
              <Pagination
                currentPage={searchPage}
                totalPages={searchTotalPages}
                hasNextPage={searchHasNext}
                onPageChange={goToSearchPage}
                isLoading={searchLoading}
                className="mt-16"
              />
            )}
          </section>
        )}

        {/* ===== TRENDING SECTION (large atmospheric cards — up to 20) ===== */}
        {!isSearchActive && (
          <section className="py-20 pl-6 md:pl-[3.5rem]">
            <div className="flex items-baseline justify-between pr-6 md:pr-[3.5rem] mb-12">
              <h2 className="text-4xl font-extrabold tracking-tight text-[#dce1fb]">
                Trending <span className="text-[#f97316] italic">Now</span>
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => scrollTrending('left')}
                  className="p-2.5 rounded-full hover:bg-[#23293c] transition-colors border border-[#584237]/20"
                >
                  <ChevronLeft className="w-5 h-5 text-[#dce1fb]" />
                </button>
                <button
                  onClick={() => scrollTrending('right')}
                  className="p-2.5 rounded-full hover:bg-[#23293c] transition-colors border border-[#584237]/20"
                >
                  <ChevronRight className="w-5 h-5 text-[#dce1fb]" />
                </button>
              </div>
            </div>

            <div
              ref={trendingScrollRef}
              className="flex gap-6 overflow-x-auto hide-scrollbar pb-10 pr-6 md:pr-[3.5rem]"
            >
              {trendingLoading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="relative min-w-[280px] md:min-w-[380px] aspect-[3/4] rounded-2xl overflow-hidden bg-[#191f31] animate-pulse flex-shrink-0"
                  />
                ))
              ) : (
                trendingAll.map((anime, idx) => {
                  const title = getDisplayTitle(anime);
                  const genres = anime.genres?.slice(0, 2).join(' \u2022 ') || '';
                  return (
                    <div
                      key={anime.id}
                      className="relative min-w-[280px] md:min-w-[380px] aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer flex-shrink-0"
                      onClick={() => navigate(`/anime/${anime.id}`)}
                    >
                      {/* Cover image */}
                      <img
                        src={proxyImage(anime.coverImage.large)}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={handleImageError}
                        loading="lazy"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324] via-[#0c1324]/30 to-transparent opacity-90" />

                      {/* Rank number */}
                      <span className="absolute bottom-16 left-6 text-[7rem] md:text-[9rem] font-black italic leading-none text-[#dce1fb]/10 select-none pointer-events-none">
                        #{idx + 1}
                      </span>

                      {/* Content */}
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-xl md:text-2xl font-bold mb-1.5 text-[#dce1fb] line-clamp-2">
                          {title}
                        </h3>
                        <p className="text-[#f97316] font-medium tracking-widest uppercase text-[0.65rem]">
                          {genres}
                        </p>
                      </div>

                      {/* Score badge */}
                      {anime.averageScore && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0c1324]/70 backdrop-blur-sm text-sm font-bold text-[#f97316]">
                          <Star className="w-3.5 h-3.5 fill-[#f97316] text-[#f97316]" />
                          {anime.averageScore}%
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ===== DISCOVERY GRID SECTION ===== */}
        {!isSearchActive && (
          <section className="py-20 px-6 md:px-[3.5rem] bg-[#070d1f]">
            {/* Tab Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
              <div className="flex gap-12">
                <button
                  onClick={() => setActiveTab('trending')}
                  className={cn(
                    "text-lg font-medium pb-2 transition-colors",
                    activeTab === 'trending'
                      ? "font-bold border-b-2 border-[#f97316] text-[#dce1fb]"
                      : "text-slate-500 hover:text-[#dce1fb]"
                  )}
                >
                  Trending
                </button>
                <button
                  onClick={() => setActiveTab('popular')}
                  className={cn(
                    "text-lg font-medium pb-2 transition-colors",
                    activeTab === 'popular'
                      ? "font-bold border-b-2 border-[#f97316] text-[#dce1fb]"
                      : "text-slate-500 hover:text-[#dce1fb]"
                  )}
                >
                  Popular
                </button>
                <button
                  onClick={() => setActiveTab('seasonal')}
                  className={cn(
                    "text-lg font-medium pb-2 transition-colors",
                    activeTab === 'seasonal'
                      ? "font-bold border-b-2 border-[#f97316] text-[#dce1fb]"
                      : "text-slate-500 hover:text-[#dce1fb]"
                  )}
                >
                  This Season
                </button>
              </div>
            </div>

            <AnimeGrid
              animes={displayAnime}
              onSave={handleSave}
              onLove={handleLove}
              isLoading={isLoading}
            />

            {/* Pagination */}
            {currentData && displayAnime.length > 0 && (
              <Pagination
                currentPage={getCurrentPage()}
                totalPages={currentData.totalPages}
                hasNextPage={currentData.hasNextPage}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                className="mt-16"
              />
            )}
          </section>
        )}

        {/* ===== CTA SECTION ===== */}
        <section className="py-32 px-6 md:px-[3.5rem] bg-[#0c1324] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#f97316]/5 rounded-full blur-[120px] -mr-40 -mt-40" />

          {/* Row of HD anime covers behind CTA text, fading from edges */}
          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="flex gap-3 opacity-[0.10]">
              {[1, 7442, 6, 8271, 3936, 12, 42, 3].map((kitsuId) => (
                <div
                  key={kitsuId}
                  className="w-28 md:w-36 flex-shrink-0 rounded-xl overflow-hidden"
                  style={{ aspectRatio: '3/4' }}
                >
                  <img
                    src={`https://media.kitsu.app/anime/poster_images/${kitsuId}/large.jpg`}
                    alt=""
                    className="w-full h-full object-cover grayscale blur-[1px]"
                    onError={handleImageError}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            {/* Gradient fade from left */}
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#0c1324] to-transparent" />
            {/* Gradient fade from right */}
            <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#0c1324] to-transparent" />
            {/* Gradient fade from top */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#0c1324] to-transparent" />
            {/* Gradient fade from bottom */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0c1324] to-transparent" />
          </div>

          {/* Decorative floating anime covers in CTA background */}
          {trendingAll.length > 0 && (
            <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
              {trendingAll.slice(10, 16).map((anime, idx) => (
                <div
                  key={anime.id}
                  className="absolute rounded-xl overflow-hidden opacity-[0.06] rotate-12"
                  style={{
                    width: `${120 + idx * 15}px`,
                    aspectRatio: '3/4',
                    top: `${10 + (idx % 3) * 30}%`,
                    right: `${5 + (idx % 2) * 8 + idx * 12}%`,
                    transform: `rotate(${-15 + idx * 8}deg)`,
                  }}
                >
                  <img
                    src={proxyImage(anime.coverImage.large)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-[#dce1fb]">
              Stuck on what to watch?
            </h2>
            <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl font-light">
              Our neural engine analyzes your emotional response patterns to curate a
              watchlist that feels like it was made just for you.
            </p>
            <button
              onClick={() => navigate('/ai')}
              className="group flex items-center gap-6 bg-[#f97316] hover:bg-orange-600 text-[#582200] px-10 md:px-12 py-5 md:py-6 rounded-full transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]"
            >
              <span className="text-base md:text-xl font-black uppercase tracking-wider">
                Try AI-Powered Curation
              </span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Diagnostics Panel */}
      <DiagnosticsPanel />
    </div>
  );
}
