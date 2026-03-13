import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface LandingScreenProps {
  onStart: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen animate-fadeIn">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto text-center space-y-8">
        
        {/* Logo Section */}
        <div className="space-y-2">
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse-slow"></div>
            <h1 className="relative font-eng text-5xl font-black tracking-tight text-white drop-shadow-lg">
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
        <div className="space-y-4 pt-4">
          <h2 className="text-2xl font-bold leading-tight">
            あなたのスイングに、<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">プロの選択を。</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            4つの質問に答えるだけで、<br />
            AIがあなたに最適なツアーボールを導き出します。
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full pt-8">
          <button
            onClick={onStart}
            className="group relative w-full flex items-center justify-center gap-3 py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] active:scale-95 transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative z-10">無料で診断スタート</span>
            <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="mt-4 text-xs text-slate-500 font-medium">所要時間: 約30秒 / 登録不要 / 完全無料</p>
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;

