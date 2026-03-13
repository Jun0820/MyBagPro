import React, { useEffect, useState, useRef } from 'react';
import type { DiagnosisAnswers } from './BallDiagnosisApp';
import { Share2, ArrowRight, RotateCcw, Crosshair, Wind, Flag, Layers } from 'lucide-react';
import { useDiagnosis } from '../../context/DiagnosisContext';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { calculateDiagnosis } from '../../data/golfBalls';
import { BALL_MASTER_DATA } from '../../data/ballMasterData';

interface ResultScreenProps {
  answers: DiagnosisAnswers;
  onRestart: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ answers, onRestart }) => {
  const navigate = useNavigate();
  const { profile } = useDiagnosis();
  const [showCard, setShowCard] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Consider Pro Mode / MyBag context
  const isProMode = answers.useMyBag && profile.myBag && profile.myBag.clubs.length > 0;
  
  // Real diagnosis logic (2026 models)
  const diagnosisResult = calculateDiagnosis(answers);
  const { ball: recommendedBall, matchScore } = diagnosisResult;

  useEffect(() => {
    const timer = setTimeout(() => setShowCard(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getScoreLabel = (score: number | null) => {
    if (score === null) return 'プレーヤー';
    if (score >= 120) return 'ビギナー';
    if (score >= 100) return '100切り目標';
    if (score >= 90) return '90切り目標';
    if (score >= 80) return 'シングル目標';
    return 'トップレベル';
  };

  const profileLabel = isProMode
    ? `PRO DIAGNOSIS / ${profile.name || 'USER'} / HS ${answers.headSpeed}m/s`
    : `HS ${answers.headSpeed}m/s / ${getScoreLabel(answers.score)}`;

  const getPriorityLabel = (p: string[] | null) => {
    if (!p || p.length === 0) return '性能';
    const map: Record<string, string> = {
      'stability': '直進性',
      'spin': 'スピン',
      'high': '高弾道',
      'distance': '飛距離'
    };
    return p.map(val => map[val] || val).join('・');
  };

  const getStyleLabel = (s: string | null) => {
    switch(s) {
      case 'spin': return '低く止める';
      case 'running': return '転がして寄せる';
      case 'high': return '高く上げて止める';
      default: return 'スタンダードな';
    }
  };

  const handleShare = async () => {
    if (!cardRef.current || isSharing) return;
    setIsSharing(true);

    try {
      // 1. Generate Image from DOM
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High resolution
        backgroundColor: '#0f172a', // slate-900 baseline
        logging: false,
        useCORS: true, 
      });

      // 2. Convert Canvas to Blob
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Failed to generate image');

        const file = new File([blob], 'mybagpro-diagnosis.png', { type: 'image/png' });

        // 3. Check for Web Share API support with files
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Bag Pro 診断結果',
            text: `AIが選んだ運命のボールは【${recommendedBall.name}】でした！ #MyBagPro #ゴルフボール診断 #ゴルフギア`,
            files: [file],
          });
        } else {
          // Fallback: Download the image for unsupported browsers (e.g. PC/old devices)
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'mybagpro-diagnosis.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert('結果画像をダウンロードしました。SNSに添付してシェアしてください！');
        }
      }, 'image/png');

    } catch (error) {
      console.error('Sharing failed:', error);
      alert('画像の生成に失敗しました。時間をおいて再試行してください。');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24">
      {/* Result Header */}
      <div className="text-center mb-4 animate-fadeIn">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-2 rounded-full mb-3">
          <Flag className="w-3.5 h-3.5" />
          診断完了
        </div>
      </div>

      {/* Trading Card Container (Target for html2canvas) */}
      <div 
        ref={cardRef}
        className={`mt-4 transform transition-all duration-700 relative ${showCard ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}
      >
        
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 rounded-3xl blur-md opacity-30 animate-pulse-slow"></div>
        
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
          {/* Top banner */}
          <div className="h-32 relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
            {/* Abstract pattern */}
            <div className="absolute inset-0">
              <img 
              src={recommendedBall.img} 
              alt={recommendedBall.name} 
              crossOrigin="anonymous"
              className="w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105 hover:scale-100 transition-transform duration-700"
            />
            </div>
            {/* Tag */}
            <div className="absolute top-4 right-4 z-20 bg-emerald-500/90 text-white border border-emerald-400 px-3 py-1 rounded-full text-xs font-bold font-eng shadow-lg">
              {matchScore}% MATCH
            </div>
            {/* Ball icon */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-16 h-16 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center">
              <span className="text-2xl">⛳</span>
            </div>
          </div>

          <div className="p-6 relative z-20">
            <div className="mb-6 text-center">
              <p className="text-cyan-400 font-bold text-xs mb-1 tracking-widest">{profileLabel}の為の最適解</p>
              <h2 className="text-2xl font-black font-eng tracking-tight text-white mb-2">{recommendedBall.name}</h2>
              <div className="inline-block bg-slate-800 px-3 py-1 rounded-md text-xs text-slate-300 font-medium">
                {recommendedBall.type}
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6 text-center">
              {recommendedBall.desc}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 py-4 border-t border-b border-slate-700/50 mb-6">
              <div className="text-center">
                <Wind className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                <div className="text-[10px] text-slate-400">飛距離</div>
                <div className="font-bold text-sm">LV.{recommendedBall.radar.distance}</div>
              </div>
              <div className="text-center border-l border-r border-slate-700/50">
                <RotateCcw className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
                <div className="text-[10px] text-slate-400">スピン</div>
                <div className="font-bold text-sm">LV.{recommendedBall.radar.spin}</div>
              </div>
              <div className="text-center">
                <Crosshair className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                <div className="text-[10px] text-slate-400">打感</div>
                <div className="font-bold text-sm">LV.{recommendedBall.radar.feel}</div>
              </div>
            </div>

            {/* User Profile Summary */}
            <div className={`rounded-xl p-4 flex items-start gap-3 ${isProMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/50'}`}>
              {isProMode ? <Layers className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <Flag className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />}
              <div>
                <div className={`text-xs font-bold mb-1 ${isProMode ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {isProMode ? '【プロ解析】マイバッグ統合診断' : '【解析結果】あなたのスイング傾向'}
                </div>
                 <div className="text-xs text-slate-400 leading-tight">
                  {isProMode ? (
                    <>
                      登録された{profile.myBag.clubs.length}本のクラブセッティングと、HS {answers.headSpeed}m/sのパワーを統合分析。
                      「{recommendedBall.name}」はあなたのギア構成において最も飛距離効率とスピンバランスを最大化します。
                    </>
                  ) : (
                    <>
                      「{getPriorityLabel(answers.priority)}」を重視し、
                      アプローチでは「{getStyleLabel(answers.approachStyle)}」スタイルで攻めるプレーヤーに。
                      現在の「{BALL_MASTER_DATA.find(b => b.id === answers.currentBallBrand)?.name || '不明'} / {BALL_MASTER_DATA.find(b => b.id === answers.currentBallBrand)?.models.find(m => m.id === answers.currentBallModel)?.name || '不明'}」からのアップグレードとして最適です。
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alternatives Section */}
      {(diagnosisResult.softAlternative || diagnosisResult.hardAlternative) && (
        <div className="mt-8 mb-4 animate-fadeIn" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wider">あわせてチェックしたい代替案</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {diagnosisResult.softAlternative && (
              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center group hover:bg-slate-800/60 transition-all">
                <div className="text-[10px] font-black text-cyan-400 mb-2 tracking-widest uppercase">Softer Feel</div>
                <div className="w-16 h-16 rounded-full bg-white mb-3 shadow-lg overflow-hidden flex items-center justify-center p-2">
                  <img 
                    src={diagnosisResult.softAlternative.img} 
                    alt={diagnosisResult.softAlternative.name} 
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs font-bold text-white mb-1 line-clamp-1">{diagnosisResult.softAlternative.name}</div>
                <div className="text-[9px] text-slate-500 leading-tight">より柔らかい打感を<br/>求めるなら</div>
              </div>
            )}
            
            {diagnosisResult.hardAlternative && (
              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center group hover:bg-slate-800/60 transition-all">
                <div className="text-[10px] font-black text-emerald-400 mb-2 tracking-widest uppercase">Firmer Feel</div>
                <div className="w-16 h-16 rounded-full bg-white mb-3 shadow-lg overflow-hidden flex items-center justify-center p-2">
                  <img 
                    src={diagnosisResult.hardAlternative.img} 
                    alt={diagnosisResult.hardAlternative.name} 
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs font-bold text-white mb-1 line-clamp-1">{diagnosisResult.hardAlternative.name}</div>
                <div className="text-[9px] text-slate-500 leading-tight">よりしっかりした打感を<br/>求めるなら</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 space-y-4">
        {/* Next Step CTA */}
        <button 
          onClick={() => navigate('/mypage')}
          className="w-full relative group overflow-hidden bg-gradient-to-br from-slate-100 to-slate-300 text-slate-900 font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all active:scale-95 flex items-center justify-between"
        >
          <div className="absolute inset-0 bg-white/40 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out z-0"></div>
          <div className="text-left relative z-10">
            <div className="text-[10px] text-slate-600 font-black tracking-wider uppercase mb-0.5">Next Step</div>
            <div className="text-lg tracking-tight">My Bagにクラブを登録する</div>
          </div>
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white relative z-10 shadow-lg group-hover:scale-110 transition-transform">
            <ArrowRight className="w-5 h-5" />
          </div>
        </button>

        {/* Native Web Share Button (Generates Image & Shares) */}
        <button 
          onClick={handleShare}
          disabled={isSharing}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all text-white
            ${isSharing 
              ? 'bg-slate-700 cursor-not-allowed opacity-80' 
              : 'bg-[#1DA1F2] hover:bg-[#1a8cd8] active:scale-95 shadow-md shadow-[#1DA1F2]/30'} `}
        >
          {isSharing ? (
            <span className="flex items-center gap-2">
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 画像を生成中...
            </span>
          ) : (
            <>
               <Share2 className="w-5 h-5" />
               結果をシェア・保存する
            </>
          )}
        </button>

        <button 
          onClick={onRestart}
          className="w-full py-3 text-sm text-slate-500 font-medium hover:text-slate-300 transition-colors mt-2"
        >
          診断をやり直す
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;

