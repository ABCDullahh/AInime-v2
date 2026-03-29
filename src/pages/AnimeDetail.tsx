import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Tv, Users, Trophy, Calendar, Play, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ListStatusDropdown, ListStatus } from '@/components/ListStatusDropdown';
import { TrailerSection } from '@/components/TrailerSection';
import { StreamingLinks } from '@/components/StreamingLinks';
import { AnimeShareButton } from '@/components/ShareButton';
import { EnhancedSimilarAnimeSection } from '@/components/EnhancedSimilarAnime';
import { useUserList, useAnimeDetail, useAnimeCharacters, useAnimeStaff } from '@/hooks/useAnimeData';
import { useMetaTags, getAnimeMetaTags } from '@/hooks/useMetaTags';
import { formatEpisodes, getDisplayTitle } from '@/lib/anime-utils';
import { toast } from '@/hooks/use-toast';
import { cn, proxyImage, handleImageError } from '@/lib/utils';

export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>();
  const animeId = id ? parseInt(id) : undefined;

  const { data: detailData, isLoading: detailLoading } = useAnimeDetail(animeId);
  const { data: charactersData, isLoading: charactersLoading } = useAnimeCharacters(animeId, detailData?.anime?.malId);
  const { data: staffData, isLoading: staffLoading } = useAnimeStaff(animeId, detailData?.anime?.malId);

  const { addToList, removeFromList, getStatus } = useUserList();

  const anime = detailData?.anime;
  const characters = charactersData?.characters || [];
  const staff = staffData?.staff || [];
  const dataSource = detailData?.source || 'anilist';

  // Update meta tags for social sharing
  const metaTags = anime ? getAnimeMetaTags(anime) : {};
  useMetaTags(metaTags);

  const handleStatusChange = (status: ListStatus) => {
    if (anime) {
      addToList(anime, status);
      toast({ title: `Status changed to ${status.replace('_', ' ')}` });
    }
  };

  const handleRemove = () => {
    if (anime) {
      removeFromList(anime.id);
      toast({ title: "Removed from your list" });
    }
  };

  if (detailLoading) {
    return (
      <div className="min-h-screen bg-[#0c1324]">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#0c1324]">
        <Header />
        <div className="px-[3.5rem] py-16 text-center">
          <h1 className="text-2xl font-bold mb-4 text-[#dce1fb]">Anime not found</h1>
          <Link to="/">
            <button className="bg-[#f97316] text-[#582200] px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const title = getDisplayTitle(anime);
  const status = getStatus(anime.id);

  return (
    <div className="min-h-screen bg-[#0c1324]">
      <Header />

      {/* Cinematic Hero Section - shorter, with poster */}
      <section className="relative h-[70vh] max-h-[700px] w-full overflow-hidden">
        {/* Banner background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={proxyImage(anime.bannerImage || anime.coverImage.large)}
            alt=""
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324] via-[#0c1324]/60 to-[#0c1324]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1324]/80 via-transparent to-transparent" />
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 z-10 flex items-end">
          <div className="w-full px-6 md:px-[3.5rem] pb-16 md:pb-20 max-w-[1400px] mx-auto">
            {/* Back link */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-[#dce1fb] transition-colors mb-8 text-xs tracking-widest uppercase font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Discover
            </Link>

            <div className="flex gap-8 md:gap-12 items-end">
              {/* Poster image */}
              <div className="hidden md:block flex-shrink-0">
                <div className="w-48 lg:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <img
                    src={proxyImage(anime.coverImage.large)}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </div>
              </div>

              {/* Title and meta */}
              <div className="flex-1 min-w-0">
                {/* Labels */}
                <p className="text-[0.65rem] tracking-[0.25em] font-black uppercase text-[#d0bcff] mb-4">
                  {anime.format} / {anime.season ? `${anime.season} ${anime.seasonYear}` : anime.seasonYear || 'N/A'}
                </p>

                {/* Title */}
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-[0.9] text-[#dce1fb] mb-6 uppercase"
                >
                  {title}
                </h1>

                {/* Genres inline */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {anime.genres.slice(0, 4).map(genre => (
                    <span
                      key={genre}
                      className="px-3 py-1 rounded-full text-[0.6rem] font-black tracking-[0.15em] uppercase bg-white/8 text-[#dce1fb]/70 border border-white/5"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-4">
                  <ListStatusDropdown
                    currentStatus={status as ListStatus | undefined}
                    onStatusChange={handleStatusChange}
                    onRemove={status ? handleRemove : undefined}
                    variant="button"
                    size="lg"
                    className=""
                  />
                  {anime.trailerUrl && (
                    <a
                      href={anime.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-transparent text-[#dce1fb] px-8 py-4 rounded-full font-bold text-base border border-white/10 hover:bg-[#23293c] hover:border-white/20 transition-all duration-300 hover:scale-105"
                    >
                      <Play className="w-5 h-5" />
                      Watch Trailer
                    </a>
                  )}
                  <AnimeShareButton
                    anime={anime}
                    variant="button"
                    size="lg"
                    className="bg-transparent text-[#dce1fb] px-8 py-4 rounded-full font-bold text-base border border-white/10 hover:bg-[#23293c] hover:border-white/20 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Widgets */}
      <section className="px-6 md:px-[3.5rem] -mt-8 relative z-20 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {/* Score */}
          <div className="bg-[#151b2d]/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl flex flex-col justify-between min-h-[180px] border border-white/5" style={{ borderLeft: '3px solid #f97316' }}>
            <Star className="w-8 h-8 text-[#f97316]" />
            <div>
              <div className="text-3xl md:text-4xl font-black text-[#dce1fb]">
                {anime.averageScore || 'N/A'}
                {anime.averageScore && <span className="text-lg font-medium text-[#e0c0b1]">%</span>}
              </div>
              <div className="text-[0.6rem] tracking-[0.2em] font-bold uppercase text-[#e0c0b1] mt-2">Finishability</div>
            </div>
          </div>

          {/* Energy Level */}
          <div className="bg-[#151b2d]/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl flex flex-col justify-between min-h-[180px] border border-white/5" style={{ borderLeft: '3px solid #d0bcff' }}>
            <svg className="w-8 h-8 text-[#d0bcff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            <div>
              <div className="text-3xl md:text-4xl font-black text-[#dce1fb] capitalize">{anime.energyLevel || 'Unknown'}</div>
              <div className="text-[0.6rem] tracking-[0.2em] font-bold uppercase text-[#e0c0b1] mt-2">Energy Output</div>
            </div>
          </div>

          {/* Tear Risk */}
          <div className="bg-[#151b2d]/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl flex flex-col justify-between min-h-[180px] border border-white/5" style={{ borderLeft: '3px solid #ffb4ab' }}>
            <svg className="w-8 h-8 text-[#ffb4ab]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
            <div>
              <div className="text-3xl md:text-4xl font-black text-[#dce1fb] capitalize">{anime.tearRisk || 'Unknown'}</div>
              <div className="text-[0.6rem] tracking-[0.2em] font-bold uppercase text-[#e0c0b1] mt-2">Tear Risk</div>
            </div>
          </div>

          {/* Setting */}
          <div className="bg-[#151b2d]/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl flex flex-col justify-between min-h-[180px] border border-white/5" style={{ borderLeft: '3px solid #93ccff' }}>
            <svg className="w-8 h-8 text-[#93ccff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20M4 20V8l8-6 8 6v12" /><path d="M9 20v-5h6v5" /></svg>
            <div>
              <div className="text-3xl md:text-4xl font-black text-[#dce1fb] capitalize">{anime.modernity?.setting || 'Unknown'}</div>
              <div className="text-[0.6rem] tracking-[0.2em] font-bold uppercase text-[#e0c0b1] mt-2">Setting Type</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Curator's Note - Synopsis & Production (2-col) */}
      <section className="py-24 md:py-32 px-6 md:px-[3.5rem] max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20">
          {/* Synopsis */}
          <div className="md:col-span-7">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#dce1fb]">The Curator's Note</h2>
            <p className="text-lg md:text-xl leading-[1.8] text-[#e0c0b1] font-light whitespace-pre-line">
              {anime.description?.replace(/<[^>]*>/g, '') || 'No synopsis available.'}
            </p>

            {/* Genre chips */}
            <div className="mt-10 flex flex-wrap gap-3">
              {anime.genres.map(genre => (
                <span
                  key={genre}
                  className="bg-[#23293c] px-5 py-2 rounded-full text-[0.65rem] font-black tracking-[0.15em] uppercase text-[#dce1fb]"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Tags */}
            {anime.tags && anime.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {anime.tags.slice(0, 8).map(tag => (
                  <span
                    key={tag.name}
                    className="curator-chip text-[#e0c0b1]"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Production Specs */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(7,13,31,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="px-8 pt-8 pb-2">
                <h3 className="text-[0.65rem] tracking-[0.25em] font-black uppercase text-[#d0bcff]">Production Specs</h3>
              </div>
              <div className="px-8 pb-8">
                <div className="space-y-1">
                  {anime.studios?.nodes && anime.studios.nodes.length > 0 && (
                    <div className="flex justify-between items-center py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-sm text-[#e0c0b1]">Studio</span>
                      <span className="font-bold text-sm text-[#dce1fb]">{anime.studios.nodes.map(s => s.name).join(', ')}</span>
                    </div>
                  )}
                  {anime.source && (
                    <div className="flex justify-between items-center py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-sm text-[#e0c0b1]">Source</span>
                      <span className="font-bold text-sm text-[#dce1fb]">{anime.source}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-sm text-[#e0c0b1]">Format</span>
                    <span className="font-bold text-sm text-[#dce1fb]">{anime.format} / {formatEpisodes(anime)}</span>
                  </div>
                  {anime.duration && (
                    <div className="flex justify-between items-center py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-sm text-[#e0c0b1]">Duration</span>
                      <span className="font-bold text-sm text-[#dce1fb]">{anime.duration} min/ep</span>
                    </div>
                  )}
                  {anime.status && (
                    <div className="flex justify-between items-center py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-sm text-[#e0c0b1]">Status</span>
                      <span className="font-bold text-sm text-[#dce1fb]">{anime.status.replace('_', ' ')}</span>
                    </div>
                  )}
                  {anime.popularity && (
                    <div className="flex justify-between items-center py-3.5">
                      <span className="text-sm text-[#e0c0b1]">Popularity</span>
                      <span className="font-bold text-sm text-[#dce1fb]">#{anime.popularity}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Meta info cards */}
            <div className="grid grid-cols-2 gap-4">
              {anime.seasonYear && (
                <div className="rounded-xl p-5 text-center border border-white/5" style={{ background: 'rgba(21,27,45,0.6)' }}>
                  <Calendar className="w-5 h-5 text-[#93ccff] mx-auto mb-2" />
                  <div className="text-sm font-bold text-[#dce1fb]">{anime.season} {anime.seasonYear}</div>
                  <div className="text-[0.6rem] tracking-[0.15em] font-bold uppercase text-[#e0c0b1] mt-1">Season</div>
                </div>
              )}
              {anime.members && (
                <div className="rounded-xl p-5 text-center border border-white/5" style={{ background: 'rgba(21,27,45,0.6)' }}>
                  <Users className="w-5 h-5 text-[#d0bcff] mx-auto mb-2" />
                  <div className="text-sm font-bold text-[#dce1fb]">{(anime.members / 1000).toFixed(0)}K</div>
                  <div className="text-[0.6rem] tracking-[0.15em] font-bold uppercase text-[#e0c0b1] mt-1">Members</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Vibes */}
      {anime.vibeMeter && anime.vibeMeter.length > 0 && (
        <section className="px-6 md:px-[3.5rem] py-8 max-w-[1400px] mx-auto">
          <h3 className="text-[0.65rem] tracking-[0.2em] font-black uppercase text-slate-500 mb-6">Vibe Meter</h3>
          <div className="flex flex-wrap gap-3">
            {anime.vibeMeter.map((vibe, idx) => (
              <span
                key={vibe}
                className={cn(
                  "vibe-chip",
                  idx === 0 ? "vibe-chip-primary" : idx === 1 ? "vibe-chip-secondary" : "vibe-chip-tertiary"
                )}
              >
                {vibe}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Streaming Links Section */}
      {anime.streamingLinks && anime.streamingLinks.length > 0 && (
        <section className="py-20 px-6 md:px-[3.5rem] bg-[#151b2d]/30">
          <h2 className="text-[0.65rem] tracking-[0.25em] font-black uppercase text-[#e0c0b1] mb-12 text-center">Available To Stream On</h2>
          <StreamingLinks streamingLinks={anime.streamingLinks} />
        </section>
      )}

      {/* Trailers Section */}
      {anime.trailers && anime.trailers.length > 0 && (
        <TrailerSection trailers={anime.trailers} />
      )}

      {/* Characters */}
      {(characters.length > 0 || charactersLoading) && (
        <section className="px-6 md:px-[3.5rem] py-16 max-w-[1400px] mx-auto">
          <h2 className="text-headline text-[#dce1fb] mb-10">Characters & Voice Actors</h2>
          {charactersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="surface-low rounded-xl p-4 flex items-center gap-4 animate-pulse">
                  <div className="w-14 h-14 rounded-full bg-[#23293c]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-[#23293c] rounded" />
                    <div className="h-3 w-16 bg-[#23293c] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map(char => (
                <div key={char.character.id} className="editorial-card p-4 flex items-center gap-4">
                  <img
                    src={proxyImage(char.character.image)}
                    alt={char.character.name}
                    className="w-14 h-14 rounded-full object-cover"
                    loading="lazy"
                    onError={handleImageError}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#dce1fb] truncate">{char.character.name}</p>
                    <p className="text-label text-[#e0c0b1]">{char.role}</p>
                  </div>
                  {char.voiceActor && (
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className="text-sm text-[#dce1fb] truncate">{char.voiceActor.name}</p>
                        <p className="text-label text-[#e0c0b1]">{char.voiceActor.language}</p>
                      </div>
                      <img
                        src={proxyImage(char.voiceActor.image)}
                        alt={char.voiceActor.name}
                        className="w-10 h-10 rounded-full object-cover"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Staff */}
      {(staff.length > 0 || staffLoading) && (
        <section className="px-6 md:px-[3.5rem] py-16 max-w-[1400px] mx-auto">
          <h2 className="text-headline text-[#dce1fb] mb-10">Staff</h2>
          {staffLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="surface-low rounded-xl p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-[#23293c]" />
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-[#23293c] rounded" />
                    <div className="h-3 w-14 bg-[#23293c] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {staff.map(s => (
                <div key={s.person.id} className="editorial-card p-4 flex items-center gap-3">
                  <img
                    src={proxyImage(s.person.image)}
                    alt={s.person.name}
                    className="w-12 h-12 rounded-full object-cover"
                    loading="lazy"
                    onError={handleImageError}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-[#dce1fb] truncate text-sm">{s.person.name}</p>
                    <p className="text-label text-[#e0c0b1] truncate">{s.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Similar Anime */}
      <EnhancedSimilarAnimeSection
        sourceAnime={anime}
        malId={anime?.malId}
      />
    </div>
  );
}
