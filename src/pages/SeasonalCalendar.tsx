import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Filter,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Tv,
  User,
  Eye,
  Play,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SectionHeader } from '@/components/SectionHeader';
import { AnimeCard } from '@/components/AnimeCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useSeasonalAnime, useUserList } from '@/hooks/useAnimeData';
import { GENRES } from '@/lib/animeData';
import { AnimeCardData } from '@/types/anime';
import { toast } from '@/hooks/use-toast';
import { cn, proxyImage, handleImageError } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { key: 'all', label: 'All Days', short: 'All' },
  { key: 'sunday', label: 'Sunday', short: 'SUN' },
  { key: 'monday', label: 'Monday', short: 'MON' },
  { key: 'tuesday', label: 'Tuesday', short: 'TUE' },
  { key: 'wednesday', label: 'Wednesday', short: 'WED' },
  { key: 'thursday', label: 'Thursday', short: 'THU' },
  { key: 'friday', label: 'Friday', short: 'FRI' },
  { key: 'saturday', label: 'Saturday', short: 'SAT' },
];

const SEASONS = [
  { value: 'WINTER', label: 'Winter (Jan-Mar)' },
  { value: 'SPRING', label: 'Spring (Apr-Jun)' },
  { value: 'SUMMER', label: 'Summer (Jul-Sep)' },
  { value: 'FALL', label: 'Fall (Oct-Dec)' },
];

function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 3) return 'WINTER';
  if (month >= 4 && month <= 6) return 'SPRING';
  if (month >= 7 && month <= 9) return 'SUMMER';
  return 'FALL';
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

// Enhanced broadcast day normalization - handles various API formats
function normalizeBroadcastDay(day: string | undefined): string | null {
  if (!day) return null;

  // Clean up the string - remove extra characters and normalize
  const cleaned = day.toLowerCase().trim()
    .replace(/s$/, '') // Remove trailing 's' (e.g., "Sundays" -> "Sunday")
    .replace(/[^a-z]/g, ''); // Remove non-alpha characters

  const dayMap: Record<string, string> = {
    'sun': 'sunday',
    'sunda': 'sunday',
    'sunday': 'sunday',
    'mon': 'monday',
    'monda': 'monday',
    'monday': 'monday',
    'tue': 'tuesday',
    'tues': 'tuesday',
    'tuesda': 'tuesday',
    'tuesday': 'tuesday',
    'wed': 'wednesday',
    'wednes': 'wednesday',
    'wednesda': 'wednesday',
    'wednesday': 'wednesday',
    'thu': 'thursday',
    'thur': 'thursday',
    'thurs': 'thursday',
    'thursda': 'thursday',
    'thursday': 'thursday',
    'fri': 'friday',
    'frida': 'friday',
    'friday': 'friday',
    'sat': 'saturday',
    'satur': 'saturday',
    'saturda': 'saturday',
    'saturday': 'saturday',
  };

  return dayMap[cleaned] || null;
}

// Parse broadcast time and convert to 24h format for sorting
function parseBroadcastTime(time: string | undefined): { display: string; sortKey: number } | null {
  if (!time) return null;

  // Handle JST time format (e.g., "25:00" means 1:00 AM next day)
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return { display: time, sortKey: 0 };

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);

  // JST often uses 25:00, 26:00 etc for late night
  const isLateNight = hours >= 24;
  if (isLateNight) {
    hours = hours - 24;
  }

  const sortKey = hours * 60 + minutes + (isLateNight ? 1440 : 0); // Add 24h worth of minutes for late night
  const displayHours = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';

  return {
    display: `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm} JST`,
    sortKey
  };
}

