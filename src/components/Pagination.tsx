import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  onPageChange,
  isLoading = false,
  className,
}: PaginationProps) {
  const hasPrevPage = currentPage > 1;

  return (
    <div className={cn("flex items-center justify-center gap-6", className)}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevPage || isLoading}
        className={cn(
          "inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300",
          hasPrevPage && !isLoading
            ? "bg-[#23293c] text-[#dce1fb] hover:bg-[#2e3447] hover:scale-105 active:scale-95"
            : "bg-[#23293c]/50 text-slate-600 cursor-not-allowed"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Indicator */}
      <div className="flex items-center gap-3">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-[#f97316]" />
        ) : (
          <>
            <span className="text-sm font-black text-[#dce1fb] tabular-nums">
              Page {currentPage}
            </span>
            {totalPages > 1 && (
              <span className="text-sm text-slate-500 font-medium">
                of {totalPages}
              </span>
            )}
          </>
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage || isLoading}
        className={cn(
          "inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all duration-300",
          hasNextPage && !isLoading
            ? "bg-[#f97316] text-[#582200] hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)]"
            : "bg-[#f97316]/30 text-[#f97316]/40 cursor-not-allowed"
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// Mobile-friendly "Load More" variant
interface LoadMoreProps {
  hasNextPage: boolean;
  onLoadMore: () => void;
  isLoading?: boolean;
  className?: string;
}

export function LoadMore({
  hasNextPage,
  onLoadMore,
  isLoading = false,
  className,
}: LoadMoreProps) {
  if (!hasNextPage) return null;

  return (
    <div className={cn("flex justify-center", className)}>
      <button
        onClick={onLoadMore}
        disabled={isLoading}
        className={cn(
          "inline-flex items-center gap-2 px-10 py-4 rounded-full text-sm font-black tracking-widest uppercase transition-all duration-300",
          isLoading
            ? "bg-[#23293c] text-slate-400 cursor-wait"
            : "bg-[#23293c] text-[#dce1fb] hover:bg-[#2e3447] hover:scale-105 active:scale-95 border border-white/5 hover:border-white/10"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </>
        ) : (
          'Load More'
        )}
      </button>
    </div>
  );
}
