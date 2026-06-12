import React from 'react';
import { Compass, HelpCircle, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  navigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />

      {/* Decorative Icon */}
      <div className="relative mb-6">
        <div className="h-16 w-16 rounded-2xl bg-zinc-900/50 border border-white/[0.08] flex items-center justify-center text-zinc-400 shadow-xl backdrop-blur-sm animate-pulse">
          <Compass size={28} className="text-blue-400" />
        </div>
        <div className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 items-center justify-center text-[9px] font-bold text-white">
            <HelpCircle size={10} />
          </span>
        </div>
      </div>

      {/* Text Content */}
      <h1 className="text-5xl font-extrabold font-mono tracking-tight text-white mb-2 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
        404
      </h1>
      <h2 className="text-base font-bold text-zinc-200 mb-2">
        Lost in Code Space
      </h2>
      <p className="text-xs text-zinc-500 max-w-sm mb-8 leading-relaxed">
        The page you are looking for does not exist, has been archived, or was moved to another directory.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/submit')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-blue-900/20"
        >
          <ArrowLeft size={13} />
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate('/repositories')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-white/[0.08] bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer backdrop-blur-sm"
        >
          View Repositories
        </button>
      </div>
    </div>
  );
};
