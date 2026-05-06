import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDiagnosis } from '../context/DiagnosisContext';
import { MyBagManager } from '../features/gear/MyBagManager';
import { ProfileManager } from '../features/gear/ProfileManager';
import {
    ArrowLeft,
    Edit3,
    User,
    Eye,
    Loader2,
    CheckCircle2,
    ArrowRight,
    LogIn,
    History,
    Trophy,
    ShoppingCart,
    LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TargetCategory, type DiagnosisHistoryItem } from '../types/golf';
import { getRecentlyViewed, type RecentlyViewedItem } from '../lib/recentlyViewed';
import { getFavoriteClubs, type FavoriteClubItem } from '../lib/favoriteClubs';
import { AFFILIATE_SHOPS, getAffiliateUrl } from '../utils/affiliate';
import { trackEvent } from '../lib/analytics';

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

    useEffect(() => {
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

    useEffect(() => {
        const currentTab = searchParams.get('tab') || 'view';
        if (currentTab === activeTab) return;

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', activeTab);
        setSearchParams(nextParams, { replace: true });
    }, [activeTab, searchParams, setSearchParams]);

    const sidebarMenu = [
        { key: 'view' as const, label: 'ダッシュボード', icon: Eye },
        { key: 'clubs' as const, label: 'マイクラブ', icon: Edit3 },
        { key: 'profile' as const, label: 'プロフィール編集', icon: User },
    ];
    const profileBadge = user.isLoggedIn ? 'クラウド保存中' : 'ベーシックプラン';
    const profileInitial = (profile.name || 'M').trim().charAt(0).toUpperCase();
    const compactMyClubs = profile.myBag.clubs;
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

    const openSavedDiagnosis = (item: DiagnosisHistoryItem) => {
        restoreDiagnosisResult(item);
        navigate('/result');
    };

    const openRecentlyViewed = (item: RecentlyViewedItem) => {
        navigate(item.href);
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
                                        <span>{lastSavedClubCount > 0 ? `保存済み ${lastSavedClubCount}本` : `登録 ${profile.myBag.clubs.length}本`}</span>
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
                                                <div className="flex items-center gap-3">
                                                    <div className="min-w-[52px] rounded-xl bg-white px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                                                        {club.number || club.category}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-black text-trust-navy">
                                                            {club.brand || '未登録'}
                                                        </div>
                                                        <div className="truncate text-[11px] text-slate-500">
                                                            {club.model || 'モデル未登録'}
                                                        </div>
                                                    </div>
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
                                <div className="text-xl font-black tracking-tight text-trust-navy">見返したいもの</div>
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
                            return manualSaveMyBag(settingOverride || profile.myBag);
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
