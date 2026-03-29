import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  Eye,
  Check,
  Bookmark,
  X,
  LogOut,
  Edit3,
  Save,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { PrivacySettings } from '@/components/PrivacySettings';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { useProfileStats } from '@/hooks/useProfileStats';
import * as api from '@/lib/api';
import { isLocalMode } from '@/lib/apiMode';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { cn, proxyImage, handleImageError } from '@/lib/utils';

const statusConfig = {
  SAVED: { icon: Bookmark, label: 'Saved', color: 'text-teal', bgColor: 'bg-teal/10' },
  LOVED: { icon: Heart, label: 'Loved', color: 'text-coral', bgColor: 'bg-coral/10' },
  WATCHING: { icon: Eye, label: 'Watching', color: 'text-violet', bgColor: 'bg-violet/10' },
  WATCHED: { icon: Check, label: 'Completed', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  DROPPED: { icon: X, label: 'Dropped', color: 'text-muted-foreground', bgColor: 'bg-muted/10' },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useSimpleAuth();
  const { stats, entries } = useProfileStats();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.display_name) {
      setDisplayName(user.display_name);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: displayName });
      }

      if (!isLocalMode()) {
        await api.updateUser({ display_name: displayName });
      }

      const updatedUser = { ...user, display_name: displayName };
      localStorage.setItem('animelist_user', JSON.stringify(updatedUser));

      toast({ title: 'Profile updated successfully!' });
      setIsEditing(false);

      window.location.reload();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Failed to update profile',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-dc-bg">
        <Header />
        <main className="pt-32 pb-20 px-[3.5rem] max-w-[1400px] mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-slate-500">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  const userInitials = (user.display_name || user.email || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const userName = user.display_name || 'Anime Fan';
  // Split name for editorial italic treatment
  const nameParts = userName.toUpperCase().split(' ');
  const nameFirst = nameParts.length > 1 ? nameParts.slice(0, -1).join('_') + '_' : userName.toUpperCase().slice(0, Math.ceil(userName.length / 2)) + '_';
  const nameLast = nameParts.length > 1 ? nameParts[nameParts.length - 1] : userName.toUpperCase().slice(Math.ceil(userName.length / 2));

  // Generate simulated watch intensity data from entries
  const watchIntensity = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Simulate based on entry count
    if (entries.length === 0) return days.map(d => ({ day: d, value: 0 }));
    return days.map((day, i) => ({
      day,
      value: Math.max(10, Math.floor(Math.random() * 100)),
    }));
  })();
  const maxIntensity = Math.max(...watchIntensity.map(d => d.value), 1);

  return (
    <div className="min-h-screen bg-dc-bg">
      <Header />

      <main className="pt-32 pb-20 px-[3.5rem] max-w-[1400px] mx-auto">
        {/* Profile Header */}
        <header className="flex flex-col md:flex-row items-center md:items-end gap-12 mb-24">
          {/* Avatar */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-dc-primary to-dc-secondary rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-dc-primary/80 p-1 overflow-hidden bg-dc-surface-dim">
              <Avatar className="w-full h-full">
                <AvatarImage src={undefined} className="w-full h-full object-cover rounded-full" />
                <AvatarFallback className="w-full h-full text-4xl font-bold bg-gradient-to-br from-dc-primary to-dc-secondary text-white rounded-full flex items-center justify-center">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Name + Bio */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-label text-dc-secondary font-bold mb-2 tracking-[0.15em]">
              Curator Level 7
            </p>

            {isEditing ? (
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="max-w-[240px] bg-dc-surface-high text-dc-on-surface"
                />
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-dc-primary text-dc-bg font-bold px-5 py-2 rounded-full text-sm hover:brightness-110 transition-all flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setDisplayName(user.display_name || '');
                  }}
                  className="text-slate-400 hover:text-dc-on-surface text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-[-0.06em] text-dc-on-surface leading-none">
                  {nameFirst}<span className="text-dc-primary italic">{nameLast}</span>
                </h1>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-slate-500 hover:text-dc-on-surface transition-colors mt-2"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
            )}

            <p className="text-slate-400 max-w-lg font-medium">{user.email}</p>

            <div className="flex gap-4 mt-6 justify-center md:justify-start">
              <button
                onClick={handleSignOut}
                className="text-label text-slate-500 hover:text-dc-primary transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32 relative">
          {/* Decorative anime covers in stats section background */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-xl">
            {[7442, 8271, 13, 42, 3].map((kitsuId, idx) => (
              <div
                key={kitsuId}
                className="absolute rounded-xl overflow-hidden opacity-[0.04]"
                style={{
                  width: `${100 + idx * 20}px`,
                  aspectRatio: '3/4',
                  top: `${-15 + (idx % 2) * 60}%`,
                  left: `${idx * 22}%`,
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
          </div>
          <div className="bg-dc-surface-low p-10 rounded-xl relative z-10">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-slate-500 mb-4">Title Library</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-dc-on-surface">{stats.totalAnime.toLocaleString()}</span>
              <span className="text-dc-primary font-bold italic">Titles</span>
            </div>
          </div>
          <div className="bg-dc-surface-low p-10 rounded-xl relative z-10">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-slate-500 mb-4">Hours Consumed</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-dc-on-surface">{stats.estimatedHoursWatched.toLocaleString()}</span>
              <span className="text-dc-secondary font-bold italic">Hrs</span>
            </div>
          </div>
          <div className="bg-dc-surface-low p-10 rounded-xl relative z-10">
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-slate-500 mb-4">Completion Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-dc-on-surface">{stats.completionRate}</span>
              <span className="text-dc-primary font-bold italic">%</span>
            </div>
          </div>
        </section>

        {/* Visual Analytics */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-dc-on-surface">
            Visual <span className="italic font-light">Analytics</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Genre Distribution */}
            <div className="bg-dc-surface-dim p-8 rounded-xl">
              <p className="text-label text-slate-400 mb-8 font-bold tracking-[0.15em]">Genre Distribution</p>
              {stats.topGenres.length > 0 ? (
                <div className="space-y-6">
                  {stats.topGenres.slice(0, 5).map((genre, index) => {
                    const colors = ['text-dc-primary', 'text-dc-secondary', 'text-dc-tertiary', 'text-dc-primary-soft', 'text-slate-400'];
                    const bgColors = ['bg-dc-primary', 'bg-dc-secondary', 'bg-dc-tertiary', 'bg-dc-primary-soft', 'bg-slate-500'];
                    return (
                      <div key={genre.genre}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-dc-on-surface">{genre.genre}</span>
                          <span className={cn('text-sm font-bold', colors[index % colors.length])}>{genre.percentage}%</span>
                        </div>
                        <div className="w-full bg-dc-surface-highest h-1 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', bgColors[index % bgColors.length])}
                            style={{ width: `${genre.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">Add anime to see genre distribution</p>
              )}
            </div>

            {/* Watch Intensity */}
            <div className="bg-dc-surface-dim p-8 rounded-xl flex flex-col justify-between">
              <div>
                <p className="text-label text-slate-400 mb-8 font-bold tracking-[0.15em]">Watch Intensity</p>
                <div className="flex items-end gap-2 h-32 mb-8">
                  {watchIntensity.map((day, i) => {
                    const heightPercent = maxIntensity > 0 ? (day.value / maxIntensity) * 100 : 0;
                    const barColors = ['bg-dc-surface-highest', 'bg-dc-primary', 'bg-dc-surface-highest', 'bg-dc-secondary', 'bg-dc-primary', 'bg-dc-surface-highest', 'bg-dc-secondary'];
                    return (
                      <div
                        key={day.day}
                        className={cn('flex-1 rounded-t-sm transition-all', barColors[i % barColors.length])}
                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between text-[0.6rem] tracking-[0.1rem] uppercase text-slate-500 font-bold">
                {watchIntensity.map(d => (
                  <span key={d.day}>{d.day}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-32">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-dc-on-surface">
              Recent <span className="italic font-light">Activity</span>
            </h2>
            <Link
              to="/my-list"
              className="text-label text-slate-500 hover:text-dc-primary transition-colors font-bold tracking-[0.15em]"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.slice(0, 5).map((entry) => {
                const statusInfo = statusConfig[entry.status];
                const title = entry.anime.title.english || entry.anime.title.romaji;
                const date = new Date(entry.addedAt);
                const timeLabel = formatTimeLabel(date);

                const actionLabel = (() => {
                  switch (entry.status) {
                    case 'WATCHED': return 'Completed';
                    case 'WATCHING': return 'Started watching';
                    case 'SAVED': return 'Added';
                    case 'LOVED': return 'Loved';
                    case 'DROPPED': return 'Dropped';
                    default: return 'Updated';
                  }
                })();

                return (
                  <Link
                    key={entry.animeId}
                    to={`/anime/${entry.animeId}`}
                    className="group flex items-center justify-between p-6 bg-dc-surface-low hover:bg-dc-surface-high transition-all duration-300 rounded-lg"
                  >
                    <div className="flex items-center gap-6">
                      <span className={cn(
                        'text-[0.65rem] font-black w-12 tracking-tighter',
                        entry.status === 'WATCHED' ? 'text-dc-primary' :
                        entry.status === 'LOVED' ? 'text-dc-secondary' :
                        'text-dc-tertiary'
                      )}>
                        {timeLabel}
                      </span>
                      <div className="flex items-center gap-4">
                        <img
                          src={proxyImage(entry.anime.coverImage.medium || entry.anime.coverImage.large)}
                          alt={title}
                          className="w-10 h-14 object-cover rounded-md"
                          onError={handleImageError}
                        />
                        <div>
                          <h4 className="font-bold text-lg text-dc-on-surface">
                            {actionLabel} <span className="text-dc-on-surface/60">{title}</span>
                          </h4>
                          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                            Status: {statusInfo.label}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-dc-on-surface transition-colors" />
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-6">No activity yet</p>
                <Link to="/">
                  <button className="bg-dc-primary text-dc-bg font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all">
                    Discover Anime
                  </button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Privacy Matrix */}
        <section className="max-w-2xl mx-auto md:mx-0 mb-32">
          <div className="bg-dc-surface-dim p-10 rounded-xl">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-dc-on-surface">
              <Shield className="w-5 h-5 text-dc-primary" />
              Privacy Matrix
            </h3>
            <PrivacySettings />
          </div>
        </section>
      </main>
    </div>
  );
}

// Helper to format time labels for activity items
function formatTimeLabel(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 24) {
    const hours = date.getHours();
    const mins = date.getMinutes();
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  if (diffDays < 2) {
    return 'YEST';
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}
