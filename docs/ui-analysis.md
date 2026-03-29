# AInime (anime-compass) - Comprehensive UI/UX Analysis

> **Purpose**: Google Stitch redesign brief. Every page, section, component, layout, color, typography, spacing, interaction, and responsive behavior documented from source code analysis.

---

## Global Design System

### Color Palette (CSS Custom Properties)

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `--background` | `222 47% 6%` | Deep navy page background |
| `--foreground` | `210 20% 95%` | Primary text (near-white) |
| `--card` | `222 40% 9%` | Card surfaces |
| `--card-foreground` | `210 20% 95%` | Card text |
| `--primary` | `12 76% 61%` | Same as coral, primary CTA |
| `--secondary` | `222 30% 14%` | Muted surfaces, chip backgrounds |
| `--secondary-foreground` | `210 20% 90%` | Secondary text |
| `--muted` | `222 25% 16%` | Skeleton backgrounds |
| `--muted-foreground` | `215 15% 55%` | Subtle labels, metadata text |
| `--accent` / `--violet` | `262 80% 65%` | Watching status, accent highlights |
| `--coral` | `12 76% 61%` | Primary brand color, CTAs, active states, trending badges |
| `--coral-glow` | `12 90% 70%` | Vibe chip glow variant |
| `--violet` | `262 80% 65%` | AI features, watching status, accent |
| `--violet-glow` | `262 90% 75%` | Vibe chip glow variant |
| `--teal` | `175 70% 45%` | Saved status, finishability, region badge |
| `--teal-glow` | `175 80% 55%` | Vibe chip glow variant |
| `--gold` | `45 90% 55%` | Star ratings, score badges |
| `--destructive` | `0 72% 51%` | Error states, delete actions |
| `--border` | `222 25% 18%` | Subtle borders |

### Gradients

| Name | Value | Usage |
|------|-------|-------|
| `gradient-primary` | `linear-gradient(135deg, coral -> violet)` | Gradient text (brand logo "AI"), avatar fallback |
| `gradient-card` | `linear-gradient(180deg, card-lighter -> card)` | Card surfaces |
| `gradient-glow` | `radial-gradient(circle, coral/15% -> transparent)` | Hover glow on cards |
| `gradient-surface` | `linear-gradient(135deg, card-variant -> card)` | CTA section backgrounds |

### Typography

| Role | Font | Weight | Size | Notes |
|------|------|--------|------|-------|
| Body | DM Sans | 400 | `base (16px)` | Google Fonts import, `antialiased` |
| Headings | DM Sans | 700 (bold) | `text-2xl` to `text-6xl` | `tracking-tight` on hero |
| Labels | DM Sans | 500 (medium) | `text-sm` / `text-xs` | Metadata, filter labels |
| Code / Mono | System monospace | - | `text-xs` | Keyboard shortcut hints |

### Shadows

| Name | Value | Usage |
|------|-------|-------|
| `shadow-card` | `0 4px 24px -4px black/40%` | Default card shadow |
| `shadow-glow` | `0 0 40px coral/20%` | Glow effect on focus |
| `shadow-elevated` | `0 8px 32px -8px black/50%` | Hover cards, modals, dropdowns |

### Border Radius

- Default: `0.75rem` (12px)
- Pills/Chips: `rounded-full`
- Cards: `rounded-xl` (12px) or `rounded-2xl` (16px)
- Avatars: `rounded-full`
- Inputs: `rounded-xl` (12px)

### Animations

| Name | Duration | Easing | Description |
|------|----------|--------|-------------|
| `animate-float` | `6s infinite` | `ease-in-out` | Background blobs floating up/down 10px |
| `animate-pulse-glow` | `2s infinite` | `ease-in-out` | Opacity 0.5 to 1 pulsing |
| `animate-slide-up` | `0.5s` | `ease-out` | Translate Y(20px->0) + fade in |
| `animate-fade-in` | `0.3s` | `ease-out` | Simple fade in |
| `animate-spin` | Tailwind default | - | Loading spinners (Loader2 icon) |
| `animate-pulse` | Tailwind default | - | Skeleton loading states |
| Staggered entry | `50ms * index` | CSS `animationDelay` | Grid items stagger on load |

### Shared Component Classes

| Class | Description |
|-------|-------------|
| `.glass-card` | `bg-card/80 backdrop-blur-xl border border-border/50` + card shadow |
| `.glow-card` | Relative overflow-hidden with `::before` pseudo radial glow on hover |
| `.gradient-text` | `bg-clip-text text-transparent` with `gradient-primary` background |
| `.vibe-chip` | `inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-secondary` |
| `.vibe-chip-coral` | Coral background 15% opacity, coral-glow text |
| `.vibe-chip-violet` | Violet background 15% opacity, violet-glow text |
| `.vibe-chip-teal` | Teal background 15% opacity, teal-glow text |
| `.vibe-chip-gold` | Gold background 15% opacity, gold text |

### Custom Scrollbar

- Track: `bg-background`
- Thumb: `bg-muted rounded-full`
- Thumb hover: `bg-muted-foreground/30`
- Width: `8px`

---

## 1. Homepage (`/` - `src/pages/Index.tsx`)

### 1.1 Header (Shared - `src/components/Header.tsx`)

**Layout**: Sticky `top-0 z-50`, full width, `h-16` height, flex row `items-center justify-between`

**Background**: `bg-background/80 backdrop-blur-xl`, bottom border `border-border/50`

**Logo** (left):
- Text: `"AI"` with `gradient-text` class (coral-to-violet gradient) + `"nime"` in `text-foreground`
- Font: `text-xl font-bold tracking-tight`
- Links to `/`

**Desktop Navigation** (center, hidden on mobile `hidden md:flex`):
- 5 nav links as Button components with icons:
  1. Compass icon + "Discover" -> `/`
  2. Sparkles icon + "AI Search" -> `/ai`
  3. Calendar icon + "Calendar" -> `/calendar`
  4. List icon + "My List" -> `/my-list`
  5. Layers icon + "Tier Lists" -> `/tier-lists`
- Active state: `variant="coral"` (coral background, white text)
- Inactive state: `variant="ghost"` (transparent, hover highlight)
- Size: `size="sm"`, `gap-2` between icon and label
- Icon size: `w-4 h-4`

**Desktop Actions** (right, hidden on mobile):
- **Authenticated**: Heart icon button (-> /my-list), User icon button (-> /profile), "Sign Out" ghost button with LogOut icon
- **Unauthenticated**: "Sign In" outline button with User icon -> `/auth`

**Mobile Menu** (hamburger, `md:hidden`):
- Toggle button: Menu / X icon (`w-5 h-5`)
- Dropdown: `bg-background/95 backdrop-blur-xl`, `animate-slide-up`, border-t
- Full-width buttons, `justify-start gap-3`
- Bottom section with Profile + Sign Out (auth'd) or Sign In (unauth'd)

