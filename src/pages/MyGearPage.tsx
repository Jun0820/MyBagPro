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
    Save,
    LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TargetCategory, type DiagnosisHistoryItem } from '../types/golf';
import { getCompareShortlist, type CompareShortlistItem } from '../lib/diagnosisCompare';
import { saveDiagnosisRankingsToCompare } from '../lib/diagnosisCompare';
import { getRecentlyViewed, type RecentlyViewedItem } from '../lib/recentlyViewed';
import { getFavoriteClubs, removeFavoriteClub, type FavoriteClubItem } from '../lib/favoriteClubs';
import { AFFILIATE_SHOPS, getAffiliateUrl } from '../utils/affiliate';
import { trackEvent } from '../lib/analytics';

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
        isManualSaveInFlight,
        saveErrorDetail,
        hasUnsavedChanges,
        pendingBagChangeCount,
        pendingBagChangeIds,
        lastCloudSavedAt,
        lastSaveTargetClubCount,
        lastSavedClubCount,
        manualSave,
        manualSaveMyBag,
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
    const [clubDistanceView, setClubDistanceView] = useState<'total' | 'carry'>('total');
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
    const distanceEligibleClubs = profile.myBag.clubs.filter((club) => club.category !== TargetCategory.PUTTER);
    const clubsWithDistance = distanceEligibleClubs.filter((club) => String(club.distance || '').trim() !== '').length;
    const distanceCoveragePercent = distanceEligibleClubs.length > 0 ? Math.round((clubsWithDistance / distanceEligibleClubs.length) * 100) : 0;
    const completionPoints = [
        completedEssentials > 0 ? 1 : 0,
        profile.myBag.ball ? 1 : 0,
        profile.headSpeed > 0 ? 1 : 0,
        profile.averageScore ? 1 : 0,
        profile.myBag.clubs.length >= 8 ? 1 : 0,
    ].reduce((sum, current) => sum + current, 0);
    const completionPercent = Math.round((completionPoints / 5) * 100);
    const recentHistory = (user.history || []).slice(0, 3);
    const considerationCount = recentHistory.length + recentlyViewed.length + favoriteClubs.length;
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
            onClick: () => {
                trackEvent('click_primary_move', {
                    source_page: 'mypage',
                    primary_move: 'starter-clubs',
                });
                openBagTabWithFocus('missing-clubs');
            },
        }
        : !profile.myBag.ball
        ? {
            eyebrow: 'Primary Move',
            title: '次はボールまでそろえる',
            description: '使用ボールが入ると、クラブとのつながりや診断結果がかなり具体化します。',
            actionLabel: 'ボールを登録する',
            onClick: () => {
                trackEvent('click_primary_move', {
                    source_page: 'mypage',
                    primary_move: 'ball-first',
                });
                openBagTabWithFocus('ball-first');
            },
        }
        : recentHistory.length === 0
        ? {
            eyebrow: 'Primary Move',
            title: '次は診断をはじめる',
            description: '登録したバッグをもとに、まずは総合診断で次の1本を絞れます。',
            actionLabel: '診断へ進む',
            onClick: () => {
                trackEvent('click_primary_move', {
                    source_page: 'mypage',
                    primary_move: 'diagnosis-first',
                });
                navigate('/diagnosis');
            },
        }
        : {
            eyebrow: 'Primary Move',
            title: '診断を1つ追加して判断を深める',
            description: '保存した内容を活かして、ボールやカテゴリ診断から次の1本を絞れます。',
            actionLabel: '診断へ進む',
            onClick: () => {
                trackEvent('click_primary_move', {
                    source_page: 'mypage',
                    primary_move: 'diagnosis',
                });
                navigate('/diagnosis');
            },
        };

    useEffect(() => {
        setCompareShortlist(getCompareShortlist());
        setRecentlyViewed(getRecentlyViewed());
        setFavoriteClubs(getFavoriteClubs());
    }, []);

    useEffect(() => {
        const handleBeforeUnload = () => {
            void manualSave();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [manualSave]);

    const handleLogout = async () => {
        if (!window.confirm('ログアウトしますか？')) return;
        await supabase.auth.signOut();
        window.location.href = '#/';
    };

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
            : '飛距離はまだ未入力です。1W / 7I / ウェッジあたりから入れると診断しやすくなります。';
    const longGameTone =
        fairwayCount + utilityCount >= 3
            ? `ロングゲーム側は FW ${fairwayCount} 本 / UT ${utilityCount} 本で流れを見やすい構成です。`
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
            label: 'プロのセッティングを探す',
            description: '近い条件のプロを参考にする',
            onClick: () => navigate('/settings/pros'),
        },
    ];
    const sidebarMenu = [
        { key: 'view' as const, label: 'ダッシュボード', icon: Eye },
        { key: 'clubs' as const, label: 'マイクラブ', icon: Edit3 },
        { key: 'profile' as const, label: 'プロフィール編集', icon: User },
    ];
    const profileBadge = user.isLoggedIn ? 'クラウド保存中' : 'ベーシックプラン';
    const profileInitial = (profile.name || 'M').trim().charAt(0).toUpperCase();
    const compactMyClubs = profile.myBag.clubs;
    const mobileFeaturedClubs = profile.myBag.clubs.slice(0, 4);
    const dashboardScore = Math.max(
        18,
        Math.min(
            100,
            Math.round(
                (completionPercent * 0.5) +
                (distanceCoveragePercent * 0.25) +
                (profile.headSpeed > 0 ? 12 : 0) +
                (profile.myBag.ball ? 8 : 0) +
                (profile.averageScore ? 5 : 0),
            ),
        ),
    );
    const scoreBars = [
        {
            label: 'クラブ登録',
            value: Math.max(8, Math.round(completionPercent)),
            helper: `${Math.min(compactMyClubs.length, 14)}/14本`,
            tone: 'bg-[#176534]',
        },
        {
            label: '飛距離入力',
            value: Math.max(8, Math.round(distanceCoveragePercent)),
            helper: distanceCoveragePercent > 0 ? `${distanceCoveragePercent}%` : '未入力',
            tone: 'bg-[#1f6aa5]',
        },
        {
            label: '使用ボール',
            value: profile.myBag.ball ? 100 : 18,
            helper: profile.myBag.ball ? profile.myBag.ball : '未登録',
            tone: 'bg-[#e2772f]',
        },
        {
            label: '基本プロフィール',
            value: profile.headSpeed > 0 && profile.averageScore ? 100 : profile.headSpeed > 0 || profile.averageScore ? 60 : 18,
            helper: profile.headSpeed > 0 || profile.averageScore ? '入力あり' : '未入力',
            tone: 'bg-[#7e49b6]',
        },
    ];

    const handleClose = () => {
        navigate('/');
    };

    const getDisplayedClubDistance = (club: typeof profile.myBag.clubs[number]) => {
        const total = String(club.distance || '').trim();
        const carry = String(club.carryDistance || '').trim();
        return clubDistanceView === 'carry' ? (carry || total) : (total || carry);
    };

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
        <div className="min-h-screen pb-20 md:pb-0">
            <main className="mx-auto max-w-[1380px] px-4 py-6 md:px-6 md:py-8">
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={handleClose}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-500 transition hover:border-[#166534] hover:text-[#166534]"
                    >
                        <ArrowLeft size={16} />
                        HOME
                    </button>
                    <div className="hidden items-center gap-2 text-xs font-bold text-slate-400 md:flex">
                        {isManualSaveInFlight ? (
                            <>
                                <Loader2 size={12} className="animate-spin text-[#166534]" />
                                保存内容を同期しています
                            </>
                        ) : saveStatus === 'saved' ? (
                            <>
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                同期完了
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]">
                    <aside className="hidden space-y-4 lg:block">
                        <div className="rounded-[28px] border border-[#e5ece6] bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaede7] text-2xl font-black text-[#176534]">
                                    {profileInitial}
                                </div>
                                <div>
                                    <div className="text-2xl font-black tracking-tight text-[#151719]">{profile.name || 'My Golfer'}</div>
                                    <div className="mt-1 inline-flex rounded-full bg-[#eef4ef] px-3 py-1 text-[11px] font-black text-[#176534]">
                                        {profileBadge}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                                <div className="flex items-center justify-between"><span>ハンディキャップ</span><span>{profile.bestScore ? Math.max(profile.bestScore - 72, 0) : 12}</span></div>
                                <div className="flex items-center justify-between"><span>ベストスコア</span><span>{profile.bestScore || 85}</span></div>
                            </div>

                        </div>

                        <div className="rounded-[28px] border border-[#e5ece6] bg-white p-3 shadow-sm">
                            <div className="space-y-1.5">
                                {sidebarMenu.map((item) => {
                                    const Icon = item.icon;
                                    const selected = activeTab === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => setActiveTab(item.key)}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition',
                                                selected ? 'bg-[#edf6ef] text-[#166534]' : 'text-slate-600 hover:bg-slate-50'
                                            )}
                                        >
                                            <Icon size={16} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => navigate('/diagnosis')}
                                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-slate-600 transition hover:bg-slate-50"
                                >
                                    <History size={16} />
                                    診断履歴
                                </button>
                                <button
                                    onClick={() => navigate('/settings/pros')}
                                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-slate-600 transition hover:bg-slate-50"
                                >
                                    <Trophy size={16} />
                                    お気に入りプロ
                                </button>
                            </div>
                        </div>

                        <div className="rounded-[28px] bg-[#163c29] p-5 text-white shadow-sm">
                            <div className="text-lg font-black">もっと詳しく分析しませんか？</div>
                            <p className="mt-2 text-sm leading-7 text-white/75">
                                クラブ登録と診断を組み合わせると、次に見直すべきポイントがかなり明確になります。
                            </p>
                            <button
                                onClick={() => navigate('/diagnosis')}
                                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#c8a96a] px-4 py-3 text-sm font-black text-[#163c29] transition hover:bg-[#d4b67c]"
                            >
                                クラブ診断をはじめる
                            </button>
                        </div>
                    </aside>

                    <div className="min-w-0">
                        <section className="mb-6 rounded-[28px] border border-[#e5ece6] bg-white px-5 py-5 shadow-sm md:px-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="text-sm font-bold text-slate-500">あなたのゴルフデータと診断結果を確認できます。</div>
                                    <h1 className="mt-2 text-3xl font-black tracking-tight text-[#151719] md:text-5xl">マイページ</h1>
                                </div>
                                <div className="flex flex-col gap-3 lg:min-w-[360px]">
                                    {user.isLoggedIn && (
                                        <button
                                            onClick={handleLogout}
                                            className="inline-flex min-h-[46px] items-center justify-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:border-[#166534] hover:text-[#166534] lg:self-end"
                                        >
                                            <LogOut size={16} />
                                            ログアウト
                                        </button>
                                    )}
                                    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 lg:hidden">
                                        {sidebarMenu.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.key}
                                                    onClick={() => setActiveTab(item.key)}
                                                    className={cn(
                                                        'flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-[11px] font-black transition',
                                                        activeTab === item.key ? 'bg-white text-[#166534] shadow-sm' : 'text-slate-500'
                                                    )}
                                                >
                                                    <Icon size={16} />
                                                    <span className="text-center">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </section>

                {!user.isLoggedIn && (
                    <section className="mb-6 rounded-[28px] border border-golf-200 bg-gradient-to-br from-golf-50 via-white to-emerald-50 p-5 shadow-lg md:p-6">
                        <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">
                                    <LogIn size={12} />
                                    Guest Mode
                                </div>
                                <div>
                                    <h2 className="text-lg font-black tracking-tight text-trust-navy md:text-2xl">
                                        内容を保存して、続きから再開できます
                                    </h2>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                        クラブ登録、診断結果、お気に入りがそのまま残ります。
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 md:gap-3">
                                <div className="rounded-2xl border border-white bg-white/80 px-3 py-3 text-left md:px-4">
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 md:text-[10px]">Save</div>
                                    <div className="mt-1 text-xs font-black text-trust-navy md:text-sm">診断を保存</div>
                                </div>
                                <div className="rounded-2xl border border-white bg-white/80 px-3 py-3 text-left md:px-4">
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 md:text-[10px]">Cloud</div>
                                    <div className="mt-1 text-xs font-black text-trust-navy md:text-sm">クラウド保存</div>
                                </div>
                                <div className="rounded-2xl border border-white bg-white/80 px-3 py-3 text-left md:px-4">
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 md:text-[10px]">Resume</div>
                                    <div className="mt-1 text-xs font-black text-trust-navy md:text-sm">すぐ再開</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2">
                            <button
                                onClick={() => setShowAuth(true)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-trust-navy px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
                            >
                                <LogIn size={16} />
                                ログインして保存する
                            </button>
                            <button
                                onClick={() => openBagTabWithFocus()}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 md:min-h-[48px]"
                            >
                                セッティング登録を始める
                            </button>
                        </div>
                    </section>
                )}

                {activeTab === 'view' && (
                    <div className="space-y-5 pb-8">
                        {showWelcomeBanner && (
                            <section className="rounded-[24px] border border-golf-200 bg-gradient-to-br from-golf-50 via-white to-emerald-50 p-4 shadow-sm md:rounded-[28px] md:p-5">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">WELCOME</div>
                                        <div className="mt-1 text-lg font-black tracking-tight text-trust-navy">次にやることを3つに絞りました</div>
                                        <p className="mt-1 text-sm leading-relaxed text-slate-600">番手を埋める、ボールを整える、診断を進める。この順で進めると迷いにくくなります。</p>
                                    </div>
                                    <button
                                        onClick={dismissWelcome}
                                        className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-500 transition-colors hover:bg-slate-50"
                                    >
                                        閉じる
                                    </button>
                                </div>
                            </section>
                        )}

                        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaede7] text-2xl font-black text-[#176534]">
                                            {profileInitial}
                                        </div>
                                        <div>
                                            <div className="text-xl font-black tracking-tight text-[#151719]">{profile.name || 'My Golfer'}</div>
                                            <div className="mt-2 inline-flex rounded-full bg-[#eef4ef] px-3 py-1 text-[10px] font-black text-[#176534]">
                                                {profileBadge}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setActiveTab('profile')}
                                            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-[#176534] transition hover:bg-slate-50"
                                        >
                                            <Edit3 size={14} />
                                            編集
                                        </button>
                                        {user.isLoggedIn && (
                                            <button
                                                onClick={() => void handleLogout()}
                                                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                                            >
                                                <LogOut size={14} />
                                                ログアウト
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
                                    <div className="rounded-2xl border border-[#e5ece6] bg-[#fbfcfb] p-4">
                                        <div className="text-sm font-black text-[#151719]">診断準備度</div>
                                        <div className="mt-4 flex items-center gap-4 md:flex-col md:items-start">
                                            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-[7px] border-[#176534]/15">
                                                <div
                                                    className="absolute inset-0 rounded-full border-[7px] border-transparent border-t-[#176534] border-r-[#176534] rotate-45"
                                                    style={{ clipPath: `inset(0 ${100 - dashboardScore}% 0 0)` }}
                                                />
                                                <div className="text-center">
                                                    <div className="text-3xl font-black text-[#151719]">{dashboardScore}</div>
                                                    <div className="text-[10px] font-black text-slate-400">/100</div>
                                                </div>
                                            </div>
                                            <div className="grid flex-1 grid-cols-2 gap-2 text-sm font-bold text-slate-600 md:w-full">
                                                <div className="rounded-xl bg-white p-3">
                                                    <div className="text-[10px] uppercase text-slate-400">登録クラブ</div>
                                                    <div className="mt-1 text-lg font-black text-[#151719]">{compactMyClubs.length}<span className="ml-1 text-xs text-slate-400">/14</span></div>
                                                </div>
                                                <div className="rounded-xl bg-white p-3">
                                                    <div className="text-[10px] uppercase text-slate-400">飛距離入力</div>
                                                    <div className="mt-1 text-lg font-black text-[#151719]">{distanceCoveragePercent}<span className="ml-1 text-xs text-slate-400">%</span></div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-xs leading-relaxed text-slate-500">
                                            ゴルフの実力ではなく、<span className="font-black text-trust-navy">診断に使える情報がどれだけそろっているか</span> を見ています。
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="text-sm font-black text-[#151719]">いま診断に使えるデータ</div>
                                        <div className="mt-4 space-y-3">
                                            {scoreBars.map((item) => (
                                                <div key={item.label}>
                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                                        <span>{item.label}</span>
                                                        <span>{item.helper}</span>
                                                    </div>
                                                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                                                        <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.value}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                            <button onClick={() => setActiveTab('clubs')} className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#176534] px-3 py-3 text-xs font-black text-white">クラブ編集</button>
                                            <button onClick={() => navigate('/diagnosis')} className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-trust-navy">診断する</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500">
                                        <span>{hasUnsavedChanges ? `未保存 ${pendingBagChangeCount}件` : 'クラウド保存済み'}</span>
                                        <span>保存対象 {lastSaveTargetClubCount}本</span>
                                        <span>クラウド確認 {lastSavedClubCount}本</span>
                                        {lastCloudSavedAt && <span>前回保存 {new Date(lastCloudSavedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>}
                                    </div>
                                    {saveStatus === 'error' && saveErrorDetail && <div className="mt-2 text-xs font-bold text-rose-600">{saveErrorDetail}</div>}
                                </div>
                            </div>

                            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">My Clubs</div>
                                        <div className="mt-1 text-xl font-black tracking-tight text-trust-navy">マイクラブ</div>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('clubs')}
                                        className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-[#176534] transition hover:bg-slate-50"
                                    >
                                        編集する
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <div className="text-xs font-black text-slate-400">{Math.min(compactMyClubs.length, 14)}/14本</div>
                                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-[11px] font-black">
                                        <button
                                            onClick={() => setClubDistanceView('total')}
                                            className={cn('rounded-full px-3 py-1 transition', clubDistanceView === 'total' ? 'bg-white text-trust-navy shadow-sm' : 'text-slate-400')}
                                        >
                                            総距離
                                        </button>
                                        <button
                                            onClick={() => setClubDistanceView('carry')}
                                            className={cn('rounded-full px-3 py-1 transition', clubDistanceView === 'carry' ? 'bg-white text-trust-navy shadow-sm' : 'text-slate-400')}
                                        >
                                            キャリー
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {compactMyClubs.length > 0 ? (
                                        compactMyClubs.map((club) => (
                                            <button
                                                key={club.id}
                                                onClick={() => setActiveTab('clubs')}
                                                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100"
                                            >
                                                <div className="min-w-[52px] rounded-xl bg-white px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                                                    {club.number || club.category}
                                                </div>
                                                <div className="ml-3 text-right">
                                                    <div className="text-base font-black text-trust-navy">
                                                        {getDisplayedClubDistance(club) ? `${getDisplayedClubDistance(club)}Y` : '未入力'}
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <button onClick={() => setActiveTab('clubs')} className="w-full rounded-2xl border border-dashed border-[#c8d8cc] bg-[#f8fbf8] px-4 py-8 text-left">
                                            <div className="text-sm font-black text-trust-navy">クラブを登録してはじめましょう</div>
                                            <div className="mt-1 text-xs text-slate-500">ドライバーや7Iから1本ずつで十分です。</div>
                                        </button>
                                    )}
                                </div>
                            </section>
                        </section>

                        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-xl font-black tracking-tight text-trust-navy">最近の診断結果</div>
                                    <div className="text-xs font-black text-slate-400">{recentHistory.length}件</div>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {recentHistory.length > 0 ? recentHistory.slice(0, 4).map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => openSavedDiagnosis(item)}
                                            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100"
                                        >
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                                    {item.category === TargetCategory.TOTAL_SETTING ? '総合診断' : `${item.category} 診断`}
                                                </div>
                                                <div className="mt-1 truncate text-sm font-black text-trust-navy">
                                                    {item.result?.rankings?.[0]?.modelName || item.result?.recommendedBall?.name || '診断結果'}
                                                </div>
                                            </div>
                                            <div className="ml-3 text-right">
                                                <div className="text-sm font-black text-trust-navy">{Math.round(item.result?.rankings?.[0]?.matchPercentage || 72)}</div>
                                                <div className="text-[10px] font-bold text-slate-400">/100</div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                            まだ診断結果はありません。まずは1回診断するとここに残せます。
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                                <div className="text-xl font-black tracking-tight text-trust-navy">見返したい候補</div>
                                <p className="mt-2 text-xs leading-relaxed text-slate-500">見返したい診断、お気に入り、最近見たページをここにまとめています。</p>
                                <div className="mt-4 space-y-4">
                                    {favoriteClubs.length > 0 && (
                                        <div>
                                            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">お気に入り登録</div>
                                            <div className="space-y-2">
                                                {favoriteClubs.slice(0, 3).map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => openFavoriteBuy(item)}
                                                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100"
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-black text-trust-navy">{item.brand} {item.modelName}</div>
                                                            <div className="mt-1 text-[11px] text-slate-500">{item.category}</div>
                                                        </div>
                                                        <ShoppingCart size={14} className="text-slate-400" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {recentlyViewed.length > 0 && (
                                        <div>
                                            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">最近見たページ</div>
                                            <div className="space-y-2">
                                                {recentlyViewed.slice(0, 3).map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => openRecentlyViewed(item)}
                                                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100"
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-black text-trust-navy">{item.title}</div>
                                                            {item.subtitle && <div className="mt-1 text-[11px] text-slate-500">{item.subtitle}</div>}
                                                        </div>
                                                        <ArrowRight size={14} className="text-slate-400" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {favoriteClubs.length === 0 && recentlyViewed.length === 0 && recentHistory.length === 0 && (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                            診断結果を残したり、お気に入り登録するとここからすぐ見直せます。
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {false && activeTab === 'view' && (
                    <div className="space-y-4 pb-8">
                        <section className="space-y-4 md:hidden">
                            <div className="rounded-[28px] border border-[#e5ece6] bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaede7] text-2xl font-black text-[#176534]">
                                            {profileInitial}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-lg font-black tracking-tight text-[#151719]">{profile.name || 'My Golfer'}</div>
                                            <div className="mt-2 inline-flex rounded-full bg-[#eef4ef] px-3 py-1 text-[10px] font-black text-[#176534]">
                                                {profileBadge}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-[#176534] transition hover:bg-slate-50"
                                    >
                                        <Edit3 size={14} />
                                        編集
                                    </button>
                                </div>
                                
                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-slate-600">
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <div className="text-[10px] uppercase text-slate-400">ハンディキャップ</div>
                                        <div className="mt-1 text-lg font-black text-[#151719]">{profile.bestScore ? Math.max((profile.bestScore ?? 72) - 72, 0) : 12}</div>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3">
                                        <div className="text-[10px] uppercase text-slate-400">ベストスコア</div>
                                        <div className="mt-1 text-lg font-black text-[#151719]">{profile.bestScore || 85}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-[#e5ece6] bg-white p-4 shadow-sm">
                                <div className="text-sm font-black text-[#151719]">総合スコア</div>
                                <div className="mt-4 flex gap-4">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-[#176534]/15">
                                            <div
                                                className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-[#176534] border-r-[#176534] rotate-45"
                                                style={{ clipPath: `inset(0 ${100 - dashboardScore}% 0 0)` }}
                                            />
                                            <div className="text-center">
                                                <div className="text-2xl font-black text-[#151719]">{dashboardScore}</div>
                                                <div className="text-[9px] font-black text-slate-400">/100</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        {scoreBars.map((item) => (
                                            <div key={item.label}>
                                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                                    <span>{item.label}</span>
                                                    <span>{item.value}</span>
                                                </div>
                                                <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                                                    <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.value}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-[#e5ece6] bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-black text-trust-navy">マイクラブ</div>
                                    <button onClick={() => setActiveTab('clubs')} className="text-xs font-black text-[#176534]">
                                        編集
                                    </button>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    {mobileFeaturedClubs.length > 0 ? (
                                        mobileFeaturedClubs.map((club) => (
                                            <button
                                                key={club.id}
                                                onClick={() => setActiveTab('clubs')}
                                                className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-left"
                                            >
                                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                                    {club.number || club.category}
                                                </div>
                                                <div className="mt-1 text-xs font-black text-trust-navy">{club.brand || 'ブランド未設定'}</div>
                                                <div className="text-[11px] text-slate-500">{club.model || 'モデル未設定'}</div>
                                            </button>
                                        ))
                                    ) : (
                                        <button
                                            onClick={() => setActiveTab('clubs')}
                                            className="col-span-2 rounded-2xl border border-dashed border-[#c8d8cc] bg-[#f8fbf8] px-3 py-4 text-left"
                                        >
                                            <div className="text-xs font-black text-trust-navy">クラブを登録してはじめましょう</div>
                                            <div className="text-[11px] text-slate-500">ドライバーか7I から</div>
                                        </button>
                                    )}
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setActiveTab('clubs')}
                                        className="inline-flex items-center justify-center rounded-xl bg-[#176534] px-3 py-2 text-xs font-black text-white"
                                    >
                                        登録・編集
                                    </button>
                                    <button
                                        onClick={() => navigate('/settings/pros')}
                                        className="inline-flex items-center justify-center rounded-xl border border-[#c9d7cb] bg-white px-3 py-2 text-xs font-black text-[#176534]"
                                    >
                                        プロを見る
                                    </button>
                                </div>
                            </div>

                            {recentHistory.length > 0 && (
                                <div className="rounded-[28px] border border-[#e5ece6] bg-white p-3 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-black text-trust-navy">最近の診断</div>
                                        <button onClick={() => {}} className="text-xs font-black text-[#176534]">
                                            詳細 →
                                        </button>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {(recentHistory.slice(0, 2)).map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => openSavedDiagnosis(item)}
                                                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:bg-slate-100"
                                            >
                                                <div className="min-w-0 truncate font-black text-trust-navy">
                                                    {item.category === TargetCategory.TOTAL_SETTING ? '総合診断' : `${item.category} 診断`}
                                                </div>
                                                <div className="ml-2 flex-shrink-0 font-black text-trust-navy">
                                                    {Math.round(item.result?.rankings?.[0]?.matchPercentage || 72)}/100
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        {showWelcomeBanner && (
                            <section className="rounded-[24px] border border-golf-200 bg-gradient-to-br from-golf-50 via-white to-emerald-50 p-4 shadow-lg md:rounded-[28px] md:p-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">
                                            <Sparkles size={12} />
                                            Welcome
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black tracking-tight text-trust-navy md:text-2xl">
                                                保存と再開が使える状態になりました
                                            </h2>
                                            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                                                いまのセッティングと診断結果をマイページに残せます。次にやることは、今の登録状況に合わせて下にまとめています。
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={dismissWelcome}
                                        className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500 transition-colors hover:bg-slate-50 md:w-auto"
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
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-golf-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-golf-700 md:w-auto"
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
                                            setActiveTab('clubs');
                                        }}
                                        className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-trust-navy transition-colors hover:bg-slate-50"
                                    >
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step 3</div>
                                        <div className="mt-1 text-base font-black">マイクラブを整える</div>
                                    </button>
                                </div>
                            </section>
                        )}

                        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl md:rounded-[32px] md:p-6">
                                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                                    <div className="space-y-3">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-golf-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">
                                            <Sparkles size={12} />
                                            My Golf Home
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-black tracking-tight text-trust-navy md:text-4xl">
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

                                <div className="mt-5 grid gap-3 sm:grid-cols-2 md:mt-6 md:gap-4 lg:grid-cols-4">
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

                                <div className="mt-4">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Save Status</div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-trust-navy">
                                            {isManualSaveInFlight ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin text-golf-600" />
                                                    保存内容を同期しています
                                                </>
                                            ) : saveStatus === 'error' ? (
                                                <>
                                                    <CircleGauge size={14} className="text-amber-500" />
                                                    {saveErrorDetail || '保存でつまずいています。もう一度保存してください'}
                                                </>
                                            ) : hasUnsavedChanges ? (
                                                <>
                                                    <Save size={14} className="text-cyan-600" />
                                                    まだ保存していない変更があります
                                                </>
                                            ) : lastCloudSavedAt ? (
                                                <>
                                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                                    最終保存: {new Date(lastCloudSavedAt ?? Date.now()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                </>
                                            ) : (
                                                <>クラブ登録やプロフィール編集はこのページに順次保存されます</>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {user.isLoggedIn && (
                                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            onClick={() => void manualSave()}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-trust-navy transition-colors hover:bg-slate-50 sm:w-auto"
                                        >
                                            <CheckCircle2 size={14} />
                                            今すぐ保存する
                                        </button>
                                        <button
                                            onClick={() => void syncWithSupabase()}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 sm:w-auto"
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
                                                onClick={() => navigate('/settings/pros')}
                                                className="rounded-2xl border border-golf-200 bg-white px-4 py-4 text-left transition-colors hover:bg-golf-100/40"
                                            >
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">3</div>
                                                <div className="mt-1 text-base font-black text-trust-navy">プロのセッティングを見る</div>
                                                <div className="mt-1 text-xs leading-relaxed text-slate-500">近いセッティングの参考例を見られます。</div>
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

                                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

                        {(recentlyViewed.length > 0 || recentHistory.length > 0 || favoriteClubs.length > 0) && (
                            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
                                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-trust-navy">
                                                <Sparkles size={14} />
                                                検討中
                                            </div>
                                        <p className="mt-2 text-sm text-slate-500">
                                            何を残し、何を見直し、次にどこを見るかをこの中で続けられます。
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
                        saveStatus={saveStatus}
                        isManualSaveInFlight={isManualSaveInFlight}
                        saveErrorDetail={saveErrorDetail}
                        hasUnsavedChanges={hasUnsavedChanges}
                        pendingBagChangeCount={pendingBagChangeCount}
                        pendingBagChangeIds={pendingBagChangeIds}
                        lastCloudSavedAt={lastCloudSavedAt}
                        lastSaveTargetClubCount={lastSaveTargetClubCount}
                        lastSavedClubCount={lastSavedClubCount}
                        onManualSave={(settingOverride) => {
                            if (!settingOverride) return;
                            void manualSaveMyBag(settingOverride);
                        }}
                        onReloadFromCloud={syncWithSupabase}
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
                        onLogout={handleLogout}
                    />
                )}
                    </div>
                </div>
            </main>

            {/* モバイル用 ボトムナビゲーション */}
            <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white shadow-lg md:hidden">
                <div className="mx-auto flex max-w-[1380px] items-center justify-around">
                    {sidebarMenu.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.key;
                        return (
                            <button
                                key={item.key}
                                onClick={() => setActiveTab(item.key)}
                                className={cn(
                                    'flex flex-col items-center gap-1 px-4 py-3 text-xs font-black transition',
                                    isActive
                                        ? 'text-[#166534]'
                                        : 'text-slate-400 hover:text-slate-600'
                                )}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};
