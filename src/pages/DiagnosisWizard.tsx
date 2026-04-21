import { useNavigate, useParams } from 'react-router-dom';
import { useDiagnosis } from '../context/DiagnosisContext';
import { TargetCategory, DiagnosisMode, Gender, SkillLevel, MissType, SwingTempo } from '../types/golf';
import type { UserProfile } from '../types/golf';
import { StepCard } from '../components/StepCard';
import { OptionButton } from '../components/OptionButton';
import { BrandModelInput } from '../components/BrandModelInput';
import { PutterHeadSelector, PutterNeckSelector } from '../components/PutterSelectors';
import { BallPreferenceSelector } from '../components/BallPreferenceSelector';
import { AdvancedShotInput } from '../components/AdvancedShotInput';
import { ArrowRight, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BrandSelector } from '../components/BrandSelector';
import { getShaftModels, getShaftWeightOptions } from '../lib/data';
import { CLUB_SPECIFIC_MISS_TYPES, CLUB_MEASUREMENT_FIELDS } from '../components/ClubSpecificQuestions';
import { trackEvent } from '../lib/analytics';

// シャフトメーカー定義
const SHAFT_MANUFACTURERS = [
    'Fujikura', 'Graphite Design', 'Mitsubishi Chemical', 'UST Mamiya',
    'Nippon Shaft', 'True Temper', 'KBS', 'Project X'
];