### 1.2 Hero Section (`src/components/HeroSection.tsx`)

**Layout**: `relative overflow-hidden py-16 md:py-24`, container with `max-w-3xl mx-auto text-center space-y-6`

**Background Effects**:
- Full `bg-gradient-glow opacity-50` overlay
- Floating coral blob: `w-72 h-72 bg-coral/10 rounded-full blur-3xl animate-float` (top-left quarter)
- Floating violet blob: `w-96 h-96 bg-violet/10 rounded-full blur-3xl animate-float` (bottom-right quarter, 2s delay)

**Badge** (top):
- Pill: `rounded-full bg-secondary border border-border/50`
- Content: Sparkles icon (`w-4 h-4 text-coral`) + "Powered by AI - AniList Data"
- Font: `text-sm text-muted-foreground`

**Headline**:
- "Discover Your Next" in `text-4xl md:text-6xl font-bold tracking-tight`
- "Favorite Anime" on new line with `gradient-text` class (coral-to-violet)

**Subheadline**:
- `text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto`
- Content: "AI-powered recommendations that understand your taste. Search naturally..."

**Search Bar** (`src/components/SearchBar.tsx`):
- Container: `max-w-2xl mx-auto`, `pt-4`
- Input wrapper: Relative flex with glow effect on focus
  - **Glow**: `absolute -inset-1 bg-gradient-to-r from-coral/20 to-violet/20 rounded-xl blur-lg`, hidden until focused
  - **Input**: `h-12 pl-12 pr-24 text-base rounded-xl border-2 bg-card/80 backdrop-blur-sm`
  - Focused border: `border-coral/50`
  - Unfocused border: `border-border/50`
  - Focus: `focus:ring-0 focus:border-coral/50`
  - Scale animation on focus: `scale-[1.01]`
- **Search icon**: Absolute left, `w-5 h-5`, coral when focused, muted otherwise
- **Clear button**: Absolute, `rounded-full hover:bg-secondary`, X icon `w-4 h-4`
- **Keyboard hint** (no query, not focused, desktop): Help popover + `Cmd+K` kbd elements in `bg-secondary font-mono`
- **Advanced Search Popover**: `w-80` with Boolean operators (AND/NOT), filters (studio:, year:, score:>, genre:, format:, status:, episodes:)
- **Submit button** (when query exists): `variant="coral" size="sm"`, absolute right inside input
- **AI Search button** (external, right side): `variant="hero" size="lg"`, Sparkles icon + "AI Search", `hidden sm:flex`

**Quick Suggestion Buttons** (below search):
- Row: `flex flex-wrap items-center justify-center gap-3 pt-4`
- Label: "Popular:" in `text-sm text-muted-foreground`
- 3 buttons: `text-sm px-3 py-1 rounded-full bg-secondary hover:bg-coral/20 hover:text-coral transition-colors`
  1. "Fantasy Adventure MC OP"
  2. "Cozy Slice of Life"
  3. "Mind-blowing Thriller"

**Stats Row** (bottom):
- `flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground`
- 3 items, each: icon (`w-4 h-4`) + text
  1. TrendingUp (coral) + "50,000+ Anime"
  2. Calendar (teal) + "Updated Daily"
  3. Sparkles (violet) + "AI Powered"

### 1.3 Filter Panel (`src/components/FilterPanel.tsx`)

**Container**: `container py-4`

**Wrapper**: `border border-border/50 rounded-xl bg-secondary/30`

**Header** (always visible, clickable to expand):
- `w-full flex items-center justify-between p-4 hover:bg-secondary/50`
- Left: Filter icon (`w-5 h-5 text-coral`) + "Filters" label + active count badge (`rounded-full bg-coral text-white text-xs`)
- Right: ChevronUp/Down icon

**Expanded Content** (`animate-fade-in p-4 pt-0 space-y-6`):

- **Genres**: Label `text-sm font-medium mb-3 text-muted-foreground`, flex wrap gap-2
  - Each genre: `px-3 py-1.5 text-sm rounded-full`
  - Active: `bg-coral text-white`
  - Inactive: `bg-secondary hover:bg-secondary/80`

- **Format/Status/Season/Year**: `grid grid-cols-2 md:grid-cols-4 gap-4`
  - Each: Label + `<select>` element styled `w-full p-2 rounded-lg bg-secondary border border-border/50 text-sm`

- **Minimum Score**: Label + 5 buttons (90+, 80+, 70+, 60+, 50+)
  - Active: `bg-teal text-white`
  - Inactive: `bg-secondary hover:bg-secondary/80`
  - Size: `px-3 py-1.5 text-sm rounded-lg`

- **Actions**: `pt-4 border-t border-border/50 flex gap-2`
  - "Clear All" ghost button with X icon (shown when filters active)
  - "Apply Filters" coral button with Filter icon (right-aligned `ml-auto`)

### 1.4 Top 5 Trending Section

**Visibility**: Only shown when search is NOT active

**Container**: `container py-6 border-t border-border/30`

**Section Header**: Fire emoji + "Top 5 Trending Anime Right Now", subtitle "Most watched anime this season"

**Grid**: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4`

**Cards**: Standard AnimeCard with rank overlay:
- Rank badge: `absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full bg-coral flex items-center justify-center text-white font-bold text-sm shadow-lg`
- Content: `#1` through `#5`

### 1.5 Tab Navigation

**Layout**: `flex items-center gap-2 mb-6`

**3 Tabs** (Button components):
1. TrendingUp icon + "Trending"
2. Flame icon + "Popular"
3. Calendar icon + "This Season"

**Active**: `variant="coral"` (coral bg)
**Inactive**: `variant="ghost"`
**Size**: `size="sm"`, `gap-2`

### 1.6 Section Header (`src/components/SectionHeader.tsx`)

**Layout**: `flex items-center justify-between mb-6`

**Left side**: Icon (optional, in `p-2 rounded-lg bg-coral/10`, icon `w-5 h-5 text-coral`) + title/subtitle
- Title: `text-xl md:text-2xl font-bold text-foreground`
- Subtitle: `text-sm text-muted-foreground mt-0.5`

**Right side**: Optional action slot

### 1.7 Anime Grid (`src/components/AnimeGrid.tsx`)

