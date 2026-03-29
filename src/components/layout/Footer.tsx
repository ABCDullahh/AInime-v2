import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#151b2d] w-full py-20 flex flex-col items-center justify-center px-[3.5rem]">
      <div className="text-6xl font-black text-slate-800/50 mb-8 block text-center select-none">
        AInime
      </div>
      <div className="flex gap-12 mb-8">
        <Link
          to="/about"
          className="text-[0.75rem] tracking-[0.15em] uppercase text-slate-500 hover:text-orange-500 italic transition-all"
        >
          About
        </Link>
        <Link
          to="/privacy"
          className="text-[0.75rem] tracking-[0.15em] uppercase text-slate-500 hover:text-orange-500 italic transition-all"
        >
          Privacy
        </Link>
        <Link
          to="/terms"
          className="text-[0.75rem] tracking-[0.15em] uppercase text-slate-500 hover:text-orange-500 italic transition-all"
        >
          Terms
        </Link>
      </div>
      <a
        href="https://github.com/ABCDullahh/AInime-v2"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-[0.75rem] tracking-[0.15em] uppercase text-slate-500 hover:text-orange-500 transition-all mb-12"
      >
        <Github className="w-4 h-4" />
        GitHub
      </a>
      <p className="text-[0.75rem] tracking-[0.15em] uppercase text-slate-600">
        &copy; {new Date().getFullYear()} AInime. The Digital Curator.
      </p>
    </footer>
  );
}
