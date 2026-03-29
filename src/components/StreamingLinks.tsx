import { useMemo, useState } from 'react';
import { ExternalLink, Globe, MapPin, ChevronDown } from 'lucide-react';
import { StreamingLink } from '@/types/anime';
import { cn } from '@/lib/utils';
import {
  getUserRegion,
  isPlatformAvailableInRegion,
  getPlatformInfo,
  getRegionDisplayName
} from '@/lib/region-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StreamingLinksProps {
  streamingLinks: StreamingLink[];
  className?: string;
}

export function StreamingLinks({ streamingLinks, className }: StreamingLinksProps) {
  const userRegion = useMemo(() => getUserRegion(), []);
  const [showUnavailable, setShowUnavailable] = useState(false);

  // Categorize links by availability in user's region
  const { available, unavailable } = useMemo(() => {
    const available: StreamingLink[] = [];
    const unavailable: StreamingLink[] = [];

    streamingLinks.forEach(link => {
      if (isPlatformAvailableInRegion(link.site, userRegion)) {
        available.push(link);
      } else {
        unavailable.push(link);
      }
    });

    return { available, unavailable };
  }, [streamingLinks, userRegion]);

  if (!streamingLinks || streamingLinks.length === 0) {
    return null;
  }

  return (
    <section className={cn("container py-8", className)} data-testid="streaming-links-section">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Where to Watch</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{getRegionDisplayName(userRegion)}</span>
        </div>
      </div>

      {/* Available in your region */}
      {available.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal" />
            Available in your region
          </h3>
          <div className="flex flex-wrap gap-3">
            {available.map((link, index) => (
              <StreamingLinkButton
                key={`${link.site}-${index}`}
                link={link}
                available={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Not available / may require VPN */}
      {unavailable.length > 0 && (
        <div>
          <button
            onClick={() => setShowUnavailable(!showUnavailable)}
            className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              showUnavailable && "rotate-180"
            )} />
            {showUnavailable ? 'Hide' : 'Show'} other regions ({unavailable.length})
          </button>

          {showUnavailable && (
            <div className="flex flex-wrap gap-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              {unavailable.map((link, index) => (
                <StreamingLinkButton
                  key={`${link.site}-${index}`}
                  link={link}
                  available={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* No available streams message */}
      {available.length === 0 && unavailable.length > 0 && !showUnavailable && (
        <p className="text-sm text-muted-foreground">
          No streaming options available in {getRegionDisplayName(userRegion)}.
          Click above to see options in other regions.
        </p>
      )}
    </section>
  );
}

interface StreamingLinkButtonProps {
  link: StreamingLink;
  available: boolean;
}

function StreamingLinkButton({ link, available }: StreamingLinkButtonProps) {
  const platformInfo = getPlatformInfo(link.site);
  const bgColor = link.color || platformInfo?.color || '#6366F1';
  const displayName = platformInfo?.name || link.site;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
            "font-medium text-sm transition-all duration-200",
            "hover:scale-105 hover:shadow-lg",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
            available
              ? "text-white shadow-md"
              : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
          )}
          style={{
            backgroundColor: available ? bgColor : undefined,
            borderColor: bgColor,
          }}
          data-testid={`streaming-link-${link.site.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {link.icon ? (
            <img
              src={link.icon}
              alt={displayName}
              className="w-5 h-5 rounded"
            />
          ) : (
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: available ? 'rgba(255,255,255,0.2)' : bgColor,
                color: available ? 'white' : 'white'
              }}
            >
              {displayName.charAt(0)}
            </div>
          )}
          <span className={cn(!available && "text-foreground")}>{displayName}</span>
          <ExternalLink className={cn(
            "w-3.5 h-3.5",
            available ? "text-white/70" : "text-muted-foreground"
          )} />
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>
          {available
            ? `Watch on ${displayName}`
            : `${displayName} - May require VPN`
          }
        </p>
        {link.language && (
          <p className="text-xs text-muted-foreground">Language: {link.language}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
