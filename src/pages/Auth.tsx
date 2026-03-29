import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { toast } from '@/hooks/use-toast';
import { cn, handleImageError } from '@/lib/utils';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
});

// Atmospheric Kitsu anime covers for background decoration
const AUTH_BG_ANIME = [
  { id: 1, name: 'Cowboy Bebop' },
  { id: 6, name: 'Fullmetal Alchemist' },
  { id: 11, name: 'Naruto' },
  { id: 12, name: 'One Piece' },
  { id: 7442, name: 'Attack on Titan' },
  { id: 8271, name: 'Steins;Gate' },
];

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signIn, signUp, signInWithGoogle } = useSimpleAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const validate = () => {
    try {
      const data: { email: string; password: string; displayName?: string } = { email, password };
      if (isSignUp && displayName) data.displayName = displayName;
      authSchema.parse(data);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const { error } = isSignUp
        ? await signUp(email, password, displayName || undefined)
        : await signIn(email, password);

      if (error) {
        toast({ title: isSignUp ? 'Sign up failed' : 'Sign in failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: isSignUp ? 'Account created!' : 'Welcome back!' });
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        if (!error.message.includes('cancelled')) {
          toast({ title: 'Google sign in failed', description: error.message, variant: 'destructive' });
        }
      } else {
        toast({ title: 'Welcome!' });
        navigate('/');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0c1324] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1324] text-[#dce1fb] relative overflow-hidden">
      {/* Atmospheric Background Layers */}
      <div className="fixed inset-0 z-0">
        {/* Grain overlay */}
        <div className="grain-overlay absolute inset-0" />
        {/* Violet orb top-left */}
        <div
          className="absolute -top-48 -left-48 w-[800px] h-[800px]"
          style={{
            background: 'radial-gradient(circle, rgba(208, 188, 255, 0.15) 0%, rgba(12, 19, 36, 0) 70%)',
          }}
        />
        {/* Coral orb bottom-right */}
        <div
          className="absolute -bottom-48 -right-48 w-[800px] h-[800px]"
          style={{
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, rgba(12, 19, 36, 0) 70%)',
          }}
        />
      </div>

      {/* Subtle anime silhouette collage behind the form area */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        {AUTH_BG_ANIME.map((anime, idx) => (
          <div
            key={anime.id}
            className="absolute overflow-hidden rounded-2xl"
            style={{
              width: `${160 + idx * 30}px`,
              aspectRatio: '3/4',
              opacity: 0.04,
              top: `${5 + (idx * 16) % 75}%`,
              right: `${2 + (idx * 14) % 50}%`,
              transform: `rotate(${-12 + idx * 7}deg)`,
              filter: 'grayscale(100%) brightness(1.3)',
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

      {/* Main Auth Canvas */}
      <main className="relative z-10 min-h-screen flex flex-col lg:flex-row items-center justify-center lg:justify-between px-8 lg:px-[10rem] py-20 gap-16">
        {/* Hero Branding Side */}
        <div className="max-w-3xl flex flex-col items-start text-left">
          <div className="mb-6">
            <span className="text-xs tracking-[0.2em] uppercase text-[#f97316] font-bold">
              The Digital Curator
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-[0.9] text-[#dce1fb]">
            {isSignUp ? (
              <>
                Begin your <br />
                <span className="italic font-light text-[#d0bcff]">journey.</span>
              </>
            ) : (
              <>
                Welcome <br />
                <span className="italic font-light text-[#d0bcff]">back.</span>
              </>
            )}
          </h1>
          <p className="mt-8 text-xl text-slate-400 font-light max-w-md leading-relaxed">
            {isSignUp
              ? 'Create your digital curated world. A space where anime meets clinical precision.'
              : 'Step back into your digital curated world. A space where anime meets clinical precision.'}
          </p>
        </div>

        {/* Glass Auth Card */}
        <div className="w-full max-w-md relative">
          {/* Faded anime art behind the glass card */}
          <div className="absolute -inset-8 z-0 pointer-events-none overflow-hidden rounded-[3rem] opacity-[0.06]">
            <div className="grid grid-cols-2 gap-1 h-full">
              {AUTH_BG_ANIME.slice(0, 4).map((anime) => (
                <div key={anime.id} className="overflow-hidden">
                  <img
                    src={`https://media.kitsu.app/anime/poster_images/${anime.id}/small.jpg`}
                    alt={anime.name}
                    className="w-full h-full object-cover blur-[1px]"
                    onError={handleImageError}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative z-10 p-10 lg:p-12 rounded-[2rem]"
            style={{
              backgroundColor: 'rgba(12, 19, 36, 0.4)',
              backdropFilter: 'blur(60px)',
              WebkitBackdropFilter: 'blur(60px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#dce1fb] text-[#0c1324] px-6 py-4 rounded-full font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="currentColor"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="currentColor"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-10 flex items-center">
              <div className="flex-grow h-[1px] bg-[#584237]/20" />
              <span className="px-4 text-[0.65rem] tracking-[0.2em] text-slate-500 uppercase">
                or use email
              </span>
              <div className="flex-grow h-[1px] bg-[#584237]/20" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {isSignUp && (
                <div className="relative group">
                  <label className="block text-[0.65rem] tracking-[0.15em] uppercase text-slate-500 mb-1 group-focus-within:text-[#f97316] transition-colors">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your curator name"
                    className={cn(
                      "w-full bg-transparent border-t-0 border-x-0 border-b px-0 py-3 text-[#dce1fb] focus:ring-0 focus:border-[#f97316] transition-all outline-none placeholder:text-slate-700",
                      errors.displayName
                        ? "border-red-500"
                        : "border-[#584237]/30"
                    )}
                  />
                  {errors.displayName && (
                    <p className="text-xs text-red-400 mt-1">{errors.displayName}</p>
                  )}
                </div>
              )}

              <div className="relative group">
                <label className="block text-[0.65rem] tracking-[0.15em] uppercase text-slate-500 mb-1 group-focus-within:text-[#f97316] transition-colors">
                  Identification
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="curator@ainime.io"
                  className={cn(
                    "w-full bg-transparent border-t-0 border-x-0 border-b px-0 py-3 text-[#dce1fb] focus:ring-0 focus:border-[#f97316] transition-all outline-none placeholder:text-slate-700",
                    errors.email
                      ? "border-red-500"
                      : "border-[#584237]/30"
                  )}
                />
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email}</p>
                )}
              </div>

              <div className="relative group">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[0.65rem] tracking-[0.15em] uppercase text-slate-500 group-focus-within:text-[#f97316] transition-colors">
                    Access Key
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="text-[0.65rem] tracking-[0.1em] text-[#d0bcff] hover:text-[#c4abff] transition-colors uppercase"
                    >
                      Lost Access?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                    className={cn(
                      "w-full bg-transparent border-t-0 border-x-0 border-b px-0 py-3 pr-10 text-[#dce1fb] focus:ring-0 focus:border-[#f97316] transition-all outline-none placeholder:text-slate-700",
                      errors.password
                        ? "border-red-500"
                        : "border-[#584237]/30"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#dce1fb] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1">{errors.password}</p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#f97316] text-[#582200] font-bold py-5 rounded-full hover:shadow-[0_0_40px_rgba(249,115,22,0.3)] transition-all duration-500 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSignUp ? 'Begin Onboarding' : 'Enter the Sanctuary'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                {isSignUp ? 'Already a curator? ' : 'New to the collection? '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrors({});
                  }}
                  className="text-[#dce1fb] font-semibold hover:text-[#f97316] transition-colors ml-1"
                >
                  {isSignUp ? 'Enter the Sanctuary' : 'Begin Onboarding'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Aesthetic Footer Overlay */}
      <footer className="fixed bottom-0 w-full py-10 px-6 md:px-[3.5rem] flex flex-col md:flex-row justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-6 opacity-30">
          <span className="text-[0.6rem] tracking-[0.3em] uppercase text-slate-500">
            System Protocol 4.0.2
          </span>
          <span className="text-[0.6rem] tracking-[0.3em] uppercase text-slate-500">
            Encrypted Session
          </span>
        </div>
        <div className="mt-4 md:mt-0 opacity-30">
          <span className="text-[0.6rem] tracking-[0.3em] uppercase text-slate-500">
            &copy; {new Date().getFullYear()} AInime. The Digital Curator.
          </span>
        </div>
      </footer>
    </div>
  );
}
