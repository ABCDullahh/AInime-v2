import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers, TrendingUp, Clock, User, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { TierListCard } from '@/components/tier-list';
import { useCommunityTierLists, useUserTierLists } from '@/hooks/useTierList';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { TIER_LIST_TEMPLATES } from '@/types/tierList';
import { cn, handleImageError } from '@/lib/utils';

// Kitsu CDN anime covers for decorative empty state mockup
const TIER_PREVIEW_ANIME = [
  { id: 7442, name: 'Attack on Titan', tier: 'S' },
  { id: 1, name: 'Cowboy Bebop', tier: 'S' },
  { id: 8271, name: 'Steins;Gate', tier: 'A' },
  { id: 6, name: 'Fullmetal Alchemist', tier: 'A' },
  { id: 11, name: 'Naruto', tier: 'A' },
  { id: 12, name: 'One Piece', tier: 'B' },
  { id: 3, name: 'Trigun', tier: 'B' },
  { id: 10, name: 'Bleach', tier: 'B' },
  { id: 13, name: 'Samurai Champloo', tier: 'C' },
];

const templateLabels: Record<string, { title: string; desc: string }> = {
  genre: { title: 'By Genre', desc: 'Categorize by Shonen, Seinen, Isekai, and more.' },
  season: { title: 'By Season', desc: 'Organize the best of Winter, Spring, Summer, Fall.' },
  studio: { title: 'By Studio', desc: 'Compare the works of Mappa, Ufotable, and Ghibli.' },
  custom: { title: 'Custom Blueprint', desc: 'Start from scratch with your own categories.' },
};

