import { Anime } from './anime';

export type TierLevel = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface TierItem {
  id?: string;
  animeId: number;
  animeTitle: string;
  animeCoverImage: string | null;
  tier: TierLevel;
  position: number;
  anime?: Anime;
}

export interface TierList {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  templateId: string | null;
  visibility: 'public' | 'friends_only' | 'private';
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  items?: TierItem[];
  user?: {
    displayName: string | null;
    avatarUrl: string | null;
  };
  isLiked?: boolean;
}

export interface TierListTemplate {
  id: string;
  name: string;
  description: string;
  tiers: TierLevel[];
  category: 'genre' | 'season' | 'studio' | 'custom';
}

export interface TierConfig {
  level: TierLevel;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const TIER_CONFIG: Record<TierLevel, TierConfig> = {
  S: {
    level: 'S',
    label: 'S',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
  },
  A: {
    level: 'A',
    label: 'A',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
  },
  B: {
    level: 'B',
    label: 'B',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
  },
  C: {
    level: 'C',
    label: 'C',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
  },
  D: {
    level: 'D',
    label: 'D',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
  },
  F: {
    level: 'F',
    label: 'F',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
  },
};

export const TIER_ORDER: TierLevel[] = ['S', 'A', 'B', 'C', 'D', 'F'];

export const TIER_LIST_TEMPLATES: TierListTemplate[] = [
  {
    id: 'best-anime',
    name: 'Best Anime of All Time',
    description: 'Rank your all-time favorite anime',
    tiers: ['S', 'A', 'B', 'C', 'D', 'F'],
    category: 'custom',
  },
  {
    id: 'action-anime',
    name: 'Action Anime',
    description: 'Rank action and battle anime',
    tiers: ['S', 'A', 'B', 'C', 'D', 'F'],
    category: 'genre',
  },
  {
    id: 'romance-anime',
    name: 'Romance Anime',
    description: 'Rank romance and love stories',
    tiers: ['S', 'A', 'B', 'C', 'D', 'F'],
    category: 'genre',
  },
  {
    id: 'isekai-anime',
    name: 'Isekai Anime',
    description: 'Rank isekai and transported-to-another-world anime',
    tiers: ['S', 'A', 'B', 'C', 'D', 'F'],
    category: 'genre',
  },
  {
    id: 'shonen-anime',
    name: 'Shonen Anime',
    description: 'Rank classic and modern shonen series',
    tiers: ['S', 'A', 'B', 'C', 'D', 'F'],
    category: 'genre',
  },
  {
    id: 'anime-movies',
    name: 'Anime Movies',
    description: 'Rank your favorite anime films',
    tiers: ['S', 'A', 'B', 'C', 'D', 'F'],
    category: 'custom',
  },
  {
    id: 'seasonal-2024',
    name: '2024 Anime',
    description: 'Rank anime from 2024',
    tiers: ['S', 'A', 'B', 'C', 'D', 'F'],
    category: 'season',
  },
  {
    id: 'studio-ghibli',
    name: 'Studio Ghibli',
    description: 'Rank Studio Ghibli films',
    tiers: ['S', 'A', 'B', 'C', 'D', 'F'],
    category: 'studio',
  },
];
