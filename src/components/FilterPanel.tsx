import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// AniList-compatible options
export const FILTER_OPTIONS = {
    formats: [
        { value: 'TV', label: 'TV Series' },
        { value: 'MOVIE', label: 'Movie' },
        { value: 'OVA', label: 'OVA' },
        { value: 'ONA', label: 'ONA' },
        { value: 'SPECIAL', label: 'Special' },
        { value: 'TV_SHORT', label: 'TV Short' },
    ],
    statuses: [
        { value: 'RELEASING', label: 'Airing' },
        { value: 'FINISHED', label: 'Finished' },
        { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
    ],
    seasons: [
        { value: 'WINTER', label: 'Winter' },
        { value: 'SPRING', label: 'Spring' },
        { value: 'SUMMER', label: 'Summer' },
        { value: 'FALL', label: 'Fall' },
    ],
    years: Array.from({ length: 36 }, (_, i) => 2025 - i),
    scores: [
        { value: 90, label: '90+' },
        { value: 80, label: '80+' },
        { value: 70, label: '70+' },
        { value: 60, label: '60+' },
        { value: 50, label: '50+' },
    ],
};

export interface FilterState {
    genres: string[];
    format?: string;
    status?: string;
    season?: string;
    year?: number;
    scoreMin?: number;
}

interface FilterPanelProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    onApply?: () => void;
    genres: string[];
    className?: string;
}

export function FilterPanel({ filters, onFilterChange, onApply, genres, className }: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(0);

    const activeFilterCount = [
        filters.genres.length > 0,
        filters.format,
        filters.status,
        filters.season,
        filters.year,
        filters.scoreMin,
    ].filter(Boolean).length;

    useEffect(() => {
        if (contentRef.current) {
            setContentHeight(contentRef.current.scrollHeight);
        }
    }, [isExpanded, filters]);

    const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const toggleGenre = (genre: string) => {
        const newGenres = filters.genres.includes(genre)
            ? filters.genres.filter(g => g !== genre)
            : [...filters.genres, genre];
        updateFilter('genres', newGenres);
    };

    const clearFilters = () => {
        onFilterChange({
            genres: [],
            format: undefined,
            status: undefined,
            season: undefined,
            year: undefined,
            scoreMin: undefined,
        });
    };

    return (
        <div className={cn("", className)}>
            {/* Collapsed: sleek toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-3 group"
            >
                <span className="text-label text-slate-500 group-hover:text-[#dce1fb] transition-colors">
                    Filters
                </span>
                {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#f97316] text-[#0c1324] text-[10px] font-black">
                        {activeFilterCount}
                    </span>
                )}
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-slate-500 transition-transform duration-300",
                        isExpanded && "rotate-180"
                    )}
                />
            </button>

            {/* Expanded: horizontal filter bar */}
            <div
                style={{
                    maxHeight: isExpanded ? `${contentHeight + 32}px` : '0px',
                    opacity: isExpanded ? 1 : 0,
                }}
                className="overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            >
                <div ref={contentRef} className="pt-6 space-y-5">
                    {/* Row 1: Genre pills */}
                    <div>
                        <span className="text-label text-slate-600 mb-3 block">Genre</span>
                        <div className="flex flex-wrap gap-2">
                            {genres.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => toggleGenre(genre)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-xs font-medium tracking-[0.08em] uppercase transition-all duration-200",
                                        filters.genres.includes(genre)
                                            ? "bg-[#f97316] text-[#0c1324]"
                                            : "bg-[#23293c] text-[#dce1fb]/70 hover:bg-[#2e3447] hover:text-[#dce1fb]"
                                    )}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Row 2: Dropdowns + Score in a horizontal row */}
                    <div className="flex flex-wrap items-end gap-4">
                        {/* Format */}
                        <div className="min-w-[140px]">
                            <span className="text-label text-slate-600 mb-2 block">Format</span>
                            <div className="relative">
                                <select
                                    value={filters.format || ''}
                                    onChange={(e) => updateFilter('format', e.target.value || undefined)}
                                    className="w-full appearance-none bg-[#23293c] text-[#dce1fb] text-sm font-medium px-4 py-2.5 pr-8 rounded-full border-0 outline-none focus:ring-1 focus:ring-[#f97316]/30 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {FILTER_OPTIONS.formats.map(f => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="min-w-[140px]">
                            <span className="text-label text-slate-600 mb-2 block">Status</span>
                            <div className="relative">
                                <select
                                    value={filters.status || ''}
                                    onChange={(e) => updateFilter('status', e.target.value || undefined)}
                                    className="w-full appearance-none bg-[#23293c] text-[#dce1fb] text-sm font-medium px-4 py-2.5 pr-8 rounded-full border-0 outline-none focus:ring-1 focus:ring-[#f97316]/30 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {FILTER_OPTIONS.statuses.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Season */}
                        <div className="min-w-[130px]">
                            <span className="text-label text-slate-600 mb-2 block">Season</span>
                            <div className="relative">
                                <select
                                    value={filters.season || ''}
                                    onChange={(e) => updateFilter('season', e.target.value || undefined)}
                                    className="w-full appearance-none bg-[#23293c] text-[#dce1fb] text-sm font-medium px-4 py-2.5 pr-8 rounded-full border-0 outline-none focus:ring-1 focus:ring-[#f97316]/30 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {FILTER_OPTIONS.seasons.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Year */}
                        <div className="min-w-[120px]">
                            <span className="text-label text-slate-600 mb-2 block">Year</span>
                            <div className="relative">
                                <select
                                    value={filters.year || ''}
                                    onChange={(e) => updateFilter('year', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full appearance-none bg-[#23293c] text-[#dce1fb] text-sm font-medium px-4 py-2.5 pr-8 rounded-full border-0 outline-none focus:ring-1 focus:ring-[#f97316]/30 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {FILTER_OPTIONS.years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Score pills */}
                        <div>
                            <span className="text-label text-slate-600 mb-2 block">Min Score</span>
                            <div className="flex gap-1.5">
                                {FILTER_OPTIONS.scores.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => updateFilter('scoreMin', filters.scoreMin === s.value ? undefined : s.value)}
                                        className={cn(
                                            "px-3 py-2 rounded-full text-xs font-bold transition-all duration-200",
                                            filters.scoreMin === s.value
                                                ? "bg-[#d0bcff] text-[#0c1324]"
                                                : "bg-[#23293c] text-slate-400 hover:bg-[#2e3447] hover:text-[#dce1fb]"
                                        )}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1.5 text-label text-slate-500 hover:text-[#dce1fb] transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            )}
                            {onApply && (
                                <button
                                    onClick={onApply}
                                    className="px-6 py-2.5 rounded-full bg-[#f97316] text-[#0c1324] text-xs font-black uppercase tracking-[0.15em] hover:bg-orange-500 transition-colors"
                                >
                                    Apply
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
