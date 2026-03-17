import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useDiagnosis } from '../../context/DiagnosisContext';
import LandingScreen from './LandingScreen';
import ChatScreen from './ChatScreen';
import ResultScreen from './ResultScreen';
import { TargetCategory, BallPerformanceGoal } from '../../types/golf';

export type ScreenState = 'landing' | 'modeSelect' | 'chat' | 'loading' | 'result';
export type DiagnosisMode = 'lite' | 'pro';

export interface DiagnosisAnswers {
  // Lite & Common
  score: number | null; // Changed to number for slider support
  headSpeed: number;
  concern: string | null;
  trajectory: string | null;
  gender: string | null;
  age: string | null;
  annualRounds: string | null;
  currentBallBrand: string | null;
  currentBallModel: string | null;
  approachStyle: string | null;
  putterFeel: string | null;
  priority: string[] | null; // Multiple selection
  
  // Pro Specific
  missTendencies: string[] | null;
  swingTempo: string | null;
  visualPreference: string[] | null;
  ballHardness: number;
  shotData?: {
    carry?: string;
    total?: string;
    spinRate?: string;
    launchAngle?: string;
  };
  useMyBag?: boolean;
  favoriteBrands: string[] | null;
}

export const BallDiagnosisApp: React.FC = () => {
  const { profile, setProfile, runDiagnosis, isAnalyzing } = useDiagnosis();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('landing');
  const [mode, setMode] = useState<DiagnosisMode>('lite');
  const [answers, setAnswers] = useState<DiagnosisAnswers>({
    score: profile.averageScore || 100,
    headSpeed: profile.headSpeed || 40,
    concern: null,
    trajectory: null,
    gender: profile.gender || null,
    age: (profile as any).age || null,
    annualRounds: (profile as any).annualRounds || null,
    currentBallBrand: (profile as any).currentBallBrand || null,
    currentBallModel: (profile as any).currentBallModel || null,
    approachStyle: null,
    putterFeel: null,
    priority: null,
    missTendencies: null,
    swingTempo: profile.swingTempo || null,
    visualPreference: null,
    ballHardness: 80,
    shotData: {
      carry: profile.measurementData?.driverCarryDistance || '200'
    },
    useMyBag: false,
    favoriteBrands: null,
  });
  const [history, setHistory] = useState<DiagnosisAnswers[]>([]);

  const handleStart = () => {
    setCurrentScreen('modeSelect');
  };

  const handleSelectMode = (selectedMode: DiagnosisMode) => {
    setMode(selectedMode);
    setCurrentScreen('chat');
  };

  const handleBackToLanding = () => {
    setCurrentScreen('landing');
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prevAnswers = history[history.length - 1];
      setAnswers(prevAnswers);
      setHistory(prev => prev.slice(0, -1));
    } else {
      setCurrentScreen('modeSelect');
    }
  };

  const handleUpdateAnswers = (newAnswers: DiagnosisAnswers) => {
    setHistory(prev => [...prev, answers]);
    setAnswers(newAnswers);
  };

  const handleDiagnose = async (finalAnswers: any) => {
    setAnswers(finalAnswers);
    
    // 1. Map all ball-specific answers to the global profile
    setProfile(prev => ({
      ...prev,
      targetCategory: TargetCategory.BALL,
      headSpeed: finalAnswers.headSpeed,
      averageScore: finalAnswers.score,
      gender: finalAnswers.gender,
      age: finalAnswers.age,
      annualRounds: finalAnswers.annualRounds,
      currentBallBrand: finalAnswers.currentBallBrand,
      currentBallModel: finalAnswers.currentBallModel,
      approachStyle: finalAnswers.approachStyle,
      ballPerformanceGoals: (finalAnswers.priority || []).map((p: string) => {
        switch(p) {
          case 'stability': return BallPerformanceGoal.CURVE_REDUCTION;
          case 'spin': return BallPerformanceGoal.MORE_SPIN;
          case 'high': return BallPerformanceGoal.HIGH_TRAJECTORY;
          case 'distance': return BallPerformanceGoal.MAX_DISTANCE;
          default: return BallPerformanceGoal.MAX_DISTANCE;
        }
      }),
      ballPreferences: {
        preferredFeel: finalAnswers.ballHardness < 65 ? 'VERY_SOFT' : finalAnswers.ballHardness < 80 ? 'SOFT' : finalAnswers.ballHardness < 90 ? 'FIRM' : 'VERY_FIRM',
        priority: finalAnswers.priority?.includes('distance') ? 'DISTANCE' : finalAnswers.priority?.includes('spin') ? 'SPIN' : 'BALANCE'
      }
    }));

    // 2. Trigger AI diagnosis
    setCurrentScreen('loading');
    try {
      await runDiagnosis();
      setCurrentScreen('result');
    } catch (error) {
      console.error("Ball diagnosis failed:", error);
      setCurrentScreen('result');
    }
  };

  const handleRestart = () => {
    setAnswers({
      score: 100,
      headSpeed: 40,
      concern: null,
      trajectory: null,
      gender: null,
      age: null,
      annualRounds: null,
      currentBallBrand: null,
      currentBallModel: null,
      approachStyle: null,
      putterFeel: null,
      priority: null,
      missTendencies: null,
      swingTempo: null,
      visualPreference: null,
      ballHardness: 80,
      shotData: {
        carry: '200'
      },
      useMyBag: false,
      favoriteBrands: null,
    });
    setHistory([]);
    setCurrentScreen('landing');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-cyan-500/30">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto min-h-screen flex flex-col">
        {currentScreen === 'landing' && (
          <LandingScreen onStart={handleStart} />
        )}

        {currentScreen === 'modeSelect' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fadeIn">
            <h2 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-8 text-center">
              診断モードを選択してください
            </h2>
            <div className="grid grid-cols-1 gap-4 w-full">
              <button
                onClick={() => handleSelectMode('lite')}
                className="group relative p-6 rounded-2xl bg-slate-800/50 border border-white/10 hover:border-cyan-500/50 transition-all text-left overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <span className="block text-cyan-400 text-xs font-bold tracking-widest uppercase mb-1">Lite Mode</span>
                  <h3 className="text-lg font-bold mb-2">簡易診断</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">4つの質問に答えるだけで、あなたに最適なボールを素早く提案します。</p>
                </div>
              </button>

              <button
                onClick={() => handleSelectMode('pro')}
                className="group relative p-6 rounded-2xl bg-slate-800/50 border border-white/10 hover:border-emerald-500/50 transition-all text-left overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <span className="block text-emerald-400 text-xs font-bold tracking-widest uppercase mb-1">Pro Mode</span>
                  <h3 className="text-lg font-bold mb-2">プロ診断</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">マイバッグのデータや詳細なプレースタイルを考慮し、最高精度の分析を行います。</p>
                </div>
              </button>
            </div>
            <button 
              onClick={handleBackToLanding}
              className="mt-8 text-slate-500 text-sm hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} /> ランディングへ戻る
            </button>
          </div>
        )}
        
        {currentScreen === 'chat' && (
          <ChatScreen 
            onComplete={handleDiagnose} 
            currentAnswers={answers} 
            onBack={handleBack} 
            onUpdateAnswers={handleUpdateAnswers}
            mode={mode}
          />
        )}
        
        {(isAnalyzing || currentScreen === 'loading') && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fadeIn">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-t-2 border-r-2 border-cyan-400 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-t-2 border-l-2 border-emerald-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
              </div>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
              AIがあなたのデータを解析中...
            </h2>
            <p className="text-slate-400 text-sm">最適なボールをマッチングしています</p>
          </div>
        )}
        
        {currentScreen === 'result' && (
          <ResultScreen answers={answers} onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
};

export default BallDiagnosisApp;

