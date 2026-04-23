import { Activity, Dumbbell, Zap, Stethoscope, Wrench, AlertTriangle, ChevronDown, Share2, X, Download } from 'lucide-react';
import { useDiagnosis } from '../context/DiagnosisContext';
import { useEffect, useState } from 'react';

import { RadarChart } from '../components/RadarChart';
import { AFFILIATE_SHOPS, getAffiliateUrl } from '../utils/affiliate';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { INITIAL_PROFILE, TargetCategory } from '../types/golf';
import { AiResponseDisplay } from '../components/AiResponseDisplay';
import { BagShareCard } from '../features/share/BagShareCard';
import { trackEvent } from '../lib/analytics';
import { saveDiagnosisRankingsToCompare } from '../lib/diagnosisCompare';

// Trajectory Animation Component (Local or Imported)
const TrajectoryAnimation = () => (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden mix-blend-overlay opacity-30">
        <svg className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id="trajGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                    <stop offset="50%" stopColor="#fff" stopOpacity="1" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d="M -50,450 Q 500,-100 1200,100" fill="none" stroke="url(#trajGradient)" strokeWidth="6" className="animate-slideIn" />
        </svg>
    </div>
);

// URLパラメータから期待される結果タイプを取得（新形式: /result/:club/:mode）
const getExpectedTypeFromUrl = (club: string | undefined, mode: string | undefined): 'BALL' | 'CLUB' | 'SHAFT' | 'PUTTER' | null => {
    const clubLower = club?.toLowerCase();
    const modeLower = mode?.toLowerCase();

    // ボール診断
    if (clubLower === 'ball') return 'BALL';

    // パター診断
    if (clubLower === 'putter') return 'PUTTER';

    // シャフト診断
    if (modeLower === 'shaft') return 'SHAFT';

    // ヘッド診断・フル診断はどちらもCLUBタイプ
    if (['driver', 'fairway', 'utility', 'iron', 'wedge', 'total'].includes(clubLower || '')) {
        return 'CLUB';
    }

    // 旧形式の互換性維持
    if (clubLower === 'shaft') return 'SHAFT';
    if (clubLower === 'club') return 'CLUB';

    return null;
};

