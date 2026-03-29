import { Anime, AnimeCardData } from '@/types/anime';

export function getVibeMeter(anime: Anime): string[] {
  const vibes: string[] = [];
  const tags = anime.tags?.map(t => t.name.toLowerCase()) || [];
  const genres = anime.genres?.map(g => g.toLowerCase()) || [];

  // Tone vibes
  if (tags.includes('coming of age') || genres.includes('slice of life')) vibes.push('cozy');
  if (tags.includes('tragedy') || tags.includes('drama')) vibes.push('emotional');
  if (tags.includes('psychological') || genres.includes('thriller')) vibes.push('intense');
  if (genres.includes('comedy')) vibes.push('comedic');
  if (genres.includes('romance')) vibes.push('romantic');
  if (genres.includes('action')) vibes.push('action-packed');
  if (tags.includes('philosophical') || tags.includes('existential')) vibes.push('reflective');
  if (genres.includes('horror')) vibes.push('dark');
  if (tags.includes('adventure') || genres.includes('adventure')) vibes.push('journey');
  if (genres.includes('fantasy')) vibes.push('fantastical');
  if (genres.includes('sci-fi')) vibes.push('futuristic');

  // Return top 3 unique vibes
  return [...new Set(vibes)].slice(0, 3);
}

export function getFinishability(anime: Anime): number {
  const episodes = anime.episodes || 12;
  const format = anime.format;
  
  // Base score starts at 5
  let score = 5;

  // Episode count factor (shorter = easier to finish)
  if (episodes <= 12) score += 3;
  else if (episodes <= 24) score += 2;
  else if (episodes <= 50) score += 1;
  else if (episodes > 100) score -= 2;

  // Format factor
  if (format === 'MOVIE') score += 2;
  if (format === 'ONA') score += 1;

  // Status factor (completed shows are easier to commit to)
  if (anime.status === 'FINISHED') score += 1;

  // Clamp between 1-10
  return Math.min(10, Math.max(1, score));
}

export function getModernity(anime: Anime): { release: number; setting?: 'modern' | 'fantasy' | 'sci-fi' | 'historical' | 'mixed' | 'unknown' } {
  const year = anime.startDate?.year || anime.seasonYear || new Date().getFullYear();
  const tags = anime.tags?.map(t => t.name.toLowerCase()) || [];
  const genres = anime.genres?.map(g => g.toLowerCase()) || [];

  let setting: 'modern' | 'fantasy' | 'sci-fi' | 'historical' | 'mixed' | 'unknown' = 'unknown';

  // Determine setting from tags/genres
  const hasFantasy = genres.includes('fantasy') || tags.some(t => 
    ['magic', 'dragons', 'demons', 'supernatural', 'isekai'].includes(t)
  );
  const hasSciFi = genres.includes('sci-fi') || tags.some(t => 
    ['space', 'mecha', 'cyberpunk', 'robots', 'artificial intelligence'].includes(t)
  );
  const hasHistorical = tags.some(t => 
    ['historical', 'feudal japan', 'samurai', 'world war'].some(h => t.includes(h))
  );
  const hasModern = tags.some(t => 
    ['urban', 'school', 'contemporary', 'modern'].includes(t)
  );

  const count = [hasFantasy, hasSciFi, hasHistorical, hasModern].filter(Boolean).length;

  if (count > 1) setting = 'mixed';
  else if (hasFantasy) setting = 'fantasy';
  else if (hasSciFi) setting = 'sci-fi';
  else if (hasHistorical) setting = 'historical';
  else if (hasModern) setting = 'modern';

  return { release: year, setting };
}

export function getEnergyLevel(anime: Anime): 'low' | 'medium' | 'high' {
  const genres = anime.genres?.map(g => g.toLowerCase()) || [];
  const tags = anime.tags?.map(t => t.name.toLowerCase()) || [];

  const highEnergy = ['action', 'sports'].some(g => genres.includes(g)) ||
    tags.some(t => ['martial arts', 'super power', 'battle', 'tournament'].includes(t));

  const lowEnergy = ['slice of life'].some(g => genres.includes(g)) ||
    tags.some(t => ['iyashikei', 'cgdct', 'slow life'].includes(t));

  if (highEnergy && !lowEnergy) return 'high';
  if (lowEnergy && !highEnergy) return 'low';
  return 'medium';
}

export function getTearRisk(anime: Anime): 'low' | 'medium' | 'high' | undefined {
  const genres = anime.genres?.map(g => g.toLowerCase()) || [];
  const tags = anime.tags?.map(t => t.name.toLowerCase()) || [];

  const highRisk = genres.includes('drama') ||
    tags.some(t => ['tragedy', 'death', 'terminal illness', 'war'].includes(t));

  const lowRisk = genres.includes('comedy') && !genres.includes('drama');

  if (highRisk) return 'high';
  if (lowRisk) return 'low';
  if (genres.includes('romance') || genres.includes('drama')) return 'medium';
  return undefined;
}

export function enrichAnimeData(anime: Anime): AnimeCardData {
  return {
    ...anime,
    vibeMeter: getVibeMeter(anime),
    finishability: getFinishability(anime),
    modernity: getModernity(anime),
    energyLevel: getEnergyLevel(anime),
    tearRisk: getTearRisk(anime),
  };
}

export function formatEpisodes(anime: Anime): string {
  const eps = anime.episodes;
  const format = anime.format;

  if (format === 'MOVIE') return 'Movie';
  if (!eps) return 'Ongoing';
  if (eps === 1) return '1 ep';
  return `${eps} eps`;
}

export function getDisplayTitle(anime: Anime): string {
  return anime.title.english || anime.title.romaji;
}

export function cleanDescription(description?: string): string {
  if (!description) return '';
  // Remove HTML tags and limit length
  return description
    .replace(/<[^>]*>/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 200) + (description.length > 200 ? '...' : '');
}
