import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDiagnosis } from '../context/DiagnosisContext';
import { MyBagView } from '../features/gear/MyBagView';
import { MyBagManager } from '../features/gear/MyBagManager';
import { ProfileManager } from '../features/gear/ProfileManager';
import {
    ArrowLeft,
    Edit3,
    User,
    Eye,
    Loader2,
    CheckCircle2,
    Brain,
    CircleGauge,
    Sparkles,
    ArrowRight,
    LogIn,
    History,
    Trophy,
    BookOpen,
    Heart,
    ShoppingCart,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TargetCategory, type DiagnosisHistoryItem } from '../types/golf';
import { driverDetails } from '../data/featuredSettings';
import { getCompareShortlist, removeCompareShortlistItem, type CompareShortlistItem } from '../lib/diagnosisCompare';
import { saveDiagnosisRankingsToCompare } from '../lib/diagnosisCompare';
import { getRecentlyViewed, type RecentlyViewedItem } from '../lib/recentlyViewed';
import { getFavoriteClubs, removeFavoriteClub, type FavoriteClubItem } from '../lib/favoriteClubs';
import { AFFILIATE_SHOPS, getAffiliateUrl } from '../utils/affiliate';
import { trackEvent } from '../lib/analytics';

const categoryToDiagnosisPath = (category?: string | null) => {
    switch (category) {
        case TargetCategory.DRIVER:
            return '/diagnosis/driver';
        case TargetCategory.FAIRWAY:
            return '/diagnosis/fairway';
        case TargetCategory.UTILITY:
            return '/diagnosis/utility';
        case TargetCategory.IRON:
            return '/diagnosis/iron';
        case TargetCategory.WEDGE:
            return '/diagnosis/wedge';
        case TargetCategory.PUTTER:
            return '/diagnosis/putter';
        case TargetCategory.BALL:
            return '/diagnosis/ball';
        default:
            return '/diagnosis';
    }
};

const favoriteCategoryToDiagnosisPath = (category?: string | null) => {
    const normalized = category?.toLowerCase() || '';

    if (normalized.includes('driver')) return '/diagnosis/driver';
    if (normalized.includes('fairway')) return '/diagnosis/fairway';
    if (normalized.includes('utility')) return '/diagnosis/utility';
    if (normalized.includes('iron')) return '/diagnosis/iron';
    if (normalized.includes('wedge')) return '/diagnosis/wedge';
    if (normalized.includes('putter')) return '/diagnosis/putter';
    if (normalized.includes('ball')) return '/diagnosis/ball';

    return '/diagnosis';
};