**Grid layout**: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6`

**Compact layout** (used in AI Search): `space-y-3` (vertical stack)

**Loading skeleton (grid)**:
- Same grid, 10 items
- Each: `rounded-xl bg-card/50 overflow-hidden animate-pulse`
- Image placeholder: `aspect-[3/4] bg-muted`
- Text placeholders: rounded divs in `p-4 space-y-3`

**Loading skeleton (compact)**:
- 5 items: flex row, `p-3 rounded-xl bg-card/50 animate-pulse`
- Image: `w-20 h-28 rounded-lg bg-muted`
- Text lines in `space-y-2`

**Empty state**:
- Centered, `py-16`
- Circle: `w-24 h-24 rounded-full bg-secondary` with magnifying glass emoji
- Title: `text-lg font-semibold`
- Description: `text-muted-foreground max-w-md`

**Stagger animation**: Each card has `animate-slide-up` with `animationDelay: index * 50ms`

### 1.8 Anime Card - Grid Variant (`src/components/AnimeCard.tsx`)

**Container**: `rounded-xl glass-card glow-card overflow-hidden`, hover: `border-coral/30 shadow-elevated`

**Cover Image** (`aspect-[3/4]`):
- Lazy loading with pulse skeleton
- Hover: `scale-105` (500ms transition)
- Gradient overlay: `bg-gradient-to-t from-background via-background/20 to-transparent opacity-80`
- **Score badge** (top-right): `absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-sm text-sm font-medium`
  - Star icon (`w-3.5 h-3.5 fill-gold text-gold`) + score as `XX%`
- **Rank badge** (top-left, if ranked): `absolute top-3 left-3 rounded-full bg-coral/90 backdrop-blur-sm text-sm font-medium text-white`
  - Trophy icon + `#N`
- **Hover overlay**: `bg-background/60 backdrop-blur-sm`, centered ListStatusDropdown

**Content area** (`p-4 space-y-3`):
- **Title**: `font-semibold line-clamp-1`, hover: `text-coral`
- **Metadata**: `text-sm text-muted-foreground`, year + format + episodes, separated by dots
- **Progress bar** (if WATCHING): `bg-violet/10 border border-violet/20 rounded-lg`, Eye icon, ProgressBar component
- **Studio & Source row**: `text-xs text-muted-foreground`, Tv icon + studio name, source as `bg-secondary/50 rounded`
- **Members & Rating**: `text-xs text-muted-foreground`, Users icon + count, rating badge `bg-violet/20 text-violet`
- **Vibe chips**: `flex flex-wrap gap-1.5`, each uses `.vibe-chip` + color variant class
- **Signature widgets** (`grid grid-cols-3 gap-2 pt-2 border-t border-border/50`):
  1. Finishability: Clock icon `text-teal`, `X/10`, label "Finishability"
  2. Energy: Zap icon `text-coral`, level (capitalize), label "Energy"
  3. Tear Risk: Droplets icon `text-violet`, level (capitalize), label "Tear Risk"
- **Genres**: `flex flex-wrap gap-1.5 pt-2`, `text-xs px-2 py-0.5 rounded-md bg-secondary`, max 3
- **Description** (hover only): `text-sm text-muted-foreground line-clamp-2 animate-fade-in`

### 1.9 Anime Card - Compact Variant

**Container**: `flex gap-4 p-3 rounded-xl glass-card glow-card`, hover: `border-coral/30`

**Cover**: `w-20 h-28 rounded-lg overflow-hidden`, hover: `scale-105`

**Content**: `flex-1 min-w-0 flex flex-col justify-between py-1`
- Title: `font-semibold truncate`, hover: `text-coral`
- Metadata: year + episodes + score (Star icon)
- Studios: `text-xs text-muted-foreground`
- Vibe chips: max 2, `flex flex-wrap gap-1.5`

**Actions** (right side): `opacity-0` -> `opacity-100` on hover, ListStatusDropdown icon variant

### 1.10 Pagination (`src/components/Pagination.tsx`)

**Layout**: `flex items-center justify-center gap-4`

**Previous button**: `variant="outline" size="sm"`, ChevronLeft icon, "Previous" text (hidden on mobile `hidden sm:inline`)

**Page indicator**: `text-sm`, "Page N" bold + "of M" muted, or Loader2 spinner when loading

**Next button**: Same as Previous but ChevronRight

**Load More variant**: Centered `variant="outline" size="lg" min-w-[200px]`, "Load More" or spinner

### 1.11 CTA Section

**Container**: `container py-16`

**Card**: `rounded-2xl overflow-hidden bg-gradient-surface border border-border/50 p-8 md:p-12`

**Decorative blobs**:
- `bg-gradient-glow opacity-30` full overlay
- `w-64 h-64 bg-coral/10 rounded-full blur-3xl` (top-right)
- `w-64 h-64 bg-violet/10 rounded-full blur-3xl` (bottom-left)

**Content** (`relative z-10 max-w-2xl`):
- Heading: "Not sure what to watch?" `text-2xl md:text-3xl font-bold`
- Description: `text-muted-foreground mb-6`
- CTA Button: `variant="hero" size="lg"` -> "Try AI Recommendations"

### 1.12 Footer

**Container**: `border-t border-border/30 py-8`

**Layout**: `flex flex-col md:flex-row items-center justify-between gap-4`

**Left**: Logo image (`w-6 h-6 rounded-md`) + "AInime" `font-semibold`

**Center**: `text-sm text-muted-foreground text-center`, attribution text

**Right**: 3 links (About, Privacy, Terms), `text-sm text-muted-foreground`, hover: `text-foreground`

### 1.13 Diagnostics Panel (Dev Tool)

- Fixed `bottom-4 right-4 z-50` settings gear button
- Expandable panel showing data source (AniList/Jikan), request logs
- Dev-only component, toggle with Settings icon

---

## 2. AI Search (`/ai` - `src/pages/AISearch.tsx`)

### 2.1 Page Header

**Layout**: `container py-8`, `max-w-4xl mx-auto`, centered

**Badge**: `inline-flex items-center gap-2 px-4 py-2 rounded-full`
- Background: `bg-gradient-to-r from-coral/20 to-violet/20 border border-coral/30`
- Content: Sparkles icon (`w-5 h-5 text-coral`) + "AI-Powered Search (LLM)" `font-medium`

**Heading**: `text-3xl md:text-4xl font-bold mb-2` - "Describe what you want to watch"

**Description**: `text-muted-foreground` - Multi-turn conversation explanation

### 2.2 Empty State (No Messages)

**Layout**: `text-center py-16 space-y-4`

**Icon container**: `w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-coral/20 to-violet/20`
- Sparkles icon: `w-10 h-10 text-coral`

**Title**: `text-lg font-medium` - "Start a conversation"

**Description**: `text-muted-foreground max-w-md mx-auto`

**Suggestion buttons**: `flex flex-wrap justify-center gap-2 pt-4`
- 4 prompt pills: `px-4 py-2 rounded-full bg-secondary hover:bg-coral/20 hover:text-coral transition-colors text-sm`
  1. "Fantasy adventure dengan MC OP"
  2. "Romance yang healing dan cozy"
  3. "Psychological thriller yang mind-bending"
  4. "Anime pendek yang bisa ditamatin weekend"

### 2.3 Chat Interface

**Message list**: `space-y-6 mb-8 min-h-[200px]`

**User message**:
- `flex justify-end`
- Bubble: `max-w-[80%] px-4 py-3 rounded-2xl bg-coral text-primary-foreground`

**Assistant message** (`space-y-4`):
- **Loading state**: `flex items-center gap-3 text-muted-foreground animate-pulse`
  - Loader2 spinner + "AI sedang menganalisis dan mencari anime..."
