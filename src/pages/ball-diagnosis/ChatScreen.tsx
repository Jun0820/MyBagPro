import React, { useState } from 'react';
import type { DiagnosisAnswers } from './BallDiagnosisApp';
import { ChevronRight, ChevronLeft, User, Calendar, Trophy, Zap } from 'lucide-react';
import { BALL_MASTER_DATA } from '../../data/ballMasterData';

interface ChatScreenProps {
  onComplete: (answers: DiagnosisAnswers) => void;
  currentAnswers: DiagnosisAnswers;
  onBack: () => void;
  onUpdateAnswers: (answers: DiagnosisAnswers) => void;
  mode: 'lite' | 'pro';
}
interface QuestionOption {
  value: string;
  label: string;
  desc?: string;
}

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  options?: QuestionOption[];
  type?: 'slider' | 'brand-selector' | 'profile-group' | 'multiple-choice';
  min?: number;
  max?: number;
  unit?: string;
  multiple?: boolean;
}

const LITE_QUESTIONS: Question[] = [
  {
    id: 'profile',
    title: 'あなたについて教えてください',
    subtitle: '性別、年齢、使用ボール、ラウンド回数を伺います ※診断のベースとなります',
    type: 'profile-group'
  },
  {
    id: 'headSpeed',
    title: 'ドライバーヘッドスピード',
    subtitle: 'ボールの硬さと飛びの最大効率を決定する重要な数値です ※不明な場合は「40」を選択',
    type: 'slider',
    min: 30,
    max: 60,
    unit: 'm/s'
  },
  {
    id: 'score',
    title: '平均スコア',
    subtitle: 'レベルに合わせた最適なスピン性能を選定します',
    type: 'slider',
    min: 70,
    max: 130,
    unit: ''
  },
  {
    id: 'approachStyle',
    title: 'アプローチスタイル',
    subtitle: 'グリーン周りでのボールの挙動（止まり方）の好みを選択してください',
    options: [
      { value: 'spin', label: 'スピンで止めたい', desc: '操作性重視' },
      { value: 'running', label: 'ランニングで寄せたい', desc: '安定感重視' },
      { value: 'none', label: '特にこだわりはない', desc: 'バランス重視' }
    ]
  },
  {
    id: 'priority',
    title: 'ボールに求める性能',
    subtitle: '最も改善したいポイントを選択してください（複数選択可）',
    multiple: true,
    options: [
      { value: 'stability', label: '曲がりを抑えたい' },
      { value: 'spin', label: 'スピンをかけたい' },
      { value: 'high', label: '弾道を高くしたい' },
      { value: 'distance', label: '飛距離を伸ばしたい' }
    ]
  }
];

