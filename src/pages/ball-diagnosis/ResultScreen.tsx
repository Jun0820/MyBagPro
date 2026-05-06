import React, { useEffect, useState, useRef } from 'react';
import type { DiagnosisAnswers } from './BallDiagnosisApp';
import { Share2, ArrowRight, RotateCcw, Crosshair, Wind, Flag, Layers, Activity, Stethoscope } from 'lucide-react';
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
  const fallbackDiagnosis = calculateDiagnosis(answers);

  // Consider Pro Mode / MyBag context
  const isProMode = answers.useMyBag && profile.myBag && profile.myBag.clubs.length > 0;
  
  // 1. Get AI result if available, otherwise fallback to local calculation
  const { resultData } = useDiagnosis();
  const aiResult = resultData?.result;
  
  // 2. Resolve recommended ball (Try to find in local DB by name if possible, or use fallback)
  let recommendedBall;
  let matchScore;
  let aiExpertAnalysis = null;
  let aiSynergyAdvice = null;

  if (aiResult?.recommendedBall) {
    // Try to find exact or partial match in BALL_DATABASE (from golfBalls.ts or master data)
    const ballInDb = BALL_MASTER_DATA.flatMap(brand => brand.models).find(m => 
      aiResult.recommendedBall.name.toLowerCase().includes(m.name.toLowerCase()) ||
      m.name.toLowerCase().includes(aiResult.recommendedBall.name.toLowerCase())
    );

    // Find the GolfBall interface object for radar/img
    const fullBallData = fallbackDiagnosis.ball; // Just for fallback structure

    recommendedBall = ballInDb ? {
      ...fullBallData, // Use structure as template
      name: aiResult.recommendedBall.name,
      brand: aiResult.recommendedBall.brand,
      desc: aiResult.recommendedBall.description,
      radar: {
        distance: aiResult.recommendedBall.radar?.['飛距離'] || 5,
        spin: aiResult.recommendedBall.radar?.['スピン'] || 5,
        feel: aiResult.recommendedBall.radar?.['打感'] || 5,
      }
    } : fullBallData;

    matchScore = aiResult.recommendedBall.matchScore || 95;
    aiExpertAnalysis = aiResult.recommendedBall.expertOpinion;
    aiSynergyAdvice = aiResult.gearSynergyAdvice;
  } else {
    // Fallback to local 2026 models calculation
    recommendedBall = fallbackDiagnosis.ball;
    matchScore = fallbackDiagnosis.matchScore;
  }

  const getDistanceLabel = (value: number) => {
    if (value >= 4.8) return '飛距離をしっかり伸ばしやすい';
    if (value >= 4.2) return '飛距離と安定感のバランスが良い';
    return '無理なく距離を出しやすい';
  };

  const getSpinLabel = (value: number) => {
    if (value >= 4.8) return 'グリーン周りで止めやすい';
    if (value >= 4.0) return 'スピン量をコントロールしやすい';
    return 'スピンを抑えて前に進めやすい';
  };

  const getFeelLabel = (value: number) => {
    if (value >= 4.8) return 'かなりソフトな打感';
    if (value >= 4.0) return 'やわらかめで扱いやすい打感';
    if (value >= 3.2) return 'しっかり感のある打感';
    return '硬めで弾き感のある打感';
  };

  const getConcernLabel = (value: string | null) => {
    const map: Record<string, string> = {
      slice: '右へのミス',
      hook: '左へのミス',
      distance: '飛距離不足',
      spin: 'スピン不足',
      trajectory: '弾道の高さ',
      feel: '打感'
    };
    return value ? (map[value] || value) : null;
  };

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

  const summaryPoints = [
    getDistanceLabel(recommendedBall.radar.distance),
    getSpinLabel(recommendedBall.radar.spin),
    getFeelLabel(recommendedBall.radar.feel),
  ];

  const fitSummary = isProMode
    ? `登録済みのマイバッグとヘッドスピード ${answers.headSpeed}m/s をもとに整理すると、${recommendedBall.name} は今のセッティングにつながりやすく、使い始めの違和感も出にくい候補です。`
    : `ヘッドスピード ${answers.headSpeed}m/s と「${getPriorityLabel(answers.priority)}」重視の条件なら、${recommendedBall.name} は性能の向きが合いやすい候補です。`;

  const playStyleSummary = [
    answers.approachStyle ? `アプローチは「${getStyleLabel(answers.approachStyle)}」派` : null,
    answers.trajectory ? `弾道傾向は「${answers.trajectory}」寄り` : null,
    getConcernLabel(answers.concern) ? `気になるのは「${getConcernLabel(answers.concern)}」` : null,
  ].filter(Boolean).join(' / ');

  const displayedAlternatives = aiResult?.alternatives?.length
    ? aiResult.alternatives
    : [
        fallbackDiagnosis.softAlternative ? {
          type: 'SOFT FEEL',
          name: fallbackDiagnosis.softAlternative.name,
          reason: 'よりソフトな打感を優先したい場合の候補です。'
        } : null,
        fallbackDiagnosis.hardAlternative ? {
          type: 'FIRM FEEL',
          name: fallbackDiagnosis.hardAlternative.name,
          reason: 'もう少ししっかりした打感を求める場合の候補です。'
        } : null,
      ].filter(Boolean);

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
    <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto pb-24 animate-fadeIn">
      <div className="w-full max-w-5xl flex flex-col">
      {/* Result Header */}
      <div className="text-center mb-4 animate-fadeIn">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/30">
          <Flag className="w-3.5 h-3.5" />
          診断完了
        </div>
      </div>

      {/* Trading Card Container (Target for html2canvas) */}
      <div 
        ref={cardRef}
        className={`mt-4 transform transition-all duration-700 relative w-full max-w-2xl mx-auto ${showCard ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}
      >
        
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 rounded-3xl blur-md opacity-30 animate-pulse-slow"></div>
        
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 shadow-2xl ring-1 ring-slate-700/50 backdrop-blur-xl">
          {/* Top banner */}
          <div className="h-40 md:h-56 relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
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
            <div className="absolute top-6 right-6 z-20 rounded-full bg-emerald-500/90 px-4 py-1.5 text-sm font-bold text-white shadow-lg ring-1 ring-emerald-400 font-eng">
              {matchScore}% MATCH
            </div>
            {/* Ball icon */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-20 h-20 md:w-24 md:h-24 bg-white rounded-full shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center justify-center border-4 border-slate-900">
              <span className="text-3xl md:text-4xl">⛳</span>
            </div>
          </div>

          <div className="p-6 relative z-20">
            <div className="mb-8 text-center px-4">
              <p className="text-cyan-400 font-bold text-xs md:text-sm mb-2 tracking-widest uppercase">{profileLabel}</p>
              <h2 className="text-3xl md:text-5xl font-black font-eng tracking-tight text-white mb-2 leading-tight">{recommendedBall.name}</h2>
              {aiResult?.recommendedBall?.catchphrase && (
                <p className="text-emerald-400 text-sm md:text-base font-bold mb-4 italic">"{aiResult.recommendedBall.catchphrase}"</p>
              )}
              <div className="inline-block bg-slate-800 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400">
                {recommendedBall.type || aiResult?.recommendedBall?.brand}
              </div>
            </div>

            <div className="mb-8 px-4 md:px-8">
              <p className="text-base text-slate-300 leading-relaxed text-center mb-4">
                {fitSummary}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {summaryPoints.map((point) => (
                  <span
                    key={point}
                    className="rounded-full bg-slate-800/70 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/10"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>

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
            <div className={`mb-6 flex items-start gap-3 rounded-xl p-4 ${isProMode ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'bg-slate-800/50'}`}>
              {isProMode ? <Layers className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <Flag className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />}
              <div>
                <div className={`text-xs font-bold mb-1 ${isProMode ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {isProMode ? 'マイバッグ連携で見た相性' : '今回の条件整理'}
                </div>
                 <div className="text-xs text-slate-400 leading-tight">
                  {isProMode ? (
                    <>
                      登録された{profile.myBag.clubs.length}本のクラブ構成と、HS {answers.headSpeed}m/s をもとに見ると、
                      {recommendedBall.name} は今のギアとのつながりが取りやすい候補です。
                    </>
                  ) : (
                    <>
                      {playStyleSummary || '入力された条件をもとに、ボールの方向性を整理しました。'}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* AI Expert Opinion (New) */}
            {(aiExpertAnalysis || aiSynergyAdvice) && (
              <div className="mt-6 space-y-4 animate-fadeIn">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 shadow-inner ring-1 ring-emerald-500/20">
                   <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Stethoscope className="w-12 h-12 text-emerald-400" />
                   </div>
                   <div className="relative z-10">
                    <h4 className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                       <Activity className="w-3 h-3" /> AI コメント
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      {aiExpertAnalysis}
                    </p>
                    {aiSynergyAdvice && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-1">相性メモ</div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {aiSynergyAdvice}
                        </p>
                      </div>
                    )}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alternatives Section */}
      {(displayedAlternatives.length > 0 || recommendedBall) && (
        <div className="mt-8 mb-4 animate-fadeIn" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wider">あわせてチェックしたい代替案</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayedAlternatives.map((alt: any, idx: number) => (
              <div key={idx} className="group flex flex-col items-center rounded-2xl bg-slate-800/40 p-4 text-center ring-1 ring-white/5 transition-all hover:-translate-y-1 hover:bg-slate-800/60">
                <div className="text-[10px] font-black text-cyan-400 mb-2 tracking-widest uppercase">{alt.type}</div>
                <div className="w-16 h-16 rounded-full bg-white mb-3 shadow-lg overflow-hidden flex items-center justify-center p-2 text-slate-800 font-bold text-[10px] transform group-hover:scale-110 transition-transform">
                  {alt.name}
                </div>
                <div className="text-xs font-bold text-white mb-1 line-clamp-1">{alt.name}</div>
                <div className="text-[9px] text-slate-500 leading-tight line-clamp-2">{alt.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 space-y-4">
        {/* Next Step CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
            onClick={() => navigate('/mypage')}
            className="relative group overflow-hidden bg-gradient-to-br from-slate-100 to-slate-300 text-slate-900 font-bold py-6 px-8 rounded-2xl shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all active:scale-95 flex items-center justify-between"
            >
            <div className="absolute inset-0 bg-white/40 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out z-0"></div>
            <div className="text-left relative z-10">
                <div className="text-[10px] text-slate-600 font-black tracking-wider uppercase mb-1">Next Step</div>
                <div className="text-xl tracking-tight">My Bagを作成する</div>
            </div>
            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white relative z-10 shadow-lg group-hover:scale-110 transition-transform">
                <ArrowRight className="w-6 h-6" />
            </div>
            </button>

            {/* Native Web Share Button (Generates Image & Shares) */}
            <button 
            onClick={handleShare}
            disabled={isSharing}
            className={`flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-lg transition-all text-white
                ${isSharing 
                ? 'bg-slate-700 cursor-not-allowed opacity-80' 
                : 'bg-[#1DA1F2] hover:bg-[#1a8cd8] active:scale-95 shadow-xl shadow-[#1DA1F2]/30'} `}
            >
            {isSharing ? (
                <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 画像を生成中...
                </span>
            ) : (
                <>
                <Share2 className="w-6 h-6" />
                結果をSNSにシェア
                </>
            )}
            </button>
        </div>

        <button 
          onClick={onRestart}
          className="w-full py-3 text-sm text-slate-500 font-medium hover:text-slate-300 transition-colors mt-2"
        >
          診断をやり直す
        </button>
      </div>
      </div>
    </div>
  );
};

export default ResultScreen;
