export type PrivacyLevel = 'public' | 'friends_only' | 'private';

export interface PrivacySettings {
  profile_visibility: PrivacyLevel;
  list_visibility: PrivacyLevel;
  activity_visibility: PrivacyLevel;
  show_stats_publicly: boolean;
  searchable: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profile_visibility: 'public',
  list_visibility: 'public',
  activity_visibility: 'public',
  show_stats_publicly: true,
  searchable: true,
};

export const PRIVACY_LABELS: Record<PrivacyLevel, { label: string; description: string }> = {
  public: {
    label: 'Public',
    description: 'Visible to everyone',
  },
  friends_only: {
    label: 'Friends Only',
    description: 'Visible to your friends',
  },
  private: {
    label: 'Private',
    description: 'Only visible to you',
  },
};