// Format time for spotlight cards (large format)
function formatSpotlightTime(time: string | undefined): string {
  if (!time) return '--:--';
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return time;
  let hours = parseInt(match[1]);
  const minutes = match[2];
  if (hours >= 24) hours -= 24;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

interface CalendarAnime extends AnimeCardData {
  broadcastDay: string | null;
  broadcastTime: string | null;
  broadcastSortKey: number;
}

export default function SeasonalCalendar() {
  const [page, setPage] = useState(1);
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeason());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [showOnlyPlanned, setShowOnlyPlanned] = useState(false);
  const [activeTab, setActiveTab] = useState<'seasonal' | 'my-calendar'>('seasonal');

  // Ref for the content area to scroll to on page change
  const contentAreaRef = useRef<HTMLDivElement>(null);

  // Pass season and year to the hook
  const { data, isLoading } = useSeasonalAnime(page, 25, selectedSeason, selectedYear);
  const { addToList, removeFromList, isInList, getStatus, getByStatus } = useUserList();

  // Get years for selector - past 3 years, current year, and next 2 years
  const years = useMemo(() => {
    const currentYear = getCurrentYear();
    return [currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  }, []);

  // Get watching anime for MY Calendar
  const watchingAnime = useMemo(() => {
    return getByStatus('WATCHING').filter(entry => {
      // Only include anime that are currently airing (RELEASING status)
      return entry.anime?.status === 'RELEASING';
    });
  }, [getByStatus]);

  // Process anime data with broadcast information
  const calendarAnimes = useMemo((): CalendarAnime[] => {
    if (!data?.animes) return [];

    return data.animes.map(anime => {
      const timeInfo = parseBroadcastTime(anime.broadcast?.time);
      return {
        ...anime,
        broadcastDay: normalizeBroadcastDay(anime.broadcast?.day),
        broadcastTime: timeInfo?.display || null,
        broadcastSortKey: timeInfo?.sortKey || 9999,
      };
    });
  }, [data?.animes]);

  // Process watching anime for MY Calendar
  const myCalendarAnimes = useMemo((): CalendarAnime[] => {
    return watchingAnime
      .filter(entry => entry.anime)
      .map(entry => {
        const timeInfo = parseBroadcastTime(entry.anime.broadcast?.time);
        return {
          ...entry.anime,
          broadcastDay: normalizeBroadcastDay(entry.anime.broadcast?.day),
          broadcastTime: timeInfo?.display || null,
          broadcastSortKey: timeInfo?.sortKey || 9999,
        };
      }) as CalendarAnime[];
  }, [watchingAnime]);

  // Group MY Calendar anime by day with proper sorting
  const myCalendarByDay = useMemo(() => {
    const grouped: Record<string, CalendarAnime[]> = {};
    DAYS_OF_WEEK.slice(1).forEach(day => {
      grouped[day.key] = [];
    });
    grouped['unknown'] = [];

    myCalendarAnimes.forEach(anime => {
      const day = anime.broadcastDay || 'unknown';
      if (grouped[day]) {
        grouped[day].push(anime);
      } else {
        grouped['unknown'].push(anime);
      }
    });

    // Sort each day by broadcast time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.broadcastSortKey - b.broadcastSortKey);
    });

    return grouped;
  }, [myCalendarAnimes]);

  // Filter anime based on selected criteria
  const filteredAnimes = useMemo(() => {
    let result = calendarAnimes;

    // Filter by day of week
    if (selectedDay !== 'all') {
      result = result.filter(anime => anime.broadcastDay === selectedDay);
    }

    // Filter by genres
    if (selectedGenres.length > 0) {
      result = result.filter(anime =>
        selectedGenres.some(genre => anime.genres.includes(genre))
      );
    }

    // Filter by planned to watch
    if (showOnlyPlanned) {
      result = result.filter(anime => isInList(anime.id));
    }

    return result;
  }, [calendarAnimes, selectedDay, selectedGenres, showOnlyPlanned, isInList]);

  // Group anime by day for calendar view
  const animesByDay = useMemo(() => {
    const grouped: Record<string, CalendarAnime[]> = {};
    DAYS_OF_WEEK.slice(1).forEach(day => {
      grouped[day.key] = [];
    });
    grouped['unknown'] = [];

    filteredAnimes.forEach(anime => {
      const day = anime.broadcastDay || 'unknown';
      if (grouped[day]) {
        grouped[day].push(anime);
      } else {
        grouped['unknown'].push(anime);
      }
    });

    // Sort each day by broadcast time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.broadcastSortKey - b.broadcastSortKey);
    });

    return grouped;
  }, [filteredAnimes]);

  // Toggle plan to watch status
  const handleTogglePlan = useCallback((anime: AnimeCardData) => {
    const status = getStatus(anime.id);
    if (status) {
      removeFromList(anime.id);
      toast({
        title: "Removed from list",
        description: `${anime.title.english || anime.title.romaji} removed from your list.`,
      });
    } else {
      addToList(anime, 'SAVED');
      toast({
        title: "Added to Plan to Watch",
        description: `${anime.title.english || anime.title.romaji} added to your list!`,
      });
    }
  }, [addToList, removeFromList, getStatus]);

  // Toggle genre filter
  const handleToggleGenre = useCallback((genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedDay('all');
    setSelectedGenres([]);
    setShowOnlyPlanned(false);
  }, []);

  // Count planned anime
  const plannedCount = useMemo(() => {
    return calendarAnimes.filter(anime => isInList(anime.id)).length;
  }, [calendarAnimes, isInList]);

  const hasFilters = selectedDay !== 'all' || selectedGenres.length > 0 || showOnlyPlanned;

  // Handle page change with scroll-to-top of content area
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    // Scroll to top of content area smoothly
    if (contentAreaRef.current) {
      contentAreaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Reset page when season or year changes
  const handleSeasonChange = useCallback((newSeason: string) => {
    setSelectedSeason(newSeason);
    setPage(1);
  }, []);

  const handleYearChange = useCallback((newYear: number) => {
    setSelectedYear(newYear);
    setPage(1);
  }, []);

  // Get today's info for highlighting
  const today = useMemo(() => {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return {
      day: days[now.getDay()],
      date: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  }, []);

  // Get today's label
  const todayLabel = useMemo(() => {
    return DAYS_OF_WEEK.find(d => d.key === today.day)?.short || '';
  }, [today.day]);

  // Get week dates for MS Teams style calendar
  const weekDates = useMemo(() => {
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 = Sunday
    const dates: { day: string; date: string; isToday: boolean; fullDate: Date }[] = [];

    for (let i = 0; i < 7; i++) {
      const dayOffset = i - currentDayIndex;
      const date = new Date(now);
      date.setDate(now.getDate() + dayOffset);

      dates.push({
        day: DAYS_OF_WEEK[i + 1].key,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: dayOffset === 0,
        fullDate: date
      });
    }

    return dates;
  }, []);

  // Get the season volume number (just for display)
  const volumeNumber = useMemo(() => {
    const seasonIdx = SEASONS.findIndex(s => s.value === selectedSeason);
    const yearsFromBase = selectedYear - 2020;
    return String(yearsFromBase * 4 + seasonIdx + 1).padStart(2, '0');
  }, [selectedSeason, selectedYear]);

  // Get today's airing anime (for the "Airing Today" spotlight)
  const todayAiring = useMemo(() => {
    return animesByDay[today.day] || [];
  }, [animesByDay, today.day]);

  return (
    <div className="min-h-screen bg-[#0c1324]">
      <Header />

      <main className="pt-32 pb-32 px-[3.5rem] max-w-[1600px] mx-auto">
        {/* Hero Header */}
        <header className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative overflow-hidden">
          {/* Atmospheric anime art behind hero heading */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {[99, 7442, 209, 3532].map((kitsuId, idx) => (
              <div
                key={kitsuId}
                className="absolute rounded-2xl overflow-hidden opacity-[0.06]"
                style={{
                  width: `${180 + idx * 40}px`,
                  aspectRatio: '3/4',
                  top: `${-10 + idx * 15}%`,
                  right: `${5 + idx * 20}%`,
                  transform: `rotate(${-8 + idx * 5}deg)`,
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
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c1324] via-transparent to-[#0c1324]/60" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0c1324]" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] w-8 bg-[#f97316]"></div>
              <span className="text-[0.65rem] tracking-[0.3em] uppercase text-[#f97316] font-black">
                Volume {volumeNumber} / {selectedSeason.charAt(0) + selectedSeason.slice(1).toLowerCase()} Edition
              </span>
            </div>
            <h1 className="text-7xl md:text-9xl font-black tracking-[-0.06em] leading-[0.85] text-white uppercase">
              Seasonal <br/>
              <span className="italic font-light text-slate-700">Calendar</span>
            </h1>
          </div>

          {/* Season/Year controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleYearChange(selectedYear - 1)}
                disabled={selectedYear <= years[0]}
                className="w-10 h-10 rounded-full bg-[#23293c] flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#2e3447] transition-all disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <Select value={selectedYear.toString()} onValueChange={v => handleYearChange(parseInt(v))}>
                <SelectTrigger className="w-24 bg-transparent text-[#dce1fb] text-sm font-bold tracking-tight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => handleYearChange(selectedYear + 1)}
                disabled={selectedYear >= years[years.length - 1]}
                className="w-10 h-10 rounded-full bg-[#23293c] flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#2e3447] transition-all disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              {SEASONS.map(season => (
                <button
                  key={season.value}
                  onClick={() => handleSeasonChange(season.value)}
                  className={cn(
                    "px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300",
                    selectedSeason === season.value
                      ? "bg-[#f97316] text-[#582200]"
                      : "bg-[#23293c] text-slate-400 hover:text-white hover:bg-[#2e3447]"
                  )}
                >
                  {season.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'seasonal' | 'my-calendar')} className="mb-16">
          <div className="flex items-center gap-8 mb-12">
            <button
              onClick={() => setActiveTab('seasonal')}
              className={cn(
                "text-label font-black transition-all",
                activeTab === 'seasonal' ? "text-[#f97316]" : "text-slate-600 hover:text-slate-300"
              )}
            >
              Seasonal Anime
            </button>
            <button
              onClick={() => setActiveTab('my-calendar')}
              className={cn(
                "text-label font-black transition-all flex items-center gap-2",
                activeTab === 'my-calendar' ? "text-[#f97316]" : "text-slate-600 hover:text-slate-300"
              )}
            >
              My Calendar
              {myCalendarAnimes.length > 0 && (
                <span className="bg-[#f97316] text-[#582200] text-[0.6rem] font-black px-2 py-0.5 rounded-full">
                  {myCalendarAnimes.length}
                </span>
              )}
            </button>
          </div>

          {/* Seasonal Anime Tab Content */}
          <TabsContent value="seasonal" className="mt-0">
            {/* Day Selector -- Editorial style */}
            <section className="mb-24" ref={contentAreaRef}>
              <div className="w-full flex items-center justify-between py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex-1 flex justify-between items-center px-4 md:px-10">
                  {DAYS_OF_WEEK.slice(1).map(day => {
                    const isActive = selectedDay === day.key;
                    const isToday = day.key === today.day;

                    return isActive || (selectedDay === 'all' && isToday) ? (
                      <div key={day.key} className="relative group">
                        <div className="absolute inset-0 bg-[#f97316]/20 blur-2xl rounded-full opacity-50" style={{ boxShadow: '0 0 40px -5px rgba(249, 115, 22, 0.3)' }}></div>
                        <button
                          onClick={() => setSelectedDay(selectedDay === day.key ? 'all' : day.key)}
                          className="relative bg-[#f97316] text-[#582200] text-xs font-black tracking-[0.2em] w-14 h-14 rounded-full flex items-center justify-center uppercase shadow-xl"
                        >
                          {day.short}
                        </button>
                      </div>
                    ) : (
                      <button
                        key={day.key}
                        onClick={() => setSelectedDay(day.key)}
                        className="text-xs font-black tracking-[0.2em] text-slate-700 hover:text-slate-300 transition-all uppercase"
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional filters row */}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                {/* Genre Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="curator-chip flex items-center gap-2 hover:bg-[#d0bcff] hover:text-[#0c1324] transition-all">
                      <Filter className="w-3.5 h-3.5" />
                      Genres
                      {selectedGenres.length > 0 && (
                        <span className="bg-[#f97316] text-[#582200] text-[0.6rem] font-black px-1.5 py-0.5 rounded-full ml-1">
                          {selectedGenres.length}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 max-h-80 overflow-y-auto bg-[#191f31] text-[#dce1fb]" align="start">
                    <div className="space-y-2">
                      <div className="font-medium text-sm mb-3">Filter by Genre</div>
                      {GENRES.map(genre => (
                        <div key={genre} className="flex items-center gap-2">
                          <Checkbox
                            id={genre}
                            checked={selectedGenres.includes(genre)}
                            onCheckedChange={() => handleToggleGenre(genre)}
                          />
                          <label
                            htmlFor={genre}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {genre}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* My Schedule toggle */}
                <button
                  onClick={() => setShowOnlyPlanned(prev => !prev)}
                  className={cn(
                    "curator-chip flex items-center gap-2 transition-all",
                    showOnlyPlanned ? "!bg-[#f97316] !text-[#582200]" : "hover:bg-[#d0bcff] hover:text-[#0c1324]"
                  )}
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  My Schedule
                </button>

                {/* Planned count */}
                <span className="text-[0.65rem] tracking-[0.2em] font-bold text-slate-600 uppercase ml-auto">
                  {plannedCount} Planned
                </span>

                {/* Clear Filters */}
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[0.65rem] tracking-[0.2em] font-black uppercase text-[#f97316] hover:text-[#ffb690] transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </section>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl bg-[#151b2d]" />
                ))}
              </div>
            )}

            {/* Airing Today Section -- Spotlight Cards */}
            {!isLoading && selectedDay === 'all' && todayAiring.length > 0 && (
              <section className="mb-32">
                <div className="flex items-center justify-between mb-16">
                  <div className="flex items-baseline gap-4">
                    <h2 className="text-3xl font-black tracking-tight uppercase text-[#dce1fb]">
                      Airing <span className="italic font-light text-slate-500">Today</span>
                    </h2>
                    <span className="text-xs font-bold text-slate-600 tracking-widest uppercase">
                      / {DAYS_OF_WEEK.find(d => d.key === today.day)?.label}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {todayAiring.slice(0, 2).map((anime) => {
                    const animeTitle = anime.title.english || anime.title.romaji;
                    const genreColor = anime.genres?.includes('Action') || anime.genres?.includes('Sci-Fi')
                      ? '#d0bcff'
                      : anime.genres?.includes('Fantasy') || anime.genres?.includes('Drama')
                      ? '#93ccff'
                      : '#ffb690';

                    return (
                      <Link
                        key={anime.id}
                        to={`/anime/${anime.id}`}
                        className="group relative overflow-hidden rounded-2xl aspect-[16/7] flex items-center transition-all duration-700 hover:translate-y-[-4px]"
                        style={{ background: 'rgba(25,31,49,0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        {/* Background image with enhanced cinematic treatment */}
                        <div className="absolute inset-0 z-0">
                          <img
                            src={proxyImage(anime.bannerImage || anime.coverImage.large)}
                            alt={`${animeTitle} cover art`}
                            className="w-full h-full object-cover object-center opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-45 transition-all duration-1000 scale-105 group-hover:scale-100"
                            onError={handleImageError}
                          />
                          {/* Multi-layer gradient for depth */}
                          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1324] via-[#0c1324]/80 to-transparent" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324]/50 via-transparent to-[#0c1324]/20" />
                        </div>

                        {/* Small cover poster on the far right for visual richness */}
                        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-14 md:w-20 aspect-[3/4] rounded-xl overflow-hidden opacity-15 group-hover:opacity-30 transition-opacity duration-700 z-[1] hidden lg:block">
                          <img
                            src={proxyImage(anime.coverImage.large)}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                            loading="lazy"
                          />
                        </div>
                        <div className="relative z-10 px-8 md:px-16 w-full flex justify-between items-center">
                          <div className="max-w-sm">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: genreColor, boxShadow: `0 0 8px ${genreColor}60` }} />
                              <span className="text-[0.6rem] tracking-[0.25em] font-black uppercase" style={{ color: genreColor }}>
                                {anime.genres?.slice(0, 2).join(' / ')}
                              </span>
                            </div>
                            <h3 className="text-2xl md:text-4xl font-black tracking-tighter mb-4 leading-none text-white uppercase italic">
                              {animeTitle.length > 20 ? animeTitle.slice(0, 20) + '...' : animeTitle}
                            </h3>
                            <div className="flex items-center gap-3 text-slate-500">
                              <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase">
                                {anime.episodes ? `${anime.episodes} Eps` : 'Ongoing'}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase">
                                {anime.format}
                              </span>
                            </div>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-[0.6rem] tracking-[0.2em] font-bold text-slate-600 uppercase mb-2">Broadcast</p>
                            <p className="text-4xl md:text-5xl font-black tracking-tighter text-white tabular-nums">
                              {formatSpotlightTime(anime.broadcast?.time)}
                            </p>
                            <p className="text-[0.6rem] font-bold text-[#f97316] tracking-widest uppercase mt-1">JST</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Weekly Watchlist -- Bento Grid */}
            {!isLoading && selectedDay === 'all' && (
              <section className="mb-32">
                <div className="flex items-end justify-between mb-16">
                  <h2 className="text-3xl font-black tracking-tight uppercase text-[#dce1fb]">
                    Weekly <span className="italic font-light text-slate-500">Watchlist</span>
                  </h2>
                </div>

                <div className="space-y-16">
                  {DAYS_OF_WEEK.slice(1).map(day => {
                    const dayAnimes = animesByDay[day.key] || [];
                    if (dayAnimes.length === 0) return null;

                    const isToday = day.key === today.day;

                    return (
                      <section key={day.key} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <h3 className={cn(
                            "text-xl font-black tracking-tight uppercase",
                            isToday ? "text-[#f97316]" : "text-[#dce1fb]"
                          )}>
                            {day.label}
                            {isToday && <span className="italic font-light text-slate-500 ml-2 text-sm">(Today)</span>}
                          </h3>
                          <span className="text-[0.65rem] tracking-[0.2em] font-bold text-slate-600 uppercase">
                            {dayAnimes.length} shows
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                          {dayAnimes.map(anime => (
                            <CalendarAnimeCard
                              key={anime.id}
                              anime={anime}
                              isPlanned={isInList(anime.id)}
                              onTogglePlan={() => handleTogglePlan(anime)}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })}

                  {/* Unknown broadcast day */}
                  {animesByDay['unknown']?.length > 0 && (
                    <section className="space-y-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-black tracking-tight uppercase text-slate-600">
                          Broadcast Day TBA
                        </h3>
                        <span className="text-[0.65rem] tracking-[0.2em] font-bold text-slate-700 uppercase">
                          {animesByDay['unknown'].length} shows
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {animesByDay['unknown'].map(anime => (
                          <CalendarAnimeCard
                            key={anime.id}
                            anime={anime}
                            isPlanned={isInList(anime.id)}
                            onTogglePlan={() => handleTogglePlan(anime)}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </section>
            )}

            {/* Single Day View */}
            {!isLoading && selectedDay !== 'all' && (
              <section className="space-y-8">
                <div className="flex items-baseline gap-4">
                  <h2 className="text-3xl font-black tracking-tight uppercase text-[#dce1fb]">
                    {DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label}
                  </h2>
                  <span className="text-xs font-bold text-slate-600 tracking-widest uppercase">
                    {filteredAnimes.length} anime airing
                  </span>
                </div>
                {filteredAnimes.length === 0 ? (
                  <div className="text-center py-24 text-slate-600">
                    <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-label">No anime found for this day with the current filters.</p>
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-4 text-[0.65rem] tracking-[0.2em] font-black uppercase text-[#f97316] hover:text-[#ffb690] transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {filteredAnimes.map(anime => (
                      <CalendarAnimeCard
                        key={anime.id}
                        anime={anime}
                        isPlanned={isInList(anime.id)}
                        onTogglePlan={() => handleTogglePlan(anime)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Empty State */}
            {!isLoading && filteredAnimes.length === 0 && selectedDay === 'all' && (
              <div className="text-center py-32 text-slate-600">
                <CalendarIcon className="w-16 h-16 mx-auto mb-6 opacity-20" />
                <h3 className="text-lg font-bold mb-2 text-slate-500">No anime found</h3>
                <p className="mb-6 text-label text-slate-600">Try adjusting your filters or check back later.</p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="curator-chip-primary"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Pagination - Page-based with clear indication */}
            {!isLoading && (data?.hasNextPage || page > 1) && (
              <div className="flex flex-col items-center gap-4 mt-20">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={cn(
                      "inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300",
                      page > 1
                        ? "bg-[#23293c] text-[#dce1fb] hover:bg-[#2e3447] hover:scale-105 active:scale-95"
                        : "bg-[#23293c]/50 text-slate-600 cursor-not-allowed"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {/* Page indicator */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#dce1fb] tabular-nums">
                      Page {page}
                    </span>
                    {data?.totalPages && data.totalPages > 1 && (
                      <span className="text-sm text-slate-500 font-medium">
                        of {data.totalPages}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!data?.hasNextPage}
                    className={cn(
                      "inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300",
                      data?.hasNextPage
                        ? "bg-[#f97316] text-[#582200] hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)]"
                        : "bg-[#f97316]/30 text-[#f97316]/40 cursor-not-allowed"
                    )}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[0.6rem] tracking-[0.2em] font-bold text-slate-600 uppercase">
                  Showing page {page} results
                </p>
              </div>
            )}
          </TabsContent>

          {/* MY Calendar Tab Content */}
          <TabsContent value="my-calendar" className="mt-0">
            {myCalendarAnimes.length === 0 ? (
              <div className="text-center py-32 text-slate-600">
                <Eye className="w-16 h-16 mx-auto mb-6 opacity-20" />
                <h3 className="text-lg font-bold mb-2 text-slate-500">No anime in your watch schedule</h3>
                <p className="mb-6 text-label text-slate-600">
                  Mark anime as "Watching" to see them in your personal calendar.
                  <br />
                  Only currently airing anime will appear here.
                </p>
                <button
                  onClick={() => setActiveTab('seasonal')}
                  className="curator-chip-primary"
                >
                  Browse Seasonal Anime
                </button>
              </div>
            ) : (
              <div className="space-y-16">
                {/* Header with current date/time */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase text-[#dce1fb]">
                      My <span className="italic font-light text-[#f97316]">Schedule</span>
                    </h2>
                    <p className="text-label text-slate-600 mt-2">{today.date}</p>
                  </div>
                  <span className="bg-[#f97316] text-[#582200] text-[0.65rem] font-black px-4 py-2 rounded-full tracking-widest uppercase">
                    {myCalendarAnimes.length} shows watching
                  </span>
                </div>

                {/* Weekly grid */}
                <div className="overflow-hidden rounded-2xl" style={{ background: 'rgba(25,31,49,0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Week Header */}
                  <div className="grid grid-cols-7">
                    {weekDates.map((dateInfo, index) => (
                      <div
                        key={dateInfo.day}
                        className={cn(
                          "p-4 text-center",
                          dateInfo.isToday && "bg-[#f97316]/10"
                        )}
                      >
                        <div className={cn(
                          "text-[0.65rem] font-black uppercase tracking-[0.2em]",
                          dateInfo.isToday ? "text-[#f97316]" : "text-slate-600"
                        )}>
                          {DAYS_OF_WEEK[index + 1].short}
                        </div>
                        <div className={cn(
                          "text-sm font-semibold mt-1",
                          dateInfo.isToday ? "text-[#f97316]" : "text-slate-400"
                        )}>
                          {dateInfo.date}
                        </div>
                        {dateInfo.isToday && (
                          <span className="inline-block mt-1 text-[0.5rem] font-black bg-[#f97316] text-[#582200] px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Schedule Grid */}
                  <div className="grid grid-cols-7 min-h-[400px]" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {weekDates.map((dateInfo) => {
                      const dayAnimes = myCalendarByDay[dateInfo.day] || [];

                      return (
                        <div
                          key={dateInfo.day}
                          className={cn(
                            "p-2 space-y-2",
                            dateInfo.isToday && "bg-[#f97316]/5"
                          )}
                          style={{ borderRight: '1px solid rgba(255,255,255,0.03)' }}
                        >
                          {dayAnimes.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-[0.6rem] text-slate-700 text-center uppercase tracking-widest">No shows</p>
                            </div>
                          ) : (
                            dayAnimes.map(anime => (
                              <ScheduleCard
                                key={anime.id}
                                anime={anime}
                                isToday={dateInfo.isToday}
                                onRemove={() => {
                                  removeFromList(anime.id);
                                  toast({
                                    title: "Removed from watching",
                                    description: `${anime.title.english || anime.title.romaji} removed from your watch list.`,
                                  });
                                }}
                              />
                            ))
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* List View (Mobile Friendly) */}
                <div className="lg:hidden space-y-8">
                  <h3 className="text-label text-slate-500 font-black">This Week's Schedule</h3>
                  {DAYS_OF_WEEK.slice(1).map(day => {
                    const dayAnimes = myCalendarByDay[day.key] || [];
                    if (dayAnimes.length === 0) return null;

                    const isToday = day.key === today.day;
                    const dateInfo = weekDates.find(d => d.day === day.key);

                    return (
                      <div
                        key={day.key}
                        className={cn(
                          "editorial-card p-6",
                          isToday && "!bg-[#f97316]/5"
                        )}
                        style={isToday ? { borderLeft: '4px solid #f97316' } : undefined}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <span className={cn(
                            "font-black uppercase tracking-tight",
                            isToday ? "text-[#f97316]" : "text-[#dce1fb]"
                          )}>
                            {day.label}
                          </span>
                          <span className="text-[0.65rem] text-slate-600 tracking-widest uppercase">
                            {dateInfo?.date}
                          </span>
                          {isToday && (
                            <span className="text-[0.5rem] font-black bg-[#f97316] text-[#582200] px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>
                          )}
                        </div>
                        <div className="space-y-3">
                          {dayAnimes.map(anime => (
                            <MobileScheduleCard
                              key={anime.id}
                              anime={anime}
                              onRemove={() => {
                                removeFromList(anime.id);
                                toast({
                                  title: "Removed from watching",
                                  description: `${anime.title.english || anime.title.romaji} removed.`,
                                });
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Unknown broadcast day */}
                {myCalendarByDay['unknown']?.length > 0 && (
                  <div className="editorial-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CalendarIcon className="w-4 h-4 text-slate-600" />
                      <span className="text-label text-slate-500 font-black">Broadcast Time TBA</span>
                      <span className="text-[0.6rem] font-black bg-[#23293c] text-slate-400 px-2 py-0.5 rounded-full">
                        {myCalendarByDay['unknown'].length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {myCalendarByDay['unknown'].map(anime => (
                        <MobileScheduleCard
                          key={anime.id}
                          anime={anime}
                          onRemove={() => {
                            removeFromList(anime.id);
                            toast({
                              title: "Removed from watching",
                              description: `${anime.title.english || anime.title.romaji} removed.`,
                            });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Calendar Anime Card Component -- Editorial style
interface CalendarAnimeCardProps {
  anime: CalendarAnime;
  isPlanned: boolean;
  onTogglePlan: () => void;
}

function CalendarAnimeCard({ anime, isPlanned, onTogglePlan }: CalendarAnimeCardProps) {
  return (
    <div className="group relative">
      <AnimeCard anime={anime} />

      {/* Broadcast Time Badge */}
      {anime.broadcastTime && (
        <div className="absolute top-2 left-2 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6rem] font-black tracking-widest uppercase bg-[#0c1324]/90 backdrop-blur-sm text-[#dce1fb]">
            <Clock className="w-3 h-3" />
            {anime.broadcastTime}
          </span>
        </div>
      )}

      {/* Plan to Watch Button */}
      <button
        className={cn(
          "absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all",
          "opacity-0 group-hover:opacity-100",
          isPlanned
            ? "opacity-100 bg-[#f97316] text-[#582200]"
            : "bg-[#23293c] text-slate-400 hover:bg-[#2e3447]"
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTogglePlan();
        }}
      >
        {isPlanned ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

// Schedule Card for weekly calendar (Desktop)
interface ScheduleCardProps {
  anime: CalendarAnime;
  isToday: boolean;
  onRemove: () => void;
}

function ScheduleCard({ anime, isToday, onRemove }: ScheduleCardProps) {
  const title = anime.title.english || anime.title.romaji;

  return (
    <Link
      to={`/anime/${anime.id}`}
      className={cn(
        "block p-2 rounded-lg text-xs transition-all group relative",
        isToday
          ? "bg-[#f97316]/20 hover:bg-[#f97316]/30"
          : "bg-[#151b2d] hover:bg-[#23293c]"
      )}
    >
      <div className="flex items-start gap-1">
        {anime.broadcastTime && (
          <div className={cn(
            "font-black shrink-0 text-[0.6rem] tracking-wider",
            isToday ? "text-[#f97316]" : "text-[#ffb690]"
          )}>
            <Clock className="w-3 h-3 inline mr-0.5" />
            {anime.broadcastTime.split(' ')[0]}
          </div>
        )}
      </div>
      <div className="font-bold mt-1 line-clamp-2 text-[#dce1fb]" title={title}>
        {title}
      </div>
      {anime.episodes && (
        <div className="text-slate-600 mt-1 text-[0.6rem] tracking-widest uppercase">
          {anime.episodes} eps
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <X className="w-3 h-3" />
      </button>
    </Link>
  );
}

// Mobile Schedule Card
interface MobileScheduleCardProps {
  anime: CalendarAnime;
  onRemove: () => void;
}

function MobileScheduleCard({ anime, onRemove }: MobileScheduleCardProps) {
  const title = anime.title.english || anime.title.romaji;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl editorial-card group">
      <Link to={`/anime/${anime.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <img
          src={proxyImage(anime.coverImage.medium || anime.coverImage.large)}
          alt={title}
          className="w-10 h-14 object-cover rounded-lg shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500"
          onError={handleImageError}
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm truncate text-[#dce1fb]">{title}</p>
          <div className="flex items-center gap-2 text-[0.6rem] tracking-widest uppercase mt-1">
            {anime.broadcastTime && (
              <span className="text-[#f97316] font-black flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {anime.broadcastTime}
              </span>
            )}
            {anime.episodes && <span className="text-slate-600">{anime.episodes} eps</span>}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <span className="vibe-chip vibe-chip-primary text-[0.5rem]">
          <Eye className="w-3 h-3 mr-1 inline" />
          Watching
        </span>
        <button
          className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400"
          onClick={onRemove}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
