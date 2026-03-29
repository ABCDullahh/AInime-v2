/**
 * Kitsu Image Proxy
 *
 * Fetches anime poster images from Kitsu's CDN (media.kitsu.app)
 * by mapping MAL IDs to Kitsu IDs. Used as a workaround when
 * MAL/AniList CDNs are blocked by corporate firewalls.
 */

// In-memory cache: MAL ID → Kitsu image URLs
const imageCache = new Map<number, { large: string; small: string } | null>();

// Persistent cache in localStorage
const CACHE_KEY = 'kitsu_image_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface KitsuCacheEntry {
  data: Record<string, { large: string; small: string }>;
  timestamp: number;
}

function loadPersistentCache(): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed: KitsuCacheEntry = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }
    for (const [malId, urls] of Object.entries(parsed.data)) {
      imageCache.set(Number(malId), urls);
    }
  } catch {
    // Ignore parse errors
  }
}

function savePersistentCache(): void {
  try {
    const data: Record<string, { large: string; small: string }> = {};
    for (const [malId, urls] of imageCache.entries()) {
      if (urls) data[malId] = urls;
    }
    const entry: KitsuCacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable
  }
}

// Load cache on module init
loadPersistentCache();

/**
 * Batch-fetch Kitsu image URLs for a list of MAL IDs.
 * Returns a Map of MAL ID → { large, small } image URLs.
 */
export async function fetchKitsuImages(
  malIds: number[]
): Promise<Map<number, { large: string; small: string }>> {
  const result = new Map<number, { large: string; small: string }>();
  const uncachedIds: number[] = [];

  // Check cache first
  for (const id of malIds) {
    if (imageCache.has(id)) {
      const cached = imageCache.get(id);
      if (cached) result.set(id, cached);
    } else {
      uncachedIds.push(id);
    }
  }

  if (uncachedIds.length === 0) return result;

  // Batch fetch in chunks of 20 (Kitsu API limit)
  const chunks: number[][] = [];
  for (let i = 0; i < uncachedIds.length; i += 20) {
    chunks.push(uncachedIds.slice(i, i + 20));
  }

  for (const chunk of chunks) {
    try {
      const ids = chunk.join(',');
      const url = `https://kitsu.app/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${ids}&include=item&fields[anime]=posterImage&page[limit]=20`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      const mappings = data?.data || [];
      const included = data?.included || [];

      // Build kitsuId → image map
      const kitsuImageMap = new Map<string, { large: string; small: string }>();
      for (const anime of included) {
        const poster = anime?.attributes?.posterImage;
        if (poster) {
          kitsuImageMap.set(anime.id, {
            large: poster.large || poster.original || poster.medium || poster.small,
            small: poster.small || poster.medium || poster.large,
          });
        }
      }

      // Map MAL IDs to Kitsu images
      for (const mapping of mappings) {
        const malId = Number(mapping?.attributes?.externalId);
        const kitsuId = mapping?.relationships?.item?.data?.id;
        if (malId && kitsuId) {
          const images = kitsuImageMap.get(kitsuId);
          if (images) {
            imageCache.set(malId, images);
            result.set(malId, images);
          } else {
            imageCache.set(malId, null); // Mark as "no image found"
          }
        }
      }

      // Mark IDs that had no mapping
      for (const id of chunk) {
        if (!imageCache.has(id)) {
          imageCache.set(id, null);
        }
      }
    } catch (err) {
      console.warn('Kitsu image fetch failed for chunk:', err);
    }
  }

  savePersistentCache();
  return result;
}

/**
 * Replace image URLs in an anime object with Kitsu CDN URLs.
 * Falls back to original URLs if no Kitsu mapping found.
 */
export function replaceWithKitsuImage(
  anime: { malId?: number; coverImage: { large: string; medium?: string } },
  kitsuImages: Map<number, { large: string; small: string }>
): void {
  if (!anime.malId) return;
  const kitsu = kitsuImages.get(anime.malId);
  if (kitsu) {
    anime.coverImage.large = kitsu.large;
    if (anime.coverImage.medium) {
      anime.coverImage.medium = kitsu.small;
    }
  }
}
