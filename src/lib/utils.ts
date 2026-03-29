import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Proxy image URLs through Vite dev server to bypass blocked CDNs.
 * Rewrites external CDN URLs to local /img-proxy/* paths.
 */
export function proxyImage(url: string | undefined | null): string {
  if (!url) return '/placeholder.svg';
  if (url.startsWith('/')) return url; // Already local

  try {
    const u = new URL(url);
    const host = u.hostname;

    if (host === 's4.anilist.co') {
      return '/img-proxy/anilist' + u.pathname;
    }
    if (host === 'cdn.myanimelist.net') {
      return '/img-proxy/mal' + u.pathname;
    }
    if (host === 'myanimelist.net') {
      return '/img-proxy/mal-main' + u.pathname;
    }
    if (host === 'img.youtube.com') {
      return '/img-proxy/youtube' + u.pathname;
    }
    if (host === 'www.dailymotion.com' && u.pathname.startsWith('/thumbnail')) {
      return '/img-proxy/dailymotion' + u.pathname;
    }
  } catch {
    // Invalid URL, return as-is
  }

  return url;
}

/**
 * Generate SVG data URL avatar with initials for fallback images.
 */
export function avatarFallback(name: string): string {
  const initials = name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
  const colors = ['#E83C91', '#FF8FB7', '#7C5CFC', '#38BDF8', '#F59E0B', '#10B981'];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const bg = colors[hash % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="${bg}"/><text x="50" y="55" font-family="sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * onError handler for <img> tags — sets fallback avatar based on alt text.
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.dataset.fallback === 'done') return; // Prevent infinite loop
  img.dataset.fallback = 'done';
  img.src = avatarFallback(img.alt || '?');
}
