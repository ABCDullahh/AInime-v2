import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, Compass } from "lucide-react";
import { handleImageError } from "@/lib/utils";

// Decorative Kitsu CDN images for the 404 page
const LOST_ANIME_COVERS = [
  { id: 1, name: 'Cowboy Bebop' },
  { id: 3, name: 'Trigun' },
  { id: 13, name: 'Samurai Champloo' },
  { id: 6, name: 'Fullmetal Alchemist' },
  { id: 8271, name: 'Steins;Gate' },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0c1324] text-[#dce1fb] relative overflow-hidden flex flex-col items-center justify-center px-6">
      {/* Atmospheric background orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px]"
          style={{
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[600px] h-[600px]"
          style={{
            background: 'radial-gradient(circle, rgba(208, 188, 255, 0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Scattered floating anime covers as decorative background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {LOST_ANIME_COVERS.map((anime, idx) => (
          <div
            key={anime.id}
            className="absolute rounded-xl overflow-hidden opacity-[0.07] shadow-2xl"
            style={{
              width: `${100 + idx * 20}px`,
              aspectRatio: '3/4',
              top: `${8 + (idx * 18) % 70}%`,
              left: `${5 + (idx * 22) % 80}%`,
              transform: `rotate(${-20 + idx * 10}deg)`,
              animation: `float-${idx % 3} ${6 + idx * 2}s ease-in-out infinite`,
            }}
          >
            <img
              src={`https://media.kitsu.app/anime/poster_images/${anime.id}/large.jpg`}
              alt={anime.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl">
        {/* Giant 404 with compass icon */}
        <div className="relative mb-8 inline-block">
          <h1 className="text-[12rem] md:text-[16rem] font-black tracking-[-0.08em] leading-none text-[#dce1fb]/5 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[#f97316]/10 flex items-center justify-center border border-[#f97316]/20">
              <Compass className="w-12 h-12 text-[#f97316] animate-[spin_8s_linear_infinite]" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 uppercase">
          Lost in the <span className="italic font-light text-[#f97316]">Void</span>
        </h2>

        <p className="text-lg text-slate-400 font-light mb-4 max-w-md mx-auto">
          This page has vanished into another dimension.
          Even the best navigators lose their way sometimes.
        </p>

        <p className="text-sm text-slate-600 mb-12">
          Route not found: <code className="text-[#d0bcff] bg-[#1a1f33] px-2 py-1 rounded text-xs">{location.pathname}</code>
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-3 bg-[#f97316] text-[#582200] px-8 py-4 rounded-full font-bold tracking-tight hover:scale-105 active:scale-95 transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]"
          >
            <Home className="w-5 h-5" />
            Return Home
          </Link>
          <Link
            to="/ai"
            className="flex items-center justify-center gap-3 bg-[#23293c] text-[#dce1fb] px-8 py-4 rounded-full font-bold tracking-tight hover:bg-[#2e3447] transition-all"
          >
            <Search className="w-5 h-5" />
            AI Search
          </Link>
        </div>
      </div>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float-0 {
          0%, 100% { transform: rotate(-20deg) translateY(0); }
          50% { transform: rotate(-18deg) translateY(-15px); }
        }
        @keyframes float-1 {
          0%, 100% { transform: rotate(-10deg) translateY(0); }
          50% { transform: rotate(-8deg) translateY(-20px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(2deg) translateY(-12px); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
