import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface LandingScreenProps {
  onStart: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen animate-fadeIn">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto text-center space-y-12">
        
        {/* Logo Section */}
        <div className="space-y-2">
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse-slow"></div>
            <h1 className="relative font-eng text-6xl md:text-8xl font-black tracking-tight text-white drop-shadow-lg">
              My Bag <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Pro</span>
            </h1>
          </div>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-slate-500 to-transparent mx-auto mt-4 mb-2"></div>
          <p className="text-slate-300 font-medium tracking-widest text-xs uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            AIゴルフボール診断
            <Sparkles className="w-3 h-3 text-emerald-400" />
          </p>
        </div>

        {/* Hero Copy */}
        <div className="space-y-6 pt-4">
          <h2 className="text-3xl md:text-5xl font-black leading-tight text-white">
            あなたのスイングに、<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">プロの選択を。</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            たった数問の質問に答えるだけで、<br className="hidden md:block" />
            AIがあなたに最適な最新ツアーボールを導き出します。
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full max-w-md pt-8">
          <button
            onClick={onStart}
            className="group relative w-full flex items-center justify-center gap-4 py-5 px-10 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-black text-xl shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative z-10">無料で診断スタート</span>
            <ArrowRight className="relative z-10 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="mt-4 text-xs text-slate-500 font-medium">所要時間: 約30秒 / 登録不要 / 完全無料</p>
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;