- **Vibe badge**: `inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet/20 text-violet text-sm`
  - Sparkles icon `w-3.5 h-3.5` + vibe description
- **Interpretation text**: `text-foreground`
- **Similarity reason** (for "More Like This"): `p-3 rounded-lg bg-teal/10 border border-teal/20 text-sm`
  - Lightbulb emoji + "Mengapa mirip:" label (`font-medium text-teal`) + reason (`text-muted-foreground`)
- **Suggestion chips**: `flex flex-wrap gap-2`
  - Each: `text-xs px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-coral/20 hover:text-coral`
  - Lightbulb emoji prefix

**Results**:
- AnimeGrid with `compact` prop (list layout)
- **Refinement chips** (below results): `flex flex-wrap gap-2 pt-4 border-t border-border/30`
  - Label: `text-xs text-muted-foreground mr-2` - "Refine:"
  - 5 chips: `px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs hover:bg-coral/20 hover:text-coral`
    1. "2020+" -> "yang rilis 2020 ke atas"
    2. "Pendek" -> "yang lebih pendek (max 13 eps)"
    3. "Tamat" -> "yang sudah selesai tayang"
    4. "No Romance" -> "tanpa romance"
    5. "Cozy" -> "yang lebih cozy dan healing"
- **"More like" buttons**: `flex flex-wrap gap-2`
  - Label: `text-xs text-muted-foreground block mb-2` - "More like:"
  - Up to 3 buttons: `px-3 py-1.5 rounded-full bg-teal/10 text-teal text-xs hover:bg-teal/20`
  - MoreHorizontal icon `w-3 h-3` + truncated title (20 chars)

### 2.4 Input Area

**Container**: `sticky bottom-4`

**New Conversation** (shown when messages exist): Centered `variant="ghost" size="sm"`, RefreshCw icon + "New Conversation", `text-muted-foreground`

**Form**: `relative`
- **Outer glow**: `absolute -inset-2 bg-gradient-to-r from-coral/20 to-violet/20 rounded-2xl blur-xl opacity-50`
- **Inner container**: `relative flex gap-2 p-2 rounded-xl bg-card border border-border`
- **Input**: `flex-1 border-0 bg-transparent focus:ring-0`
  - Placeholder changes: "Describe what you want to watch..." (empty) vs "Refine: 'yang lebih pendek', 'tanpa romance'..." (with messages)
- **Send button**: `variant="coral" size="icon"`, Send icon or Loader2 spinner

---

## 3. Anime Detail (`/anime/:id` - `src/pages/AnimeDetail.tsx`)

### 3.1 Loading State
- Centered `py-32`, Loader2 `w-8 h-8 animate-spin text-coral`

### 3.2 Not Found State
- `container py-16 text-center`
- "Anime not found" `text-2xl font-bold`
- "Back to Home" coral button

### 3.3 Hero Section

**Banner**: `absolute inset-0 h-80 overflow-hidden`
- Image: `blur-2xl opacity-30 scale-110 object-cover`
- Gradient overlay: `bg-gradient-to-b from-background/50 via-background/80 to-background`

**Back link**: `inline-flex items-center gap-2 text-muted-foreground hover:text-foreground`
- ArrowLeft icon + "Back to Discover"

**Layout**: `flex flex-col md:flex-row gap-8`

**Poster** (left):
- `w-64 rounded-xl overflow-hidden shadow-elevated`
- Image: `aspect-[3/4] object-cover`
- **Rank badge**: `absolute top-3 left-3 rounded-full bg-coral/90 text-sm font-medium text-white`
  - Trophy icon + `#N`

**Actions** (below poster):
- `mt-4 space-y-2`
- ListStatusDropdown: `variant="button" size="lg" w-full`
- Share button: `variant="button" size="lg" w-full`

**Info** (right, `flex-1`):
- **Title**: `text-3xl md:text-4xl font-bold text-foreground`
- **Native title**: `text-lg text-muted-foreground`
- **English title** (if different): `text-sm text-muted-foreground`
- **Metadata row**: `flex flex-wrap items-center gap-4 mb-6`
  - Score: `rounded-full bg-gold/20 text-gold`, Star icon (filled) + `XX%`
  - Season: Calendar icon + "SEASON YEAR"
  - Format: Tv icon + "FORMAT - XX eps"
  - Duration: Clock icon + "XX min/ep"
  - Members: Users icon + "XXK favorites"
- **Genres**: `flex flex-wrap gap-2 mb-6`
  - Each: `px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm`
- **Tags**: `flex flex-wrap gap-1.5 mb-6`, max 8
  - Each: `px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground`

### 3.4 Signature Widgets

**Layout**: `grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6`

Each widget: `glass-card rounded-lg p-3 text-center`
1. **Finishability**: `text-2xl font-bold text-teal` + "X/10", label `text-xs text-muted-foreground`
2. **Energy**: `text-2xl font-bold text-coral capitalize` + level, label "Energy"
3. **Tear Risk**: `text-2xl font-bold text-violet capitalize` + level, label "Tear Risk"
4. **Setting**: `text-2xl font-bold text-gold capitalize` + setting, label "Setting"

### 3.5 Studio, Source, Status Info

`flex flex-wrap gap-4 text-sm text-muted-foreground mb-6`
- Key-value pairs: Key in `text-foreground font-medium`, value in default

### 3.6 Trailer Link

- `inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-coral text-white hover:bg-coral/90`
- Play icon + "Watch Trailer" + ExternalLink icon

### 3.7 Synopsis Section

- `container py-8`
- Title: `text-xl font-bold mb-4` - "Synopsis"
- Text: `text-muted-foreground leading-relaxed max-w-4xl whitespace-pre-line`
- HTML tags stripped from description

### 3.8 Vibe Section

- `container py-4`
- Title: `text-lg font-semibold mb-3` - "Vibe"
- Chips: `flex flex-wrap gap-2`, alternating colors (coral, violet, teal by index)

### 3.9 Streaming Links (`src/components/StreamingLinks.tsx`)

- `container py-8`
- Title: `text-xl font-bold` - "Where to Watch"
- Region indicator: MapPin icon + region name `text-sm text-muted-foreground`
- **Available section**: Globe icon (teal) + "Available in your region"
  - Buttons: `inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white shadow-md`
  - Hover: `scale-105 shadow-lg`
  - Dynamic background color per platform
- **Unavailable section**: Collapsible with ChevronDown
  - Same buttons but `opacity-60 grayscale hover:opacity-100 hover:grayscale-0`
- Each button: Platform icon/initial + name + ExternalLink icon
- Tooltip with "Watch on X" or "X - May require VPN"

### 3.10 Trailers Section (`src/components/TrailerSection.tsx`)

