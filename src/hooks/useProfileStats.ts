import { useMemo } from 'react';
import { useUserList, UserListEntry } from '@/hooks/useAnimeData';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

export interface GenreStat {
  genre: string;
  count: number;
  percentage: number;
}

export interface ProfileStats {
  totalAnime: number;
  watchedCount: number;
  watchingCount: number;
  savedCount: number;
  lovedCount: number;
  droppedCount: number;
  completionRate: number;
  totalEpisodes: number;
  estimatedHoursWatched: number;
  topGenres: GenreStat[];
  formatBreakdown: { format: string; count: number }[];
  averageScore: number | null;
  memberSince: string | null;
  recentActivity: UserListEntry[];
}

export function useProfileStats() {
  const { user } = useSimpleAuth();
  const { entries, isLoading } = useUserList();

  const stats = useMemo<ProfileStats>(() => {
    if (!entries || entries.length === 0) {
      return {
        totalAnime: 0,
        watchedCount: 0,
        watchingCount: 0,
        savedCount: 0,
        lovedCount: 0,
        droppedCount: 0,
        completionRate: 0,
        totalEpisodes: 0,
        estimatedHoursWatched: 0,
        topGenres: [],
        formatBreakdown: [],
        averageScore: null,
        memberSince: null,
        recentActivity: [],
      };
    }

    // Count by status
    const watchedCount = entries.filter(e => e.status === 'WATCHED').length;
    const watchingCount = entries.filter(e => e.status === 'WATCHING').length;
    const savedCount = entries.filter(e => e.status === 'SAVED').length;
    const lovedCount = entries.filter(e => e.status === 'LOVED').length;
    const droppedCount = entries.filter(e => e.status === 'DROPPED').length;

    // Completion rate (watched / total excluding saved)
    const completedOrInProgress = watchedCount + watchingCount + droppedCount;
    const completionRate = completedOrInProgress > 0
      ? Math.round((watchedCount / completedOrInProgress) * 100)
      : 0;

    // Calculate total episodes and hours
    let totalEpisodes = 0;
    let totalMinutes = 0;

    for (const entry of entries) {
      if (entry.status === 'WATCHED' || entry.status === 'WATCHING') {
        const episodes = entry.anime.episodes || 0;
        const duration = entry.anime.duration || 24; // Default 24 minutes per episode

        if (entry.status === 'WATCHED') {
          totalEpisodes += episodes;
          totalMinutes += episodes * duration;
        } else if (entry.status === 'WATCHING') {
          // Estimate 50% watched for currently watching anime
          totalEpisodes += Math.floor(episodes * 0.5);
          totalMinutes += Math.floor(episodes * 0.5 * duration);
        }
      }
    }

    const estimatedHoursWatched = Math.round(totalMinutes / 60);

    // Genre breakdown
    const genreCounts: Record<string, number> = {};
    for (const entry of entries) {
      for (const genre of entry.anime.genres) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    }

    const totalGenreCount = Object.values(genreCounts).reduce((sum, c) => sum + c, 0);
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: Math.round((count / totalGenreCount) * 100),
      }));

    // Format breakdown
    const formatCounts: Record<string, number> = {};
    for (const entry of entries) {
      const format = entry.anime.format || 'Unknown';
      formatCounts[format] = (formatCounts[format] || 0) + 1;
    }

    const formatBreakdown = Object.entries(formatCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([format, count]) => ({ format, count }));

    // Average score of user's anime (from AniList scores)
    const scoresSum = entries.reduce((sum, e) => sum + (e.anime.averageScore || 0), 0);
    const scoresCount = entries.filter(e => e.anime.averageScore).length;
    const averageScore = scoresCount > 0 ? Math.round(scoresSum / scoresCount) : null;

    // Recent activity (last 10 added/updated)
    const recentActivity = [...entries]
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 10);

    return {
      totalAnime: entries.length,
      watchedCount,
      watchingCount,
      savedCount,
      lovedCount,
      droppedCount,
      completionRate,
      totalEpisodes,
      estimatedHoursWatched,
      topGenres,
      formatBreakdown,
      averageScore,
      memberSince: null, // Will be set from user data if available
      recentActivity,
    };
  }, [entries]);

  return {
    stats,
    entries,
    isLoading,
    user,
  };
}
