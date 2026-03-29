// Region detection utilities for streaming availability

// Known streaming platforms with their regional availability
export const STREAMING_PLATFORMS: Record<string, {
  name: string;
  color: string;
  regions: string[];
  icon?: string;
}> = {
  'Crunchyroll': {
    name: 'Crunchyroll',
    color: '#F47521',
    regions: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA', 'BR', 'MX', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI', 'PT', 'IN', 'PH', 'SG', 'MY', 'ID'],
  },
  'Netflix': {
    name: 'Netflix',
    color: '#E50914',
    regions: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA', 'BR', 'MX', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI', 'PT', 'IN', 'JP', 'KR', 'PH', 'SG', 'MY', 'ID', 'TH', 'VN'],
  },
  'Funimation': {
    name: 'Funimation',
    color: '#5B0BB5',
    regions: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'BR', 'MX'],
  },
  'Amazon Prime Video': {
    name: 'Prime Video',
    color: '#00A8E1',
    regions: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA', 'BR', 'MX', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI', 'PT', 'IN', 'JP', 'SG'],
  },
  'Hulu': {
    name: 'Hulu',
    color: '#1CE783',
    regions: ['US', 'JP'],
  },
  'HIDIVE': {
    name: 'HIDIVE',
    color: '#00BAFF',
    regions: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA'],
  },
  'Disney+': {
    name: 'Disney+',
    color: '#113CCF',
    regions: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA', 'BR', 'MX', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI', 'PT', 'IN', 'JP', 'KR', 'SG', 'MY', 'ID', 'TH'],
  },
  'VRV': {
    name: 'VRV',
    color: '#FFDD00',
    regions: ['US'],
  },
  'Bilibili': {
    name: 'Bilibili',
    color: '#00A1D6',
    regions: ['CN', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID'],
  },
  'iQIYI': {
    name: 'iQIYI',
    color: '#00BE06',
    regions: ['CN', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'TW', 'HK'],
  },
  'Anime Digital Network': {
    name: 'ADN',
    color: '#0066CC',
    regions: ['FR', 'DE', 'BE', 'LU', 'CH'],
  },
  'Wakanim': {
    name: 'Wakanim',
    color: '#E6004C',
    regions: ['FR', 'DE', 'RU', 'SC'],
  },
  'AnimeLab': {
    name: 'AnimeLab',
    color: '#FFC600',
    regions: ['AU', 'NZ'],
  },
};

// Timezone to country code mapping
const TIMEZONE_COUNTRY_MAP: Record<string, string> = {
  // Americas
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Anchorage': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Buenos_Aires': 'AR',
  // Europe
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Lisbon': 'PT',
  'Europe/Dublin': 'IE',
  'Europe/Warsaw': 'PL',
  'Europe/Moscow': 'RU',
  // Asia Pacific
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Taipei': 'TW',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Jakarta': 'ID',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Manila': 'PH',
  'Asia/Kolkata': 'IN',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Pacific/Auckland': 'NZ',
  // Africa
  'Africa/Johannesburg': 'ZA',
  'Africa/Cairo': 'EG',
};

// Get user's country code from timezone
export function getUserRegion(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Direct timezone match
    if (TIMEZONE_COUNTRY_MAP[timezone]) {
      return TIMEZONE_COUNTRY_MAP[timezone];
    }

    // Fallback: try to extract from timezone prefix
    const parts = timezone.split('/');
    if (parts[0] === 'America') {
      return 'US'; // Default Americas to US
    } else if (parts[0] === 'Europe') {
      return 'GB'; // Default Europe to UK
    } else if (parts[0] === 'Asia') {
      return 'JP'; // Default Asia to Japan for anime context
    } else if (parts[0] === 'Australia') {
      return 'AU';
    } else if (parts[0] === 'Pacific') {
      return 'NZ';
    } else if (parts[0] === 'Africa') {
      return 'ZA';
    }

    // Ultimate fallback
    return 'US';
  } catch {
    return 'US';
  }
}

// Check if a streaming platform is available in a region
export function isPlatformAvailableInRegion(platformName: string, region: string): boolean {
  const platform = Object.values(STREAMING_PLATFORMS).find(
    p => p.name.toLowerCase() === platformName.toLowerCase() ||
         platformName.toLowerCase().includes(p.name.toLowerCase())
  );

  if (!platform) {
    return true; // Unknown platforms are shown as potentially available
  }

  return platform.regions.includes(region);
}

// Get platform info by name
export function getPlatformInfo(platformName: string): { color: string; name: string } | null {
  // Normalize platform name for matching
  const normalizedName = platformName.toLowerCase().trim();

  for (const [key, platform] of Object.entries(STREAMING_PLATFORMS)) {
    if (normalizedName.includes(key.toLowerCase()) ||
        key.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(platform.name.toLowerCase())) {
      return platform;
    }
  }

  return null;
}

// Get display name for region code
export function getRegionDisplayName(code: string): string {
  const regionNames: Record<string, string> = {
    'US': 'United States',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'AU': 'Australia',
    'NZ': 'New Zealand',
    'IE': 'Ireland',
    'ZA': 'South Africa',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'IT': 'Italy',
    'NL': 'Netherlands',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'PT': 'Portugal',
    'IN': 'India',
    'JP': 'Japan',
    'KR': 'South Korea',
    'CN': 'China',
    'HK': 'Hong Kong',
    'TW': 'Taiwan',
    'SG': 'Singapore',
    'MY': 'Malaysia',
    'ID': 'Indonesia',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'PH': 'Philippines',
    'PL': 'Poland',
    'RU': 'Russia',
    'EG': 'Egypt',
    'AR': 'Argentina',
  };

  return regionNames[code] || code;
}