- `container py-8`
- Title: `text-xl font-bold mb-6` - "Trailers & PVs"
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- **Thumbnail card**: `aspect-video rounded-xl overflow-hidden glass-card glow-card`, hover: `border-coral/30 shadow-elevated`
  - Gradient overlay: `from-background/80 via-background/20 to-transparent`
  - Play button: `w-14 h-14 rounded-full bg-coral/90`, hover: `scale-110 bg-coral`
  - Title: `text-sm font-medium text-white truncate drop-shadow-lg`
  - Platform badge: `top-3 left-3 rounded-full bg-background/80 backdrop-blur-sm text-xs`
- **Video Modal**: Fixed overlay `bg-background/90 backdrop-blur-sm`
  - `max-w-5xl aspect-video`
  - Close: X button above
  - Navigation: ChevronLeft/Right on sides (if multiple trailers)
  - Keyboard: Escape to close, Arrow keys to navigate
  - iframe with `rounded-xl shadow-elevated`

### 3.11 Characters & Voice Actors

- `container py-8`
- Title: `text-xl font-bold mb-6` - "Characters & Voice Actors"
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Each card: `glass-card rounded-lg p-3 flex items-center gap-3`
  - Character image: `w-14 h-14 rounded-full object-cover`
  - Character info: name `font-medium`, role `text-xs text-muted-foreground`
  - Voice actor (right): name `text-sm`, language `text-xs text-muted-foreground`, image `w-10 h-10 rounded-full`
- Loading: Same grid with pulse skeleton, circular placeholders

### 3.12 Staff

- `container py-8`
- Grid: `grid grid-cols-2 sm:grid-cols-4 gap-4`
- Each card: `glass-card rounded-lg p-3 flex items-center gap-3`
  - Image: `w-12 h-12 rounded-full object-cover`
  - Name: `font-medium text-sm truncate`, role: `text-xs text-muted-foreground truncate`

### 3.13 Similar Anime Section (`src/components/EnhancedSimilarAnime.tsx`)

- `container py-8 pb-16`
- Title: "Similar Anime" `text-xl font-bold` + Sparkles icon (coral)
- Personalized badge (if applicable): `text-xs text-teal bg-teal/10 px-2 py-1 rounded-full`
- Grid: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4`
- **Each card**: `glass-card rounded-xl overflow-hidden`, hover: `shadow-elevated scale-[1.02]`
  - Cover: `aspect-[3/4]`, hover: `scale-105` (500ms)
  - **Similarity score overlay** (top-right): `rounded-full text-xs font-bold backdrop-blur-sm`
    - 70%+: `bg-emerald-500/90 text-white`
    - 50-69%: `bg-teal/90 text-white`
    - <50%: `bg-background/90 text-foreground`
  - **Match type badge** (bottom-left): Rounded full pill with color coding
  - Info: title `text-sm line-clamp-2`, score + format row
  - Tooltip on reason text with full breakdown
- **Legend** (bottom): `flex flex-wrap items-center gap-4 mt-6 text-xs text-muted-foreground`
  - 3 colored dots: emerald "Strong Match (70%+)", teal "Related (45-69%)", violet "Discovery (<45%)"
- Loading: 6 skeleton cards with pulse animation

---

## 4. Calendar (`/calendar` - `src/pages/SeasonalCalendar.tsx`)

### 4.1 Page Header

- `text-3xl font-bold flex items-center gap-3 mb-2`
- Calendar icon `w-8 h-8 text-coral` + "Seasonal Calendar"
- Description: `text-muted-foreground`

### 4.2 Main Tabs

- `TabsList grid w-full max-w-md grid-cols-2`
- Tab 1: Tv icon + "Seasonal Anime"
- Tab 2: User icon + "MY Calendar" + Badge with count (if > 0)

### 4.3 Seasonal Anime Tab

**Season Selector**: `flex flex-wrap items-center gap-4 mb-6`
- Year navigation: ChevronLeft/Right ghost buttons + Select dropdown (`w-24`)
  - Options: past 3 years through future 2 years
- Season buttons: 4 buttons (Winter, Spring, Summer, Fall)
  - Active: `variant="coral"`
  - Inactive: `variant="outline"`
- Planned count badge: `Badge variant="secondary"`, Bookmark icon + "X planned"

**Filters Section**: `flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-card/50 border border-border/50`

- **Day filter tabs**: `flex flex-wrap gap-1`
  - 8 buttons: All Days + Sun-Sat
  - Active: `variant="coral"`
  - Inactive: `variant="ghost"`
  - Text: full label desktop (`hidden sm:inline`), abbreviation mobile (`sm:hidden`)

- **Genre filter**: Popover with checkbox list
  - Trigger: outline button with Filter icon + "Genres" + count badge
  - Content: `w-64 max-h-80 overflow-y-auto`, checkbox + label per genre

- **My Schedule toggle**: `variant={showOnlyPlanned ? 'coral' : 'outline'}`, BookmarkCheck icon

- **Clear Filters**: ghost button (shown when filters active)

**Calendar Grid (All Days view)**: `space-y-8`
- Each day section: optional `p-4 rounded-lg bg-coral/5 border border-coral/20` for today
  - Day header: `text-xl font-semibold capitalize`, "(Today)" suffix, Badge with count
  - Grid: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4`
  - CalendarAnimeCard (AnimeCard + broadcast time badge + plan toggle)

**Single Day View**: SectionHeader + same grid or empty state

**Calendar Anime Card**:
- Standard AnimeCard wrapped in relative div
- **Broadcast time badge** (top-left): `Badge variant="secondary" bg-background/90 backdrop-blur-sm text-xs`
  - Clock icon + time string
- **Plan to Watch button** (top-right): `w-8 h-8`, icon only
  - Planned: `variant="coral"`, BookmarkCheck icon, always visible
  - Unplanned: `variant="secondary"`, Bookmark icon, `opacity-0 group-hover:opacity-100`

### 4.4 MY Calendar Tab

**Empty state**: Eye icon (`w-16 h-16 opacity-50`), "No anime in your watch schedule", browse button

**Schedule header**: `rounded-lg bg-gradient-to-r from-coral/10 to-purple-500/10 border border-coral/20 p-4`
- "My Anime Schedule" `text-lg font-semibold text-coral`
- Date/time display: `text-sm text-muted-foreground`
- Badge: `bg-coral`, "X shows watching"

**MS Teams Style Weekly Calendar** (desktop, `border rounded-lg overflow-hidden bg-card`):
- **Week header**: `grid grid-cols-7 border-b bg-muted/30`
  - Each day: `p-3 text-center border-r`, day abbreviation + date
  - Today highlight: `bg-coral/10`, coral text, "Today" badge
- **Schedule grid**: `grid grid-cols-7 min-h-[400px]`
  - Each column: `border-r p-2 space-y-2`, today: `bg-coral/5`
  - ScheduleCard per anime: `p-2 rounded-md text-xs`
    - Today: `bg-coral/20 border-coral/40`
    - Non-today: `bg-primary/10 border-primary/20`
    - Hover: `scale-[1.02]`
    - Content: time (Clock icon), title (line-clamp-2), episode count
    - Remove button: `w-4 h-4 rounded-full bg-destructive`, hidden until group hover