export const MyGearPage = () => {
    const {
        profile,
        updateProfile,
        setProfile,
        user,
        saveStatus,
        setStep,
        manualSave,
        syncWithSupabase,
        setShowAuth,
        restoreDiagnosisResult,
    } = useDiagnosis();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'view' | 'clubs' | 'profile'>('view');
    const [compareShortlist, setCompareShortlist] = useState<CompareShortlistItem[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
    const [favoriteClubs, setFavoriteClubs] = useState<FavoriteClubItem[]>([]);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const primaryShop = AFFILIATE_SHOPS[0];

    const registeredCategories = new Set(profile.myBag.clubs.map((club) => club.category));
    const essentialCategories = [
        TargetCategory.DRIVER,
        TargetCategory.IRON,
        TargetCategory.WEDGE,
        TargetCategory.PUTTER,
    ];
    const completedEssentials = essentialCategories.filter((category) => registeredCategories.has(category)).length;
    const fairwayCount = profile.myBag.clubs.filter((club) => club.category === TargetCategory.FAIRWAY).length;
    const utilityCount = profile.myBag.clubs.filter((club) => club.category === TargetCategory.UTILITY).length;
    const wedgeCount = profile.myBag.clubs.filter((club) => club.category === TargetCategory.WEDGE).length;
    const putterCount = profile.myBag.clubs.filter((club) => club.category === TargetCategory.PUTTER).length;
    const clubsWithDistance = profile.myBag.clubs.filter((club) => String(club.distance || '').trim() !== '').length;
    const distanceCoveragePercent = profile.myBag.clubs.length > 0 ? Math.round((clubsWithDistance / profile.myBag.clubs.length) * 100) : 0;
    const completionPoints = [
        completedEssentials > 0 ? 1 : 0,
        profile.myBag.ball ? 1 : 0,
        profile.headSpeed > 0 ? 1 : 0,
        profile.averageScore ? 1 : 0,
        profile.myBag.clubs.length >= 8 ? 1 : 0,
    ].reduce((sum, current) => sum + current, 0);
    const completionPercent = Math.round((completionPoints / 5) * 100);
    const recentHistory = (user.history || []).slice(0, 3);
    const considerationCount = compareShortlist.length + recentHistory.length + recentlyViewed.length + favoriteClubs.length;
    const shouldShowFirstSteps =
        user.isLoggedIn &&
        profile.myBag.clubs.length < 3 &&
        compareShortlist.length === 0 &&
        recentHistory.length === 0;
    const nextParam = searchParams.get('next');
    const primaryMove = !registeredCategories.has(TargetCategory.DRIVER)
        ? {
            eyebrow: 'Primary Move',
            title: 'まずは代表番手を登録する',
            description: 'ドライバーか7Iが入るだけでも、自動分析と比較の精度がかなり上がります。',
            actionLabel: '代表番手を登録する',
            onClick: () => openBagTabWithFocus('missing-clubs'),
        }
        : !profile.myBag.ball
        ? {
            eyebrow: 'Primary Move',
            title: '次はボールまでそろえる',
            description: '使用ボールが入ると、クラブとのつながりや診断結果がかなり具体化します。',
            actionLabel: 'ボールを登録する',
            onClick: () => openBagTabWithFocus('ball-first'),
        }
        : compareShortlist.length === 0 && recentHistory.length === 0
        ? {
            eyebrow: 'Primary Move',
            title: '比較ページで今の差を見る',
            description: '登録したバッグを基準に、次に見直すカテゴリをすぐ見つけられます。',
            actionLabel: '比較ページへ進む',
            onClick: () => navigate('/compare'),
        }
        : {
            eyebrow: 'Primary Move',
            title: '診断を1つ追加して判断を深める',
            description: '保存した内容を活かして、ボールやカテゴリ診断から次の1本を絞れます。',
            actionLabel: '診断へ進む',
            onClick: () => navigate('/diagnosis'),
        };

    useEffect(() => {
        setCompareShortlist(getCompareShortlist());
        setRecentlyViewed(getRecentlyViewed());
        setFavoriteClubs(getFavoriteClubs());
    }, []);

    useEffect(() => {
        if (saveStatus === 'saved') {
            setLastSavedAt(new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
        }
    }, [saveStatus]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            void manualSave();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [manualSave]);

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'clubs') {
            setActiveTab('clubs');
            return;
        }
        if (tabParam === 'profile') {
            setActiveTab('profile');
            return;
        }
        if (tabParam === 'view') {
            setActiveTab('view');
        }
    }, [searchParams]);

    const bagCoverageTone =
        profile.myBag.clubs.length >= 10
            ? `クラブは ${profile.myBag.clubs.length} 本登録済みです。かなり全体像が見える状態です。`
            : profile.myBag.clubs.length >= 5
            ? `クラブは ${profile.myBag.clubs.length} 本登録済みです。代表番手はかなり見えています。`
            : profile.myBag.clubs.length > 0
            ? `クラブは ${profile.myBag.clubs.length} 本登録済みです。あと数本で分析の精度が上がります。`
            : 'まだクラブが未登録です。まずは1Wか7Iからで十分です。';
    const structureTone =
        completedEssentials >= 3
            ? 'ドライバー・アイアン・ウェッジ・パターの代表番手がかなりそろっています。'
            : `代表番手の登録は ${completedEssentials}/${essentialCategories.length} です。まずはドライバー・アイアン・ウェッジ・パターをそろえると分析が安定します。`;
    const distanceTone =
        distanceCoveragePercent >= 70
            ? `飛距離の入力は ${distanceCoveragePercent}% 入っています。番手間の差分までかなり見やすいです。`
            : distanceCoveragePercent > 0
            ? `飛距離の入力は ${distanceCoveragePercent}% です。代表番手の飛距離を増やすと分析がさらに具体化します。`
            : '飛距離はまだ未入力です。1W / 7I / ウェッジあたりから入れると比較しやすくなります。';
    const longGameTone =
        fairwayCount + utilityCount >= 3
            ? `ロングゲーム側は FW ${fairwayCount} 本 / UT ${utilityCount} 本で比較しやすい構成です。`
            : `ロングゲーム側は FW ${fairwayCount} 本 / UT ${utilityCount} 本です。FWやUTを1本足すと流れを見やすくなります。`;
    const scoringTone =
        wedgeCount >= 2 && putterCount >= 1
            ? `ショートゲーム側は WEDGE ${wedgeCount} 本 + パターでかなり整っています。`
            : `ショートゲーム側は WEDGE ${wedgeCount} 本 / パター ${putterCount} 本です。ウェッジやパターが入るとスコア改善の提案が具体的になります。`;
    const headSpeedTone =
        profile.headSpeed >= 48
            ? 'ヘッドスピードは高めです。低スピンに寄りすぎない組み合わせ確認が効きます。'
            : profile.headSpeed >= 42
            ? 'ヘッドスピードは標準帯です。やさしさとつかまりのバランス確認が効きます。'
            : profile.headSpeed > 0
            ? 'ヘッドスピードはやや低めです。球の上がりやすさとボール最適化が効きます。'
            : 'ヘッドスピードが未入力です。入れると診断と自動分析がかなり安定します。';
    const ballTone = profile.myBag.ball
        ? `使用ボールは「${profile.myBag.ball}」です。ボール診断までつなげると相性が見えます。`
        : '使用ボールが未登録です。ボールまで入ると自動分析と診断の精度が上がります。';
    const analysisHighlights = [
        { label: '構成', value: `${profile.myBag.clubs.length}本`, note: bagCoverageTone },
        { label: '代表番手', value: `${completedEssentials}/${essentialCategories.length}`, note: structureTone },
        { label: '飛距離', value: `${distanceCoveragePercent}%`, note: distanceTone },
    ];
    const analysisPoints = [longGameTone, scoringTone, ballTone, headSpeedTone];

    const analysisActions = [
        compareShortlist.length > 0
            ? {
                label: '比較候補を見に行く',
                description: `${compareShortlist.length} 件の候補を保存済みです。比較ページで見比べられます。`,
                onClick: () => navigate('/compare?mode=shortlist'),
            }
            : null,
        favoriteClubs.length > 0
            ? {
                label: 'お気に入りを見直す',
                description: `${favoriteClubs.length} 件のお気に入りがあります。価格確認や再診断につなげられます。`,
                onClick: () => setActiveTab('view'),
            }
            : null,
        profile.myBag.ball
            ? {
                label: 'ボール診断で相性を確認する',
                description: '今のボールが本当に合っているか、HSとバッグから見直します。',
                onClick: () => navigate('/ball-diagnosis'),
            }
            : {
                label: 'ボールを登録して分析を完成させる',
                description: '使用ボールを入れると、分析と診断の精度が上がります。',
                onClick: () => openBagTabWithFocus(),
            },
    ].filter(Boolean) as Array<{ label: string; description: string; onClick: () => void }>;

    const nextActions = [
        !registeredCategories.has(TargetCategory.DRIVER)
            ? {
                label: 'ドライバーを登録する',
                description: 'まずは1本入れて診断精度を上げる',
                onClick: () => openBagTabWithFocus('ball-first'),
            }
            : !profile.myBag.ball
            ? {
                label: 'ボールを登録する',
                description: '今のボールを入れて分析を完成させる',
                onClick: () => openBagTabWithFocus('ball-first'),
            }
            : {
                label: 'ボール診断をする',
                description: '今のHSとバッグから相性を見る',
                onClick: () => navigate('/ball-diagnosis'),
            },
        {
            label: '比較ページを見る',
            description: '今のバッグとプロの差を並べて確認する',
            onClick: () => navigate('/compare'),
        },
        {
            label: 'プロのセッティングを探す',
            description: '近い条件のプロを参考にする',
            onClick: () => navigate('/settings/pros'),
        },
    ];

    const handleClose = () => {
        navigate('/');
    };

    const returnTo = searchParams.get('returnTo');
    const showWelcomeBanner = searchParams.get('welcome') === '1';

    const openBagTabWithFocus = (focus?: 'missing-clubs' | 'ball-first') => {
        setActiveTab('clubs');
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', 'clubs');
        nextParams.delete('welcome');
        if (focus) {
            nextParams.set('focus', focus);
        } else {
            nextParams.delete('focus');
        }
        setSearchParams(nextParams, { replace: true });
    };

    const dismissWelcome = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('welcome');
        nextParams.delete('next');
        setSearchParams(nextParams, { replace: true });
    };

    const openSavedDiagnosis = (item: DiagnosisHistoryItem) => {
        restoreDiagnosisResult(item);
        navigate('/result');
    };

    const openCompareCandidate = (item: CompareShortlistItem) => {
        const matchedDriver = driverDetails.find(
            (driver) =>
                driver.brand === item.brand &&
                (driver.name === item.modelName || `${driver.brand} ${driver.name}` === `${item.brand} ${item.modelName}`),
        );

        if (matchedDriver) {
            navigate(`/buy/drivers/${matchedDriver.slug}`);
            return;
        }

        navigate('/compare');
    };

    const openRecentlyViewed = (item: RecentlyViewedItem) => {
        navigate(item.href);
    };

    const addSavedDiagnosisToCompare = (item: DiagnosisHistoryItem) => {
        if (!Array.isArray(item.result?.rankings) || item.result.rankings.length === 0) return;
        const next = saveDiagnosisRankingsToCompare(item.profile, item.result.rankings);
        setCompareShortlist(next);
    };

    const openFavoriteBuy = (item: FavoriteClubItem) => {
        trackEvent('click_affiliate_shop', {
            source_page: 'my_page_favorites',
            shop_id: primaryShop.id,
            shop_name: primaryShop.name,
            brand: item.brand,
            model_name: item.modelName,
        });
        window.open(getAffiliateUrl(item.brand, item.modelName, primaryShop.id), '_blank', 'noopener,noreferrer');
    };

    const rediagnoseFavorite = (item: FavoriteClubItem) => {
        trackEvent('restart_diagnosis_from_favorite', {
            source_page: 'my_page_favorites',
            category: item.category,
            brand: item.brand,
            model_name: item.modelName,
        });
        navigate(favoriteCategoryToDiagnosisPath(item.category));
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:h-16 md:flex-row md:items-center md:justify-between md:py-0">
                    <button
                        onClick={handleClose}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-trust-navy"
                    >
                        <ArrowLeft size={16} />
                        HOME
                    </button>

                    <div className="grid w-full grid-cols-3 rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-inner md:flex md:w-auto">
                        <button
                            onClick={() => setActiveTab('view')}
                            className={cn(
                                'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition-all md:px-4',
                                activeTab === 'view' ? 'bg-white text-trust-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            <Eye size={14} />
                            HOME
                        </button>
                        <button
                            onClick={() => setActiveTab('clubs')}
                            className={cn(
                                'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition-all md:px-4',
                                activeTab === 'clubs' ? 'bg-white text-trust-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            <Edit3 size={14} />
                            BAG
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={cn(
                                'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition-all md:px-4',
                                activeTab === 'profile' ? 'bg-white text-trust-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            <User size={14} />
                            PROFILE
                        </button>
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        <div className="hidden items-center gap-2 md:flex">
                            {saveStatus === 'saving' ? (
                                <div className="flex animate-pulse items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                    <Loader2 size={12} className="animate-spin" /> 同期中...
                                </div>
                            ) : saveStatus === 'saved' ? (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                                    <CheckCircle2 size={12} /> 同期完了
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-4 pt-8">
                {!user.isLoggedIn && (
                    <section className="mb-6 rounded-[28px] border border-golf-200 bg-gradient-to-br from-golf-50 via-white to-emerald-50 p-5 shadow-lg md:p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">
                                    <LogIn size={12} />
                                    Guest Mode
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-trust-navy md:text-2xl">
                                        いまの内容を保存すると、続きからすぐ再開できます
                                    </h2>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                        セッティング登録、自動分析、診断結果、比較候補をマイページに残せます。まずはゲストのまま使って、必要になったら保存できます。
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3 md:min-w-[340px]">
                                <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 text-left">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Save</div>
                                    <div className="mt-1 text-sm font-black text-trust-navy">診断結果を保存</div>
                                </div>
                                <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 text-left">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Compare</div>
                                    <div className="mt-1 text-sm font-black text-trust-navy">比較候補を保持</div>
                                </div>
                                <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 text-left">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Resume</div>
                                    <div className="mt-1 text-sm font-black text-trust-navy">続きをすぐ再開</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => setShowAuth(true)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-trust-navy px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 sm:w-auto"
                            >
                                <LogIn size={16} />
                                ログインして保存する
                            </button>
                            <button
                                onClick={() => openBagTabWithFocus()}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
                            >
                                まずはセッティング登録を始める
                            </button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white bg-white/70 px-4 py-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Why Register</div>
                            <div className="mt-2 grid gap-2 md:grid-cols-3">
                                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-trust-navy">いまのクラブ構成が残る</div>
                                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-trust-navy">診断や比較の続きから戻れる</div>
                                <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-trust-navy">ログイン後もクラウドで復元できる</div>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'view' && (
                    <div className="space-y-6 pb-12">
                        {showWelcomeBanner && (
                            <section className="rounded-[28px] border border-golf-200 bg-gradient-to-br from-golf-50 via-white to-emerald-50 p-5 shadow-lg md:p-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">
                                            <Sparkles size={12} />
                                            Welcome
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black tracking-tight text-trust-navy md:text-2xl">
                                                保存と再開が使える状態になりました
                                            </h2>
                                            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                                                いまのセッティング、診断結果、比較候補をマイページに残せます。次にやることは、今の登録状況に合わせて下にまとめています。
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={dismissWelcome}
                                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500 transition-colors hover:bg-slate-50"
                                    >
                                        閉じる
                                    </button>
                                </div>

                                <div className="mt-4 rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-sm">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">
                                                {nextParam === 'ball' ? 'Ball First' : nextParam === 'compare' ? 'Compare First' : primaryMove.eyebrow}
                                            </div>
                                            <div className="mt-1 text-lg font-black tracking-tight text-trust-navy">
                                                {primaryMove.title}
                                            </div>
                                            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                                                {primaryMove.description}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                dismissWelcome();
                                                primaryMove.onClick();
                                            }}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-golf-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-golf-700"
                                        >
                                            {primaryMove.actionLabel}
                                            <ArrowRight size={15} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    <button
                                        onClick={() => openBagTabWithFocus('missing-clubs')}
                                        className="rounded-2xl bg-golf-600 px-5 py-4 text-left text-white transition-colors hover:bg-golf-700"
                                    >
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Step 1</div>
                                        <div className="mt-1 text-base font-black">代表番手を登録する</div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            dismissWelcome();
                                            navigate('/ball-diagnosis');
                                        }}
                                        className="rounded-2xl bg-trust-navy px-5 py-4 text-left text-white transition-colors hover:bg-slate-800"
                                    >
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Step 2</div>
                                        <div className="mt-1 text-base font-black">ボール診断をする</div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            dismissWelcome();
                                            navigate('/compare');
                                        }}
                                        className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-trust-navy transition-colors hover:bg-slate-50"
                                    >
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step 3</div>
                                        <div className="mt-1 text-base font-black">比較ページで差を見る</div>
                                    </button>
                                </div>
                            </section>
                        )}

                        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
                                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                                    <div className="space-y-3">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-golf-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">
                                            <Sparkles size={12} />
                                            My Golf Home
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-black tracking-tight text-trust-navy md:text-4xl">
                                                {profile.name || 'あなた'}の現在地
                                            </h1>
                                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                                                保存した診断、比較候補、お気に入りを見返しながら、次に何を残して何を見直すかを決めるためのホームです。
                                            </p>
                                        </div>
                                    </div>

                                    {!user.isLoggedIn && (
                                        <div className="w-full md:w-auto">
                                            <button
                                                onClick={() => setShowAuth(true)}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-trust-navy px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 md:w-auto"
                                            >
                                                <LogIn size={16} />
                                                保存して続きから使う
                                            </button>
                                            <p className="mt-2 text-xs font-bold text-slate-400 md:text-right">
                                                ログインすると診断結果と比較候補を残せます。
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 grid gap-4 md:grid-cols-4">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Head Speed</div>
                                        <div className="mt-2 text-2xl font-black text-trust-navy">
                                            {profile.headSpeed}
                                            <span className="ml-1 text-xs text-slate-400">m/s</span>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Average</div>
                                        <div className="mt-2 text-2xl font-black text-trust-navy">{profile.averageScore || '—'}</div>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ball</div>
                                        <div className="mt-2 line-clamp-2 text-sm font-black text-trust-navy">{profile.myBag.ball || '未登録'}</div>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bag 完成度</div>
                                        <div className="mt-2 text-2xl font-black text-golf-700">
                                            {completionPercent}
                                            <span className="ml-1 text-xs text-slate-400">%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-[1.3fr_1fr]">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Save Status</div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-trust-navy">
                                            {saveStatus === 'saving' ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin text-golf-600" />
                                                    保存内容を同期しています
                                                </>
                                            ) : saveStatus === 'error' ? (
                                                <>
                                                    <CircleGauge size={14} className="text-amber-500" />
                                                    保存でつまずいています。もう一度保存してください
                                                </>
                                            ) : lastSavedAt ? (
                                                <>
                                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                                    最終保存: {lastSavedAt}
                                                </>
                                            ) : (
                                                <>クラブ登録やプロフィール編集はこのページに順次保存されます</>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Support</div>
                                        <div className="mt-2 text-sm font-bold text-trust-navy">保存や表示で困ったときの連絡先</div>
                                        <a
                                            href="mailto:support@funrecipe.co.jp"
                                            className="mt-3 inline-flex items-center gap-2 text-xs font-black text-golf-700 transition-colors hover:text-golf-800"
                                        >
                                            support@funrecipe.co.jp
                                            <ArrowRight size={12} />
                                        </a>
                                    </div>
                                </div>

                                {user.isLoggedIn && (
                                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            onClick={() => void manualSave()}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-trust-navy transition-colors hover:bg-slate-50"
                                        >
                                            <CheckCircle2 size={14} />
                                            今すぐ保存する
                                        </button>
                                        <button
                                            onClick={() => void syncWithSupabase()}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100"
                                        >
                                            <Loader2 size={14} className={saveStatus === 'saving' ? 'animate-spin' : ''} />
                                            クラウドから再読み込み
                                        </button>
                                    </div>
                                )}

                                {shouldShowFirstSteps && (
                                    <div className="mt-4 rounded-2xl border border-golf-200 bg-golf-50 px-5 py-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">First Steps</div>
                                        <div className="mt-2 text-lg font-black tracking-tight text-trust-navy">最初の3ステップで、マイページがかなり使いやすくなります</div>
                                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                                            <button
                                                onClick={() => openBagTabWithFocus()}
                                                className="rounded-2xl border border-golf-200 bg-white px-4 py-4 text-left transition-colors hover:bg-golf-100/40"
                                            >
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">1</div>
                                                <div className="mt-1 text-base font-black text-trust-navy">ドライバーか7Iを登録</div>
                                                <div className="mt-1 text-xs leading-relaxed text-slate-500">まずは代表番手だけで十分です。</div>
                                            </button>
                                            <button
                                                onClick={() => navigate('/ball-diagnosis')}
                                                className="rounded-2xl border border-golf-200 bg-white px-4 py-4 text-left transition-colors hover:bg-golf-100/40"
                                            >
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">2</div>
                                                <div className="mt-1 text-base font-black text-trust-navy">ボール診断をする</div>
                                                <div className="mt-1 text-xs leading-relaxed text-slate-500">クラブとの相性を早めに確認できます。</div>
                                            </button>
                                            <button
                                                onClick={() => navigate('/compare')}
                                                className="rounded-2xl border border-golf-200 bg-white px-4 py-4 text-left transition-colors hover:bg-golf-100/40"
                                            >
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">3</div>
                                                <div className="mt-1 text-base font-black text-trust-navy">比較ページで差を見る</div>
                                                <div className="mt-1 text-xs leading-relaxed text-slate-500">次に見直すカテゴリが見えます。</div>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-5">
                                    <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400">
                                        <span>登録状況</span>
                                        <span>{completionPercent}%</span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-golf-500 to-emerald-500 transition-all"
                                            style={{ width: `${completionPercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-3 md:grid-cols-3">
                                    <button
                                        onClick={primaryMove.onClick}
                                        className="rounded-2xl border border-golf-200 bg-golf-50 px-5 py-4 text-left text-trust-navy transition-colors hover:bg-golf-100"
                                    >
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">{primaryMove.eyebrow}</div>
                                        <div className="mt-1 text-base font-black">{primaryMove.title}</div>
                                        <div className="mt-1 text-xs leading-relaxed text-slate-500">{primaryMove.description}</div>
                                    </button>
                                    <button
                                        onClick={() => openBagTabWithFocus()}
                                        className="rounded-2xl bg-golf-600 px-5 py-4 text-left text-white transition-colors hover:bg-golf-700"
                                    >
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Next</div>
                                        <div className="mt-1 text-base font-black">不足クラブを登録する</div>
                                    </button>
                                    <button
                                        onClick={() => navigate('/ball-diagnosis')}
                                        className="rounded-2xl bg-trust-navy px-5 py-4 text-left text-white transition-colors hover:bg-slate-800"
                                    >
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Diagnosis</div>
                                        <div className="mt-1 text-base font-black">ボール診断をする</div>
                                    </button>
                                    <button
                                        onClick={() => (recentHistory[0] ? openSavedDiagnosis(recentHistory[0]) : navigate('/diagnosis'))}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-trust-navy transition-colors hover:bg-slate-100"
                                    >
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Saved</div>
                                        <div className="mt-1 text-base font-black">
                                            {recentHistory[0] ? '保存した診断を見る' : '無料診断を始める'}
                                        </div>
                                    </button>
                                </div>

                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Latest Guide</div>
                                    <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="text-base font-black text-trust-navy">診断前にMy Bagを登録しておくべき理由</div>
                                            <div className="mt-1 text-sm leading-relaxed text-slate-500">
                                                先にセッティングを入れておくと、比較・保存・再訪までどうつながるかを整理した最新ガイドです。
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate('/articles/why-register-mybag-before-diagnosis-2026')}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-trust-navy transition-colors hover:bg-slate-100"
                                        >
                                            ガイドを見る
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-trust-navy">
                                        <Brain size={14} />
                                        自動分析
                                    </div>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        {analysisHighlights.map((item) => (
                                            <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                                                <div className="mt-2 text-2xl font-black text-trust-navy">{item.value}</div>
                                                <div className="mt-2 text-xs leading-relaxed text-slate-500">{item.note}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {analysisPoints.map((point) => (
                                            <div key={point} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium leading-relaxed text-slate-600">
                                                {point}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-5 space-y-3">
                                        {analysisActions.map((action) => (
                                            <button
                                                key={action.label}
                                                onClick={action.onClick}
                                                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50"
                                            >
                                                <div>
                                                    <div className="text-sm font-black text-trust-navy">{action.label}</div>
                                                    <div className="mt-1 text-xs text-slate-500">{action.description}</div>
                                                </div>
                                                <ArrowRight size={16} className="text-slate-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-trust-navy">
                                        <CircleGauge size={14} />
                                        次にやること
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {nextActions.map((action) => (
                                            <button
                                                key={action.label}
                                                onClick={action.onClick}
                                                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100"
                                            >
                                                <div>
                                                    <div className="text-sm font-black text-trust-navy">{action.label}</div>
                                                    <div className="mt-1 text-xs text-slate-500">{action.description}</div>
                                                </div>
                                                <ArrowRight size={16} className="text-slate-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {(compareShortlist.length > 0 || recentlyViewed.length > 0 || recentHistory.length > 0 || favoriteClubs.length > 0) && (
                            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
                                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-trust-navy">
                                                <Sparkles size={14} />
                                                検討中
                                            </div>
                                        <p className="mt-2 text-sm text-slate-500">
                                            何を残し、何を比較し、次にどこを見るかをこの中で続けられます。
                                        </p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        {considerationCount} Items
                                    </div>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                                    {recentHistory.length > 0 && (
                                        <div>
                                            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                <History size={13} />
                                                残している診断
                                            </div>
                                            <div className="space-y-3">
                                                {recentHistory.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                                    >
                                                        <button
                                                            onClick={() => openSavedDiagnosis(item)}
                                                            className="w-full text-left transition-colors hover:opacity-80"
                                                        >
                                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                                {item.category}
                                                            </div>
                                                            <div className="mt-2 line-clamp-2 text-base font-black text-trust-navy">
                                                                {item.result?.rankings?.[0]?.modelName || item.result?.recommendedBall?.name || '診断結果'}
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                                                <Trophy size={12} />
                                                                {new Date(item.date).toLocaleDateString('ja-JP')}
                                                            </div>
                                                        </button>
                                                        {Array.isArray(item.result?.rankings) && item.result.rankings.length > 0 && (
                                                            <button
                                                                onClick={() => addSavedDiagnosisToCompare(item)}
                                                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-trust-navy px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-slate-800 sm:w-auto"
                                                            >
                                                                比較へ残す
                                                                <ArrowRight size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {compareShortlist.length > 0 && (
                                        <div>
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                    残している比較
                                                </div>
                                                <button
                                                    onClick={() => navigate('/compare?mode=shortlist')}
                                                    className="text-[11px] font-black text-trust-navy transition-colors hover:text-slate-700"
                                                >
                                                    比較を開く
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {compareShortlist.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                                    {item.sourceCategory}
                                                                </div>
                                                                <div className="mt-2 line-clamp-2 text-base font-black text-trust-navy">
                                                                    {item.brand} {item.modelName}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setCompareShortlist(removeCompareShortlistItem(item.id))}
                                                                className="text-[11px] font-black text-slate-400 transition-colors hover:text-slate-600"
                                                            >
                                                                削除
                                                            </button>
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-500">
                                                                適合率 {item.matchPercentage.toFixed(1)}%
                                                            </span>
                                                            {item.shaft && (
                                                                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-500">
                                                                    {item.shaft}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => openCompareCandidate(item)}
                                                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-trust-navy px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-slate-800 sm:w-auto"
                                                        >
                                                            詳細を見る
                                                            <ArrowRight size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {favoriteClubs.length > 0 && (
                                        <div>
                                            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                <Heart size={13} />
                                                お気に入り
                                            </div>
                                            <div className="space-y-3">
                                                {favoriteClubs.slice(0, 4).map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                                    >
                                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                            {item.category}
                                                        </div>
                                                        <div className="mt-1 text-sm font-black text-trust-navy">
                                                            {item.brand} {item.modelName}
                                                        </div>
                                                        {(item.shaft || item.loft) && (
                                                            <div className="mt-1 text-xs text-slate-500">
                                                                {[item.shaft, item.loft].filter(Boolean).join(' / ')}
                                                            </div>
                                                        )}
                                                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                                            <button
                                                                onClick={() => openFavoriteBuy(item)}
                                                                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-trust-navy px-3 py-2 text-xs font-black text-white transition-colors hover:bg-slate-800 sm:w-auto"
                                                            >
                                                                <ShoppingCart size={13} />
                                                                価格を見る
                                                            </button>
                                                            <button
                                                                onClick={() => rediagnoseFavorite(item)}
                                                                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 transition-colors hover:bg-slate-100 sm:w-auto"
                                                            >
                                                                再診断する
                                                            </button>
                                                            <button
                                                                onClick={() => navigate('/compare?mode=shortlist')}
                                                                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 transition-colors hover:bg-slate-100 sm:w-auto"
                                                            >
                                                                比較を開く
                                                            </button>
                                                            <button
                                                                onClick={() => setFavoriteClubs(removeFavoriteClub(item.id))}
                                                                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:w-auto"
                                                            >
                                                                削除
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {recentlyViewed.length > 0 && (
                                        <div>
                                            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                <BookOpen size={13} />
                                                直近で見たもの
                                            </div>
                                            <div className="space-y-3">
                                                {recentlyViewed.slice(0, 4).map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => openRecentlyViewed(item)}
                                                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100"
                                                    >
                                                        <div>
                                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                                {item.type === 'profile' ? 'プロ' : item.type === 'article' ? '記事' : 'クラブ'}
                                                            </div>
                                                            <div className="mt-1 text-sm font-black text-trust-navy">{item.title}</div>
                                                            {item.subtitle && (
                                                                <div className="mt-1 text-xs text-slate-500">{item.subtitle}</div>
                                                            )}
                                                        </div>
                                                        <ArrowRight size={14} className="text-slate-400" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        <MyBagView
                            setting={profile.myBag}
                            headSpeed={profile.headSpeed}
                            userName={profile.name}
                            snsLinks={profile.snsLinks || {}}
                            coverPhoto={profile.coverPhoto}
                            isPublic={profile.isPublic}
                            onUpdateIsPublic={(v: boolean) => updateProfile('isPublic', v)}
                            userId={user.id}
                            bestScore={profile.bestScore}
                            averageScore={profile.averageScore}
                        />
                    </div>
                )}

                {activeTab === 'clubs' && (
                    <MyBagManager
                        setting={profile.myBag}
                        onUpdate={(next) =>
                            setProfile((prev) => ({
                                ...prev,
                                myBag: typeof next === 'function' ? next(prev.myBag) : next,
                            }))
                        }
                        onOpenBallDiagnosis={() => navigate('/ball-diagnosis')}
                        onOpenCompare={() => navigate('/compare')}
                        onDiagnose={(club) => {
                            updateProfile('targetCategory', club.category);
                            updateProfile('currentBrand', club.brand);
                            updateProfile('currentModel', club.model);
                            updateProfile('currentShaftModel', club.shaft);
                            updateProfile('currentLoft', club.loft);
                            updateProfile('freeComments', club.worry || '');

                            if (profile.headSpeed > 0 && profile.gender) {
                                setStep(2);
                            } else {
                                setStep(1);
                            }

                            navigate(categoryToDiagnosisPath(club.category));
                        }}
                        saveStatus={saveStatus}
                        onManualSave={manualSave}
                        onSaveAndReturn={
                            returnTo
                                ? async () => {
                                      await manualSave();
                                      const nextReturn = new URL(returnTo, window.location.origin);
                                      nextReturn.searchParams.set('refreshed', '1');
                                      navigate(`${nextReturn.pathname}${nextReturn.search}${nextReturn.hash}`);
                                  }
                                : undefined
                        }
                        intakeMode={(searchParams.get('focus') as 'missing-clubs' | 'ball-first' | null) || 'default'}
                    />
                )}

                {activeTab === 'profile' && (
                    <ProfileManager
                        userName={profile.name}
                        onUpdateUserName={(n: string) => updateProfile('name', n)}
                        snsLinks={profile.snsLinks || {}}
                        onUpdateSnsLinks={(l: any) => updateProfile('snsLinks', l)}
                        coverPhoto={profile.coverPhoto}
                        onUpdateCoverPhoto={(p: string) => updateProfile('coverPhoto', p)}
                        age={profile.age}
                        onUpdateAge={(a: string) => updateProfile('age', a)}
                        gender={profile.gender}
                        onUpdateGender={(g: string) => updateProfile('gender', g)}
                        headSpeed={profile.headSpeed}
                        onUpdateHeadSpeed={(s: number) => updateProfile('headSpeed', s)}
                        isPublic={profile.isPublic}
                        onUpdateIsPublic={(v: boolean) => updateProfile('isPublic', v)}
                        birthdate={profile.birthdate}
                        onUpdateBirthdate={(d: string) => updateProfile('birthdate', d)}
                        golfHistory={profile.golfHistory}
                        onUpdateGolfHistory={(h: string) => updateProfile('golfHistory', h)}
                        bestScore={profile.bestScore}
                        onUpdateBestScore={(s: number | undefined) => updateProfile('bestScore', s)}
                        averageScore={profile.averageScore}
                        onUpdateAverageScore={(s: number | undefined) => updateProfile('averageScore', s)}
                        saveStatus={saveStatus}
                        onManualSave={manualSave}
                        onLogout={async () => {
                            if (window.confirm('ログアウトしますか？')) {
                                await supabase.auth.signOut();
                                window.location.href = '#/';
                            }
                        }}
                    />
                )}
            </main>
        </div>
    );
};