export default function TierLists() {
  const { user } = useSimpleAuth();
  const [activeTab, setActiveTab] = useState<'browse' | 'templates' | 'my-lists'>('browse');
  const [page, setPage] = useState(1);

  const { data: communityData, isLoading: isCommunityLoading } = useCommunityTierLists(page);
  const { data: userLists, isLoading: isUserListsLoading } = useUserTierLists();

  // Group templates by category for the blueprint section
  const templateCategories = ['genre', 'season', 'studio', 'custom'] as const;

  return (
    <div className="min-h-screen bg-dc-bg">
      <Header />

      <main className="pt-32 pb-20 px-[3.5rem] max-w-[1440px] mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8 relative overflow-hidden">
          {/* Faded anime covers behind hero text */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {[3936, 6, 44, 1].map((kitsuId, idx) => (
              <div
                key={kitsuId}
                className="absolute rounded-2xl overflow-hidden opacity-[0.05]"
                style={{
                  width: `${160 + idx * 30}px`,
                  aspectRatio: '3/4',
                  top: `${-20 + idx * 20}%`,
                  right: `${2 + idx * 18}%`,
                  transform: `rotate(${-12 + idx * 7}deg)`,
                }}
              >
                <img
                  src={`https://media.kitsu.app/anime/poster_images/${kitsuId}/large.jpg`}
                  alt=""
                  className="w-full h-full object-cover grayscale"
                  onError={handleImageError}
                  loading="lazy"
                />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-dc-bg via-transparent to-dc-bg/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dc-bg" />
          </div>

          <div className="max-w-4xl relative z-10">
            <span className="text-label text-dc-primary-soft font-bold mb-4 block tracking-[0.15em]">
              Archive 04: Rankings
            </span>
            <h1 className="text-6xl md:text-8xl font-black tracking-[-0.04em] leading-[0.9] text-dc-on-surface">
              DIGITAL <br />
              <span className="italic font-light text-slate-400">CURATION</span>
            </h1>
          </div>
          <Link to="/tier-lists/create" className="relative z-10">
            <button
              className="bg-dc-primary text-dc-bg px-10 py-5 rounded-full font-bold tracking-tight hover:scale-95 transition-transform flex items-center gap-3"
              data-testid="create-tier-list-btn"
            >
              <Plus className="w-5 h-5" />
              CREATE NOW
            </button>
          </Link>
        </header>

        {/* Tab Navigation (hidden but functional, using editorial sections instead) */}
        <div className="flex gap-12 mb-20">
          <button
            onClick={() => setActiveTab('browse')}
            className={cn(
              'pb-2 tracking-wide transition-all text-sm font-medium',
              activeTab === 'browse'
                ? 'text-dc-primary font-bold border-b-2 border-dc-primary'
                : 'text-slate-500 hover:text-dc-on-surface'
            )}
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Browse
            </span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={cn(
              'pb-2 tracking-wide transition-all text-sm font-medium',
              activeTab === 'templates'
                ? 'text-dc-primary font-bold border-b-2 border-dc-primary'
                : 'text-slate-500 hover:text-dc-on-surface'
            )}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Templates
            </span>
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('my-lists')}
              className={cn(
                'pb-2 tracking-wide transition-all text-sm font-medium',
                activeTab === 'my-lists'
                  ? 'text-dc-primary font-bold border-b-2 border-dc-primary'
                  : 'text-slate-500 hover:text-dc-on-surface'
              )}
            >
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                My Lists
              </span>
            </button>
          )}
        </div>

        {/* Browse Tab — Community Curations */}
        {activeTab === 'browse' && (
          <>
            {/* Featured Tier List */}
            {communityData?.lists && communityData.lists.length > 0 && (
              <section className="mb-32">
                <div className="relative group cursor-pointer overflow-hidden rounded-xl bg-dc-surface-low p-1">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 bg-dc-bg rounded-[0.7rem] overflow-hidden">
                    {/* Featured image */}
                    <div className="lg:col-span-5 h-[500px] relative bg-dc-surface-high">
                      {communityData.lists[0].items && communityData.lists[0].items.length > 0 && communityData.lists[0].items[0].animeCoverImage && (
                        <img
                          src={communityData.lists[0].items[0].animeCoverImage}
                          alt={communityData.lists[0].title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-dc-bg/80 to-transparent flex flex-col justify-end p-12">
                        <span className="bg-dc-secondary text-dc-bg px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-[0.2em] uppercase w-fit mb-4">
                          Featured Collection
                        </span>
                        <h2 className="text-4xl font-bold mb-2 text-dc-on-surface">
                          {communityData.lists[0].title}
                        </h2>
                        <p className="text-slate-400 text-sm max-w-xs">
                          {communityData.lists[0].description || 'Curated by the community'}
                        </p>
                      </div>
                    </div>
                    {/* Tier rows preview */}
                    <div className="lg:col-span-7 p-8 flex flex-col justify-center space-y-4">
                      {['S', 'A', 'B'].map((tier) => {
                        const tierItems = communityData.lists[0].items?.filter(i => i.tier === tier) || [];
                        return (
                          <div key={tier} className="flex items-center gap-6">
                            <div
                              className={cn(
                                'w-16 h-16 flex items-center justify-center rounded-xl font-black text-3xl',
                                tier === 'S' && 'bg-red-900/50 text-red-400',
                                tier === 'A' && 'bg-dc-primary/20 text-dc-primary',
                                tier === 'B' && 'bg-dc-surface-highest text-slate-400'
                              )}
                            >
                              {tier}
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                              {tierItems.length > 0 ? (
                                tierItems.slice(0, 3).map((item) => (
                                  <div
                                    key={item.animeId}
                                    className="w-20 h-28 flex-shrink-0 bg-dc-surface-highest rounded-lg overflow-hidden"
                                  >
                                    {item.animeCoverImage && (
                                      <img
                                        src={item.animeCoverImage}
                                        alt={item.animeTitle}
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                ))
                              ) : (
                                <>
                                  <div className="w-20 h-28 bg-dc-surface-low rounded-lg" />
                                  <div className="w-20 h-28 bg-dc-surface-low rounded-lg" />
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Community Curations Grid */}
            <section className="mb-32">
              <div className="flex justify-between items-baseline mb-12">
                <h3 className="text-3xl font-bold tracking-tight text-dc-on-surface">
                  Community <span className="italic font-light">Curations</span>
                </h3>
              </div>

              {isCommunityLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-dc-primary" />
                </div>
              ) : communityData?.lists && communityData.lists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                  {communityData.lists.map((tierList) => (
                    <TierListCard key={tierList.id} tierList={tierList} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  {/* Decorative tier list preview mockup using anime covers */}
                  <div className="max-w-lg mx-auto mb-10 rounded-xl overflow-hidden opacity-60" style={{ background: 'rgba(21, 27, 45, 0.5)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    {['S', 'A', 'B', 'C'].map((tier) => {
                      const tierAnime = TIER_PREVIEW_ANIME.filter(a => a.tier === tier);
                      return (
                        <div key={tier} className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <div
                            className={cn(
                              'w-10 h-10 flex items-center justify-center rounded-lg font-black text-lg flex-shrink-0',
                              tier === 'S' && 'bg-red-900/50 text-red-400',
                              tier === 'A' && 'bg-orange-900/40 text-orange-400',
                              tier === 'B' && 'bg-yellow-900/30 text-yellow-400',
                              tier === 'C' && 'bg-slate-800/50 text-slate-400'
                            )}
                          >
                            {tier}
                          </div>
                          <div className="flex gap-2 overflow-hidden">
                            {tierAnime.map((anime) => (
                              <div key={anime.id} className="w-12 h-16 rounded-md overflow-hidden flex-shrink-0 bg-[#191f31]">
                                <img
                                  src={`https://media.kitsu.app/anime/poster_images/${anime.id}/small.jpg`}
                                  alt={anime.name}
                                  className="w-full h-full object-cover"
                                  onError={handleImageError}
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Layers className="w-16 h-16 mx-auto mb-6 text-slate-600" />
                  <h3 className="text-xl font-bold mb-2 text-dc-on-surface">No tier lists yet</h3>
                  <p className="text-slate-400 mb-8">
                    Be the first to create and share a tier list!
                  </p>
                  <Link to="/tier-lists/create">
                    <button className="bg-dc-primary text-dc-bg font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all flex items-center gap-2 mx-auto">
                      <Plus className="w-4 h-4" />
                      Create Tier List
                    </button>
                  </Link>
                </div>
              )}
            </section>

            {/* Base Blueprints */}
            <section>
              <div className="mb-12">
                <p className="text-label text-dc-primary font-black tracking-[0.25em] mb-4">Starting Points</p>
                <h2 className="text-4xl font-bold text-dc-on-surface">Base Blueprints</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {templateCategories.map((cat) => {
                  const template = TIER_LIST_TEMPLATES.find(t => t.category === cat);
                  const info = templateLabels[cat];
                  const isCustom = cat === 'custom';
                  return (
                    <Link
                      key={cat}
                      to={template ? `/tier-lists/create?template=${template.id}` : '/tier-lists/create'}
                      className="group"
                    >
                      <div
                        className={cn(
                          'bg-dc-surface-container p-8 rounded-xl hover:bg-dc-surface-high transition-all cursor-pointer',
                          isCustom && 'flex flex-col items-center justify-center text-center border-2 border-dashed border-dc-outline-variant/20'
                        )}
                      >
                        {isCustom ? (
                          <>
                            <Plus className="w-6 h-6 text-slate-600 mb-2" />
                            <h5 className="text-sm font-bold text-slate-500">{info.title}</h5>
                          </>
                        ) : (
                          <>
                            <div className="text-dc-primary text-3xl mb-6">
                              {cat === 'genre' && <Layers className="w-8 h-8" />}
                              {cat === 'season' && <Clock className="w-8 h-8" />}
                              {cat === 'studio' && <TrendingUp className="w-8 h-8" />}
                            </div>
                            <h5 className="text-lg font-bold mb-2 text-dc-on-surface">{info.title}</h5>
                            <p className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                              {info.desc}
                            </p>
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <section className="space-y-6">
            <p className="text-slate-400 mb-8">
              Start with a template to quickly create a themed tier list.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TIER_LIST_TEMPLATES.map((template) => (
                <Link
                  key={template.id}
                  to={`/tier-lists/create?template=${template.id}`}
                  className="group"
                >
                  <div className="editorial-card p-6 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={cn(
                          'curator-chip',
                          template.category === 'genre' && 'bg-dc-secondary/20 text-dc-secondary',
                          template.category === 'season' && 'bg-dc-tertiary/20 text-dc-tertiary',
                          template.category === 'studio' && 'bg-dc-primary/20 text-dc-primary',
                          template.category === 'custom' && 'bg-dc-primary/20 text-dc-primary'
                        )}
                      >
                        {template.category}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1 text-dc-on-surface group-hover:text-dc-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {template.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* My Lists Tab */}
        {activeTab === 'my-lists' && user && (
          <section className="space-y-6">
            {isUserListsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-dc-primary" />
              </div>
            ) : userLists && userLists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                {userLists.map((tierList) => (
                  <TierListCard key={tierList.id} tierList={tierList} showUser={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                {/* Decorative scattered anime covers */}
                <div className="flex justify-center gap-3 mb-8 opacity-40">
                  {TIER_PREVIEW_ANIME.slice(0, 5).map((anime, idx) => (
                    <div
                      key={anime.id}
                      className="w-16 h-22 rounded-lg overflow-hidden flex-shrink-0 bg-[#191f31]"
                      style={{ transform: `rotate(${-8 + idx * 4}deg)` }}
                    >
                      <img
                        src={`https://media.kitsu.app/anime/poster_images/${anime.id}/small.jpg`}
                        alt={anime.name}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>

                <Layers className="w-16 h-16 mx-auto mb-6 text-slate-600" />
                <h3 className="text-xl font-bold mb-2 text-dc-on-surface">No tier lists yet</h3>
                <p className="text-slate-400 mb-8">
                  Create your first anime tier list!
                </p>
                <Link to="/tier-lists/create">
                  <button className="bg-dc-primary text-dc-bg font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all flex items-center gap-2 mx-auto">
                    <Plus className="w-4 h-4" />
                    Create Tier List
                  </button>
                </Link>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