**Mobile list view** (`lg:hidden space-y-4`):
- Per day section with day card (`rounded-lg border`)
  - Today: `bg-coral/5 border-coral/30`
  - MobileScheduleCard: `flex items-center gap-3 p-2 rounded-lg bg-muted/30`
    - Cover image: `w-10 h-14 rounded`
    - Title, time, episode count
    - "Watching" badge: `bg-green-500/20 text-green-600`
    - Remove button: `w-6 h-6 opacity-0 group-hover:opacity-100`

---

## 5. My List (`/my-list` - `src/pages/MyList.tsx`)

### 5.1 Page Header

- SectionHeader: "My List", subtitle "X anime in your collection"
- Share button (right, when entries > 0): ListShareButton `variant="button" size="md"`

### 5.2 Status Tabs

**Layout**: `flex flex-wrap gap-2 mb-8 pb-4 border-b border-border/50`

**6 Tabs** (Button components):
1. "All (N)" - no icon
2. Bookmark icon (teal) + "Saved (N)"
3. Heart icon (coral) + "Loved (N)"
4. Eye icon (violet) + "Watching (N)"
5. Check icon (green-500) + "Watched (N)"
6. X icon (muted-foreground) + "Dropped (N)"

Active: `variant="coral"`, Inactive: `variant="ghost" size="sm" gap-2`
Icon color preserved when inactive via `config.color`

### 5.3 Empty State (No Entries)

- `py-20 text-center`
- Circle: `w-24 h-24 rounded-full bg-secondary`, Bookmark icon `w-10 h-10 text-muted-foreground`
- Title: `text-xl font-semibold`
- Description: `text-muted-foreground max-w-md`
- CTA: "Discover Anime" coral button

### 5.4 Currently Watching Progress

**Visibility**: Only when watching entries > 0

**Container**: `mt-12 pt-8 border-t border-border/50`

**Header**: Play icon (violet) + "Currently Watching" `text-lg font-semibold`
- Subtitle: X anime in progress, Y episodes remaining

**Grid**: `grid gap-4 md:grid-cols-2`

**Episode Progress Tracker** (`src/components/EpisodeProgressTracker.tsx`, full variant):
- Container: `glass-card p-4 rounded-xl space-y-4`
- **Header row**: Cover image (`w-16 h-24 rounded-lg`) + title + "Currently Watching" label + last updated
- **Progress bar section**:
  - Label row: "Progress" + percentage (`text-violet`)
  - Progress bar: `h-3 bg-violet/20`, fill: violet
  - Episode info: "Episode X of Y" + "Z episodes remaining"
- **Controls** (`pt-2 border-t border-border/50`):
  - Decrement/increment buttons: outline `h-9 w-9 p-0`
  - Episode display: `px-4 py-2 rounded-lg bg-violet/20 text-violet font-semibold text-lg min-w-[80px]`
    - Click to edit: inline number input
  - "Next Episode" coral button with ChevronRight icon
  - "Complete" outline button with Check icon

### 5.5 Taste Profile Stats

**Container**: `mt-16 pt-8 border-t border-border/50`

**Title**: "Your Taste Profile" `text-lg font-semibold mb-6`

**Grid**: `grid grid-cols-2 md:grid-cols-4 gap-4`

4 stat cards (each `glass-card p-4 rounded-xl`):
1. **Top Genres**: list of genre + count pairs
2. **Completion Rate**: `text-3xl font-bold text-coral` percentage
3. **Currently Watching**: `text-3xl font-bold text-violet` count
4. **Favorites**: `text-3xl font-bold text-teal` count

### 5.6 AI Summary Section

- `mt-8 pt-6 border-t border-border/50`
- Title: Sparkles icon (coral) + "Your Anime Summary"
- Generate/Regenerate button
- Result card: `glass-card p-4 rounded-xl`, `text-lg leading-relaxed`
- Empty state: centered Sparkles icon + instruction text

### 5.7 AI Recommendations (`src/components/AIRecommendations.tsx`)

- `mt-8 pt-6 border-t border-border/50`
- Title: Brain icon (violet) + "AI-Powered Recommendations" + "Personalized" badge
- Generate/Refresh button
- **Loading**: Animated brain icon with concentric spinning borders
- **Personalized message**: `glass-card rounded-xl border border-violet/20 bg-gradient-to-r from-violet/5 to-coral/5`
  - Target icon in violet rounded-lg container + message text
- **Taste Analysis** (collapsible): `grid grid-cols-2 md:grid-cols-4 gap-4`
  - Top Genres, Mood Profile, Pattern, Formats
