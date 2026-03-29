import { useState } from 'react';
import { Share2, Copy, Check, X, Twitter, Facebook, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimeShareCard, ListShareCard } from '@/components/ShareCard';
import { AnimeCardData } from '@/types/anime';
import {
  ShareContent,
  SharePlatform,
  getAnimeShareContent,
  getListShareContent,
  getShareUrl,
  copyToClipboard,
  openShareWindow,
} from '@/lib/share-utils';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  className?: string;
  variant?: 'button' | 'icon' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
}

interface AnimeShareButtonProps extends ShareButtonProps {
  anime: AnimeCardData;
}

interface ListShareButtonProps extends ShareButtonProps {
  title: string;
  animeCount: number;
  watchedCount: number;
  topGenres: { genre: string; count: number }[];
  coverImages: string[];
  username?: string;
}

// Platform button configs
const platforms: Array<{
  id: SharePlatform;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { id: 'twitter', label: 'Twitter', icon: Twitter, color: 'hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2]' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'hover:bg-[#4267B2]/20 hover:text-[#4267B2]' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'hover:bg-[#0A66C2]/20 hover:text-[#0A66C2]' },
];

// Share modal component
function ShareModal({
  isOpen,
  onClose,
  shareContent,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  shareContent: ShareContent;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleShare = (platform: SharePlatform) => {
    if (platform === 'copy') {
      handleCopyLink();
    } else {
      const url = getShareUrl(platform, shareContent);
      openShareWindow(url, platform);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareContent.url);
    if (success) {
      setCopied(true);
      toast({ title: 'Link copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({ title: 'Failed to copy link', variant: 'destructive' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="share-modal"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-coral" />
            <h3 className="font-semibold text-lg">Share</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Card */}
        <div className="p-4 flex justify-center bg-secondary/30">
          {children}
        </div>

        {/* Share options */}
        <div className="p-4 space-y-4">
          {/* Platform buttons */}
          <div className="flex justify-center gap-3">
            {platforms.map(platform => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.id}
                  onClick={() => handleShare(platform.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl',
                    'bg-secondary/50 transition-colors',
                    platform.color
                  )}
                  aria-label={`Share on ${platform.label}`}
                  data-testid={`share-${platform.id}`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs">{platform.label}</span>
                </button>
              );
            })}
          </div>

          {/* Copy link section */}
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 text-sm text-muted-foreground truncate">
              {shareContent.url}
            </div>
            <Button
              variant="coral"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2"
              data-testid="copy-link-button"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Share button for anime
export function AnimeShareButton({
  anime,
  className,
  variant = 'button',
  size = 'md',
}: AnimeShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const shareContent = getAnimeShareContent(anime, window.location.origin);

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <>
      {variant === 'icon-only' ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-colors',
            className
          )}
          aria-label="Share"
          data-testid="share-button"
        >
          <Share2 className={iconSizes[size]} />
        </button>
      ) : variant === 'icon' ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-lg',
            'hover:bg-secondary/80 transition-colors',
            className
          )}
          aria-label="Share"
          data-testid="share-button"
        >
          <Share2 className={iconSizes[size]} />
        </button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className={cn('gap-2', sizeClasses[size], className)}
          data-testid="share-button"
        >
          <Share2 className={iconSizes[size]} />
          Share
        </Button>
      )}

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shareContent={shareContent}
      >
        <AnimeShareCard anime={anime} className="scale-90" />
      </ShareModal>
    </>
  );
}

// Share button for lists
export function ListShareButton({
  title,
  animeCount,
  watchedCount,
  topGenres,
  coverImages,
  username,
  className,
  variant = 'button',
  size = 'md',
}: ListShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const shareContent = getListShareContent(
    title,
    animeCount,
    topGenres.map(g => g.genre),
    window.location.origin,
    username
  );

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <>
      {variant === 'icon-only' ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-colors',
            className
          )}
          aria-label="Share List"
          data-testid="share-list-button"
        >
          <Share2 className={iconSizes[size]} />
        </button>
      ) : variant === 'icon' ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-lg',
            'hover:bg-secondary/80 transition-colors',
            className
          )}
          aria-label="Share List"
          data-testid="share-list-button"
        >
          <Share2 className={iconSizes[size]} />
        </button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className={cn('gap-2', sizeClasses[size], className)}
          data-testid="share-list-button"
        >
          <Share2 className={iconSizes[size]} />
          Share List
        </Button>
      )}

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shareContent={shareContent}
      >
        <ListShareCard
          title={title}
          animeCount={animeCount}
          watchedCount={watchedCount}
          topGenres={topGenres}
          coverImages={coverImages}
          className="scale-90"
        />
      </ShareModal>
    </>
  );
}
