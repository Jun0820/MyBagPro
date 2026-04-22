import { useNavigate } from 'react-router-dom';
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
        user,
        saveStatus,
        setStep,
        manualSave,
        setShowAuth,
        restoreDiagnosisResult,
    } = useDiagnosis();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'view' | 'clubs' | 'profile'>('view');
    const [compareShortlist, setCompareShortlist] = useState<CompareShortlistItem[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
    const [favoriteClubs, setFavoriteClubs] = useState<FavoriteClubItem[]>([]);
    const primaryShop = AFFILIATE_SHOPS[0];

    const registeredCategories = new Set(profile.myBag.clubs.map((club) => club.category));
    const essentialCategories = [
        TargetCategory.DRIVER,
        TargetCategory.IRON,
        TargetCategory.WEDGE,
        TargetCategory.PUTTER,
    ];
    const completedEssentials = essentialCategories.filter((category) => registeredCategories.has(category)).length;
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

    useEffect(() => {
        setCompareShortlist(getCompareShortlist());
        setRecentlyViewed(getRecentlyViewed());
        setFavoriteClubs(getFavoriteClubs());
    }, []);

    const analysisPoints = [
        profile.myBag.ball
            ? `使用ボールは「${profile.myBag.ball}」です。ボール診断までつなげると、今のHSに対する相性が見えます。`
            : '使用ボールが未登録です。ボールを入れると自動分析と診断の精度が上がります。',
        profile.myBag.clubs.length >= 10
            ? `クラブは ${profile.myBag.clubs.length} 本登録済みです。セッティング全体を見た提案がしやすい状態です。`
            : `クラブ登録は ${profile.myBag.clubs.length} 本です。まずはドライバー・アイアン・パターが入ると分析しやすくなります。`,
        profile.headSpeed >= 48
            ? 'ヘッドスピードは高めです。低スピンに寄りすぎない組み合わせの確認が効きます。'
            : profile.headSpeed >= 42
            ? 'ヘッドスピードは標準帯です。やさしさとつかまりのバランス確認が効きます。'
            : 'ヘッドスピードはやや低めです。球の上がりやすさとボール選びの最適化が効きます。',
    ];

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
                onClick: () => setActiveTab('clubs'),
            },
    ].filter(Boolean) as Array<{ label: string; description: string; onClick: () => void }>;

    const nextActions = [
        !registeredCategories.has(TargetCategory.DRIVER)
            ? {
                label: 'ドライバーを登録する',
                description: 'まずは1本入れて診断精度を上げる',
                onClick: () => setActiveTab('clubs'),
            }
            : !profile.myBag.ball
            ? {
                label: 'ボールを登録する',
                description: '今のボールを入れて分析を完成させる',
                onClick: () => setActiveTab('clubs'),
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
                                onClick={() => setActiveTab('clubs')}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
                            >
                                まずはセッティング登録を始める
                            </button>
                        </div>
                    </section>
                )}

                {activeTab === 'view' && (
                    <div className="space-y-6 pb-12">
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
                                                セッティング登録を起点に、自動分析、診断、比較、購入までつなげるためのホームです。
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
                                        onClick={() => setActiveTab('clubs')}
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
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-trust-navy">
                                        <Brain size={14} />
                                        自動分析
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {analysisPoints.map((point) => (
                                            <div key={point} className="rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-600">
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
                                            保存した診断、比較候補、最近見たものをまとめて見返せます。
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
                                                保存した診断
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
                                                                比較候補に追加
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
                                                    比較候補
                                                </div>
                                                <button
                                                    onClick={() => navigate('/compare?mode=shortlist')}
                                                    className="text-[11px] font-black text-trust-navy transition-colors hover:text-slate-700"
                                                >
                                                    比較ページで開く
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
                                                            候補を見る
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
                                                                比較へ戻る
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
                                                最近見たもの
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
                        onUpdate={(b: any) => updateProfile('myBag', b)}
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
