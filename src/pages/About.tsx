import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/layout/Footer';
import { Sparkles, Network, Calendar, Heart, Github, ExternalLink } from 'lucide-react';

const techCards = [
  {
    icon: Sparkles,
    title: 'AI Search',
    description: 'Natural language anime discovery powered by Google Gemini. Describe what you want in any language and let AI curate results.',
    accent: 'orange',
  },
  {
    icon: Network,
    title: 'Dual API',
    description: 'Jikan + AniList with automatic fallback. If one source is down, we seamlessly switch to the other.',
    accent: 'purple',
  },
  {
    icon: Calendar,
    title: 'Real-time Calendar',
    description: 'Broadcast schedules with day-by-day filtering. Never miss an episode from your favorite seasonal anime.',
    accent: 'blue',
  },
  {
    icon: Heart,
    title: 'Personal Curation',
    description: 'Track, rate, and organize your anime journey. Build tier lists. Get personalized AI recommendations.',
    accent: 'orange',
  },
];

const credits = [
  { name: 'Jikan API', description: 'MyAnimeList data via open REST API' },
  { name: 'AniList', description: 'GraphQL anime database with rich metadata' },
  { name: 'Kitsu', description: 'High-quality poster images via CDN' },
  { name: 'Firebase', description: 'Authentication and user management' },
  { name: 'Google Gemini', description: 'AI-powered natural language search' },
];

function getAccentStyles(accent: string) {
  switch (accent) {
    case 'orange':
      return {
        bg: 'rgba(249, 115, 22, 0.08)',
        iconColor: 'text-[#f97316]',
      };
    case 'purple':
      return {
        bg: 'rgba(208, 188, 255, 0.08)',
        iconColor: 'text-[#d0bcff]',
      };
    case 'blue':
      return {
        bg: 'rgba(147, 204, 255, 0.08)',
        iconColor: 'text-[#93ccff]',
      };
    default:
      return {
        bg: 'rgba(249, 115, 22, 0.08)',
        iconColor: 'text-[#f97316]',
      };
  }
}

export default function About() {
  return (
    <div className="min-h-screen bg-[#0c1324] text-[#dce1fb]">
      <Header />

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 md:px-[3.5rem] max-w-5xl mx-auto">
        <p className="text-label text-slate-500 mb-6">THE DIGITAL CURATOR</p>
        <h1 className="text-display mb-6">
          ABOUT{' '}
          <span className="italic font-light text-[#f97316]">AInime</span>
        </h1>
        <p className="text-xl text-slate-400 font-light max-w-2xl leading-relaxed">
          Where artificial intelligence meets the art of anime discovery.
        </p>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 md:px-[3.5rem] max-w-5xl mx-auto">
        <p className="text-label text-[#f97316] mb-4">01</p>
        <h2 className="text-headline mb-8">Our Mission</h2>
        <div className="grid md:grid-cols-2 gap-12">
          <p className="text-body-editorial text-lg leading-relaxed">
            Anime is vast. With thousands of titles spanning decades, finding your next
            obsession shouldn't feel like searching for a needle in a haystack. We built
            AInime to be the curator you never had — one that understands context, mood,
            and taste.
          </p>
          <p className="text-body-editorial text-lg leading-relaxed">
            Ask in plain language. "Something like Cowboy Bebop but more melancholic."
            "A short anime I can finish this weekend." "Anime yang bikin nangis." Our AI
            understands intent, not just keywords, and translates it into meaningful
            discovery.
          </p>
        </div>
      </section>

      {/* Technology */}
      <section className="py-20 px-6 md:px-[3.5rem] max-w-5xl mx-auto">
        <p className="text-label text-[#d0bcff] mb-4">02</p>
        <h2 className="text-headline mb-12">The Technology</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {techCards.map((card) => {
            const styles = getAccentStyles(card.accent);
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="editorial-card p-8 flex flex-col gap-5"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: styles.bg }}
                >
                  <Icon className={`w-6 h-6 ${styles.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold tracking-tight">{card.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Open Source */}
      <section className="py-20 px-6 md:px-[3.5rem] max-w-5xl mx-auto">
        <p className="text-label text-[#93ccff] mb-4">03</p>
        <h2 className="text-headline mb-8">Open Source</h2>
        <div className="editorial-card p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1">
            <p className="text-body-editorial text-lg leading-relaxed mb-6">
              AInime is fully open source. Every line of code, every design decision, every
              API integration is available for you to inspect, learn from, and contribute to.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Built with passion by{' '}
              <span className="text-[#f97316] font-medium">ABCDullahh</span>
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <a
                href="https://github.com/ABCDullahh/AInime-v2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#f97316] text-[#582200] px-6 py-3 rounded-full font-bold text-sm tracking-tight hover:shadow-[0_0_40px_rgba(249,115,22,0.3)] transition-all"
              >
                <Github className="w-5 h-5" />
                View on GitHub
                <ExternalLink className="w-4 h-4" />
              </a>
              <span className="vibe-chip">MIT License</span>
            </div>
          </div>
        </div>
      </section>

      {/* Credits */}
      <section className="py-20 px-6 md:px-[3.5rem] max-w-5xl mx-auto">
        <p className="text-label text-slate-500 mb-4">04</p>
        <h2 className="text-headline mb-12">Credits</h2>
        <div className="space-y-1">
          {credits.map((credit, idx) => (
            <div
              key={credit.name}
              className="flex items-baseline justify-between py-5 group"
              style={{
                borderBottom: idx < credits.length - 1 ? '1px solid rgba(88, 66, 55, 0.15)' : 'none',
              }}
            >
              <span className="font-bold tracking-tight text-lg group-hover:text-[#f97316] transition-colors">
                {credit.name}
              </span>
              <span className="text-sm text-slate-500 text-right">
                {credit.description}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Back link */}
      <section className="py-16 px-6 md:px-[3.5rem] max-w-5xl mx-auto text-center">
        <Link
          to="/"
          className="text-sm text-slate-500 hover:text-[#f97316] transition-colors tracking-wide uppercase"
        >
          Back to Discover
        </Link>
      </section>

      <Footer />
    </div>
  );
}