- **Recommendations grid**: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`
  - Each: AnimeCard + match score badge (`bg-violet/90 text-white text-xs rounded-full`)
  - Hover: reason text overlay from bottom
- Footer: "Powered by Gemini AI with Google Search grounding"

---

## 6. Tier Lists

### 6.1 Browse Page (`/tier-lists` - `src/pages/TierLists.tsx`)

**Header**: SectionHeader "Tier Lists" + "Create Tier List" coral button (Plus icon)

**Tabs** (shadcn/ui Tabs):
1. TrendingUp icon + "Browse"
2. Layers icon + "Templates"
3. User icon + "My Lists" (auth'd only)

**Browse tab**: Grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Loading: centered Loader2 spinner
- Empty: Layers icon (`w-16 h-16 opacity-50`) + "No tier lists yet" + create button

**Tier List Card** (`src/components/tier-list/TierListCard.tsx`):
- `rounded-xl border bg-card overflow-hidden`, hover: `border-coral/50 shadow-lg shadow-coral/10`
- **Preview images** (`h-32 bg-muted/30`): Up to 4 overlapping cover images with tier badges (S/A/B...)
  - Tier badge colors from `TIER_CONFIG` (S=red, A=orange, B=yellow, etc.)
- **Content** (`p-4 space-y-3`):
  - Title: `font-semibold truncate`, hover: `text-coral`
  - Description: `text-sm text-muted-foreground line-clamp-2`
  - Visibility icon: Users (friends), Lock (private)
  - Stats: Eye icon + anime count, Heart (like button, filled when liked), Clock + time ago
  - User avatar: `w-6 h-6 rounded-full bg-gradient-to-br from-coral to-violet text-white text-xs`

**Templates tab**: Grid same layout
- Template cards: `p-6 rounded-xl border bg-card`, hover: `border-coral/50 shadow-lg shadow-coral/10`
  - Category badge: colored by type (violet=genre, teal=season, gold=studio, coral=custom)
  - Name: `font-semibold`, hover: `text-coral`
  - Description: `text-sm text-muted-foreground`

### 6.2 Create Page (`/tier-lists/create` - `src/pages/TierListCreate.tsx`)

- Back button: ghost, ArrowLeft icon + "Back to Tier Lists"
- SectionHeader with template name or "Create Tier List"
- `max-w-4xl` container
- TierListCreator component with title, anime search, drag-drop tier rows (S through F)

### 6.3 Detail Page (`/tier-lists/:id` - `src/pages/TierListDetail.tsx`)

- Back button + TierListView component
- **View header**: Title `text-2xl md:text-3xl font-bold`, description, actions (Like, Share, Edit)
  - Like button: outline, Heart icon (filled+coral when liked) + count
  - Share button: outline, Share2 icon
  - Edit button (owner only): outline, Edit icon
- **Meta info**: Eye icon + anime count, Calendar + date, User + author name
- **Tier display**: TierRow per tier (S through F), only showing non-empty tiers
  - Each TierRow: Tier label (colored background) + anime cover images in a row
- Loading: Loader2 spinner
- Error: AlertCircle icon + "Tier list not found" + browse button

### 6.4 Edit Page (`/tier-lists/:id/edit` - `src/pages/TierListEdit.tsx`)

- Same as Create but pre-populated with existing data

---

## 7. Auth (`/auth` - `src/pages/Auth.tsx`)

### 7.1 Background

- Fixed decorative blobs: `pointer-events-none`
  - `w-96 h-96 bg-coral/10 rounded-full blur-3xl` (top-left quarter)
  - `w-96 h-96 bg-violet/10 rounded-full blur-3xl` (bottom-right quarter)

### 7.2 Layout

- `min-h-screen flex items-center justify-center p-4`
- Card: `relative w-full max-w-md`

### 7.3 Branding Header

- `text-center mb-8`
- Logo: `w-8 h-8 rounded-lg` image + "AInime" in `text-2xl font-bold` with gradient text
- Title: `text-2xl font-bold text-foreground`
  - Sign up: "Create your account"
  - Sign in: "Welcome back"
- Subtitle: `text-muted-foreground mt-2`

### 7.4 Auth Card

- `glass-card rounded-2xl p-6 border border-border/50`

**Google OAuth**: `w-full mb-4 gap-3 h-11`, outline variant
- Google SVG icon (multi-color: blue/green/yellow/red paths)
- Text: "Continue with Google"
- Loading: Loader2 spinner replaces icon

**Divider**: `relative mb-4`
- Line: `w-full border-t border-border/50`
- "or" label: `bg-card px-2 text-muted-foreground text-xs uppercase`, centered

**Form** (`space-y-4`):
- **Display Name** (sign up only): Label `text-sm font-medium text-foreground`, Input with placeholder
- **Email**: Label + Input `type="email"`, placeholder "you@example.com"
- **Password**: Label + Input with visibility toggle
  - Eye/EyeOff toggle button: `absolute right-3 top-1/2 -translate-y-1/2`
  - Placeholder: "........"
- Error messages: `text-xs text-destructive`
- Validation: zod schema (email valid, password min 6, displayName min 2)

**Submit button**: `variant="coral" w-full`
- Sign up: "Create Account"
- Sign in: "Sign In"
- Loading: Loader2 spinner

**Toggle**: `mt-6 text-center text-sm text-muted-foreground`
- "Already have an account?" / "Don't have an account?"
- Toggle link: `text-coral hover:underline font-medium`

**Terms**: `text-center text-xs text-muted-foreground mt-6`
- "By continuing, you agree to our Terms of Service and Privacy Policy"

---

## 8. Profile (`/profile` - `src/pages/Profile.tsx`)

### 8.1 Profile Header

- `glass-card rounded-2xl p-6 md:p-8 mb-8`
- `flex flex-col md:flex-row items-start md:items-center gap-6`

**Avatar**: `w-24 h-24 border-4 border-coral/30`
- Fallback: `text-2xl font-bold bg-gradient-to-br from-coral to-violet text-white`, user initials

**Info**:
- Display name: `text-2xl md:text-3xl font-bold` + Edit3 icon button (ghost)
  - Edit mode: Input `max-w-[200px]` + Save coral button + Cancel ghost button
- Email: `text-muted-foreground`
- Stats row: `flex flex-wrap gap-4 mt-4 text-sm`
  1. Film icon (coral) + "X anime in list"
  2. Clock icon (violet) + "X hours watched"
  3. Trophy icon (teal) + "X% completion rate"

**Sign Out button**: ghost `size="sm"`, LogOut icon

### 8.2 Tabs

`TabsList grid w-full grid-cols-3 max-w-md`
1. BarChart3 icon + "Statistics"
2. Calendar icon + "History"
3. Settings icon + "Settings"

### 8.3 Statistics Tab

**Key Stats Grid**: `grid grid-cols-2 md:grid-cols-5 gap-4`

Each StatCard (`glass-card p-4 rounded-xl`):
- Icon container: `w-10 h-10 rounded-lg`, colored background
- Value: `text-2xl font-bold`
- Label: `text-sm text-muted-foreground`

5 cards:
1. Completed (green-500)
2. Watching (violet)
3. Loved (coral)
4. Saved (teal)
5. Dropped (muted-foreground)

**Detailed Stats** (`grid md:grid-cols-2 gap-6`):

**Watch Statistics Card** (`glass-card border-0`):
- Clock icon (violet) + "Watch Statistics"
- 4 rows: Total Episodes, Hours Watched, Days Watched, Avg Anime Score
- Each: `flex justify-between`, label `text-muted-foreground`, value `font-semibold text-xl`

**Favorite Genres Card**:
- TrendingUp icon (coral) + "Favorite Genres"
- Up to 6 GenreBars with progress visualization
  - Label row: genre name + "X anime" count
  - Bar: `h-2 bg-secondary rounded-full overflow-hidden`, fill rotates colors (coral, violet, teal, yellow, green, blue)
  - Width: percentage-based

**Format Breakdown Card**:
- Film icon (teal) + "Format Breakdown"
- Pill badges: `px-4 py-2 rounded-full bg-secondary`, format name + count in `text-coral font-bold`

### 8.4 History Tab

- **Recent Activity Card** (`glass-card border-0`):
  - Calendar icon (violet) + "Recent Activity"
  - List of anime entries with:
    - Cover image: `w-12 h-16 rounded-md`
    - Title: `font-medium truncate`, hover: `text-coral`
    - Status icon + label (colored per status)
    - Date: `text-xs text-muted-foreground`
    - ChevronRight arrow
  - Empty state: "No activity yet" + "Discover Anime" button
- "View Full List" outline button -> `/my-list`

### 8.5 Settings Tab

**Account Information** (`glass-card border-0`):
- User icon (coral) + "Account Information"
- Email display
- Display Name with Edit button (`text-coral`)

**Privacy Settings** (`src/components/PrivacySettings.tsx`):
- Shield icon (coral) + "Privacy Settings"
- 3 privacy groups (each with public/friends/private radio options):
  1. Profile Visibility (User icon)
  2. Anime List Visibility (List icon)
  3. Activity Visibility (Activity icon)
- Each option: `p-3 rounded-lg border`, selected: `border-coral bg-coral/10`
  - Icon in circle: selected `bg-coral text-white`, unselected `bg-secondary`
  - Check mark when selected

- **Additional Privacy Options**:
  - Eye icon (violet) + "Additional Privacy Options"
  - Toggle switches:
    1. "Show Statistics Publicly" (BarChart3, teal)
    2. "Appear in Search Results" (Search, violet)

- **Privacy Summary Card**: EyeOff icon (violet), current settings listed

**Data & Statistics Card**: anime count + "View List" button

**Sign Out Card**: `border-destructive/20`, destructive variant button

---

## 9. 404 Page (`src/pages/NotFound.tsx`)

**Layout**: `flex min-h-screen items-center justify-center bg-muted`

**Content**: `text-center`
- "404" in `text-4xl font-bold mb-4`
- "Oops! Page not found" in `text-xl text-muted-foreground mb-4`
- "Return to Home" link: `text-primary underline hover:text-primary/90`

---

## 10. Shared Components Detail

### 10.1 ListStatusDropdown (`src/components/ListStatusDropdown.tsx`)

**3 variants**: button, badge, icon

**5 Status Options**:
| Status | Label | Icon | Color | BgColor |
|--------|-------|------|-------|---------|
| WATCHING | Watching | Eye | text-violet | bg-violet/20 |
| WATCHED | Completed | Check | text-green-500 | bg-green-500/20 |
| SAVED | Plan to Watch | Bookmark | text-teal | bg-teal/20 |
| LOVED | Favorite | Heart | text-coral | bg-coral/20 |
| DROPPED | Dropped | X | text-muted-foreground | bg-muted/50 |

**Dropdown**: `absolute z-50 w-48 rounded-xl bg-background/95 backdrop-blur-xl border border-border shadow-elevated animate-fade-in`
- Options: Full-width buttons with icon + label + checkmark for active
- Remove option (with divider): destructive colored

**Button variant**: Full button with icon + label + ChevronDown
- Has status: `variant="outline"` with status color
- No status: `variant="coral"` with Plus icon + "Add to List"

**Icon variant**: Round icon-only button
- Has status: `variant="glass"` with colored icon
- No status: `variant="coral"` with Plus icon

### 10.2 Share System (`src/components/ShareButton.tsx` + `ShareCard.tsx`)

**Share Modal**: Fixed overlay `bg-background/80 backdrop-blur-sm`
- Modal card: `max-w-lg rounded-2xl shadow-elevated`
- Header: Share2 icon (coral) + "Share" + close button
- Preview card center-aligned
- Platform buttons: `flex justify-center gap-3`
  - Twitter, Facebook, LinkedIn, each in `p-3 rounded-xl bg-secondary/50`
  - Custom hover colors per platform
- Copy link section: URL display + "Copy" coral button with Check/Copy icon

### 10.3 FilterChips (`src/components/FilterChips.tsx`)

Used for genre and status filtering. Pill-shaped toggle buttons.

### 10.4 NavLink (`src/components/NavLink.tsx`)

Navigation link wrapper component.

---

## 11. Responsive Breakpoints Summary

| Breakpoint | Prefix | Usage |
|------------|--------|-------|
| < 640px | (default) | Mobile - 2-col grids, hamburger menu, stacked layouts |
| >= 640px | `sm:` | 3-col grids, show day labels in calendar |
| >= 768px | `md:` | 4-5 col grids, desktop nav visible, side-by-side layouts |
| >= 1024px | `lg:` | 5-6 col grids, Teams calendar visible |
| >= 1280px | `xl:` | 6 col grids in calendar |

### Key Responsive Patterns

1. **Grid columns scale**: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`
2. **Nav**: Desktop flex nav + mobile hamburger with dropdown
3. **Detail page**: `flex-col md:flex-row` for poster + info
4. **Profile**: `flex-col md:flex-row` for avatar + info
5. **Padding**: `p-8 md:p-12` for hero sections
6. **Typography**: `text-4xl md:text-6xl` for hero headings
7. **Calendar**: Teams grid hidden on mobile, replaced by stacked list view
8. **Search bar AI button**: `hidden sm:flex`

