import { AnimeCardData } from '@/types/anime';
import { getDisplayTitle, cleanDescription } from './anime-utils';

// Share card types
export type SharePlatform = 'twitter' | 'facebook' | 'linkedin' | 'copy';

export interface ShareContent {
  title: string;
  description: string;
  url: string;
  image?: string;
  hashtags?: string[];
}

export interface ShareCardData {
  type: 'anime' | 'list' | 'profile';
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
  stats?: Array<{ label: string; value: string | number }>;
  badges?: string[];
}

// Generate share content for an anime
export function getAnimeShareContent(anime: AnimeCardData, baseUrl: string): ShareContent {
  const title = getDisplayTitle(anime);
  const cleanDesc = cleanDescription(anime.description);
  const truncatedDesc = cleanDesc ? cleanDesc.slice(0, 140) + (cleanDesc.length > 140 ? '...' : '') : '';

  return {
    title: `Check out ${title} on AInime`,
    description: truncatedDesc || `${anime.format} with ${anime.episodes || '?'} episodes`,
    url: `${baseUrl}/anime/${anime.id}`,
    image: anime.coverImage.large,
    hashtags: ['anime', ...anime.genres.slice(0, 2).map(g => g.replace(/\s+/g, ''))],
  };
}

// Generate share content for a user's anime list
export function getListShareContent(
  listName: string,
  animeCount: number,
  topGenres: string[],
  baseUrl: string,
  username?: string
): ShareContent {
  return {
    title: username ? `${username}'s Anime List` : 'My Anime List on AInime',
    description: `${animeCount} anime collected! Top genres: ${topGenres.slice(0, 3).join(', ')}`,
    url: `${baseUrl}/my-list`,
    hashtags: ['anime', 'animelist', ...topGenres.slice(0, 2).map(g => g.replace(/\s+/g, ''))],
  };
}

// Generate share URL for different platforms
export function getShareUrl(platform: SharePlatform, content: ShareContent): string {
  const encodedUrl = encodeURIComponent(content.url);
  const encodedTitle = encodeURIComponent(content.title);
  const encodedDescription = encodeURIComponent(content.description);
  const hashtags = content.hashtags?.join(',') || '';

  switch (platform) {
    case 'twitter':
      // Twitter/X share URL with text and hashtags
      return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${hashtags}`;

    case 'facebook':
      // Facebook share URL
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`;

    case 'linkedin':
      // LinkedIn share URL
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

    default:
      return content.url;
  }
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

// Open share URL in a popup window
export function openShareWindow(url: string, platform: SharePlatform): void {
  const width = 600;
  const height = 400;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;

  window.open(
    url,
    `share-${platform}`,
    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,resizable=yes,scrollbars=yes`
  );
}

// Generate share card data for anime
export function getAnimeShareCardData(anime: AnimeCardData): ShareCardData {
  const title = getDisplayTitle(anime);

  return {
    type: 'anime',
    title,
    subtitle: anime.studios?.nodes?.[0]?.name,
    description: cleanDescription(anime.description) || 'No description available',
    image: anime.coverImage.large,
    stats: [
      { label: 'Score', value: anime.averageScore ? `${anime.averageScore}%` : 'N/A' },
      { label: 'Episodes', value: anime.episodes || '?' },
      { label: 'Format', value: anime.format },
    ],
    badges: anime.genres.slice(0, 3),
  };
}

// Generate share card data for a list
export function getListShareCardData(
  listName: string,
  animeCount: number,
  watchedCount: number,
  topGenres: { genre: string; count: number }[],
  coverImages: string[]
): ShareCardData {
  return {
    type: 'list',
    title: listName,
    description: `${animeCount} anime in collection`,
    stats: [
      { label: 'Total', value: animeCount },
      { label: 'Watched', value: watchedCount },
      { label: 'Completion', value: animeCount > 0 ? `${Math.round((watchedCount / animeCount) * 100)}%` : '0%' },
    ],
    badges: topGenres.slice(0, 4).map(g => g.genre),
  };
}