const PRO_QUESTIONS: Question[] = [
  {
    id: 'profile',
    title: 'あなたについて教えてください',
    subtitle: '基本情報を入力してください',
    type: 'profile-group'
  },
  {
    id: 'score',
    title: '平均スコア',
    subtitle: 'コースマネジメントと要求されるスピン性能を分析します',
    type: 'slider',
    min: 70,
    max: 130,
    unit: ''
  },
  {
    id: 'headSpeed',
    title: 'ドライバーヘッドスピード',
    subtitle: 'インパクトの強さとコアの潰れ具合を算出します',
    type: 'slider',
    min: 30,
    max: 60,
    unit: 'm/s'
  },
  {
    id: 'swingTempo',
    title: 'スイングテンポ',
    subtitle: '切り返しの強さに合わせたカバーの食いつきを評価します',
    options: [
      { value: 'fast', label: '速い' },
      { value: 'normal', label: '普通' },
      { value: 'smooth', label: 'ゆったり' }
    ]
  },
  {
    id: 'missTendencies',
    title: '主なミス傾向は？',
    subtitle: 'ミスを補う直進性やスピンバランスを考慮します（複数選択可）',
    multiple: true,
    options: [
      { value: 'slice', label: 'スライス' },
      { value: 'hook', label: 'フック' },
      { value: 'top', label: 'トップ' },
      { value: 'duff', label: 'ダフリ' },
      { value: 'distance_loss', label: '飛距離不足' }
    ]
  },
  {
    id: 'shotData_carry',
    title: 'ドライバーの平均キャリー',
    subtitle: '実質的な飛距離フローと最適な弾道を決定します',
    type: 'slider',
    min: 100,
    max: 350,
    unit: 'yd'
  },
  {
    id: 'approachStyle',
    title: 'アプローチスタイル',
    subtitle: 'ウェッジショットでのスイングスタイルを入力してください',
    options: [
      { value: 'spin', label: 'スピンで止めたい' },
      { value: 'running', label: 'ランニングで寄せたい' },
      { value: 'none', label: '特にこだわりはない' }
    ]
  },
  {
    id: 'visualPreference',
    title: '視覚的なこだわり',
    subtitle: 'セットアップ時の集中を高める要素を選択してください（複数選択可）',
    multiple: true,
    options: [
      { value: 'colored', label: 'カラー付き' },
      { value: 'lined', label: 'ライン付き' },
      { value: 'none', label: '特にこだわらない', desc: '性能のみで選ぶ' }
    ]
  },
  {
    id: 'priority',
    title: 'ボールに求める性能',
    subtitle: 'スコアアップに直結する要素を選択してください（複数選択可）',
    multiple: true,
    options: [
      { value: 'stability', label: '曲がりを抑えたい' },
      { value: 'spin', label: 'スピンをかけたい' },
      { value: 'high', label: '弾道を高くしたい' },
      { value: 'distance', label: '飛距離を伸ばしたい' }
    ]
  },
  {
    id: 'ballHardness',
    title: 'ボールの硬さの好み',
    subtitle: '打感の感触について、あなたの好みを教えてください',
    type: 'slider',
    min: 50,
    max: 100,
    unit: ''
  },
  {
    id: 'favoriteBrands',
    title: '好きなメーカー（優先して提案）',
    subtitle: '特定のメーカーを優先して提案してほしい場合に選択してください（複数選択可）',
    multiple: true,
    options: [
      { value: 'unknown', label: '特にこだわりなし' },
      ...BALL_MASTER_DATA.filter(b => b.id !== 'unknown').map(b => ({
        value: b.id,
        label: b.name
      }))
    ]
  },
  {
    id: 'useMyBag',
    title: '登録済みのクラブ情報を考慮しますか？',
    subtitle: 'MyBagのセッティング（ウッド・アイアンの硬さ等）との親和性を分析します',
    options: [
      { value: 'true', label: 'はい' },
      { value: 'false', label: 'いいえ' }
    ]
  }
];

