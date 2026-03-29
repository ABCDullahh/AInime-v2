# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AInime — anime discovery platform with AI-powered search, tier list creation, personal watchlist, and seasonal calendar. React SPA with Supabase backend.

## Commands

```bash
npm run dev          # Dev server on http://localhost:8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint
npm run preview      # Preview production build on http://localhost:4173

# Supabase edge functions
supabase functions serve   # Run edge functions locally

# Playwright (PWA verification only)
npx playwright test        # Runs against preview server (localhost:4173)
```

## Architecture

### Data Layer (Dual-API with Fallback)

The core pattern is AniList-primary, Jikan-fallback:

- `src/lib/anilist.ts` — AniList GraphQL API (primary data source)
- `src/lib/jikan.ts` — Jikan/MAL REST API (fallback, rate-limited to ~1 req/sec with exponential backoff)
- `src/lib/animeData.ts` — **Orchestrator** that wraps both APIs with `withFallback()`. All data fetching goes through here, never call anilist/jikan directly from components.
- `src/contexts/DataSourceContext.tsx` — Diagnostics context for monitoring which API is active, plus force-Jikan toggle for testing.

### React Query Hooks

- `src/hooks/useAnimeData.ts` — All anime data queries (trending, popular, search, detail). Uses React Query with `animeData.*` orchestrator functions.
- `src/hooks/useTierList.ts` — Tier list state management (drag-and-drop state, CRUD operations)
- `src/hooks/useAIRecommendations.ts` — Calls Supabase edge function for AI recommendations

### Auth

`src/contexts/SimpleAuthContext.tsx` — Custom auth using Supabase with localStorage persistence. Not Supabase Auth proper — uses its own hashing and user table. Import auth via `useSimpleAuth()` hook.

### Supabase Integration

- `src/integrations/supabase/client.ts` — Auto-generated Supabase client (do not edit manually)
- `src/integrations/supabase/types.ts` — Auto-generated database types (do not edit manually)
- `supabase/functions/ai-search/` — Edge function for AI-powered anime search (uses Gemini API)
- `supabase/functions/ai-recommendations/` — Edge function for AI recommendations

### Routing

React Router v6 in `src/App.tsx`. Key routes:
- `/` — Home (trending/popular grids)
- `/ai` — AI search
- `/anime/:id` — Anime detail
- `/tier-lists`, `/tier-lists/create`, `/tier-lists/:id`, `/tier-lists/:id/edit`
- `/calendar` — Seasonal calendar
- `/my-list` — Personal watchlist
- `/auth`, `/profile`

### PWA

Configured via `vite-plugin-pwa` in `vite.config.ts`. Workbox caches Jikan (CacheFirst, 24h), AniList (NetworkFirst, 1h), Supabase (NetworkFirst, 5m), and image CDNs (CacheFirst, 7d).

## Key Conventions

- **Path alias**: `@/` maps to `src/` (configured in tsconfig and vite)
- **UI components**: shadcn/ui in `src/components/ui/` — add new ones via `npx shadcn-ui@latest add <component>`
- **Styling**: Tailwind with CSS variables for theming (dark mode via class strategy). Custom colors: `coral`, `violet`, `teal`, `gold` with glow variants.
- **TypeScript**: Strict mode is OFF (`noImplicitAny: false`, `strictNullChecks: false`). Don't tighten these.
- **Anime type**: Core interface is `Anime` in `src/types/anime.ts`. All API mappers normalize to this type.
- **Environment**: Supabase vars are `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Edge functions need `GEMINI_API_KEY`.

## API Gotchas

- **Jikan rate limit**: Soft 429 — may return 200 OK with error in body. Always check response shape.
- **AniList SSL**: May show `ERR_CERT_COMMON_NAME_INVALID` in some environments; triggers fallback to Jikan.
- **Future seasons**: Jikan may have no data for upcoming seasons — handle empty gracefully.