export const DiagnosisWizard = () => {
    const { step, setStep, profile, updateProfile, runDiagnosis, isAnalyzing, diagnosisError, setProfile, user, setShowAuth } = useDiagnosis();
    const navigate = useNavigate();
    const { category } = useParams<{ category: string }>();
    const [manualBackNavigation, setManualBackNavigation] = useState(false);

    const goToDiagnosisEntry = () => {
        setManualBackNavigation(true);
        setStep(1);
        navigate('/diagnosis', { replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // エラーハンドリング: prevStepが未定義の場合の修正と、ナビゲーションループの解消
    // エラーハンドリング: prevStepが未定義の場合の修正と、ナビゲーションループの解消
    const prevStep = () => {
        trackEvent('diagnosis_back_click', {
            diagnosis_category: profile.targetCategory || 'entry',
            current_step: step,
            has_category_param: Boolean(category),
        });

        if (step === 2) {
            goToDiagnosisEntry();
            return;
        }

        setManualBackNavigation(true);
        if (step <= 1) {
            navigate('/');
        } else if (profile.targetCategory === TargetCategory.TOTAL_SETTING) {
            // Total Setting back logic
            if (step === 20) {
                setStep(1);
            } else if (step === 4) {
                setStep(1);
            } else {
                setStep(step - 1);
            }
        } else {
            setStep(step - 1);
        }
    };

    // Helper to handle profile updates and navigation
    const handleNext = (updates: Partial<UserProfile>, autoAdvance = true) => {
        setManualBackNavigation(false);
        Object.entries(updates).forEach(([key, value]) => {
            updateProfile(key as keyof UserProfile, value);
        });
        if (autoAdvance) setStep(step + 1);
    };

    // ウェッジ診断のステップ定義 (Vokey Style)
    const renderWedgeSteps = () => {
        switch (step) {
            case 2: // 診断モード選択 (追加 or 見直し)
                return (
                    <StepCard
                        title="ウェッジ選びの目的は？"
                        subtitle="現在のセットに追加するか、構成全体を見直すかお選びください。"
                        onBack={prevStep}
                    >
                        <div className="space-y-4">
                            <OptionButton
                                label="セット全体の見直し (推奨)"
                                subLabel="PWのロフトに合わせて最適な3〜4本を提案します"
                                selected={profile.wedgeDiagnosisMode === 'REPLACE'}
                                onClick={() => handleNext({ wedgeDiagnosisMode: 'REPLACE' })}
                                icon={<Zap className="w-5 h-5 text-yellow-400" />}
                            />
                            <OptionButton
                                label="1本だけ買い足し"
                                subLabel="特定のロフト（例:58°）を探している"
                                selected={profile.wedgeDiagnosisMode === 'ADD'}
                                onClick={() => handleNext({ wedgeDiagnosisMode: 'ADD' })}
                            />
                        </div>
                    </StepCard>
                );
            case 3: // ADDモード: ターゲットロフト / REPLACEモード: PWロフト
                return (
                    <StepCard
                        title={profile.wedgeDiagnosisMode === 'ADD' ? "欲しいウェッジのロフト角は？" : "今のピッチングウェッジ(PW)のロフト角は？"}
                        subtitle={profile.wedgeDiagnosisMode === 'ADD' ? "補充したいロフトを選択してください。" : "正確な提案のために、PWのロフト角を教えてください。"}
                        onBack={prevStep}
                    >
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">
                                    {profile.wedgeDiagnosisMode === 'ADD' ? "ターゲットロフト" : "PWロフト角"} (°)
                                </label>
                                <input
                                    type="text"
                                    value={profile.wedgeDiagnosisMode === 'ADD' ? (profile.targetWedgeLoft || '') : (profile.wedgePwLoft || '')}
                                    onChange={(e) => updateProfile(profile.wedgeDiagnosisMode === 'ADD' ? 'targetWedgeLoft' : 'wedgePwLoft', e.target.value)}
                                    placeholder={profile.wedgeDiagnosisMode === 'ADD' ? "58" : "44"}
                                    className="w-full p-4 bg-white text-slate-900 border-2 border-slate-200 rounded-xl outline-none focus:border-golf-500 font-bold text-xl"
                                />
                            </div>
                            {profile.wedgeDiagnosisMode === 'ADD' && (
                                <div className="grid grid-cols-3 gap-3">
                                    {['50°', '52°', '56°', '58°', '60°'].map(loft => (
                                        <button
                                            key={loft}
                                            onClick={() => handleNext({ targetWedgeLoft: loft })}
                                            className="py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-golf-500/20 hover:border-golf-500/50 transition-all text-sm font-bold"
                                        >
                                            {loft}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {profile.wedgeDiagnosisMode === 'REPLACE' && (
                                <div className="grid grid-cols-3 gap-3">
                                    {['42°', '44°', '46°', '48°'].map(loft => (
                                        <button
                                            key={loft}
                                            onClick={() => handleNext({ wedgePwLoft: loft })}
                                            className="py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-golf-500/20 hover:border-golf-500/50 transition-all text-sm font-bold"
                                        >
                                            {loft}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <OptionButton
                                label={profile.wedgeDiagnosisMode === 'ADD' ? "ロフトは相談したい" : "わからない (標準的な44°とする)"}
                                selected={false}
                                onClick={() => handleNext(profile.wedgeDiagnosisMode === 'ADD' ? { targetWedgeLoft: '58' } : { wedgePwLoft: '44' })}
                            />
                        </div>
                    </StepCard>
                );
            case 4: // バウンスの好み (Divot Check)
                return (
                    <StepCard
                        title="フルショットでターフ（芝）は取れますか？"
                        subtitle="入射角を分析し、ベースとなるバウンス角を決定します。"
                        onBack={prevStep}
                    >
                        <div className="space-y-4">
                            <OptionButton
                                label="ガッツリ取れる (Deep)"
                                subLabel="上から打ち込むタイプ。バウンス大きめがおすすめ"
                                selected={profile.divotDepth === 'deep'}
                                onClick={() => handleNext({ divotDepth: 'deep' })}
                            />
                            <OptionButton
                                label="普通に取れる (Normal)"
                                subLabel="適度な深さ"
                                selected={profile.divotDepth === 'normal'}
                                onClick={() => handleNext({ divotDepth: 'normal' })}
                            />
                            <OptionButton
                                label="ほとんど取れない (Shallow)"
                                subLabel="払い打つタイプ。バウンス少なめがおすすめ"
                                selected={profile.divotDepth === 'shallow'}
                                onClick={() => handleNext({ divotDepth: 'shallow' })}
                            />
                        </div>
                    </StepCard>
                );
            case 5: // [NEW] ウェッジ別用途チェックリスト
                return (
                    <StepCard
                        title="各ウェッジの主な用途は？"
                        subtitle="最適なグラインド（ソール形状）を提案するために、使い方を教えてください。（複数選択可）"
                        onBack={prevStep}
                    >
                        <div className="space-y-6">
                            {/* PW / GW: Full & Greenside Only */}
                            {['pw', 'gw'].map((w) => (
                                <div key={w} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-trust-navy uppercase mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                                        <span className="bg-trust-navy text-white text-xs px-2 py-1 rounded">{w.toUpperCase()}</span>
                                        <span className="text-xs text-slate-500">
                                            {w === 'pw' ? '43°-48°' : '50°-52°'}
                                        </span>
                                    </h4>
                                    <div className="flex gap-2">
                                        {[
                                            { val: 'FULL', label: 'フルショット', icon: '🏌️‍♂️' },
                                            { val: 'GREENSIDE', label: 'グリーン周り', icon: '⛳️' }
                                        ].map((usage) => {
                                            const current = (profile.wedgeUsage as any)?.[w] || [];
                                            const isSelected = current.includes(usage.val);
                                            return (
                                                <button
                                                    key={usage.val}
                                                    onClick={() => {
                                                        const newUsage = isSelected
                                                            ? current.filter((u: string) => u !== usage.val)
                                                            : [...current, usage.val];
                                                        updateProfile('wedgeUsage', {
                                                            ...profile.wedgeUsage,
                                                            [w]: newUsage
                                                        });
                                                    }}
                                                    className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 ${isSelected
                                                        ? 'bg-golf-50 border-golf-500 text-golf-800'
                                                        : 'bg-white border-slate-200 text-slate-500'
                                                        }`}
                                                >
                                                    <span className="text-lg">{usage.icon}</span>
                                                    {usage.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* SW / LW: Full, Greenside, Open Face, Bunker */}
                            {['sw', 'lw'].map((w) => (
                                <div key={w} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-trust-navy uppercase mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                                        <span className="bg-trust-navy text-white text-xs px-2 py-1 rounded">{w.toUpperCase()}</span>
                                        <span className="text-xs text-slate-500">
                                            {w === 'sw' ? '54°-56°' : '58°-62°'}
                                        </span>
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { val: 'FULL', label: 'フルショット', icon: '🏌️‍♂️' },
                                            { val: 'GREENSIDE', label: 'グリーン周り', icon: '⛳️' },
                                            { val: 'OPEN_FACE', label: 'フェースを開く', icon: '📐' },
                                            { val: 'BUNKER', label: 'バンカー', icon: '🏖️' }
                                        ].map((usage) => {
                                            const current = (profile.wedgeUsage as any)?.[w] || [];
                                            const isSelected = current.includes(usage.val);
                                            return (
                                                <button
                                                    key={usage.val}
                                                    onClick={() => {
                                                        const newUsage = isSelected
                                                            ? current.filter((u: string) => u !== usage.val)
                                                            : [...current, usage.val];
                                                        updateProfile('wedgeUsage', {
                                                            ...profile.wedgeUsage,
                                                            [w]: newUsage
                                                        });
                                                    }}
                                                    className={`py-3 px-2 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 ${isSelected
                                                        ? 'bg-golf-50 border-golf-500 text-golf-800'
                                                        : 'bg-white border-slate-200 text-slate-500'
                                                        }`}
                                                >
                                                    <span className="text-lg">{usage.icon}</span>
                                                    {usage.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep(step + 1)}
                            className="w-full mt-6 bg-trust-navy text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all"
                        >
                            次へ
                        </button>
                    </StepCard>
                );

            case 6: // フェアウェイコンディション
                return (
                    <StepCard
                        title="よく行くコースのフェアウェイの状態は？"
                        subtitle="地面の硬さによって適正バウンスが変わります。"
                        onBack={prevStep}
                    >
                        <div className="space-y-4">
                            <OptionButton
                                label="硬め (Firm)"
                                subLabel="地面が硬く、ヘッドが弾かれやすい"
                                selected={profile.fairwayCondition === 'FIRM'}
                                onClick={() => handleNext({ fairwayCondition: 'FIRM' })}
                            />
                            <OptionButton
                                label="普通 (Normal)"
                                subLabel="一般的な日本のコースコンディション"
                                selected={profile.fairwayCondition === 'NORMAL'}
                                onClick={() => handleNext({ fairwayCondition: 'NORMAL' })}
                            />
                            <OptionButton
                                label="柔らかめ (Soft)"
                                subLabel="雨上がりや洋芝など、ヘッドが潜りやすい"
                                selected={profile.fairwayCondition === 'SOFT'}
                                onClick={() => handleNext({ fairwayCondition: 'SOFT' })}
                            />
                        </div>
                    </StepCard>
                );
            case 7: // バンカーコンディション
                return (
                    <StepCard
                        title="よく行くコースのバンカーの状態は？"
                        subtitle="砂質に合わせたソール形状を選びます。"
                        onBack={prevStep}
                    >
                        <div className="space-y-4">
                            <OptionButton
                                label="砂が薄い・硬い"
                                subLabel="ヘッドが弾かれやすい"
                                selected={profile.bunkerCondition === 'FIRM'}
                                onClick={() => handleNext({ bunkerCondition: 'FIRM' })}
                            />
                            <OptionButton
                                label="普通"
                                subLabel="適度な砂量"
                                selected={profile.bunkerCondition === 'NORMAL'}
                                onClick={() => handleNext({ bunkerCondition: 'NORMAL' })}
                            />
                            <OptionButton
                                label="砂が厚い・柔らかい"
                                subLabel="ヘッドが潜りやすい（目玉になりやすい）"
                                selected={profile.bunkerCondition === 'SOFT'}
                                onClick={() => handleNext({ bunkerCondition: 'SOFT' })}
                            />
                        </div>
                    </StepCard>
                );
            case 8: // バンカー得意度
                return (
                    <StepCard
                        title="バンカーショットは得意ですか？"
                        subtitle="苦手な場合、専用の幅広ソールを提案します。"
                        onBack={prevStep}
                    >
                        <div className="space-y-4">
                            <OptionButton
                                label="得意 / 問題ない"
                                subLabel="エクスプロージョンショットが打てる"
                                selected={profile.bunkerSkill === 'CONFIDENT'}
                                onClick={() => handleNext({ bunkerSkill: 'CONFIDENT' })}
                            />
                            <OptionButton
                                label="普通"
                                subLabel="基本的には出せるが、たまにミスする"
                                selected={profile.bunkerSkill === 'NORMAL'}
                                onClick={() => handleNext({ bunkerSkill: 'NORMAL' })}
                            />
                            <OptionButton
                                label="苦手 / 脱出優先したい"
                                subLabel="一回で出ないことが多い。とにかく簡単に出したい"
                                selected={profile.bunkerSkill === 'NOT_CONFIDENT'}
                                onClick={() => handleNext({ bunkerSkill: 'NOT_CONFIDENT' })}
                            />
                        </div>
                    </StepCard>
                );
            case 9: // アイアンシャフト
                return (
                    <StepCard
                        title="現在使用しているアイアンのシャフトは？"
                        subtitle="ウェッジのシャフト重量フローを合わせるために重要です。"
                        onBack={prevStep}
                    >
                        <div className="space-y-4">
                            <OptionButton
                                label="スチール (Dynamic Gold / MODUSなど)"
                                selected={profile.ironShaftType === 'STEEL'}
                                onClick={() => handleNext({ ironShaftType: 'STEEL' }, true)} // 9へ
                            />
                            <OptionButton
                                label="軽量スチール (N.S.PRO 950など)"
                                selected={profile.ironShaftType === 'STEEL'}
                                onClick={() => handleNext({ ironShaftType: 'STEEL' }, true)}
                            />
                            <OptionButton
                                label="カーボン"
                                selected={profile.ironShaftType === 'CARBON'}
                                onClick={() => handleNext({ ironShaftType: 'CARBON' }, true)}
                            />
                        </div>
                    </StepCard>
                );
            default:
                return null;
        }
    };
    const resetCategorySpecificData = () => {
        setProfile((prev) => ({
            ...prev,
            // 現在のギア情報をリセット
            currentBrand: '',
            currentModel: '',
            currentShaftModel: '',
            currentShaftWeight: '',
            currentShaftFlex: '',
            currentLoft: '',

            // ドライバーシャフト情報をリセット
            driverShaftModel: undefined,
            driverShaftFlex: undefined,
            driverShaftWeight: undefined,

            // クラブ別詳細質問をリセット
            headVolumePreference: undefined,
            shaftKickPoint: undefined,
            mainFairwayNumber: undefined,
            fwUsageScene: undefined,
            utShapePreference: undefined,
            ironReplacement: undefined,
            ironShaftType: undefined,
            ironSetComposition: undefined,
            soleWidthPreference: undefined,
            wedgePwLoft: undefined,
            wedgeSetup: undefined,
            wedgeBounce: undefined,
            wedgeSoleGrind: undefined,
            wedgeDiagnosisMode: undefined,
            bunkerFrequency: undefined,
            putterStrokeType: undefined,
            putterLength: undefined,
            gripType: undefined,
            putterFeel: undefined,
            matchDriverShaft: undefined,
            preferredShaftBrands: [],

            // パター固有をリセット
            currentPutterHead: null,
            currentPutterNeck: null,
            putterStroke: null,
            putterMiss: [],

            // 弾道・球筋の好みをリセット
            preferredTrajectory: undefined,
            preferredBallFlight: undefined,

            // ミス傾向をリセット
            missTendencies: [],

            // 計測データをリセット
            hasMeasurementData: false,
            measurementData: {
                driverCarryDistance: '',
                driverTotalDistance: '',
                sevenIronDistance: '',
                ballSpeed: '',
                launchAngle: '',
                spinRateMeasured: '',
                clubPath: '',
                faceAngle: '',
                attackAngle: '',
                smashFactor: '',
                sevenIronLoft: '',
                wedgeFullDistance: '',
                wedgeSpinRate: '',
                fwCarryDistance: '',
                fwSpinRate: '',
                fwLaunchAngle: '',
                utCarryDistance: '',
                utSpinRate: '',
                ironSpinRate: '',
                ironLaunchAngle: '',
                ironDescentAngle: '',
                measurementClubType: ''
            }
        }));
    };

    // Initial category setup from URL or profile.targetCategory (pre-set by My Page)
    useEffect(() => {
        if (step === 1) {
            // URL parameter has priority
            if (category) {
                const validCategory = Object.values(TargetCategory).find(c => c === category) ||
                    Object.entries(TargetCategory).find(([k, _v]) => k.toLowerCase() === category?.toLowerCase())?.[1];
                if (validCategory) {
                    resetCategorySpecificData();
                    updateProfile('targetCategory', validCategory);
                    setStep(2);
                    return;
                }
            }
            
            // If targetCategory was pre-set (e.g. via MyPage's onDiagnose)
            if (profile.targetCategory) {
                setStep(2);
            }
        }
    }, [category, step, profile.targetCategory]);

    useEffect(() => {
        if (step === 4 && profile.gender && profile.skillLevel && profile.bestScore && profile.averageScore) {
            if (!manualBackNavigation) {
                setStep(step + 1);
            }
        }
    }, [step, profile.gender, profile.skillLevel, profile.bestScore, profile.averageScore, manualBackNavigation]);

    useEffect(() => {
        if (step === 4 && profile.gender && profile.skillLevel && profile.headSpeed > 0 && !manualBackNavigation) {
            setStep(step + 1);
        }
    }, [step, profile.gender, profile.skillLevel, profile.headSpeed, manualBackNavigation]);

    useEffect(() => {
        if (step === 4 && profile.gender && profile.skillLevel && profile.bestScore && !manualBackNavigation) {
            setStep(step + 1);
        }
    }, [step, profile.gender, profile.skillLevel, profile.bestScore, manualBackNavigation]);

    useEffect(() => {
        if (step === 3 && !manualBackNavigation) {
            const hasCurrentGear = profile.currentBrand && profile.currentModel;
            if (hasCurrentGear && profile.targetCategory !== TargetCategory.TOTAL_SETTING && profile.targetCategory !== TargetCategory.WEDGE) {
                setStep(step + 1);
            }
        }
    }, [step, profile.currentBrand, profile.currentModel, profile.targetCategory, manualBackNavigation]);

    useEffect(() => {
        if (profile.missTendencies && profile.missTendencies.length > 0 && !manualBackNavigation) {
           if (step === 5 && profile.targetCategory !== TargetCategory.WEDGE && profile.targetCategory !== TargetCategory.PUTTER) {
               setStep(step + 1);
           }
        }
    }, [step, profile.missTendencies, profile.targetCategory, manualBackNavigation]);

    // [NEW] Handle auto-advance for TOTAL_SETTING
    useEffect(() => {
        if (profile.targetCategory === TargetCategory.TOTAL_SETTING) {
            if ((step === 2 || step === 3) && !manualBackNavigation) {
                setStep(4);
            }
        }
    }, [step, profile.targetCategory, manualBackNavigation]);


    // Step 1: Target Selection (Default if no category param)
    if (step === 1) return (
        <div className="w-full max-w-6xl mx-auto animate-fadeIn">
            <section className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_54%,#eef6f1_100%)] shadow-sm">
                <div className="relative px-5 py-8 md:px-10 md:py-12">
                    <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle,_rgba(39,174,96,0.16),_rgba(255,255,255,0)_68%)] blur-2xl lg:block" />
                    <div className="relative">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-black tracking-[0.16em] text-slate-500">
                            <Sparkles size={14} className="text-golf-700" />
                            AI CLUB DIAGNOSIS
                        </div>
                        <h1 className="mt-5 text-[2.3rem] font-black leading-[1.05] tracking-tight text-trust-navy md:text-6xl">
                            まずは10秒で、
                            <br />
                            自分に合う方向を知る。
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                            いまのミス傾向と振り方から、候補を一気に絞ります。ログインなしで始められて、あとで保存もできます。
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            {['ログイン不要', '入力は途中で保持', '結果はあとで保存可能'].map((chip) => (
                                <div key={chip} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600">
                                    {chip}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                            <div className="grid gap-3 sm:grid-cols-3">
                                {[
                                    '右に抜ける不安を減らしたい',
                                    '捕まりすぎを抑えたい',
                                    '今より候補を早く絞りたい',
                                ].map((point) => (
                                    <div key={point} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-bold text-slate-700">
                                        <CheckCircle2 size={18} className="shrink-0 text-golf-700" />
                                        <span>{point}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-bold text-white">
                                3問前後で候補を整理
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => {
                                    resetCategorySpecificData();
                                    updateProfile('targetCategory', TargetCategory.DRIVER);
                                    setStep(2);
                                    navigate('/diagnosis/driver');
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-7 py-4 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
                            >
                                10秒でドライバー診断を始める
                                <ArrowRight size={16} />
                            </button>
                            <button
                                onClick={() => navigate('/settings/pros')}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-7 py-4 text-sm font-black text-slate-700 transition-colors hover:border-golf-400 hover:text-golf-700"
                            >
                                先にプロのセッティングを見る
                            </button>
                        </div>

                        <div className="mt-4 inline-flex max-w-xl items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
                            <div className="mt-0.5 text-base">ℹ️</div>
                            <div className="font-bold">
                                この診断はβ版です。精度向上中です。
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 md:p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-[11px] font-black tracking-[0.14em] text-slate-400">OTHER DIAGNOSIS</div>
                        <div className="mt-1 text-sm font-bold text-slate-600">他カテゴリの診断は順次公開中です。</div>
                    </div>
                    <button
                        onClick={() => navigate('/settings/pros')}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 transition-colors hover:border-golf-400 hover:text-golf-700"
                    >
                        先にプロを見る
                    </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {['フェアウェイウッド', 'ユーティリティ', 'アイアン', 'ウェッジ', 'パター'].map((item) => (
                        <div
                            key={item}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 md:text-sm"
                        >
                            {item} は順次公開予定
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );

    // Wedge Flow Interceptor (Vokey Style)
    // ターゲットカテゴリがウェッジの場合、専用フロー（Step 2〜9）を強制的に表示
    if (((profile.targetCategory as any) === TargetCategory.WEDGE || profile.targetCategory === 'ウェッジ') && step >= 2 && step <= 9) {
        const wedgeContent = renderWedgeSteps();
        if (wedgeContent) return wedgeContent;
    }

    // Step 2: Mode Selection
    if (step === 2) {
        // Fallback: Ensure Wedge flow is caught even if Interceptor skipped
        if ((profile.targetCategory as any) === TargetCategory.WEDGE || profile.targetCategory === 'ウェッジ') {
            const wedgeContent = renderWedgeSteps();
            if (wedgeContent) return wedgeContent;
        }

        // Total Setting skips mode selection (handled in useEffect)
        if (profile.targetCategory === TargetCategory.TOTAL_SETTING) {
            return null;
        }

        if (profile.targetCategory === TargetCategory.PUTTER) {
            return (
                <StepCard title="このまま診断を始めます" subtitle="パターは最適化モードでそのまま進みます。" onBack={prevStep}>
                    <div className="py-6 md:py-10">
                        <div className="rounded-[1.75rem] bg-slate-50 p-6 text-center">
                            <div className="text-5xl mb-5">🤖</div>
                            <p className="font-black text-2xl text-trust-navy">選び方をすぐ整える</p>
                            <p className="mt-3 text-sm leading-7 text-slate-600">細かいモード選択はせず、そのまま最適化へ進みます。</p>
                        </div>
                        <button onClick={() => setStep(step + 1)} className="mt-6 w-full px-10 py-4 bg-trust-navy text-white rounded-full font-black hover:scale-[1.01] transition-transform">
                            次へ進む
                        </button>
                    </div>
                </StepCard>
            );
        }
        return (
            <StepCard title="どう診断したいですか？" subtitle="まずは、どこまで見直したいかを選ぶだけで大丈夫です。" onBack={prevStep}>
                <div className="space-y-4">
                    <OptionButton
                        label="フルで見直す"
                        subLabel="ヘッドとシャフトをまとめて提案します。"
                        selected={profile.diagnosisMode === DiagnosisMode.FULL_SPEC}
                        onClick={() => { updateProfile('diagnosisMode', DiagnosisMode.FULL_SPEC); setStep(step + 1) }}
                        icon={<Sparkles size={18} />}
                    />
                    <OptionButton
                        label="ヘッドだけ見直す"
                        subLabel="シャフトは活かして、合うヘッドを探します。"
                        selected={profile.diagnosisMode === DiagnosisMode.HEAD_ONLY}
                        onClick={() => { updateProfile('diagnosisMode', DiagnosisMode.HEAD_ONLY); setStep(step + 1) }}
                        icon={<Zap size={18} />}
                    />
                    <OptionButton
                        label="シャフトだけ見直す"
                        subLabel="ヘッドはそのままで、振りやすさを整えます。"
                        selected={profile.diagnosisMode === DiagnosisMode.SHAFT_ONLY}
                        onClick={() => { updateProfile('diagnosisMode', DiagnosisMode.SHAFT_ONLY); setStep(step + 1) }}
                        icon={<ArrowRight size={18} />}
                    />
                </div>
            </StepCard>
        );
    }

    // Step 3: Current Gear
    if (step === 3) {
        // Total Setting skips individual gear entry (handled in useEffect)
        if (profile.targetCategory === TargetCategory.TOTAL_SETTING) {
            return null;
        }

        // ユーティリティ診断用の特別なUI
        if (profile.targetCategory === TargetCategory.UTILITY) {
            const utNumberOptions = ['2H', '3H', '4H', '5H', '6H', '7H'];
            const currentUtilities = profile.currentUtilities || [];

            const addUtility = (number: string) => {
                const exists = currentUtilities.some(u => u.number === number);
                if (!exists) {
                    updateProfile('currentUtilities', [...currentUtilities, { number }]);
                }
            };

            const removeUtility = (number: string) => {
                updateProfile('currentUtilities', currentUtilities.filter(u => u.number !== number));
            };

            return (
                <StepCard title="ユーティリティ設定" subtitle="現在のユーティリティ構成を教えてください" onBack={prevStep}>
                    <div className="space-y-6">
                        {/* 1. 現在のUT構成 */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="text-xs font-bold text-slate-400 mb-3 block">1. 現在お使いのユーティリティのモデル</label>
                            <BrandModelInput
                                brand={profile.currentBrand}
                                model={profile.currentModel}
                                category="UTILITY"
                                onBrandChange={v => updateProfile('currentBrand', v)}
                                onModelChange={v => updateProfile('currentModel', v)}
                                placeholderModel="例: Rogue ST, G430"
                            />
                            <div className="mt-2 flex items-center justify-end">
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500 hover:text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={profile.currentBrand === 'Unknown' && profile.currentModel === 'Unknown'}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                updateProfile('currentBrand', 'Unknown');
                                                updateProfile('currentModel', 'Unknown');
                                            } else {
                                                updateProfile('currentBrand', '');
                                                updateProfile('currentModel', '');
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-slate-300 text-trust-navy focus:ring-trust-navy"
                                    />
                                    <span>現在使用しているモデルがわからない</span>
                                </label>
                            </div>
                        </div>

                        {/* 2. 番手構成 */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="text-xs font-bold text-slate-400 mb-3 block">2. 現在お持ちの番手（複数選択可）</label>
                            <div className="flex flex-wrap gap-2">
                                {utNumberOptions.map(num => {
                                    const isSelected = currentUtilities.some(u => u.number === num);
                                    return (
                                        <button key={num} onClick={() => isSelected ? removeUtility(num) : addUtility(num)} className={`py-2 px-4 border-2 rounded-xl font-bold transition-all ${isSelected ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>
                                            {isSelected && '✓ '}{num}
                                        </button>
                                    );
                                })}
                                <button onClick={() => updateProfile('currentUtilities', [])} className="py-2 px-4 border-2 border-slate-200 rounded-xl font-bold text-slate-400 hover:border-slate-300">持っていない</button>
                            </div>
                        </div>

                        {/* 2. アイアンセット上限 */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="text-xs font-bold text-slate-400 mb-3 block">2. アイアンセットの上限番手</label>
                            <p className="text-xs text-slate-500 mb-3">※UTで補う範囲の参考にします</p>
                            <div className="flex flex-wrap gap-2">
                                {['4I', '5I', '6I', '7I'].map(num => (
                                    <button key={num} onClick={() => updateProfile('ironSetUpperLimit', num)} className={`py-2 px-4 border-2 rounded-xl font-bold transition-all ${profile.ironSetUpperLimit === num ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>{num}</button>
                                ))}
                            </div>
                        </div>

                        {/* 3. 最もロフトが立ったFW */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="text-xs font-bold text-slate-400 mb-3 block">3. お持ちの最もロフトが立ったFW（任意）</label>
                            <p className="text-xs text-slate-500 mb-3">※距離ギャップの確認に使用します</p>
                            <div className="flex flex-wrap gap-2">
                                {['3W', '5W', '7W', '持っていない'].map(fw => (
                                    <button key={fw} onClick={() => updateProfile('lowestFairway', fw)} className={`py-2 px-4 border-2 rounded-xl font-bold transition-all ${profile.lowestFairway === fw ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>{fw}</button>
                                ))}
                            </div>
                        </div>

                        {/* 4. 診断したいUT番手 */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <label className="text-xs font-bold text-blue-600 mb-3 block">4. 診断したいユーティリティの番手</label>
                            <div className="flex flex-wrap gap-2">
                                {['3H', '4H', '5H', '6H'].map(num => (
                                    <button key={num} onClick={() => updateProfile('targetUtilityNumber', num)} className={`py-2 px-4 border-2 rounded-xl font-bold transition-all ${profile.targetUtilityNumber === num ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-blue-200 text-blue-500 hover:border-blue-400'}`}>{num}</button>
                                ))}
                            </div>
                        </div>

                        {/* ドライバーシャフト情報 */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <label className="text-xs font-bold text-blue-600 mb-4 block flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-600 flex items-center justify-center text-[10px]">💡</span>
                                現在お使いのドライバーのシャフト
                            </label>
                            <p className="text-xs text-slate-500 mb-4">※シャフトを揃える診断に使用します（任意）</p>
                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        list="driver-shaft-suggestions"
                                        value={profile.driverShaftModel || ''}
                                        onChange={e => updateProfile('driverShaftModel', e.target.value)}
                                        placeholder="例: Ventus Blue 6S, Speeder NX 50"
                                        className="w-full p-3 border-2 border-blue-200 rounded-xl font-bold text-trust-navy outline-none focus:border-blue-500 text-sm bg-white"
                                    />
                                    <datalist id="driver-shaft-suggestions">
                                        {getShaftModels('ドライバー').filter((m: string) =>
                                            !profile.driverShaftModel ||
                                            m.toLowerCase().includes((profile.driverShaftModel || '').toLowerCase())
                                        ).slice(0, 10).map((m: string) => (
                                            <option key={m} value={m} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">WEIGHT</label>
                                        <select
                                            value={profile.driverShaftWeight || ''}
                                            onChange={e => updateProfile('driverShaftWeight', e.target.value)}
                                            className="w-full p-3 border-2 border-blue-200 rounded-xl font-bold text-trust-navy outline-none focus:border-blue-500 text-sm bg-white"
                                        >
                                            <option value="">Select</option>
                                            {getShaftWeightOptions('ドライバー').map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">FLEX</label>
                                        <select
                                            value={profile.driverShaftFlex || ''}
                                            onChange={e => updateProfile('driverShaftFlex', e.target.value)}
                                            className="w-full p-3 border-2 border-blue-200 rounded-xl font-bold text-trust-navy outline-none focus:border-blue-500 text-sm bg-white"
                                        >
                                            <option value="">Select</option>
                                            <option value="R">R (Regular)</option>
                                            <option value="SR">SR (Stiff Regular)</option>
                                            <option value="S">S (Stiff)</option>
                                            <option value="X">X (Extra Stiff)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setStep(step + 1)} disabled={!profile.targetUtilityNumber} className="w-full mt-8 bg-trust-navy text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors">次へ</button>
                </StepCard>
            );
        }

        // その他のクラブ種別（ドライバー、FW、アイアン、ボール）のデフォルトStep 3
        return (
            <StepCard title="現在のギア" subtitle="現在使用中のモデルを教えてください" onBack={prevStep}>
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="text-xs font-bold text-slate-400 mb-4 block flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">1</span>
                            ヘッドスペック
                        </label>
                        <BrandModelInput
                            brand={profile.currentBrand}
                            model={profile.currentModel}
                            category={profile.targetCategory || 'DRIVER'}
                            onBrandChange={v => updateProfile('currentBrand', v)}
                            onModelChange={v => updateProfile('currentModel', v)}
                        />
                    </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="text-xs font-bold text-slate-400 mb-4 block flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">2</span>
                                シャフトスペック
                            </label>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1.5 ml-1">シャフトモデル</label>
                                    <input
                                        type="text"
                                        list="shaft-model-suggestions"
                                        value={profile.currentShaftModel}
                                        onChange={e => updateProfile('currentShaftModel', e.target.value)}
                                        placeholder="例: Ventus Blue, Tour AD"
                                        className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-trust-navy outline-none focus:border-golf-500 text-sm"
                                    />
                                    <datalist id="shaft-model-suggestions">
                                        {getShaftModels(profile.targetCategory || 'ドライバー').filter((m: string) =>
                                            !profile.currentShaftModel ||
                                            m.toLowerCase().includes(profile.currentShaftModel.toLowerCase())
                                        ).slice(0, 10).map((m: string) => (
                                            <option key={m} value={m} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1.5 ml-1">重量</label>
                                        <select
                                            value={profile.currentShaftWeight}
                                            onChange={e => updateProfile('currentShaftWeight', e.target.value)}
                                            className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-trust-navy outline-none focus:border-golf-500 text-sm bg-white"
                                        >
                                            <option value="">Select</option>
                                            {getShaftWeightOptions(profile.targetCategory || 'ドライバー').map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1.5 ml-1">フレックス</label>
                                        <select
                                            value={profile.currentShaftFlex}
                                            onChange={e => updateProfile('currentShaftFlex', e.target.value)}
                                            className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-trust-navy outline-none focus:border-golf-500 text-sm bg-white"
                                        >
                                            <option value="">Select</option>
                                            <option value="R">R (Regular)</option>
                                            <option value="SR">SR (Stiff Regular)</option>
                                            <option value="S">S (Stiff)</option>
                                            <option value="X">X (Extra Stiff)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                    {/* FW用: ドライバーシャフト情報 */}
                    {profile.targetCategory === TargetCategory.FAIRWAY && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <label className="text-xs font-bold text-blue-600 mb-4 block flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-600 flex items-center justify-center text-[10px]">💡</span>
                                現在お使いのドライバーのシャフト
                            </label>
                            <p className="text-xs text-slate-500 mb-4">※シャフトを揃える診断に使用します（任意）</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1.5 ml-1">ドライバーシャフト</label>
                                    <input
                                        type="text"
                                        list="driver-shaft-suggestions"
                                        value={profile.driverShaftModel || ''}
                                        onChange={e => updateProfile('driverShaftModel', e.target.value)}
                                        placeholder="例: Ventus Blue 6S, Speeder NX 50"
                                        className="w-full p-3 border-2 border-blue-200 rounded-xl font-bold text-trust-navy outline-none focus:border-blue-500 text-sm bg-white"
                                    />
                                    <datalist id="driver-shaft-suggestions">
                                        {getShaftModels('ドライバー').filter((m: string) =>
                                            !profile.driverShaftModel ||
                                            m.toLowerCase().includes((profile.driverShaftModel || '').toLowerCase())
                                        ).slice(0, 10).map((m: string) => (
                                            <option key={m} value={m} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">WEIGHT</label>
                                        <select
                                            value={profile.driverShaftWeight || ''}
                                            onChange={e => updateProfile('driverShaftWeight', e.target.value)}
                                            className="w-full p-3 border-2 border-blue-200 rounded-xl font-bold text-trust-navy outline-none focus:border-blue-500 text-sm bg-white"
                                        >
                                            <option value="">Select</option>
                                            {getShaftWeightOptions('ドライバー').map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">FLEX</label>
                                        <select
                                            value={profile.driverShaftFlex || ''}
                                            onChange={e => updateProfile('driverShaftFlex', e.target.value)}
                                            className="w-full p-3 border-2 border-blue-200 rounded-xl font-bold text-trust-navy outline-none focus:border-blue-500 text-sm bg-white"
                                        >
                                            <option value="">Select</option>
                                            <option value="R">R (Regular)</option>
                                            <option value="SR">SR (Stiff Regular)</option>
                                            <option value="S">S (Stiff)</option>
                                            <option value="X">X (Extra Stiff)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={() => setStep(step + 1)} disabled={!profile.currentBrand} className="w-full mt-8 bg-trust-navy text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-trust-navy transition-colors">
                    次へ
                </button>
            </StepCard>
        );
    }


    // Step 4: User Profile
    if (step === 4) return (
        <StepCard title="ユーザープロフィール" subtitle="あなたのプロフィール" onBack={prevStep}>
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">性別</label>
                    <div className="flex gap-3">
                        {Object.values(Gender).map(g => (
                            <button key={g} onClick={() => updateProfile('gender', g)} className={`flex-1 py-3 border-2 rounded-xl font-bold transition-all ${profile.gender === g ? 'border-golf-500 bg-golf-50 text-golf-800' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">ゴルフのレベル</label>
                    <div className="flex flex-col gap-3">
                        {Object.values(SkillLevel).map(s => (
                            <OptionButton
                                key={s}
                                label={s}
                                selected={profile.skillLevel === s}
                                onClick={() => updateProfile('skillLevel', s)}
                            />
                        ))}
                    </div>
                </div>

                {/* スコア入力セクション */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">ベストスコア</label>
                        <input 
                            type="number" 
                            placeholder="例: 78"
                            value={profile.bestScore || ''}
                            onChange={(e) => updateProfile('bestScore', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:ring-2 focus:ring-golf-500/20 focus:border-golf-500 transition-all outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">平均スコア</label>
                        <input 
                            type="number" 
                            placeholder="例: 92"
                            value={profile.averageScore || ''}
                            onChange={(e) => updateProfile('averageScore', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:ring-2 focus:ring-golf-500/20 focus:border-golf-500 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>
            <button onClick={() => setStep(step + 1)} disabled={!profile.gender || !profile.skillLevel} className="w-full mt-8 bg-trust-navy text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors">
                次へ
            </button>
        </StepCard>
    );

    // Step 5: Swing Data or Putter Spec
    if (step === 5) {
        if (profile.targetCategory === TargetCategory.PUTTER) {
            // ストロークタイプから推奨形状を計算
            const getRecommendedPutter = () => {
                switch (profile.putterStrokeType) {
                    case 'STRAIGHT':
                        return {
                            head: 'ネオマレット / 大型マレット',
                            neck: 'センターシャフト / フェースバランス',
                            toeHang: '0-15°',
                            reason: 'ストレート軌道には、フェースバランスの大型ヘッドが最適です'
                        };
                    case 'SLIGHT_ARC':
                        return {
                            head: 'マレット / 中型ヘッド',
                            neck: 'ベントネック / ショートスラント',
                            toeHang: '20-30°',
                            reason: '軽いアーク軌道には、適度なトゥハングを持つマレットが最適です'
                        };
                    case 'STRONG_ARC':
                        return {
                            head: 'ブレード（ピン型）/ L字マレット',
                            neck: 'クランクネック / L字ネック',
                            toeHang: '40-50°',
                            reason: '強いアーク軌道には、トゥハングが大きいブレードタイプが最適です'
                        };
                    default:
                        return null;
                }
            };

            const recommended = getRecommendedPutter();

            return (
                <StepCard title="パター診断" subtitle="パッティングスタイルを分析します" onBack={prevStep}>
                    {/* 1. ストロークタイプ（最重要質問） */}
                    <div className="mb-8">
                        <label className="font-bold block mb-2 text-trust-navy text-lg">1. あなたのストロークタイプ</label>
                        <p className="text-xs text-slate-500 mb-4">※パター選びで最も重要な要素です</p>
                        <div className="flex flex-col gap-3">
                            {[
                                { value: 'STRAIGHT', icon: '➡️', label: 'ストレート', desc: '真っ直ぐ引いて真っ直ぐ出す' },
                                { value: 'SLIGHT_ARC', icon: '↩️', label: '軽いアーク', desc: 'やや弧を描く・自然な動き' },
                                { value: 'STRONG_ARC', icon: '🔄', label: '強いアーク', desc: '大きく弧を描く・フェースが開閉' }
                            ].map(t => (
                                <button key={t.value} onClick={() => updateProfile('putterStrokeType', t.value)} className={`flex items-center gap-4 p-4 border-2 rounded-xl font-bold text-left transition-all ${profile.putterStrokeType === t.value ? 'bg-golf-50 border-golf-500 text-golf-800 shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>
                                    <span className="text-2xl">{t.icon}</span>
                                    <div className="flex-1"><div className="text-sm">{t.label}</div><div className="text-xs opacity-60">{t.desc}</div></div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${profile.putterStrokeType === t.value ? 'border-golf-500 bg-golf-500' : 'border-slate-200'}`}>
                                        {profile.putterStrokeType === t.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 推奨形状の表示（ストローク選択後） */}
                    {recommended && (
                        <div className="mb-8 bg-gradient-to-r from-golf-50 to-blue-50 p-5 rounded-2xl border border-golf-200">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">💡</span>
                                <span className="font-bold text-golf-800">AI推奨パター形状</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="bg-white/80 p-3 rounded-xl">
                                    <div className="text-xs text-slate-400 font-bold mb-1">推奨ヘッド</div>
                                    <div className="font-bold text-trust-navy text-sm">{recommended.head}</div>
                                </div>
                                <div className="bg-white/80 p-3 rounded-xl">
                                    <div className="text-xs text-slate-400 font-bold mb-1">推奨ネック</div>
                                    <div className="font-bold text-trust-navy text-sm">{recommended.neck}</div>
                                </div>
                            </div>
                            <p className="text-xs text-golf-700">{recommended.reason}</p>
                            <div className="mt-2 text-xs text-slate-500">トゥハング目安: {recommended.toeHang}</div>
                        </div>
                    )}

                    {/* 2. パッティングの悩み（複数選択） */}
                    <div className="mb-8">
                        <label className="font-bold block mb-4 text-trust-navy text-lg">2. パッティングの悩み（複数選択可）</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: 'SHORT', icon: '📉', label: 'ショートが多い' },
                                { value: 'OVER', icon: '📈', label: 'オーバーが多い' },
                                { value: 'PUSH', icon: '➡️', label: '右に外す' },
                                { value: 'PULL', icon: '⬅️', label: '左に外す' },
                                { value: 'OFF_CENTER', icon: '🎯', label: '芯を外す' },
                                { value: 'LINE', icon: '👁️', label: 'ライン読みが苦手' }
                            ].map(m => (
                                <button key={m.value} onClick={() => {
                                    const cur = profile.putterMiss || [];
                                    const next = cur.includes(m.value as any) ? cur.filter(v => v !== m.value) : [...cur, m.value as any];
                                    updateProfile('putterMiss', next);
                                }} className={`p-3 border-2 rounded-xl font-bold transition-all flex items-center gap-2 ${profile.putterMiss?.includes(m.value as any) ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>
                                    <span>{m.icon}</span>
                                    <span className="text-sm">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. グリーンスピードの傾向 */}
                    <div className="mb-8">
                        <label className="font-bold block mb-4 text-trust-navy text-lg">3. よくプレーするグリーンのスピード</label>
                        <div className="flex gap-3">
                            {[
                                { value: 'FAST', icon: '⚡', label: '速い（高速グリーン）' },
                                { value: 'NORMAL', icon: '📊', label: '普通' },
                                { value: 'SLOW', icon: '🐢', label: '遅い（重いグリーン）' }
                            ].map(g => (
                                <button key={g.value} onClick={() => updateProfile('greenSpeedPreference' as any, g.value)} className={`flex-1 p-3 border-2 rounded-xl font-bold text-center transition-all ${(profile as any).greenSpeedPreference === g.value ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>
                                    <div className="text-lg mb-1">{g.icon}</div>
                                    <div className="text-xs">{g.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4. 好みの打感 */}
                    <div className="mb-8">
                        <label className="font-bold block mb-4 text-trust-navy text-lg">4. 好みの打感</label>
                        <div className="flex gap-3">
                            {[
                                { value: 'SOFT', icon: '☁️', label: 'ソフト', desc: '柔らかい打感' },
                                { value: 'FIRM', icon: '🔨', label: 'ファーム', desc: 'しっかりした打感' }
                            ].map(t => (
                                <button key={t.value} onClick={() => updateProfile('putterFeel', t.value)} className={`flex-1 flex items-center justify-center gap-3 p-4 border-2 rounded-xl font-bold transition-all ${profile.putterFeel === t.value ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>
                                    <span className="text-2xl">{t.icon}</span>
                                    <div><div className="text-sm">{t.label}</div><div className="text-xs opacity-60">{t.desc}</div></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5. パターの長さ */}
                    <div className="mb-8">
                        <label className="font-bold block mb-4 text-trust-navy text-lg">5. 希望するパターの長さ</label>
                        <div className="flex flex-wrap gap-2">
                            {['32"', '33"', '34"', '35"', 'わからない'].map(len => (
                                <button key={len} onClick={() => updateProfile('putterLength', len)} className={`py-2 px-4 border-2 rounded-xl font-bold transition-all ${profile.putterLength === len ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>{len}</button>
                            ))}
                        </div>
                    </div>

                    {/* 6. 現在使用中のパター（任意） */}
                    <div className="mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="font-bold block mb-3 text-trust-navy text-lg">6. 現在使用中のパター（任意）</label>
                        <p className="text-xs text-slate-500 mb-3">※比較分析に使用します</p>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <PutterHeadSelector selected={profile.currentPutterHead} onSelect={v => updateProfile('currentPutterHead', v)} />
                        </div>
                        <div className="text-xs text-slate-400 mb-2">ネックタイプ</div>
                        <div className="grid grid-cols-3 gap-3">
                            <PutterNeckSelector selected={profile.currentPutterNeck} onSelect={v => updateProfile('currentPutterNeck', v)} />
                        </div>
                    </div>

                    <button onClick={() => setStep(8)} disabled={!profile.putterStrokeType} className="w-full mt-4 bg-trust-navy text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors">AI診断を実行</button>
                </StepCard>
            );
        }

        // For Ball & Clubs: Show Swing Data
        return (
            <StepCard title="スイングデータ" subtitle="スイングの特徴を教えてください" onBack={prevStep}>
                <div className="bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-inner mb-8">
                    <label className="font-bold block mb-2 text-trust-navy text-lg flex justify-between items-end">
                        <span>ドライバーのヘッドスピード</span>
                        <span className="text-golf-600 text-3xl font-black font-eng">{profile.headSpeed}<span className="text-sm text-slate-400 font-medium ml-1">m/s</span></span>
                    </label>
                    <p className="text-xs text-slate-500 mb-4">※ドライバー計測値。計測したことがない場合は推定値でOKです。</p>
                    <div className="px-2">
                        <input
                            type="range"
                            min="30"
                            max="55"
                            value={profile.headSpeed}
                            onChange={e => updateProfile('headSpeed', parseInt(e.target.value))}
                            className="range-slider mb-4"
                        />
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-400 px-1 font-eng">
                        <span>30</span>
                        <span>40</span>
                        <span>55+</span>
                    </div>
                </div>

                <div className="mt-8">
                    <label className="font-bold block mb-4 text-trust-navy text-lg">スイングテンポ</label>
                    <div className="flex flex-col gap-3">
                        {[
                            { value: SwingTempo.FAST, icon: '⚡', desc: '速い・切り返しが鋭い' },
                            { value: SwingTempo.NORMAL, icon: '📊', desc: '普通・標準的なテンポ' },
                            { value: SwingTempo.SMOOTH, icon: '🌊', desc: 'ゆったり・大きな弧' }
                        ].map(t => (
                            <button
                                key={t.value}
                                onClick={() => updateProfile('swingTempo', t.value)}
                                className={`flex items-center gap-5 p-5 border rounded-2xl font-bold text-left transition-all duration-300 active:scale-[0.98] group ${profile.swingTempo === t.value
                                    ? 'bg-golf-50/80 border-golf-500 text-golf-800 shadow-md ring-2 ring-golf-100'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300 hover:shadow-sm'}`}
                            >
                                <span className={`text-3xl transition-transform duration-300 ${profile.swingTempo === t.value ? 'scale-110' : 'group-hover:scale-110'}`}>{t.icon}</span>
                                <div>
                                    <div className={`text-base md:text-lg ${profile.swingTempo === t.value ? 'text-trust-navy' : ''}`}>{t.desc.split('・')[0]}</div>
                                    <div className="text-xs opacity-60 font-medium">{t.desc.split('・')[1]}</div>
                                </div>
                                <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${profile.swingTempo === t.value ? 'border-golf-500 bg-golf-500' : 'border-slate-200'}`}>
                                    {profile.swingTempo === t.value && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 弾道高さの好み（ドライバー、FW、UT、アイアン） */}
                {profile.targetCategory !== TargetCategory.BALL && profile.targetCategory !== TargetCategory.WEDGE && (
                    <div className="mt-8">
                        <label className="font-bold block mb-4 text-trust-navy text-lg">好みの弾道高さ</label>
                        <div className="flex flex-col gap-3">
                            {[
                                { value: 'HIGH', icon: '🚀', label: '高弾道', desc: 'キャリーで飛ばしたい' },
                                { value: 'MID', icon: '📊', label: '中弾道', desc: 'バランス重視' },
                                { value: 'LOW', icon: '⬇️', label: '低弾道', desc: '風に強い・ライナー' }
                            ].map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => updateProfile('preferredTrajectory', t.value)}
                                    className={`flex items-center gap-5 p-4 border rounded-2xl font-bold text-left transition-all ${profile.preferredTrajectory === t.value
                                        ? 'bg-golf-50/80 border-golf-500 text-golf-800 shadow-md'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}
                                >
                                    <span className="text-2xl">{t.icon}</span>
                                    <div>
                                        <div className="text-base">{t.label}</div>
                                        <div className="text-xs opacity-60">{t.desc}</div>
                                    </div>
                                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${profile.preferredTrajectory === t.value ? 'border-golf-500 bg-golf-500' : 'border-slate-200'}`}>
                                        {profile.preferredTrajectory === t.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 球筋（軌道）の好み（ドライバー、FW、UT、アイアン） */}
                {profile.targetCategory !== TargetCategory.BALL && profile.targetCategory !== TargetCategory.WEDGE && (
                    <div className="mt-8">
                        <label className="font-bold block mb-4 text-trust-navy text-lg">好みの球筋（軌道）</label>
                        <div className="flex flex-col gap-3">
                            {[
                                { value: 'STRAIGHT', icon: '➡️', label: 'ストレート', desc: '真っ直ぐ飛ばしたい' },
                                { value: 'FADE', icon: '↗️', label: 'フェード', desc: '軽く左から右へ' },
                                { value: 'DRAW', icon: '↖️', label: 'ドロー', desc: '軽く右から左へ' }
                            ].map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => updateProfile('preferredBallFlight', t.value)}
                                    className={`flex items-center gap-5 p-4 border rounded-2xl font-bold text-left transition-all ${profile.preferredBallFlight === t.value
                                        ? 'bg-golf-50/80 border-golf-500 text-golf-800 shadow-md'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}
                                >
                                    <span className="text-2xl">{t.icon}</span>
                                    <div>
                                        <div className="text-base">{t.label}</div>
                                        <div className="text-xs opacity-60">{t.desc}</div>
                                    </div>
                                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${profile.preferredBallFlight === t.value ? 'border-golf-500 bg-golf-500' : 'border-slate-200'}`}>
                                        {profile.preferredBallFlight === t.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== ドライバー専用詳細質問 ===== */}
                {profile.targetCategory === TargetCategory.DRIVER && (
                    <>
                        <div className="mt-8">
                            <label className="font-bold block mb-4 text-trust-navy text-lg">ヘッド体積の好み</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { value: 'LARGE', icon: '🔵', label: '大型ヘッド (460cc)', desc: '安心感・寛容性重視' },
                                    { value: 'COMPACT', icon: '🔘', label: 'コンパクト (440cc以下)', desc: '操作性・顔の良さ重視' },
                                    { value: 'ANY', icon: '⚪', label: 'こだわらない', desc: '性能優先' }
                                ].map(t => (
                                    <button key={t.value} onClick={() => updateProfile('headVolumePreference', t.value)} className={`flex items-center gap-4 p-4 border rounded-xl font-bold text-left transition-all ${profile.headVolumePreference === t.value ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>
                                        <span className="text-xl">{t.icon}</span>
                                        <div><div className="text-sm">{t.label}</div><div className="text-xs opacity-60">{t.desc}</div></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8">
                            <label className="font-bold block mb-4 text-trust-navy text-lg">シャフトの調子（キックポイント）</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { value: 'TIP', icon: '⬆️', label: '先調子', desc: '先が走る・つかまりやすい' },
                                    { value: 'MID', icon: '⏸️', label: '中調子', desc: '癖がない・万能' },
                                    { value: 'BUTT', icon: '⬇️', label: '元調子', desc: '手元がしなる・叩ける' },
                                    { value: 'UNKNOWN', icon: '❓', label: 'わからない', desc: 'AI におまかせ' }
                                ].map(t => (
                                    <button key={t.value} onClick={() => updateProfile('shaftKickPoint', t.value)} className={`flex items-center gap-4 p-4 border rounded-xl font-bold text-left transition-all ${profile.shaftKickPoint === t.value ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>
                                        <span className="text-xl">{t.icon}</span>
                                        <div><div className="text-sm">{t.label}</div><div className="text-xs opacity-60">{t.desc}</div></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ===== FW専用詳細質問 ===== */}
                {profile.targetCategory === TargetCategory.FAIRWAY && (
                    <>
                        <div className="mt-8">
                            <label className="font-bold block mb-4 text-trust-navy text-lg">主なFW番手</label>
                            <div className="grid grid-cols-4 gap-3">
                                {(['3W', '5W', '7W', '9W'] as const).map(num => (
                                    <button key={num} onClick={() => updateProfile('mainFairwayNumber', num)} className={`py-3 border-2 rounded-xl font-bold transition-all ${profile.mainFairwayNumber === num ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>{num}</button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8">
                            <label className="font-bold block mb-4 text-trust-navy text-lg">FWの主な使用シーン</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { value: 'TEE', icon: '⛳', label: 'ティーショット中心', desc: 'Par4やPar5のティーで使う' },
                                    { value: 'GROUND', icon: '🌱', label: '地面からが多い', desc: 'セカンドショットで多用' },
                                    { value: 'BOTH', icon: '🔀', label: '両方均等', desc: 'どちらでも使う' }
                                ].map(t => (
                                    <button key={t.value} onClick={() => updateProfile('fwUsageScene', t.value)} className={`flex items-center gap-4 p-4 border rounded-xl font-bold text-left transition-all ${profile.fwUsageScene === t.value ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>
                                        <span className="text-xl">{t.icon}</span>
                                        <div><div className="text-sm">{t.label}</div><div className="text-xs opacity-60">{t.desc}</div></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8 bg-blue-50 p-5 rounded-2xl border border-blue-200">
                            <label className="font-bold block mb-3 text-trust-navy text-lg">💡 ドライバーのシャフトと揃えますか？</label>
                            <p className="text-xs text-slate-500 mb-4">FWはドライバーと同じ系統のシャフトに揃えるのが基本です。</p>
                            <div className="flex gap-3">
                                {[
                                    { value: 'YES', label: '✅ はい（同じ系統を推奨）' },
                                    { value: 'NO', label: '❌ いいえ（別で選びたい）' }
                                ].map(opt => (
                                    <button key={opt.value} onClick={() => updateProfile('matchDriverShaft', opt.value)} className={`flex-1 py-3 px-4 border-2 rounded-xl font-bold text-sm transition-all ${profile.matchDriverShaft === opt.value ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>{opt.label}</button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ===== UT専用詳細質問 ===== */}
                {profile.targetCategory === TargetCategory.UTILITY && (
                    <>
                        <div className="mt-8">
                            <label className="font-bold block mb-4 text-trust-navy text-lg">置き換えたいアイアン番手</label>
                            <div className="flex flex-wrap gap-2">
                                {['2I', '3I', '4I', '5I', 'なし'].map(num => (
                                    <button key={num} onClick={() => updateProfile('ironReplacement', num)} className={`py-2 px-4 border-2 rounded-xl font-bold transition-all ${profile.ironReplacement === num ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>{num}</button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8">
                            <label className="font-bold block mb-4 text-trust-navy text-lg">好みのUT形状</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { value: 'WOOD', icon: '🟢', label: 'ウッド型', desc: '丸くて大きめ・つかまりやすい' },
                                    { value: 'IRON', icon: '🔷', label: 'アイアン型', desc: '薄くてシャープ・操作性重視' },
                                    { value: 'HYBRID', icon: '⚪', label: 'ハイブリッド型', desc: '中間的な形状' }
                                ].map(t => (
                                    <button key={t.value} onClick={() => updateProfile('utShapePreference', t.value)} className={`flex items-center gap-4 p-4 border rounded-xl font-bold text-left transition-all ${profile.utShapePreference === t.value ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>
                                        <span className="text-xl">{t.icon}</span>
                                        <div><div className="text-sm">{t.label}</div><div className="text-xs opacity-60">{t.desc}</div></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ===== アイアン専用詳細質問 ===== */}
                {profile.targetCategory === TargetCategory.IRON && (
                    <>
                        <div className="mt-8">
                            <label className="font-bold block mb-4 text-trust-navy text-lg">シャフトタイプ</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { value: 'STEEL', icon: '🔩', label: 'スチール', desc: '安定性・コントロール重視' },
                                    { value: 'CARBON', icon: '🪶', label: 'カーボン', desc: '軽量・飛距離重視' },
                                    { value: 'UNKNOWN', icon: '❓', label: 'わからない/どちらでも', desc: 'AI におまかせ' }
                                ].map(t => (
                                    <button key={t.value} onClick={() => updateProfile('ironShaftType', t.value)} className={`flex items-center gap-4 p-4 border rounded-xl font-bold text-left transition-all ${profile.ironShaftType === t.value ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>
                                        <span className="text-xl">{t.icon}</span>
                                        <div><div className="text-sm">{t.label}</div><div className="text-xs opacity-60">{t.desc}</div></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8">
                            <label className="font-bold block mb-4 text-trust-navy text-lg">ソール幅の好み</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { value: 'WIDE', icon: '📏', label: 'ワイドソール', desc: 'ミスに強い・やさしい' },
                                    { value: 'NORMAL', icon: '➖', label: '標準', desc: 'バランス型' },
                                    { value: 'THIN', icon: '📐', label: '薄いソール', desc: '操作性・抜けの良さ' }
                                ].map(t => (
                                    <button key={t.value} onClick={() => updateProfile('soleWidthPreference', t.value)} className={`flex items-center gap-4 p-4 border rounded-xl font-bold text-left transition-all ${profile.soleWidthPreference === t.value ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>
                                        <span className="text-xl">{t.icon}</span>
                                        <div><div className="text-sm">{t.label}</div><div className="text-xs opacity-60">{t.desc}</div></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8">
                            <label className="font-bold block mb-4 text-trust-navy text-lg">セット構成（5-PW等）</label>
                            <input type="text" value={profile.ironSetComposition || ''} onChange={e => updateProfile('ironSetComposition', e.target.value)} placeholder="例: 5-PW, 6-GW" className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-trust-navy outline-none focus:border-golf-500 text-sm" />
                        </div>
                    </>
                )}

                {/* ===== ウェッジ専用詳細質問 ===== */}
                {profile.targetCategory === TargetCategory.WEDGE && (
                    <>
                        <div className="mt-8">
                            <label className="font-bold block mb-4 text-trust-navy text-lg">診断モード</label>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => updateProfile('wedgeDiagnosisMode', 'REPLACE')}
                                    className={`p-4 border-2 rounded-xl font-bold text-left transition-all ${profile.wedgeDiagnosisMode === 'REPLACE' ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">🔄</span>
                                        <div>
                                            <div className="text-lg">セット見直し (リプレース)</div>
                                            <div className="text-sm opacity-70">PWのロフトに合わせて最適な3〜4本を提案します</div>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => updateProfile('wedgeDiagnosisMode', 'ADD')}
                                    className={`p-4 border-2 rounded-xl font-bold text-left transition-all ${profile.wedgeDiagnosisMode === 'ADD' ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">➕</span>
                                        <div>
                                            <div className="text-lg">単品購入 (買い足し)</div>
                                            <div className="text-sm opacity-70">特定のロフトのウェッジを1本探します</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* ADDモード：欲しいロフト */}
                        {profile.wedgeDiagnosisMode === 'ADD' && (
                            <div className="mt-8 animate-fadeIn">
                                <label className="font-bold block mb-4 text-trust-navy text-lg">欲しいロフト角</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['46', '48', '50', '52', '54', '56', '58', '60'].map(loft => (
                                        <button
                                            key={loft}
                                            onClick={() => updateProfile('targetWedgeLoft', loft)}
                                            className={`py-3 border-2 rounded-xl font-bold transition-all ${profile.targetWedgeLoft === loft ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}
                                        >
                                            {loft}°
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* REPLACEモードの詳細設定 */}
                        {profile.wedgeDiagnosisMode === 'REPLACE' && (
                            <div className="mt-8 animate-fadeIn space-y-8">
                                {/* PWロフト (必須 - Step 3で未入力の場合のみ) */}
                                <div>
                                    <label className="font-bold block mb-4 text-trust-navy text-lg">PWのロフト角 (基準)</label>
                                    {profile.wedgePwLoft ? (
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center">
                                            <div>
                                                <span className="text-xs text-blue-600 font-bold block">登録済み</span>
                                                <span className="text-2xl font-black text-trust-navy">{profile.wedgePwLoft}</span>
                                            </div>
                                            <button onClick={() => updateProfile('wedgePwLoft', '')} className="text-xs text-blue-500 underline">変更する</button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-xs text-slate-500 mb-3">※ウェッジ構成決定の基準になります</p>
                                            <div className="flex flex-wrap gap-2">
                                                {['43°以下', '44°', '45°', '46°', '47°', '48°以上'].map(loft => (
                                                    <button key={loft} onClick={() => updateProfile('wedgePwLoft', loft)} className={`py-2 px-4 border-2 rounded-xl font-bold transition-all ${profile.wedgePwLoft === loft ? 'bg-golf-50 border-golf-500 text-golf-800' : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'}`}>{loft}</button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* バウンス/ソール好みのヒアリング (Vokey Reference) */}
                                <div>
                                    <label className="font-bold block mb-4 text-trust-navy text-lg">入射角・ディボット跡</label>
                                    <div className="grid gap-3">
                                        {[
                                            { val: 'HIGH', label: '深く削れる (打ち込む)', desc: 'ハイバウンス推奨' },
                                            { val: 'MID', label: '普通', desc: 'ミッドバウンス推奨' },
                                            { val: 'LOW', label: 'ほとんど削れない (払う)', desc: 'ローバウンス推奨' }
                                        ].map(opt => (
                                            <button key={opt.val} onClick={() => updateProfile('wedgeBounce', opt.val)} className={`p-3 border-2 rounded-xl text-left transition-all ${profile.wedgeBounce === opt.val ? 'bg-golf-50 border-golf-500' : 'bg-white border-slate-200'}`}>
                                                <div className="font-bold text-trust-navy">{opt.label}</div>
                                                <div className="text-xs text-slate-500">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold block mb-4 text-trust-navy text-lg">バンカーの砂質・苦手意識</label>
                                    <div className="grid gap-3">
                                        {[
                                            { val: 'HIGH', label: 'バンカーが苦手 / ふかふかの砂が多い', desc: '幅広ソール・ハイバウンス' },
                                            { val: 'NORMAL', label: '普通 / 標準的な砂', desc: '標準ソール' },
                                            { val: 'LOW', label: 'バンカーは得意 / 硬い砂が多い', desc: '多機能グラインド' }
                                        ].map(opt => (
                                            <button key={opt.val} onClick={() => updateProfile('bunkerFrequency', opt.val)} className={`p-3 border-2 rounded-xl text-left transition-all ${profile.bunkerFrequency === opt.val ? 'bg-golf-50 border-golf-500' : 'bg-white border-slate-200'}`}>
                                                <div className="font-bold text-trust-navy">{opt.label}</div>
                                                <div className="text-xs text-slate-500">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <button onClick={() => setStep(step + 1)} disabled={!profile.swingTempo} className="w-full mt-10 bg-trust-navy text-white py-4 md:py-5 rounded-full font-bold text-lg shadow-xl shadow-trust-navy/20 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all">メーカー選択へ</button>
            </StepCard>
        );
    }


    // Step 6: Preferences (Ball) or Analysis (Club)
    if (step === 6) {
        if (profile.targetCategory === TargetCategory.BALL) {
            return (
                <StepCard title="ボールの好み" subtitle="好みと重要視するポイント" onBack={prevStep}>
                    <BallPreferenceSelector
                        preferences={profile.ballPreferences}
                        userProfile={profile}
                        onChange={v => updateProfile('ballPreferences', v)}
                        onProfileChange={updateProfile}
                    />
                    <button onClick={() => setStep(7)} className="w-full mt-8 bg-trust-navy text-white py-4 rounded-xl font-bold hover:bg-slate-800">
                        計測データへ
                    </button>
                </StepCard>
            );
        }

        // クラブ別ミスタイプを取得
        const clubMissTypes = CLUB_SPECIFIC_MISS_TYPES[profile.targetCategory || TargetCategory.DRIVER] || [];

        return (
            <StepCard title="詳細分析" subtitle={`${profile.targetCategory || 'クラブ'}の悩みやミスの傾向`} onBack={prevStep}>
                <div className="space-y-6">
                    <div>
                        <label className="font-bold block mb-3">ミス傾向 (複数選択可)</label>
                        <p className="text-xs text-slate-500 mb-4">※ {profile.targetCategory || 'このクラブ'}でよくあるミスを選択してください</p>
                        <div className="grid grid-cols-2 gap-3">
                            {clubMissTypes.map(m => (
                                <button key={m.value} onClick={() => {
                                    const cur = profile.missTendencies || [];
                                    const next = cur.includes(m.value as MissType) ? cur.filter(v => v !== m.value) : [...cur, m.value as MissType];
                                    updateProfile('missTendencies', next);
                                }} className={`text-xs md:text-sm p-3 md:p-4 border-2 rounded-xl font-bold transition-all flex items-center gap-2 ${profile.missTendencies.includes(m.value as MissType) ? 'bg-golf-50 border-golf-500 text-golf-800 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
                                    <span className="text-lg">{m.icon}</span>
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <label className="font-bold block mb-3 text-trust-navy text-lg">具体的な悩みやこだわり (任意)</label>
                        <p className="text-xs text-slate-500 mb-4">今の${profile.targetCategory || 'クラブ'}について、AIに伝えたいことを具体的に入力してください</p>
                        <textarea
                            value={profile.freeComments || ''}
                            onChange={(e) => updateProfile('freeComments', e.target.value)}
                            placeholder="例：170ydを楽に打ちたい。スライスを抑えたい。最新だけでなく中古の名器も知りたい。"
                            className="w-full p-4 bg-white text-slate-900 border-2 border-slate-200 rounded-xl outline-none focus:border-golf-500 min-h-[120px] text-sm md:text-base shadow-sm"
                        />
                    </div>
                </div>
                <button onClick={() => setStep(7)} className="w-full mt-8 bg-trust-navy text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors">次へ</button>
            </StepCard>
        );
    }

    // Step 7: Shot Data / Measurement
    if (step === 7) {
        if (profile.targetCategory === TargetCategory.BALL) {
            return (
                <StepCard title="計測データ（任意）" subtitle="計測データがあれば入力してください" onBack={prevStep}>
                    <AdvancedShotInput
                        data={profile.shotData}
                        onChange={v => updateProfile('shotData', v)}
                    />
                    <button onClick={() => setStep(8)} className="w-full mt-8 bg-trust-navy text-white py-4 rounded-xl font-bold hover:bg-slate-800">
                        メーカー選択へ
                    </button>
                </StepCard>
            );
        }

        const updateMeasurement = (key: keyof typeof profile.measurementData, value: string) => {
            setProfile({
                ...profile,
                measurementData: { ...profile.measurementData, [key]: value }
            });
        };

        return (
            <StepCard title="計測データ" subtitle={`${profile.targetCategory || 'クラブ'}の計測データ（任意）`} onBack={prevStep}>
                <div className="mb-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={profile.hasMeasurementData}
                            onChange={e => updateProfile('hasMeasurementData', e.target.checked)}
                            className="w-5 h-5 accent-golf-600"
                        />
                        <span className="font-bold text-trust-navy">計測データを持っている（トラックマン、GC Quad等）</span>
                    </label>
                </div>

                {profile.hasMeasurementData && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-4">
                            <p className="text-sm text-blue-800">💡 計測データを入力すると、より精度の高い診断が可能になります</p>
                        </div>

                        {/* クラブ別計測項目 */}
                        {(() => {
                            const measurementFields = CLUB_MEASUREMENT_FIELDS[profile.targetCategory || TargetCategory.DRIVER] || [];
                            if (measurementFields.length === 0) {
                                return (
                                    <p className="text-sm text-slate-500">このカテゴリには計測データ入力項目がありません。</p>
                                );
                            }
                            return (
                                <div className="grid grid-cols-2 gap-4">
                                    {measurementFields.map(field => (
                                        <div key={field.key}>
                                            <label className="block text-xs font-bold text-slate-500 mb-2">
                                                {field.label} {field.unit && `(${field.unit})`}
                                            </label>
                                            <input
                                                type="text"
                                                value={(profile.measurementData as Record<string, string>)[field.key] || ''}
                                                onChange={e => updateMeasurement(field.key as keyof typeof profile.measurementData, e.target.value)}
                                                placeholder={`例: ${field.placeholder}`}
                                                className="w-full p-3 bg-white text-slate-900 border-2 border-slate-200 rounded-xl outline-none focus:border-golf-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}

                <button onClick={() => setStep(8)} className="w-full mt-8 bg-trust-navy text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                    {profile.hasMeasurementData ? 'データを登録して次へ' : 'スキップして次へ'}
                </button>
            </StepCard>
        );
    }

    // Step 8: Brand Selection (Shared with Wedge Step 10)
    if (step === 8 || (profile.targetCategory === TargetCategory.WEDGE && step === 10)) {
        const isClub = profile.targetCategory !== TargetCategory.PUTTER;
        const showHeadBrands = !isClub || profile.diagnosisMode !== DiagnosisMode.SHAFT_ONLY; // ボール・パターは常に表示、クラブはシャフトのみ以外で表示
        const showShaftBrands = isClub && (profile.diagnosisMode === DiagnosisMode.SHAFT_ONLY || profile.diagnosisMode === DiagnosisMode.FULL_SPEC);

        const toggleShaftBrand = (brand: string) => {
            const current = profile.preferredShaftBrands || [];
            if (current.includes(brand)) {
                updateProfile('preferredShaftBrands', current.filter(b => b !== brand));
            } else {
                updateProfile('preferredShaftBrands', [...current, brand]);
            }
        };

        const addCustomShaft = (val: string) => {
            if (val && !(profile.preferredShaftBrands || []).includes(val)) {
                updateProfile('preferredShaftBrands', [...(profile.preferredShaftBrands || []), val]);
            }
        };

        const isHeadValid = !showHeadBrands || profile.brandPreferenceMode === 'any' || (profile.preferredBrands && profile.preferredBrands.length > 0);
        const finalCanProceed = isHeadValid;

        return (
            <StepCard title="メーカー選択" subtitle="こだわりメーカーはありますか？" onBack={prevStep}>
                <div className="space-y-8">
                    {/* Head Brands */}
                    {showHeadBrands && (
                        <div>
                            {showShaftBrands && <h3 className="font-bold text-trust-navy text-lg mb-3">1. ヘッドメーカー</h3>}
                            <BrandSelector
                                category={profile.targetCategory || TargetCategory.DRIVER}
                                selectedBrands={profile.preferredBrands || []}
                                preferenceMode={profile.brandPreferenceMode || 'any'}
                                onChange={brands => updateProfile('preferredBrands', brands)}
                                onPreferenceModeChange={mode => updateProfile('brandPreferenceMode', mode)}
                            />
                        </div>
                    )}

                    {/* Shaft Brands */}
                    {showShaftBrands && (
                        <div className="animate-fadeIn">
                            {showHeadBrands && <h3 className="font-bold text-trust-navy text-lg mb-3">2. シャフトメーカー（任意）</h3>}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="text-xs font-bold text-slate-400 mb-3 block">好みのシャフトメーカー（複数選択可）</label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {SHAFT_MANUFACTURERS.map(brand => {
                                        const isSelected = (profile.preferredShaftBrands || []).includes(brand);
                                        return (
                                            <button
                                                key={brand}
                                                onClick={() => toggleShaftBrand(brand)}
                                                className={`py-2 px-3 md:px-4 border-2 rounded-xl font-bold text-xs md:text-sm transition-all ${isSelected
                                                    ? 'bg-golf-50 border-golf-500 text-golf-800'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-golf-300'
                                                    }`}
                                            >
                                                {isSelected && '✓ '}{brand}
                                            </button>
                                        );
                                    })}
                                </div>

                                <label className="text-xs font-bold text-slate-400 mb-2 block">その他のメーカー（自由入力）</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="例: Seven Dreamers"
                                        className="flex-1 p-3 bg-white text-slate-900 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-golf-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addCustomShaft(e.currentTarget.value);
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                        onBlur={(e) => {
                                            if (e.target.value) {
                                                addCustomShaft(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </div>
                                {/* 追加されたカスタムシャフトの表示 */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(profile.preferredShaftBrands || []).filter(b => !SHAFT_MANUFACTURERS.includes(b)).map(brand => (
                                        <button
                                            key={brand}
                                            onClick={() => toggleShaftBrand(brand)}
                                            className="py-1 px-3 border border-golf-300 bg-golf-50 text-golf-700 rounded-lg text-xs font-bold flex items-center gap-1"
                                        >
                                            {brand} <span className="text-[10px]">✕</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setStep(step + 1)}
                    disabled={!finalCanProceed}
                    className="w-full mt-8 bg-trust-navy text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    最終確認へ
                </button>
            </StepCard>
        );
    }

    // Step 9 / 10 / 11: Final Check
    if (step === 9 || (profile.targetCategory === TargetCategory.WEDGE && step === 11)) {


        // クラブ名を英語パスに変換
        const getClubPath = (): string => {
            switch (profile.targetCategory) {
                case TargetCategory.DRIVER: return 'driver';
                case TargetCategory.FAIRWAY: return 'fairway';
                case TargetCategory.UTILITY: return 'utility';
                case TargetCategory.IRON: return 'iron';
                case TargetCategory.WEDGE: return 'wedge';
                case TargetCategory.PUTTER: return 'putter';
                case TargetCategory.BALL: return 'ball';
                case TargetCategory.TOTAL_SETTING: return 'total';
                default: return 'driver';
            }
        };

        // モードを英語パスに変換
        const getModePath = (): string => {
            switch (profile.diagnosisMode) {
                case DiagnosisMode.HEAD_ONLY: return 'head';
                case DiagnosisMode.SHAFT_ONLY: return 'shaft';
                case DiagnosisMode.FULL_SPEC: return 'full';
                default: return 'full';
            }
        };

        const handleSubmit = async () => {
            if (isAnalyzing) return; // 二重送信防止
            setManualBackNavigation(false);
            const success = await runDiagnosis();
            if (!success) return; // エラー時はナビゲートしない
            const clubPath = getClubPath();
            const modePath = getModePath();
            // ボールとパターはモード不要
            if (profile.targetCategory === TargetCategory.BALL) {
                trackEvent('diagnosis_result_navigate', {
                    diagnosis_category: 'ball',
                    destination: '/result/ball',
                });
                navigate(`/result/ball`);
            } else if (profile.targetCategory === TargetCategory.PUTTER) {
                trackEvent('diagnosis_result_navigate', {
                    diagnosis_category: 'putter',
                    destination: '/result/putter/head',
                });
                navigate(`/result/putter/head`);
            } else {
                trackEvent('diagnosis_result_navigate', {
                    diagnosis_category: clubPath,
                    diagnosis_mode: modePath,
                    destination: `/result/${clubPath}/${modePath}`,
                });
                navigate(`/result/${clubPath}/${modePath}`);
            }
        };



        /* Removed: redundant wedge check inside Final Check block */

        if (isAnalyzing) {
            return (
                <div className="flex flex-col items-center justify-center w-full min-h-[50h] py-20">
                    <div className="relative mb-12">
                        <div className="w-24 h-24 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-golf-500 rounded-full animate-spin"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl animate-pulse">⛳️</div>
                    </div>
                    <h3 className="font-eng font-black text-3xl md:text-4xl text-trust-navy mb-4 tracking-tighter">ANALYZING SWING DNA</h3>
                    <div className="text-slate-500 text-center space-y-2">
                        <p className="font-bold">2026年モデルを含む市場データを照合中...</p>
                        <p className="text-xs text-slate-400">AI is calculating your optimal trajectory</p>
                    </div>
                </div>
            );
        }

        return (
            <StepCard title="最終確認" subtitle="最後にいくつか確認させてください" onBack={prevStep}>
                <div className="space-y-6">
                    {diagnosisError && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-800">
                            <div className="font-black">診断を完了できませんでした</div>
                            <div className="mt-1">{diagnosisError}</div>
                            <div className="mt-2 text-xs font-bold text-red-700">
                                入力内容は残っています。少し時間をおいて再試行してください。
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="font-bold block mb-2">Free Comments (その他要望)</label>
                        <textarea
                            placeholder="例: 腰痛があるので体に優しいものがいい、など"
                            value={profile.freeComments}
                            onChange={e => updateProfile('freeComments', e.target.value)}
                            className="w-full border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-golf-500 min-h-[100px]"
                        />
                    </div>
                </div>

                {!user.isLoggedIn && (
                    <div className="bg-golf-50 p-5 mt-6 rounded-2xl border border-golf-200">
                        <p className="font-bold text-golf-800 mb-2 flex items-center gap-2">💡 ヒント</p>
                        <p className="text-sm text-golf-700 mb-4">アカウントを作成すると、診断結果やMy Bagデータを永続的に保存できます。</p>
                        <button onClick={() => setShowAuth(true)} className="w-full py-3 bg-white border-2 border-golf-200 text-golf-700 font-bold rounded-xl hover:bg-golf-100 transition-colors">
                            ログイン / 新規登録して保存
                        </button>
                    </div>
                )}

                <button onClick={handleSubmit} disabled={isAnalyzing} className="w-full mt-8 bg-gradient-to-r from-golf-600 to-golf-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-golf-500/30 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    <Zap size={20} fill="currentColor" /> {isAnalyzing ? '診断中...' : 'AI診断を開始'}
                </button>
            </StepCard>
        );
    }

    return null;
};