export const ResultPage = () => {
    const { resultData, diagnosisError, user, setProfile, resetDiagnosis, setShowAuth, profile } = useDiagnosis();
    const navigate = useNavigate();
    const { club, mode } = useParams<{ club?: string; mode?: string }>();
    const [searchParams] = useSearchParams();
    const [showShareModal, setShowShareModal] = useState(false);
    const compareSource = searchParams.get('source') === 'compare';
    const comparePriorityCategory = searchParams.get('priority');
    const compareProfileName = searchParams.get('profile');
    const compareProfileSlug = searchParams.get('profileSlug');
    const compareBannerTitle = comparePriorityCategory
        ? `${comparePriorityCategory} の差分を見直した結果です`
        : '比較ページで見つけた差分を見直した結果です';
    const compareBannerDescription = compareProfileName
        ? `${compareProfileName} と比べた中で気になったカテゴリを先に診断しています。次の比較や保存までこのまま進めます。`
        : '比較ページで見つけた差分を、そのまま診断結果までつないでいます。';
    const fallbackResultData = !resultData ? (() => {
        try {
            const saved = localStorage.getItem('mybagpro_result_data');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    })() : null;
    const activeResultData = resultData || fallbackResultData;

    if (diagnosisError) {
        return (
            <div className="text-center py-20 bg-slate-50 min-h-screen px-4">
                <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="text-red-500 w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">AI解析エラー</h3>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed">{diagnosisError}</p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => navigate('/diagnosis')} 
                            className="w-full bg-trust-navy text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-slate-800 transition-colors"
                        >
                            診断画面に戻る
                        </button>
                        <button 
                            onClick={() => navigate('/')} 
                            className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-colors"
                        >
                            ホームに戻る
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!activeResultData) {
        return (
            <div className="text-center py-20 bg-slate-50 min-h-screen">
                <p className="text-slate-600 mb-4">保存された診断結果がありません。</p>
                <button onClick={() => navigate('/')} className="text-trust-navy underline font-bold">ホームに戻る</button>
            </div>
        );
    }

    const { result } = activeResultData;

    // URLカテゴリとの整合性チェック（新形式: /result/:club/:mode）
    const expectedTypeFromUrl = getExpectedTypeFromUrl(club, mode);
    const resultType = result?.type || (profile.targetCategory === TargetCategory.BALL ? 'BALL' : 'CLUB');
    const isBallResult = resultType === 'BALL';

    // カテゴリ整合性チェック（警告用）
    const isMismatch = expectedTypeFromUrl && resultType !== expectedTypeFromUrl &&
        !(expectedTypeFromUrl === 'CLUB' && (resultType === 'DRIVER' || resultType === 'IRON')); // CLUBはDRIVER/IRONも許容

    useEffect(() => {
        if (!activeResultData?.result) return;
        trackEvent('diagnosis_result_view', {
            diagnosis_category: profile.targetCategory || club || 'unknown',
            result_type: resultType,
            expected_type: expectedTypeFromUrl || 'none',
            has_ai_response: Boolean(result.aiResponseText),
        });
    }, [activeResultData, profile.targetCategory, club, resultType, expectedTypeFromUrl, result.aiResponseText]);

    const handleRestart = () => {
        resetDiagnosis();
        setProfile(INITIAL_PROFILE);
        navigate('/');
    };

    const topModel = result.rankings[0];
    const primaryShop = AFFILIATE_SHOPS[0];

    const handleSaveTopModel = () => {
        if (!topModel) return;
        const category = profile.targetCategory || TargetCategory.DRIVER;
        const newClub = {
            id: Math.random().toString(36),
            category: category as string,
            brand: topModel.brand || '',
            model: topModel.modelName || '',
            number: topModel.modelName || '',
            flex: '',
            shaft: typeof topModel.shafts?.[0] === 'string' ? topModel.shafts[0] : topModel.shafts?.[0]?.modelName || '',
            loft: topModel.loft ? `${topModel.loft}°` : '',
            distance: '',
        };
        const currentBag = profile.myBag || { clubs: [], ball: '' };
        setProfile({
            ...profile,
            myBag: {
                ...currentBag,
                clubs: [...currentBag.clubs, newClub],
            },
        });
        trackEvent('save_diagnosis_recommendation', {
            diagnosis_category: profile.targetCategory || 'unknown',
            product_brand: topModel.brand || '',
            product_name: topModel.modelName || '',
            is_logged_in: user.isLoggedIn,
        });
        alert(`✅ ${topModel.brand} ${topModel.modelName} をMy Bagに登録しました！`);
    };

    const handleBuyClick = (shopId: typeof AFFILIATE_SHOPS[number]['id']) => {
        if (!topModel) return;
        const shop = AFFILIATE_SHOPS.find((item) => item.id === shopId);
        if (!shop) return;
        trackEvent('click_affiliate_shop', {
            source_page: 'diagnosis_result',
            diagnosis_category: profile.targetCategory || 'unknown',
            shop_id: shop.id,
            shop_name: shop.name,
            brand: topModel.brand || '',
            model_name: topModel.modelName || '',
        });
        window.open(getAffiliateUrl(topModel.brand, topModel.modelName, shop.id), '_blank', 'noopener,noreferrer');
    };

    const handleSaveCompareShortlist = () => {
        if (!Array.isArray(result.rankings) || result.rankings.length === 0) return;
        saveDiagnosisRankingsToCompare(profile, result.rankings);
        trackEvent('save_compare_shortlist', {
            diagnosis_category: profile.targetCategory || 'unknown',
            shortlist_count: Math.min(result.rankings.length, 3),
            top_product_name: topModel?.modelName || '',
        });
        alert('✅ 比較候補をマイページに保存しました。');
        navigate('/mypage');
    };

    const handleSaveAndReturnToCompare = () => {
        if (!Array.isArray(result.rankings) || result.rankings.length === 0) return;
        saveDiagnosisRankingsToCompare(profile, result.rankings);
        trackEvent('save_compare_shortlist', {
            diagnosis_category: profile.targetCategory || 'unknown',
            shortlist_count: Math.min(result.rankings.length, 3),
            top_product_name: topModel?.modelName || '',
            return_target: 'compare',
        });
        if (compareProfileSlug) {
            navigate(`/compare?setting=${encodeURIComponent(compareProfileSlug)}`);
            return;
        }
        navigate('/compare?mode=shortlist');
    };

    return (
        <div className="animate-fadeIn min-h-screen bg-[#f8fafc] pb-16 text-slate-900 md:pb-20">
            <div className="mx-auto w-full max-w-6xl px-4 pt-2 md:px-6">
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 md:mb-6">
                この診断はβ版です。精度向上中です。
            </div>
            {compareSource && (
                <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 md:mb-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700">FROM COMPARE</div>
                    <div className="mt-2 text-base font-black text-trust-navy md:text-lg">{compareBannerTitle}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">{compareBannerDescription}</div>
                </div>
            )}
            {/* Hero Section */}
            <div className="group relative mb-5 h-28 overflow-hidden rounded-[1.5rem] shadow-2xl shadow-slate-900/20 md:mb-8 md:h-56 md:rounded-[2.25rem]">
                {/* Background: Deep Space Navy */}
                <div className="absolute inset-0 bg-[#020617]"></div>

                {/* Animated Cyber Grid */}
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>

                {/* Spotlights */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-golf-500/20 rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

                <TrajectoryAnimation />

                {/* Content Overlay */}
                <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-300 shadow-lg shadow-black/20 backdrop-blur-md md:mb-3 md:px-4 md:text-xs md:tracking-[0.2em]">
                        <Zap size={12} className="text-slate-400" fill="currentColor" />
                        AI Performance Analysis
                    </div>
                    <h2 className="mb-1 text-[1.45rem] font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] font-eng md:text-5xl">
                        IDEAL TRAJECTORY
                    </h2>
                    <p className="text-[10px] font-medium tracking-wider uppercase text-slate-400 md:text-sm">
                        Optimized for your swing DNA
                    </p>
                </div>
            </div>

            {/* カテゴリ不整合警告 */}
            {isMismatch && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-center gap-3">
                    <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0" />
                    <div className="text-xs text-amber-800 font-medium">
                        <strong>注意:</strong> URLで期待されるカテゴリ（{expectedTypeFromUrl}）と診断結果のカテゴリ（{resultType}）が一致しません。
                        正しい診断結果を表示していますか？
                    </div>
                </div>
            )}

            {topModel && (
                <section className="mb-6 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 shadow-xl shadow-slate-200/40 md:mb-8 md:rounded-[2rem] md:px-8 md:py-7">
                    <div className="mb-4 grid gap-2 md:grid-cols-3">
                        <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-3.5 py-3">
                            <div className="text-[10px] font-black tracking-[0.16em] text-slate-400">BEST MATCH</div>
                            <div className="mt-1 text-sm font-black text-trust-navy">{topModel.brand}</div>
                        </div>
                        <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-3.5 py-3">
                            <div className="text-[10px] font-black tracking-[0.16em] text-slate-400">MATCH SCORE</div>
                            <div className="mt-1 text-sm font-black text-trust-navy">{topModel.matchPercentage.toFixed(1)}%</div>
                        </div>
                        <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-3.5 py-3">
                            <div className="text-[10px] font-black tracking-[0.16em] text-slate-400">NEXT STEP</div>
                            <div className="mt-1 text-sm font-black text-trust-navy">
                                {compareSource && comparePriorityCategory ? `${comparePriorityCategory} を保存 or 比較` : '保存 or 比較'}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 md:max-w-[58%]">
                            <div className="text-[11px] font-black tracking-[0.18em] text-golf-700">BEST MATCH</div>
                            <h3 className="mt-2 text-xl font-black text-trust-navy md:text-3xl">
                                {topModel.brand} {topModel.modelName}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600 md:text-base">
                                適合率 {topModel.matchPercentage.toFixed(1)}%。まずはこの1本を保存するか、比較候補に残してから価格を確認するのがおすすめです。
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                                    {result.userSwingDna?.type || '診断結果'}
                                </span>
                                {topModel.shafts?.[0] && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                                        {typeof topModel.shafts[0] === 'string' ? topModel.shafts[0] : topModel.shafts[0].modelName}
                                    </span>
                                )}
                                {topModel.loft && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                                        ロフト {topModel.loft}°
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2.5 md:min-w-[320px] md:max-w-[360px]">
                            <button
                                onClick={() => handleBuyClick(primaryShop.id)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-golf-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-golf-600"
                            >
                                {primaryShop.name}で価格を見る
                            </button>

                            <button
                                onClick={handleSaveCompareShortlist}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                比較候補を残す
                            </button>

                            {compareSource && (
                                <button
                                    onClick={handleSaveAndReturnToCompare}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-5 py-3.5 text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
                                >
                                    比較に戻って差分を見る
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    if (user.isLoggedIn) {
                                        handleSaveTopModel();
                                    } else {
                                        trackEvent('open_auth_from_result', {
                                            diagnosis_category: profile.targetCategory || 'unknown',
                                            product_name: topModel.modelName || '',
                                        });
                                        setShowAuth(true);
                                    }
                                }}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3.5 text-sm font-black text-white transition hover:bg-slate-800"
                            >
                                {user.isLoggedIn ? 'おすすめを保存する' : 'ログインして結果を保存'}
                            </button>

                            <button
                                onClick={() => navigate('/diagnosis')}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                条件を変えてもう一度診断
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* AIのテキスト提案をスマホファーストでリッチに表示 */}
            {result.aiResponseText && (
                <div className="mb-8 md:mb-12">
                     <AiResponseDisplay responseText={result.aiResponseText} />
                </div>
            )}

            {/* 以下は従来の物理ベースの推論データ詳細 (Data Insights) アコーディオン化 */}
            <details className="group mb-8">
                <summary className="flex list-none cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-200/50 py-3 text-sm font-bold text-trust-navy transition-colors select-none hover:bg-slate-200 [&::-webkit-details-marker]:hidden md:text-base">
                    <Wrench size={16} /> 詳細な物理データ分析を見る (Data Insights) <ChevronDown size={16} className="group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-6">
            
            {/* 🆕 総合診断専用：重量フロー & 距離の階段分析 */}
            {profile.targetCategory === TargetCategory.TOTAL_SETTING && (
                <div className="grid md:grid-cols-2 gap-6 mb-12 px-4 md:px-0">
                    {result.weightFlowAnalysis && result.weightFlowAnalysis !== 'なし' && (
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity size={80} className="text-slate-900" />
                            </div>
                            <h4 className="font-eng font-black text-xl mb-4 flex items-center gap-2 text-slate-800">
                                <span className="p-1.5 bg-slate-900 text-white rounded-lg"><Activity size={16} /></span>
                                WEIGHT FLOW ANALYSIS
                            </h4>
                            <p className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                                {result.weightFlowAnalysis}
                            </p>
                        </div>
                    )}
                    {result.distanceGapAnalysis && result.distanceGapAnalysis !== 'なし' && (
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Zap size={80} className="text-slate-900" />
                            </div>
                            <h4 className="font-eng font-black text-xl mb-4 flex items-center gap-2 text-slate-800">
                                <span className="p-1.5 bg-slate-900 text-white rounded-lg"><Zap size={16} /></span>
                                DISTANCE GAP ANALYSIS
                            </h4>
                            <p className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                                {result.distanceGapAnalysis}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {result.currentGearAnalysis &&
                (!profile.currentBrand || (profile.currentBrand !== 'Unknown' && profile.currentBrand !== '')) &&
                (!profile.currentModel || (profile.currentModel !== 'Unknown' && profile.currentModel !== '')) && (
                    <details className="group bg-white rounded-[2rem] mb-8 md:mb-12 relative overflow-hidden transition-all duration-500 shadow-xl shadow-slate-200 border border-slate-100" open>
                        <summary className="font-bold text-lg p-6 md:p-8 flex items-center justify-between cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden relative z-20 hover:bg-slate-50 transition-colors">
                            <span className="flex items-center gap-3 font-eng tracking-wider text-xl">
                                <span className="p-2 bg-slate-100 rounded-xl border border-slate-200"><Activity size={20} className="text-slate-600" /></span>
                                <span className="text-slate-800">CURRENT GEAR ANALYSIS</span>
                            </span>
                            <span className="group-open:rotate-180 transition-transform duration-300 bg-slate-100 rounded-full p-2 border border-slate-200 text-slate-500"><ChevronDown size={20} /></span>
                        </summary>
                        <div className="grid md:grid-cols-2 gap-4 md:gap-8 relative z-10 p-4 md:p-8 pt-0 md:pt-0">
                            <div className="text-center bg-slate-900 p-4 md:p-8 rounded-2xl border border-slate-800 relative overflow-hidden group-hover:border-slate-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/20 opacity-50"></div>
                                <div className="relative z-10">
                                    <div className="text-[10px] md:text-xs font-bold text-slate-400 mb-1 md:mb-2 uppercase tracking-[0.2em] font-eng">Match Score</div>
                                    <div className="text-5xl md:text-8xl font-black text-white text-glow font-eng tracking-tighter">
                                        {result.currentGearAnalysis.matchPercentage.toFixed(1)}<span className="text-2xl md:text-3xl text-slate-500 font-bold ml-1">%</span>
                                    </div>
                                    <div className="text-xs font-bold mt-4 text-white/90 bg-white/10 inline-block px-4 py-1.5 rounded-full border border-white/10 tracking-wider">
                                        {result.currentGearAnalysis.typeDescription.includes('Unknown') || result.currentGearAnalysis.typeDescription.includes('不明')
                                            ? 'No Data'
                                            : result.currentGearAnalysis.typeDescription}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors">
                                    <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-2 uppercase tracking-wider font-eng">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shadow-[0_0_10px_#94a3b8]"></span> PROS
                                    </div>
                                    <div className="text-sm leading-relaxed text-slate-600 font-medium">{result.currentGearAnalysis.pros}</div>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors">
                                    <div className="text-xs font-bold text-red-500 mb-2 flex items-center gap-2 uppercase tracking-wider font-eng">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_#f87171]"></span> CONS
                                    </div>
                                    <div className="text-sm leading-relaxed text-slate-600 font-medium">{result.currentGearAnalysis.cons}</div>
                                </div>
                            </div>
                        </div>
                    </details>
                )}

            {/* 🆕 理想の弾道 & 軌道分析セクション (DRIVER, FW, UT, IRON, WEDGE) */}
            {result.idealTrajectory && (
                <div className="bg-white rounded-[2rem] p-4 md:p-10 mb-6 md:mb-12 relative overflow-hidden border border-slate-200 shadow-xl shadow-slate-100/50">
                    <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50/50 via-white to-transparent pointer-events-none blur-3xl"></div>

                    <div className="relative z-10">
                        <h3 className="font-bold text-lg md:text-xl mb-4 md:mb-6 flex items-center gap-3">
                            <span className="p-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-600"><Activity size={20} /></span>
                            <span className="tracking-wider font-eng text-slate-800">TARGET TRAJECTORY</span>
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-start">
                            {/* 理想パラメータ */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 backdrop-blur-md">
                                <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-[0.2em] font-eng">Target Spec</div>
                                <div className="text-2xl md:text-3xl font-black mb-2 text-slate-800">{result.idealTrajectory.recommendation}</div>
                                <p className="text-xs text-slate-500 mb-6 font-medium">Auto-calculated based on your swing data.</p>
                                <div className="grid grid-cols-3 gap-3 text-center text-xs font-medium text-slate-600">
                                    <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                                        <div className="text-slate-500 text-[10px] mb-1 font-eng tracking-wider">LAUNCH</div>
                                        <div className="font-bold text-lg text-slate-800">{result.idealTrajectory.details?.launchAngle || '-'}</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                                        <div className="text-slate-500 text-[10px] mb-1 font-eng tracking-wider">SPIN</div>
                                        <div className="font-bold text-lg text-slate-800">{result.idealTrajectory.details?.spinRate || '-'}</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                                        <div className="text-slate-500 text-[10px] mb-1 font-eng tracking-wider">HEIGHT</div>
                                        <div className="font-bold text-lg text-slate-800">{result.idealTrajectory.details?.maxHeight || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 現状分析 (データがある場合) */}
                            {result.idealTrajectory.analysis ? (
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-eng">Your Trajectory</div>
                                        <div className="bg-slate-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-slate-500/30 tracking-wider">SCORE: {result.idealTrajectory.analysis.score}</div>
                                    </div>

                                    <div className="space-y-6 mb-6">
                                        {/* Launch Angle Status */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold tracking-wide">
                                                <span className="text-slate-900 font-eng">LAUNCH ANGLE</span>
                                                <span className={`${result.idealTrajectory.analysis.launchStatus === 'ideal' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {result.idealTrajectory.analysis.launchStatus === 'ideal' ? 'PERFECT' : result.idealTrajectory.analysis.launchStatus === 'low' ? 'LOW' : 'HIGH'}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${result.idealTrajectory.analysis.launchStatus === 'ideal' ? 'bg-emerald-500 w-1/2 mx-auto' : result.idealTrajectory.analysis.launchStatus === 'low' ? 'bg-amber-500 w-1/3 ml-0' : 'bg-amber-500 w-1/3 ml-auto'}`}></div>
                                            </div>
                                        </div>

                                        {/* Spin Rate Status */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold tracking-wide">
                                                <span className="text-slate-900 font-eng">SPIN RATE</span>
                                                <span className={`${result.idealTrajectory.analysis.spinStatus === 'ideal' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {result.idealTrajectory.analysis.spinStatus === 'ideal' ? 'PERFECT' : result.idealTrajectory.analysis.spinStatus === 'low' ? 'LOW' : 'HIGH'}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${result.idealTrajectory.analysis.spinStatus === 'ideal' ? 'bg-emerald-500 w-1/2 mx-auto' : result.idealTrajectory.analysis.spinStatus === 'low' ? 'bg-amber-500 w-1/3 ml-0' : 'bg-amber-500 w-1/3 ml-auto'}`}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-sm font-bold text-slate-900 mb-2 font-eng tracking-wider flex items-center gap-2">
                                        <span className="text-slate-500">💡</span> ADVICE
                                    </div>
                                    <ul className="text-sm text-slate-800 list-disc list-outside pl-4 space-y-2 leading-relaxed">
                                        {result.idealTrajectory.analysis.suggestions.map((sug: string, i: number) => (
                                            <li key={i}>{sug}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-500 border border-slate-300 border-dashed rounded-2xl bg-slate-50">
                                    <p className="text-sm mb-2 font-medium">Enter launch data to see<br />detailed trajectory analysis</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 mb-8 border-l-8 border-slate-500 relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-2xl md:text-3xl font-black flex gap-3 items-center mb-4 text-trust-navy">
                        <Dumbbell className="text-slate-600 w-8 h-8" strokeWidth={2.5} />
                        {result.userSwingDna.type}
                    </h4>
                    <p className="text-base md:text-lg leading-relaxed text-slate-600 font-medium">{result.userSwingDna.description}</p>
                    {result.userSwingDna.keyNeeds && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {result.userSwingDna.keyNeeds.map((need: string, i: number) => (
                                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">#{need}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Rankings Container - Mobile: Horizontal Scroll, Desktop: Vertical Stack */}
            <div className="flex flex-col md:gap-8 gap-6">
                <div className="flex flex-col items-center gap-2 mb-2 md:mb-4">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-slate-200 w-12 md:w-24"></div>
                        <h3 className="text-center text-2xl md:text-3xl font-black text-trust-navy font-eng tracking-wider">RECOMMENDATIONS</h3>
                        <div className="h-px bg-slate-200 w-12 md:w-24"></div>
                    </div>
                    <p className="text-sm text-slate-500 text-center max-w-md hidden md:block">
                        総合適合度でソートしています。各種性能のバランスを考慮したランキングです。
                    </p>
                    <p className="text-xs text-slate-400 text-center md:hidden animate-pulse">
                        ← 横にスワイプして比較 →
                    </p>
                </div>

                {/* 結果が0件の場合 */}
                {result.rankings.length === 0 && (
                    <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="text-4xl mb-4">🤔</div>
                        <h4 className="text-xl font-bold text-trust-navy mb-2">条件に一致するモデルが見つかりませんでした</h4>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
                            現在の条件（ロフト角や特性）に合致するモデルがデータベースにありませんでした。<br />
                            条件を変更して再度お試しいただくか、別の診断モードをご利用ください。
                        </p>
                    </div>
                )}

                <div className="flex flex-row md:flex-col overflow-x-auto snap-x snap-mandatory gap-6 px-4 md:px-0 pb-12 md:pb-0 -mx-4 md:mx-0 scrollbar-hide scroll-pl-4 pt-4">
                    {result.rankings.map((item: any, i: number) => (
                        <div key={i} className={`min-w-[85%] md:min-w-0 snap-center rounded-[2.5rem] overflow-hidden transition-all duration-500 group
                            ${i === 0
                                ? 'bg-white shadow-[0_20px_50px_rgba(15,23,42,0.1)] ring-1 ring-slate-200'
                                : 'bg-white/80 backdrop-blur-sm border border-white/60 shadow-xl shadow-slate-200/50'
                            }`}>

                            {/* 1st Place Premium Badge */}
                            {i === 0 ? (
                                <div className="bg-[#0f172a] relative overflow-hidden text-white text-center font-bold py-3 text-xs md:text-sm tracking-[0.2em] font-eng uppercase shadow-md">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                                    <span className="relative z-10 flex items-center justify-center gap-2 text-amber-400">
                                        <Zap size={14} fill="currentColor" /> BEST MATCH MODEL
                                    </span>
                                </div>
                            ) : item.isCurrentGear && (
                                <div className="bg-slate-500 text-white text-center font-bold py-2 text-xs md:text-sm tracking-widest uppercase flex items-center justify-center gap-2">
                                    Current Gear
                                </div>
                            )}
                            <div className="p-4 md:p-8 flex flex-col md:flex-row gap-4 md:gap-8">
                                <div className="md:w-1/3 flex flex-col">
                                    <div className="bg-slate-50 p-6 rounded-[2rem] mb-5 aspect-square flex items-center justify-center relative shadow-inner">
                                        <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold shadow-sm text-slate-600 tracking-wider border border-slate-100">{item.brand}</div>
                                        <div className="w-full h-full flex items-center justify-center">
                                            {item.radarChart ? (
                                                <RadarChart data={item.radarChart} category={result.category || TargetCategory.DRIVER} />
                                            ) : (
                                                /* RadarChartがない場合（ウェッジ/パターなど）はスペック概要を表示 */
                                                <div className="text-center">
                                                    <div className="text-4xl font-black text-slate-200 mb-2">{item.brand}</div>
                                                    <div className="text-xl font-bold text-trust-navy">{item.modelName}</div>
                                                    {/* ウェッジ詳細表示 */}
                                                    {(item.loft || item.bounce) && (
                                                        <div className="mt-4 flex gap-4 justify-center">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase">LOFT</span>
                                                                <span className="text-2xl font-black text-slate-700">{item.loft}°</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase">BOUNCE</span>
                                                                <span className="text-2xl font-black text-slate-700">{item.bounce}°</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* パター詳細表示 */}
                                                    {item.neckType && (
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 backdrop-blur-sm">
                                                            <div className="text-[10px] font-bold text-indigo-500 mb-2 uppercase tracking-wider flex items-center justify-between">
                                                                <span>性能チャート</span>
                                                                <span className="text-slate-400 text-[9px]">現状 vs 理想</span>
                                                            </div>
                                                            {item.radarChart && (
                                                                <RadarChart
                                                                    data={item.radarChart}
                                                                    category={isBallResult ? TargetCategory.BALL : (result.category || TargetCategory.DRIVER)}
                                                                />
                                                            )}
                                                            <div className="mt-3 flex justify-center gap-4 text-[10px] font-bold">
                                                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500"></span> 現在</div>
                                                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> 理想</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <h3 className="text-2xl md:text-3xl font-black mb-1 text-trust-navy leading-tight">{item.modelName}</h3>
                                        <div className="text-sm font-bold text-slate-400">{item.brand}</div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">適合率</span>
                                        <span className="text-3xl md:text-4xl font-black text-trust-navy tracking-tight">{item.matchPercentage.toFixed(1)}<span className="text-lg text-slate-400 ml-1 font-bold">%</span></span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full mb-2 overflow-hidden">
                                        <div style={{ width: `${item.matchPercentage}%` }} className="h-full bg-gradient-to-r from-slate-700 to-slate-900 rounded-full shadow-[0_0_12px_rgba(15,23,42,0.4)] relative">
                                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                        </div>
                                    </div>
                                    {/* フィッターの熱い一言 */}
                                    {item.expertOpinion && (
                                        <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                                            <div className="text-[10px] font-bold text-amber-600 mb-1 flex items-center gap-1">
                                                <Stethoscope size={10} /> FITTER'S INSIGHT
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 italic leading-relaxed">
                                                "{item.expertOpinion}"
                                            </p>
                                        </div>
                                    )}

                                    {/* ランキング説明 */}
                                    {item.rankingExplanation && (
                                        <p className="text-xs text-slate-500 mb-6 flex items-center gap-1">
                                            <span className="text-golf-500">💡</span> {item.rankingExplanation}
                                        </p>
                                    )}
                                    {!item.rankingExplanation && <div className="mb-6"></div>}

                                    {/* シャフト推奨 (パター以外) */}
                                    {!isBallResult && !result.category?.includes('PUTTER') && item.shafts && item.shafts.length > 0 && (
                                        <div className="mb-6 p-5 md:p-6 bg-trust-navy rounded-2xl text-white relative overflow-hidden group shadow-lg">
                                            <div className="absolute -top-6 -right-6 p-4 bg-white/5 rounded-full blur-xl w-32 h-32"></div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Zap size={16} className="text-yellow-400" />
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">推奨シャフト</p>
                                            </div>
                                            <div className="space-y-3 relative z-10">
                                                {item.shafts.map((shaft: any, sIdx: number) => (
                                                    <div key={sIdx} className="flex items-center gap-3 pb-2 border-b border-white/10 last:border-0 last:pb-0">
                                                        <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-slate-600 text-white rounded-full shadow-lg shadow-slate-900/50">{sIdx + 1}</span>
                                                        <p className="font-eng font-bold text-base md:text-lg tracking-tight">
                                                            {typeof shaft === 'string' ? shaft : `${shaft.modelName} (${shaft.flex})`}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ウェッジ専用セクション (強化版 - セット対応) */}
                                    {item.loft && item.bounce && (
                                        <div className="mb-6 space-y-4">
                                            {/* ロフトカテゴリバッジ & セット表示 */}
                                            <div className="flex items-center gap-3">
                                                {item.setRecommendation ? (
                                                    <div className="px-4 py-2 rounded-xl font-black text-lg bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200">
                                                        WEDGE SET
                                                    </div>
                                                ) : (
                                                    <div className={`px-4 py-2 rounded-xl font-black text-lg ${item.loft <= 52 ? 'bg-blue-100 text-blue-700' :
                                                        item.loft <= 56 ? 'bg-amber-100 text-amber-700' :
                                                            'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {item.loft <= 52 ? 'GAP WEDGE' : item.loft <= 56 ? 'SAND WEDGE' : 'LOB WEDGE'}
                                                    </div>
                                                )}

                                                {/* セット推奨がある場合は、セット内容を表示 */}
                                                {item.modelName.includes('推奨セット') ? (
                                                    <div className="text-xl font-black text-trust-navy">
                                                        {item.modelName.split('推奨セット:')[1].replace(')', '').trim()}
                                                    </div>
                                                ) : (
                                                    <div className="text-2xl font-black text-trust-navy">{item.loft}°</div>
                                                )}
                                            </div>

                                            {/* スペック詳細グリッド */}
                                            <div className="grid grid-cols-3 gap-3">
                                                {/* セットの場合はロフト構成を表示、単体の場合はバウンスを表示 */}
                                                {item.setRecommendation ? (
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center col-span-2">
                                                        <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">SET COMPOSITION</div>
                                                        <div className="text-lg font-black text-trust-navy">
                                                            {item.modelName.includes('推奨セット')
                                                                ? item.modelName.split('推奨セット:')[1].replace(')', '').trim()
                                                                : `${item.loft}° SET`
                                                            }
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 mt-1">
                                                            PWからのフローを最適化
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                                        <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">BOUNCE</div>
                                                        <div className="text-xl font-black text-trust-navy">{item.bounce}°</div>
                                                        <div className="text-[9px] text-slate-500 mt-1">
                                                            {item.bounce >= 12 ? 'ハイバウンス' : item.bounce >= 8 ? 'ミドル' : 'ローバウンス'}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* グラインド表示 (セットの場合は代表的なグラインドまたは説明) */}
                                                {!item.setRecommendation && (
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                                        <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">GRIND</div>
                                                        <div className="text-xl font-black text-trust-navy">{item.grind}</div>
                                                        <div className="text-[9px] text-slate-500 mt-1 line-clamp-2">{item.grindDescription?.split(' ')[0] || 'Standard'}</div>
                                                    </div>
                                                )}

                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                                    <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">PRICE</div>
                                                    <div className="text-lg font-black text-trust-navy">{item.priceEstimate}</div>
                                                </div>
                                            </div>

                                            {/* セット推奨の補足テキスト */}
                                            {item.setRecommendation && (
                                                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 text-xs text-orange-800 font-bold flex items-center gap-2">
                                                    <span className="text-lg">💡</span>
                                                    {item.setRecommendation}
                                                </div>
                                            )}

                                            {/* シャフト推奨 (ウェッジ) */}
                                            {item.shafts && item.shafts.length > 0 && (
                                                <div className="p-4 bg-slate-800 rounded-xl text-white">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                                        <Zap size={12} className="text-yellow-400" /> 推奨シャフト
                                                    </div>
                                                    <div className="font-bold">
                                                        {typeof item.shafts[0] === 'string' ? item.shafts[0] : `${item.shafts[0].modelName} (${item.shafts[0].flex})`}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">アイアンシャフトに合わせた提案</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* パター専用セクション (強化版) */}
                                    {item.neckType && item.headShape && (
                                        <div className="mb-6 space-y-4">
                                            {/* ストローク分析バッジ */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className="px-4 py-2 rounded-xl font-bold bg-indigo-100 text-indigo-700">
                                                    {item.headShape}
                                                </div>
                                                <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold">
                                                    {item.neckType}
                                                </div>
                                                {item.hangAngle !== undefined && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-bold">
                                                        トゥハング: {item.hangAngle}°
                                                    </div>
                                                )}
                                            </div>

                                            {/* 特性チャート (RadarChartがない場合のみ表示) */}
                                            {!item.radarChart && item.characteristics && (
                                                <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-xl border border-slate-100">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-4">PUTTER CHARACTERISTICS</div>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="font-bold text-slate-600">寛容性</span>
                                                                <span className="text-slate-500">{item.characteristics.forgiveness}/10</span>
                                                            </div>
                                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.characteristics.forgiveness * 10}%` }}></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="font-bold text-slate-600">打感</span>
                                                                <span className="text-slate-500">{item.characteristics.feel}/10</span>
                                                            </div>
                                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.characteristics.feel * 10}%` }}></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="font-bold text-slate-600">アライメント</span>
                                                                <span className="text-slate-500">{item.characteristics.alignment}/10</span>
                                                            </div>
                                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${item.characteristics.alignment * 10}%` }}></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="font-bold text-slate-600">操作性</span>
                                                                <span className="text-slate-500">{item.characteristics.control}/10</span>
                                                            </div>
                                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${item.characteristics.control * 10}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}



                                    {/* ボール専用情報セクション */}
                                    {isBallResult && (
                                        <div className="mb-6 space-y-4">
                                            {/* 物理パラメーター可視化 */}
                                            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-wider">PHYSICS DATA</div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* D-Spin */}
                                                    <div className="text-center">
                                                        <div className="text-[10px] text-slate-400 mb-1">D-SPIN</div>
                                                        <div className="text-2xl font-black text-emerald-400">{item.dSpinIndex || '–'}</div>
                                                        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                                                            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (item.dSpinIndex || 0) * 1.8)}%` }}></div>
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 mt-1">{(item.dSpinIndex || 0) <= 20 ? '低スピン' : (item.dSpinIndex || 0) <= 35 ? '中スピン' : '高スピン'}</div>
                                                    </div>
                                                    {/* W-Spin */}
                                                    <div className="text-center">
                                                        <div className="text-[10px] text-slate-400 mb-1">W-SPIN</div>
                                                        <div className="text-2xl font-black text-blue-400">{item.wSpinIndex || '–'}</div>
                                                        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                                                            <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${item.wSpinIndex || 0}%` }}></div>
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 mt-1">{(item.wSpinIndex || 0) >= 90 ? '高スピン' : (item.wSpinIndex || 0) >= 60 ? '中スピン' : '低スピン'}</div>
                                                    </div>
                                                    {/* 弾道 */}
                                                    <div className="text-center">
                                                        <div className="text-[10px] text-slate-400 mb-1">弾道</div>
                                                        <div className="text-2xl font-black text-amber-400">{item.trajectoryIndex || '–'}</div>
                                                        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                                                            <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${item.trajectoryIndex || 0}%` }}></div>
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 mt-1">{(item.trajectoryIndex || 0) >= 70 ? '高弾道' : (item.trajectoryIndex || 0) >= 50 ? '中弾道' : '低弾道'}</div>
                                                    </div>
                                                </div>
                                                {/* 追加情報 - Compressionは非公開 */}
                                                <div className="flex justify-center items-center gap-6 mt-4 pt-4 border-t border-slate-700 text-xs">
                                                    <span className="text-slate-400">構造: <span className="text-white font-bold">{item.structure || '–'}</span></span>
                                                    <span className="text-slate-400">カバー: <span className="text-white font-bold">{item.coverMaterial === 'URETHANE' ? 'ウレタン' : item.coverMaterial === 'IONOMER' ? 'アイオノマー' : 'ハイブリッド'}</span></span>
                                                </div>
                                            </div>

                                            {/* 色・ライン・プロ情報 */}
                                            <div className="p-5 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100 shadow-sm">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* 色バリエーション */}
                                                    {item.availableColors && item.availableColors.length > 0 && (
                                                        <div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider flex items-center gap-1.5">
                                                                <span className="text-base">🎨</span> COLORS
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {item.availableColors.slice(0, 4).map((color: string, cIdx: number) => (
                                                                    <span key={cIdx} className={`px-3 py-1 text-xs font-bold rounded-full border ${color === 'ホワイト' ? 'bg-white border-slate-200 text-slate-700' :
                                                                        color === 'イエロー' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                                                                            color === 'オレンジ' ? 'bg-orange-100 border-orange-300 text-orange-800' :
                                                                                color === 'ピンク' ? 'bg-pink-100 border-pink-300 text-pink-800' :
                                                                                    'bg-slate-100 border-slate-200 text-slate-700'
                                                                        }`}>
                                                                        {color}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* アライメントライン */}
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider flex items-center gap-1.5">
                                                            <span className="text-base">📐</span> LINE
                                                        </div>
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${item.hasAlignmentLine ? 'bg-golf-50 text-golf-700 border border-golf-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                            }`}>
                                                            {item.hasAlignmentLine ? (
                                                                <>
                                                                    <span className="text-golf-500">✓</span>
                                                                    {item.alignmentLineType === 'TRIPLE_TRACK' ? 'トリプルトラック' :
                                                                        item.alignmentLineType === 'PIX' ? 'pix' :
                                                                            item.alignmentLineType === 'NAVI' ? 'ナビ' :
                                                                                item.alignmentLineType === 'STRIPE' ? 'ストライプ' :
                                                                                    item.alignmentLineType === 'SIMPLE' ? 'アライメント' : 'あり'}
                                                                </>
                                                            ) : (
                                                                <h4 className="text-xl md:text-3xl font-black text-slate-800 leading-tight mb-2 group-hover:text-golf-600 transition-colors">{item.modelName}</h4>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 使用プロ */}
                                                    {item.usedByPros && item.usedByPros.length > 0 && (
                                                        <div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider flex items-center gap-1.5">
                                                                <span className="text-base">⛳️</span> USED BY PROS
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {item.usedByPros.slice(0, 3).map((pro: string, pIdx: number) => (
                                                                    <span key={pIdx} className="px-3 py-1 bg-trust-navy text-white text-xs font-bold rounded-full">
                                                                        {pro}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <p className="italic text-slate-600 mb-8 border-l-4 border-golf-400 pl-5 py-2 text-lg md:text-xl font-medium leading-relaxed bg-slate-50/50 rounded-r-xl">
                                        "{item.catchphrase}"
                                    </p>

                                    <div className="space-y-3 mt-auto">
                                        <details className="group bg-slate-50 border border-slate-100 rounded-xl overflow-hidden transition-all duration-300 open:bg-blue-50/30 open:border-blue-100">
                                            <summary className="p-4 font-bold text-slate-700 text-xs md:text-sm flex items-center justify-between cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden hover:bg-slate-100/50 transition-colors">
                                                <span className="flex items-center gap-3 tracking-wider font-eng text-[#0f172a]">
                                                    <Stethoscope size={16} className="text-blue-500" />
                                                    DIAGNOSIS
                                                </span>
                                                <span className="group-open:rotate-180 transition-transform duration-300 bg-white shadow-sm border border-slate-100 rounded-full p-1 text-slate-400">
                                                    <ChevronDown size={14} />
                                                </span>
                                            </summary>
                                            <div className="px-4 pb-4 pt-0 text-slate-600 text-sm leading-relaxed animate-fadeIn">
                                                {item.reasoning}
                                            </div>
                                        </details>

                                        {!item.neckType && (
                                            <details className="group bg-slate-50 border border-slate-100 rounded-xl overflow-hidden transition-all duration-300 open:bg-emerald-50/30 open:border-emerald-100">
                                                <summary className="p-4 font-bold text-slate-700 text-xs md:text-sm flex items-center justify-between cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden hover:bg-slate-100/50 transition-colors">
                                                    <span className="flex items-center gap-3 tracking-wider font-eng text-[#0f172a]">
                                                        <Wrench size={16} className="text-emerald-500" />
                                                        SOLUTION
                                                    </span>
                                                    <span className="group-open:rotate-180 transition-transform duration-300 bg-white shadow-sm border border-slate-100 rounded-full p-1 text-slate-400">
                                                        <ChevronDown size={14} />
                                                    </span>
                                                </summary>
                                                <div className="px-4 pb-4 pt-0 text-slate-600 text-sm leading-relaxed animate-fadeIn">
                                                    {item.technicalFit}
                                                </div>
                                            </details>
                                        )}
                                    </div>

                                    {/* Affiliate Links */}
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">CHECK PRICE</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {AFFILIATE_SHOPS.map(shop => (
                                                <a
                                                    key={shop.id}
                                                    href={getAffiliateUrl(item.brand, item.modelName, shop.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-xs md:text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all ${shop.color}`}
                                                >
                                                    <span>{shop.icon}</span> {shop.name}で探す
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendation Summary */}
            {result.summary && (
                <div className="relative mt-12 mb-12">
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-[2.5rem] shadow-xl"></div>
                    <div className="relative bg-white/60 backdrop-blur-md p-6 md:p-10 rounded-[2.5rem] border border-white/60 shadow-lg">
                        <h3 className="text-xl md:text-2xl font-black text-trust-navy mb-6 flex items-center gap-3">
                            <span className="text-2xl bg-slate-100 w-10 h-10 flex items-center justify-center rounded-xl shadow-sm">🧐</span>
                            {result.summary.title}
                        </h3>
                        <div className="space-y-4">
                            {result.summary.items.map((item: any, i: number) => (
                                <div key={i} className="flex gap-4 items-start bg-white/80 p-4 rounded-xl border border-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-md text-sm
                        ${i === 0 ? 'bg-gradient-to-br from-golf-400 to-golf-600' : 'bg-slate-400'}
                    `}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-trust-navy text-base leading-tight mb-1">{item.model}</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Section: SNS Share + My Bag + Restart */}
            <div className="mt-12 space-y-6">
                {/* SNS Share Section */}
                <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h3 className="text-lg font-black text-trust-navy mb-4 flex items-center gap-2">
                        📱 診断結果をシェア
                    </h3>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                const topModel = result.rankings[0];
                                const shareText = `🏌️ My Bag Pro AI診断結果\n\n⛳ 推奨: ${topModel?.modelName || '—'} (${topModel?.brand || '—'})\n📊 適合率: ${topModel?.matchPercentage?.toFixed(1) || '—'}%\n🎯 スイングDNA: ${result.userSwingDna?.type || '—'}\n\n▶ あなたも無料で診断してみよう！`;
                                const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
                                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                                window.open(url, '_blank', 'width=550,height=420');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white py-3.5 rounded-xl font-bold text-sm transition-colors active:scale-95 shadow-md"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                            Xでシェア
                        </button>
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold text-sm transition-colors active:scale-95 shadow-md"
                        >
                            <Share2 size={18} />
                            画像でシェア
                        </button>
                    </div>
                </div>

                {/* Share Preview Modal */}
                {showShareModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
                        <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col items-center">
                            <button 
                                onClick={() => setShowShareModal(false)}
                                className="absolute -top-12 right-0 p-2 text-white hover:text-golf-400 transition-colors"
                            >
                                <X size={32} />
                            </button>
                            
                            <div className="w-full overflow-y-auto rounded-3xl shadow-2xl origin-top transform scale-75 md:scale-90 lg:scale-100">
                                <BagShareCard profile={profile} bag={profile.myBag} />
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button 
                                    onClick={() => {
                                        alert('画像を長押し、または右クリックして「画像を保存」からSNSへシェアしてください ✨');
                                    }}
                                    className="px-8 py-3 bg-golf-600 text-white rounded-full font-bold shadow-xl hover:bg-golf-700 transition-all flex items-center gap-2"
                                >
                                    <Download size={18} />
                                    画像を保存
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* My Bag Registration */}
                {result.rankings.length > 0 && (
                    <button
                        onClick={() => {
                            if (user.isLoggedIn) {
                                handleSaveTopModel();
                            } else {
                                trackEvent('open_auth_from_result', {
                                    diagnosis_category: profile.targetCategory || 'unknown',
                                    product_name: topModel?.modelName || '',
                                });
                                setShowAuth(true);
                            }
                        }}
                        className="w-full relative group overflow-hidden bg-gradient-to-r from-golf-600 to-golf-700 text-white font-bold py-5 px-8 rounded-2xl shadow-xl shadow-golf-600/30 hover:shadow-golf-600/50 transition-all active:scale-95 flex items-center justify-between"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out z-0"></div>
                        <div className="text-left relative z-10">
                            <div className="text-[10px] text-white/70 font-black tracking-wider uppercase mb-0.5">SAVE TO MY BAG</div>
                            <div className="text-lg tracking-tight">推奨クラブをMy Bagに登録する</div>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform backdrop-blur-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </div>
                    </button>
                )}

                </div>
                </div>
            </details>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-3">
                    {!user.isLoggedIn && (
                        <button onClick={() => setShowAuth(true)} className="w-full px-8 py-4 bg-trust-navy text-white rounded-full font-bold shadow-xl shadow-trust-navy/20 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 text-sm md:text-base">
                            無料でアカウント作成・結果を保存
                        </button>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                resetDiagnosis();
                                navigate('/diagnosis');
                            }}
                            className="flex-1 px-6 py-4 bg-white text-trust-navy border-2 border-trust-navy rounded-full font-bold hover:bg-slate-50 transition-all active:scale-95 text-sm"
                        >
                            別カテゴリで診断する
                        </button>
                        <button onClick={handleRestart} className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 transition-all active:scale-95 text-sm">
                            トップに戻る
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