const ChatScreen: React.FC<ChatScreenProps> = ({ 
  onComplete, 
  currentAnswers, 
  onBack, 
  onUpdateAnswers,
  mode
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<DiagnosisAnswers>(currentAnswers);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Derive questions based on mode
  const baseQuestions = mode === 'lite' ? LITE_QUESTIONS : PRO_QUESTIONS;
  
  // Skip gender/score if already in userProfile (optional, keeping for now)
  const finalQuestions = baseQuestions.filter(q => {
    // Skip profile group if basic info exists
    if (q.id === 'profile' && answers.gender && answers.age && answers.annualRounds) return false;
    
    // Skip score/headSpeed if they were initialized from user profile (i.e., not default values)
    if (q.id === 'score' && answers.score && answers.score !== 100) return false;
    if (q.id === 'headSpeed' && answers.headSpeed && answers.headSpeed !== 40) return false;
    
    return true;
  });

  const handleSelect = (value: any) => {
    if (isTransitioning) return;
    
    const currentQ = finalQuestions[currentStep];
    let newAnswers: DiagnosisAnswers;

    if (currentQ.id.startsWith('shotData_')) {
      const key = currentQ.id.split('_')[1];
      newAnswers = {
        ...answers,
        shotData: {
          ...answers.shotData,
          [key]: value.toString()
        }
      };
    } else {
      newAnswers = { ...answers, [currentQ.id]: value };
    }
    
    onUpdateAnswers(newAnswers);
    setAnswers(newAnswers);
    setIsTransitioning(true);

    if (currentStep < finalQuestions.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 400);
    } else {
      setTimeout(() => {
        onComplete(newAnswers);
        setIsTransitioning(false);
      }, 400);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const currentQuestion = finalQuestions[currentStep];
  const progress = ((currentStep + 1) / finalQuestions.length) * 100;

  const renderProfileGroup = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="grid grid-cols-2 gap-3">
          {/* Gender */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <User size={12} /> 性別
            </label>
            <div className="flex bg-slate-800/80 rounded-xl p-1 border border-white/5">
              {['男性', '女性'].map(g => (
                <button
                  key={g}
                  onClick={() => setAnswers(prev => ({ ...prev, gender: g }))}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${answers.gender === g ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-900/40' : 'text-slate-400'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          {/* Age */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={12} /> 年齢
            </label>
            <select
              value={answers.age || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, age: e.target.value }))}
              className="w-full bg-slate-800/80 border border-white/5 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-cyan-500/50"
            >
              <option value="">選択</option>
              {['20代以下', '30代', '40代', '50代', '60代', '70代以上'].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Ball Brand & Model */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <Zap size={12} /> 現在の使用ボール
          </label>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={answers.currentBallBrand || ''}
              onChange={(e) => {
                const brandId = e.target.value;
                setAnswers(prev => ({ ...prev, currentBallBrand: brandId, currentBallModel: null }));
              }}
              className="bg-slate-800/80 border border-white/5 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-cyan-500/50"
            >
              <option value="">メーカー選択</option>
              {BALL_MASTER_DATA.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={answers.currentBallModel || ''}
              disabled={!answers.currentBallBrand}
              onChange={(e) => setAnswers(prev => ({ ...prev, currentBallModel: e.target.value }))}
              className="bg-slate-800/80 border border-white/5 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-cyan-500/50 disabled:opacity-50"
            >
              <option value="">モデル選択</option>
              {BALL_MASTER_DATA.find(b => b.id === answers.currentBallBrand)?.models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Annual Rounds */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <Trophy size={12} /> 年間ラウンド回数
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: 'under5', label: '5回未満' },
              { val: '5-12', label: '5〜12回' },
              { val: '13-24', label: '13〜24回' },
              { val: 'over25', label: '25回以上' }
            ].map(r => (
              <button
                key={r.val}
                onClick={() => setAnswers(prev => ({ ...prev, annualRounds: r.val }))}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${answers.annualRounds === r.val ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800/80 border-white/5 text-slate-400 hover:border-slate-600'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!answers.gender || !answers.age || !answers.currentBallBrand || !answers.currentBallModel || !answers.annualRounds}
          onClick={() => handleSelect('completed')}
          className="w-full mt-4 p-5 rounded-2xl font-black text-lg tracking-widest bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-lg disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-3"
        >
          次へ進む <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center p-6 animate-slideIn overflow-x-hidden">
      <div className="w-full max-w-4xl flex flex-col flex-1">
      {/* Header: Back + Progress */}
      <div className="w-full pt-8 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button 
            onClick={handleBackStep}
            className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white border border-white/5 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1.5 font-bold font-eng tracking-widest uppercase">
              <span>Step {currentStep + 1}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 w-full bg-slate-800/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Question Area */}
      <div className="flex-1 flex flex-col pt-2 overflow-y-auto hide-scrollbar">
        <h2 className="text-2xl font-black mb-1 tracking-tight">
          {currentQuestion.title}
        </h2>
        {currentQuestion.subtitle && <p className="text-slate-500 text-sm mb-6 leading-relaxed">{currentQuestion.subtitle}</p>}

        {/* Dynamic Question Rendering */}
        {currentQuestion.type === 'profile-group' ? (
          renderProfileGroup()
        ) : currentQuestion.type === 'slider' ? (
          <div className="py-8">
            <div className="flex flex-col items-center justify-center p-12 md:p-20 rounded-[3rem] bg-slate-800/30 border border-white/5 backdrop-blur-xl mb-12 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 text-sm font-black text-cyan-400 mb-4 font-eng tracking-[0.3em] uppercase">Current Value</div>
              <div className="relative z-10 flex items-baseline gap-4">
                <span className="text-8xl md:text-[10rem] font-black tabular-nums tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  {currentQuestion.id.startsWith('shotData_') 
                    ? (answers.shotData?.[currentQuestion.id.split('_')[1] as keyof typeof answers.shotData] || currentQuestion.min || 0)
                    : (answers[currentQuestion.id as keyof DiagnosisAnswers] as number || currentQuestion.min || 0)}
                </span>
                <span className="text-3xl md:text-4xl font-black text-slate-500 font-eng italic">{currentQuestion.unit}</span>
              </div>
            </div>

            <div className="relative px-2 mb-10">
              <div className="absolute inset-x-2 h-2 top-1/2 -translate-y-1/2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  style={{ width: `${((((currentQuestion.id.startsWith('shotData_') ? parseInt(answers.shotData?.[currentQuestion.id.split('_')[1] as keyof typeof answers.shotData] || '0') : (answers[currentQuestion.id as keyof DiagnosisAnswers] as number)) || (currentQuestion.min || 0)) - (currentQuestion.min || 0)) / ((currentQuestion.max || 100) - (currentQuestion.min || 0))) * 100}%` }}
                />
              </div>
              
              <input
                type="range"
                min={currentQuestion.min}
                max={currentQuestion.max}
                step="1"
                value={(currentQuestion.id.startsWith('shotData_') ? (answers.shotData?.[currentQuestion.id.split('_')[1] as keyof typeof answers.shotData] || currentQuestion.min) : (answers[currentQuestion.id as keyof DiagnosisAnswers] || currentQuestion.min)) as number}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (currentQuestion.id.startsWith('shotData_')) {
                    const key = currentQuestion.id.split('_')[1];
                    setAnswers(prev => ({ ...prev, shotData: { ...prev.shotData, [key]: val.toString() } }));
                  } else {
                    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
                  }
                }}
                className="relative z-10 w-full h-10 bg-transparent appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[6px] [&::-webkit-slider-thumb]:border-cyan-500 [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(34,211,238,0.6)]"
              />

              <div className="flex justify-between mt-6 text-[10px] font-black text-slate-600 tracking-widest uppercase font-eng">
                {currentQuestion.id === 'ballHardness' ? (
                  <>
                    <span className="text-cyan-500">Soft (柔らかめ)</span>
                    <span className="text-emerald-500">Hard (しっかりめ)</span>
                  </>
                ) : (
                  <>
                    <span>Min: {currentQuestion.min}{currentQuestion.unit}</span>
                    <span>Max: {currentQuestion.max}{currentQuestion.unit}</span>
                  </>
                )}
              </div>
            </div>

            <button
               onClick={() => handleSelect(currentQuestion.id.startsWith('shotData_') ? (answers.shotData?.[currentQuestion.id.split('_')[1] as keyof typeof answers.shotData] || currentQuestion.min) : (answers[currentQuestion.id as keyof DiagnosisAnswers] || currentQuestion.min))}
               className="w-full max-w-md mx-auto p-10 rounded-[2.5rem] bg-white text-slate-900 font-black text-2xl tracking-tighter hover:bg-cyan-400 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl"
            >
              CONTINUE <ChevronRight size={32} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-16">
            {currentQuestion.options?.map((opt: any, idx: number) => {
              const questionValue = answers[currentQuestion.id as keyof DiagnosisAnswers];
              const isSelected = Array.isArray(questionValue) 
                ? (questionValue as string[]).includes(opt.value) 
                : questionValue === opt.value;
              
              return (
                <button
                    key={opt.value}
                    onClick={() => {
                      if (currentQuestion.multiple) {
                        const cur = (answers[currentQuestion.id as keyof DiagnosisAnswers] as string[]) || [];
                        const next = cur.includes(opt.value) ? cur.filter(v => v !== opt.value) : [...cur, opt.value];
                        setAnswers(prev => ({ ...prev, [currentQuestion.id]: next }));
                      } else {
                        handleSelect(opt.value);
                      }
                    }}
                    className={`w-full group relative flex items-center justify-between p-6 rounded-2xl text-left transition-all duration-300 active:scale-[0.98] animate-fadeIn border
                      ${isSelected 
                        ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.15)]' 
                        : 'bg-slate-800/40 border-white/5 hover:border-slate-600 hover:bg-slate-800/60'}`}
                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                  >
                    <div className="flex-1">
                      <div className={`font-black text-lg transition-colors ${isSelected ? 'text-cyan-400' : 'text-slate-100'}`}>
                        {opt.label}
                      </div>
                      {opt.desc && (
                        <div className={`text-xs mt-1 font-medium transition-colors ${isSelected ? 'text-cyan-400/60' : 'text-slate-500'}`}>
                          {opt.desc}
                        </div>
                      )}
                    </div>

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500
                      ${isSelected ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-900/50 rotate-0' : 'bg-slate-700/50 text-slate-400 rotate-0 group-hover:rotate-12'}`}>
                      {currentQuestion.multiple ? (
                        <div className={`w-4 h-4 rounded-md border-2 transition-all ${isSelected ? 'bg-white border-white scale-100' : 'border-slate-500 scale-90'}`} />
                      ) : (
                        <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'translate-x-0' : '-translate-x-1 group-hover:translate-x-0'}`} />
                      )}
                    </div>
                </button>
              );
            })}
            
            {currentQuestion.multiple && (
              <div className="md:col-span-2 flex justify-center mt-8">
                <button
                  disabled={!Array.isArray(answers[currentQuestion.id as keyof DiagnosisAnswers]) || (answers[currentQuestion.id as keyof DiagnosisAnswers] as string[]).length === 0}
                  onClick={() => handleSelect(answers[currentQuestion.id as keyof DiagnosisAnswers])}
                  className="w-full max-w-xl p-8 rounded-3xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-black text-xl tracking-widest shadow-xl shadow-cyan-900/20 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-4"
                >
                  選択を確定して次へ <ChevronRight size={24} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ChatScreen;

