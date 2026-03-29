import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Heart, User, LogOut, Bell } from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { useUserList, UserListEntry } from '@/hooks/useAnimeData';
import { cn } from '@/lib/utils';
import { getDisplayTitle } from '@/lib/anime-utils';

const navLinks = [
  { href: '/', label: 'Discover' },
  { href: '/ai', label: 'AI Search' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/my-list', label: 'My List' },
  { href: '/tier-lists', label: 'Tier Lists' },
];

const STATUS_LABELS: Record<UserListEntry['status'], string> = {
  SAVED: 'Saved',
  LOVED: 'Favorited',
  WATCHING: 'Started watching',
  WATCHED: 'Completed',
  DROPPED: 'Dropped',
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationDropdown({
  entries,
  onClose,
}: {
  entries: UserListEntry[];
  onClose: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Sort by most recent (addedAt or updatedAt), take last 5
  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.addedAt).getTime();
        const dateB = new Date(b.updatedAt || b.addedAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [entries]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden animate-scale-in z-50"
      style={{
        backgroundColor: 'rgba(21, 27, 45, 0.95)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(88, 66, 55, 0.15)',
      }}
    >
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(88, 66, 55, 0.15)' }}>
        <span className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
          Recent Activity
        </span>
        <span className="text-xs text-slate-600">{entries.length} total</span>
      </div>

      {recentEntries.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Bell className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No notifications yet</p>
          <p className="text-xs text-slate-600 mt-1">
            Start adding anime to your list
          </p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {recentEntries.map((entry) => {
            const title = entry.anime
              ? getDisplayTitle(entry.anime)
              : `Anime #${entry.animeId}`;
            const statusLabel = STATUS_LABELS[entry.status] || entry.status;
            const timestamp = entry.updatedAt || entry.addedAt;
            const isRecent =
              new Date().getTime() - new Date(timestamp).getTime() < 86400000; // 24h

            return (
              <button
                key={entry.animeId}
                onClick={() => {
                  navigate(`/anime/${entry.animeId}`);
                  onClose();
                }}
                className="w-full text-left px-5 py-3.5 hover:bg-[#23293c] transition-colors flex items-start gap-3"
              >
                {/* Poster thumbnail */}
                <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#191f31]">
                  {entry.anime?.coverImage?.large && (
                    <img
                      src={entry.anime.coverImage.large}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {isRecent && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f97316] mr-2 flex-shrink-0 relative top-[-1px]" />
                    )}
                    {title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {statusLabel}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {formatTimeAgo(timestamp)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(88, 66, 55, 0.15)' }}>
        <button
          onClick={() => {
            navigate('/my-list');
            onClose();
          }}
          className="w-full text-center text-xs font-medium text-[#f97316] hover:text-[#ffb690] transition-colors py-1"
        >
          View All in My List
        </button>
      </div>
    </div>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useSimpleAuth();
  const { entries } = useUserList();

  // Count recent entries (last 24h) for badge
  const recentCount = useMemo(() => {
    const dayAgo = new Date().getTime() - 86400000;
    return entries.filter((e) => {
      const t = new Date(e.updatedAt || e.addedAt).getTime();
      return t > dayAgo;
    }).length;
  }, [entries]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-[60px] bg-[#0c1324]/40">
      <div className="flex items-center justify-between px-6 md:px-[3.5rem] h-20">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <span className="text-2xl font-black tracking-tighter text-slate-50">
            AInime
          </span>
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;

            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-medium tracking-[-0.04em] transition-colors pb-1",
                  isActive
                    ? "text-orange-500 font-bold border-b-2 border-orange-500"
                    : "text-slate-400 hover:text-slate-100"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <button
                onClick={() => navigate('/my-list')}
                className="text-[#dce1fb] hover:text-orange-400 transition-all duration-300"
              >
                <Heart className="w-5 h-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  className="text-[#dce1fb] hover:text-orange-400 transition-all duration-300 relative"
                >
                  <Bell className="w-5 h-5" />
                  {recentCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f97316] text-[#0c1324] text-[10px] font-bold flex items-center justify-center">
                      {recentCount > 9 ? '9+' : recentCount}
                    </span>
                  )}
                </button>
                {isNotifOpen && (
                  <NotificationDropdown
                    entries={entries}
                    onClose={() => setIsNotifOpen(false)}
                  />
                )}
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="text-[#dce1fb] hover:text-orange-400 transition-all duration-300"
              >
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignOut}
                className="text-slate-400 hover:text-slate-100 text-sm font-medium tracking-[-0.04em] transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="text-sm font-medium tracking-[-0.04em] text-slate-400 hover:text-slate-100 transition-colors flex items-center gap-2"
            >
              <User className="w-5 h-5" />
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[#dce1fb] p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0c1324]/95 backdrop-blur-[60px] animate-slide-down">
          <nav className="px-6 py-6 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "block w-full text-left py-3 px-4 rounded-xl text-sm font-medium tracking-[-0.04em] transition-all",
                    isActive
                      ? "text-orange-500 bg-[#23293c]"
                      : "text-slate-400 hover:text-slate-100 hover:bg-[#191f31]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-4 mt-4 space-y-2" style={{ borderTop: '1px solid rgba(88, 66, 55, 0.15)' }}>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-left py-3 px-4 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-[#191f31] transition-all"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-3 px-4 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-[#191f31] transition-all"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center py-3 px-6 rounded-full bg-[#f97316] text-[#582200] font-bold text-sm transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]"
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
