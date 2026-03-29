import { useEffect } from 'react';

export interface MetaTagsConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image';
}

// Default meta values
const DEFAULT_META: MetaTagsConfig = {
  title: 'AInime - Smart Anime Discovery',
  description: 'Discover anime with AI-powered search and recommendations',
  image: '/logo.png',
  type: 'website',
  twitterCard: 'summary_large_image',
};

function updateMetaTag(property: string, content: string, isProperty = true): void {
  const attribute = isProperty ? 'property' : 'name';
  let meta = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, property);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
}

function getAbsoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Hook to dynamically update meta tags for social sharing
 * Updates Open Graph and Twitter Card meta tags
 */
export function useMetaTags(config: MetaTagsConfig): void {
  useEffect(() => {
    const mergedConfig = { ...DEFAULT_META, ...config };
    const imageUrl = mergedConfig.image ? getAbsoluteUrl(mergedConfig.image) : '';
    const pageUrl = mergedConfig.url || window.location.href;

    // Update document title
    if (mergedConfig.title) {
      document.title = mergedConfig.title;
    }

    // Update meta description
    if (mergedConfig.description) {
      updateMetaTag('description', mergedConfig.description, false);
    }

    // Open Graph tags
    if (mergedConfig.title) {
      updateMetaTag('og:title', mergedConfig.title);
    }
    if (mergedConfig.description) {
      updateMetaTag('og:description', mergedConfig.description);
    }
    if (mergedConfig.type) {
      updateMetaTag('og:type', mergedConfig.type);
    }
    if (imageUrl) {
      updateMetaTag('og:image', imageUrl);
    }
    updateMetaTag('og:url', pageUrl);

    // Twitter Card tags
    if (mergedConfig.twitterCard) {
      updateMetaTag('twitter:card', mergedConfig.twitterCard, false);
    }
    if (mergedConfig.title) {
      updateMetaTag('twitter:title', mergedConfig.title, false);
    }
    if (mergedConfig.description) {
      updateMetaTag('twitter:description', mergedConfig.description, false);
    }
    if (imageUrl) {
      updateMetaTag('twitter:image', imageUrl, false);
    }

    // Cleanup function to restore defaults when component unmounts
    return () => {
      document.title = DEFAULT_META.title!;
      updateMetaTag('description', DEFAULT_META.description!, false);
      updateMetaTag('og:title', DEFAULT_META.title!);
      updateMetaTag('og:description', DEFAULT_META.description!);
      updateMetaTag('og:type', DEFAULT_META.type!);
      updateMetaTag('og:image', getAbsoluteUrl(DEFAULT_META.image!));
      updateMetaTag('twitter:title', DEFAULT_META.title!, false);
      updateMetaTag('twitter:description', DEFAULT_META.description!, false);
      updateMetaTag('twitter:image', getAbsoluteUrl(DEFAULT_META.image!), false);
    };
  }, [config.title, config.description, config.image, config.url, config.type, config.twitterCard]);
}

/**
 * Generate meta tags config for an anime
 */
export function getAnimeMetaTags(anime: {
  title: { english?: string; romaji: string };
  description?: string;
  coverImage: { large: string };
  id: number;
}): MetaTagsConfig {
  const title = anime.title.english || anime.title.romaji;
  const description = anime.description
    ? anime.description.replace(/<[^>]*>/g, '').slice(0, 160)
    : 'View anime details on AInime';

  return {
    title: `${title} - AInime`,
    description,
    image: anime.coverImage.large,
    type: 'article',
    twitterCard: 'summary_large_image',
  };
}

/**
 * Generate meta tags config for a user's list
 */
export function getListMetaTags(
  animeCount: number,
  username?: string
): MetaTagsConfig {
  const title = username ? `${username}'s Anime List` : 'My Anime List';

  return {
    title: `${title} - AInime`,
    description: `Collection of ${animeCount} anime on AInime`,
    type: 'profile',
    twitterCard: 'summary_large_image',
  };
}