---

## 12. Routing Map

| Path | Page | Auth Required |
|------|------|---------------|
| `/` | Index (Homepage) | No |
| `/ai` | AI Search | No |
| `/calendar` | Seasonal Calendar | No |
| `/my-list` | My List | No (local storage) |
| `/tier-lists` | Tier Lists Browse | No |
| `/tier-lists/create` | Tier List Create | Yes |
| `/tier-lists/:id` | Tier List Detail | No |
| `/tier-lists/:id/edit` | Tier List Edit | Yes (owner) |
| `/auth` | Authentication | No |
| `/profile` | User Profile | Yes |
| `/anime/:id` | Anime Detail | No |
| `*` | 404 Not Found | No |

---

## 13. State Management & Data Flow

- **Server state**: TanStack React Query (`@tanstack/react-query`)
- **Auth**: Firebase Auth + custom `SimpleAuthContext`
- **User list**: Local storage with sync to backend (`useUserList` hook)
- **Data sources**: AniList (primary) + Jikan/MAL (fallback), managed by `DataSourceContext`
- **AI search**: Local LLM processing via `localAISearch` utility
- **AI recommendations**: Gemini API with Google Search grounding

---

## 14. Icon Library

All icons from **Lucide React** (`lucide-react`). Key icons used:

| Icon | Usage |
|------|-------|
| Sparkles | AI features, magic actions |
| Compass | Discover page nav |
| TrendingUp | Trending tab, analytics |
| Flame | Popular tab |
| Calendar | Seasonal tab, dates |
| Star | Ratings (often with `fill-gold text-gold`) |
| Trophy | Rank badges |
| Heart | Loved status, likes |
| Bookmark | Saved status |
| Eye | Watching status |
| Check | Completed status |
| X | Close, remove, dropped |
| Send | Chat send button |
| Loader2 | Loading spinners (`animate-spin`) |
| Search | Search input icon |
| Filter | Filter panel |
| ArrowLeft | Back navigation |
| ChevronLeft/Right | Pagination, navigation |
| Play | Trailers, video playback |
| Share2 | Share actions |
| Settings | Dev diagnostics |
| Zap | Energy level, match score |
| Droplets | Tear risk |
| Clock | Duration, time, finishability |
| Users | Members count |
| Tv | Format, studios |
| Brain | AI recommendations |
| Target | Personalized targeting |
| Shield | Privacy settings |
| LogOut | Sign out |
| Edit3 | Edit profile |
| Menu | Mobile hamburger |

---

## 15. PWA Features

Components in `src/components/pwa/`:
- `PWAInstallPrompt` - App install banner
- `OfflineIndicator` - Offline status indicator
- `PWAUpdatePrompt` - App update notification

All rendered at the App level above the router.
