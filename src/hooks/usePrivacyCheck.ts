import { useCallback } from 'react';
import * as api from '@/lib/api';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { PrivacyLevel } from '@/types/privacy';

interface PrivacyCheckResult {
  canView: boolean;
  reason?: 'private' | 'friends_only' | 'not_authenticated';
}

export function usePrivacyCheck() {
  const { user } = useSimpleAuth();

  /**
   * Check if the current user can view content owned by another user
   * based on the owner's privacy settings
   */
  const checkVisibility = useCallback(
    async (
      ownerId: string,
      visibilityLevel: PrivacyLevel
    ): Promise<PrivacyCheckResult> => {
      // If the viewer is the owner, always allow
      if (user?.id === ownerId) {
        return { canView: true };
      }

      // If content is public, always allow
      if (visibilityLevel === 'public') {
        return { canView: true };
      }

      // If content is private, only owner can view
      if (visibilityLevel === 'private') {
        return { canView: false, reason: 'private' };
      }

      // If content is friends_only, check if viewer is a friend
      if (visibilityLevel === 'friends_only') {
        // If not authenticated, can't be a friend
        if (!user) {
          return { canView: false, reason: 'not_authenticated' };
        }

        try {
          const { isFriend } = await api.checkFriendship(user.id, ownerId);
          if (isFriend) {
            return { canView: true };
          }
        } catch (error) {
          console.error('Error checking friendship:', error);
        }

        return { canView: false, reason: 'friends_only' };
      }

      return { canView: false };
    },
    [user]
  );

  /**
   * Get privacy settings for a specific user
   */
  const getUserPrivacySettings = useCallback(async (userId: string) => {
    try {
      const data = await api.getUserPrivacy(userId);

      return {
        profile_visibility: (data.profile_visibility || 'public') as PrivacyLevel,
        list_visibility: (data.list_visibility || 'public') as PrivacyLevel,
        activity_visibility: (data.activity_visibility || 'public') as PrivacyLevel,
        show_stats_publicly: data.show_stats_publicly ?? true,
        searchable: data.searchable ?? true,
      };
    } catch (error) {
      console.error('Error fetching user privacy settings:', error);
      // Sensible defaults when API fails
      return {
        profile_visibility: 'public' as PrivacyLevel,
        list_visibility: 'public' as PrivacyLevel,
        activity_visibility: 'public' as PrivacyLevel,
        show_stats_publicly: true,
        searchable: true,
      };
    }
  }, []);

  /**
   * Check if current user can view a specific user's profile
   */
  const canViewProfile = useCallback(
    async (ownerId: string): Promise<PrivacyCheckResult> => {
      const settings = await getUserPrivacySettings(ownerId);
      if (!settings) {
        return { canView: false };
      }
      return checkVisibility(ownerId, settings.profile_visibility);
    },
    [checkVisibility, getUserPrivacySettings]
  );

  /**
   * Check if current user can view a specific user's anime list
   */
  const canViewList = useCallback(
    async (ownerId: string): Promise<PrivacyCheckResult> => {
      const settings = await getUserPrivacySettings(ownerId);
      if (!settings) {
        return { canView: false };
      }
      return checkVisibility(ownerId, settings.list_visibility);
    },
    [checkVisibility, getUserPrivacySettings]
  );

  /**
   * Check if current user can view a specific user's activity
   */
  const canViewActivity = useCallback(
    async (ownerId: string): Promise<PrivacyCheckResult> => {
      const settings = await getUserPrivacySettings(ownerId);
      if (!settings) {
        return { canView: false };
      }
      return checkVisibility(ownerId, settings.activity_visibility);
    },
    [checkVisibility, getUserPrivacySettings]
  );

  /**
   * Check if current user can view a specific user's statistics
   */
  const canViewStats = useCallback(
    async (ownerId: string): Promise<boolean> => {
      // Owner can always view their own stats
      if (user?.id === ownerId) {
        return true;
      }

      const settings = await getUserPrivacySettings(ownerId);
      if (!settings) {
        return false;
      }

      // First check profile visibility
      const profileCheck = await checkVisibility(ownerId, settings.profile_visibility);
      if (!profileCheck.canView) {
        return false;
      }

      // Then check if stats are shown publicly
      return settings.show_stats_publicly;
    },
    [user, checkVisibility, getUserPrivacySettings]
  );

  return {
    checkVisibility,
    getUserPrivacySettings,
    canViewProfile,
    canViewList,
    canViewActivity,
    canViewStats,
  };
}
