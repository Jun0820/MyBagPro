import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
    LogIn,
    History,
    Trophy,
    LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { TargetCategory } from '../types/golf';

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
        saveDebugInfo,
        manualSave,
        manualSaveMyBag,
        manualSaveMyBagClub,
        syncWithSupabase,
        setShowAuth,
    } = useDiagnosis();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const activeTab = useMemo<'view' | 'clubs' | 'profile'>(() => {
        if (location.pathname === '/mypage/clubs' || location.pathname.startsWith('/mybag/create')) return 'clubs';
        if (location.pathname === '/mypage/profile') return 'profile';
        return 'view';
    }, [location.pathname]);

    const registeredCategories = new Set(profile.myBag.clubs.map((club) => club.category));
    const essentialCategories = [
        TargetCategory.DRIVER,
        TargetCategory.IRON,
        TargetCategory.WEDGE,
        TargetCategory.PUTTER,
    ];
    const completedEssentials = essentialCategories.filter((category) => registeredCategories.has(category)).length;
    const distanceEligibleClubs = profile.myBag.clubs.filter(
        (club) => club.category !== TargetCategory.PUTTER && club.category !== TargetCategory.BALL,
    );
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
        const legacyTab = searchParams.get('tab');
        if (!legacyTab) return;

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('tab');
        const nextSearch = nextParams.toString();
        const nextPath =
            legacyTab === 'clubs'
                ? '/mypage/clubs'
                : legacyTab === 'profile'
                    ? '/mypage/profile'
                    : '/mypage/view';

        navigate(`${nextPath}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
    }, [navigate, searchParams]);

    const sidebarMenu = [
        { key: 'view' as const, label: 'ダッシュボード', icon: Eye },
        { key: 'clubs' as const, label: 'マイクラブ', icon: Edit3 },
        { key: 'profile' as const, label: 'プロフィール編集', icon: User },
    ];
    const profileBadge = !user.isLoggedIn
        ? 'ベーシックプラン'
        : isManualSaveInFlight
            ? 'クラウド保存中'
            : hasUnsavedChanges
                ? '未保存あり'
                : 'クラウド保存済み';
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
            helper: distanceEligibleClubs.length > 0 ? `${clubsWithDistance}/${distanceEligibleClubs.length}本` : '対象なし',
            tone: 'bg-[#1f6aa5]',
        },
        {
            label: '使用ボール',
            value: profile.myBag.ball ? 100 : 18,
            helper: profile.myBag.ball ? profile.myBag.ball : '未登録',
            tone: 'bg-[#e2772f]',
        },
        {
            label: 'プロフィール情報',
            value: profile.headSpeed > 0 && profile.averageScore ? 100 : profile.headSpeed > 0 || profile.averageScore ? 60 : 18,
            helper: profile.headSpeed > 0 || profile.averageScore ? '入力あり' : '未入力',
            tone: 'bg-[#7e49b6]',
        },
    ];

    const handleClose = () => {
        navigate('/');
    };

    const buildMyPageUrl = (
        tab: 'view' | 'clubs' | 'profile',
        params?: URLSearchParams,
    ) => {
        const basePath =
            tab === 'clubs' ? '/mypage/clubs' :
            tab === 'profile' ? '/mypage/profile' :
            '/mypage/view';
        const query = params?.toString();
        return query ? `${basePath}?${query}` : basePath;
    };

    const navigateMyPageTab = (
        tab: 'view' | 'clubs' | 'profile',
        configureParams?: (params: URLSearchParams) => void,
        options?: { replace?: boolean },
    ) => {
        const params = new URLSearchParams(searchParams);
        params.delete('tab');
        if (tab !== 'clubs') {
            params.delete('focus');
            params.delete('editClub');
        }
        configureParams?.(params);
        navigate(buildMyPageUrl(tab, params), { replace: options?.replace ?? false });
    };

    const openBagTabWithFocus = (focus?: 'missing-clubs' | 'ball-first') => {
        navigateMyPageTab('clubs', (params) => {
            params.delete('welcome');
            params.delete('editClub');
            if (focus) {
                params.set('focus', focus);
            } else {
                params.delete('focus');
            }
        }, { replace: true });
    };

    const consumeRequestedEditClub = () => {
        const nextParams = new URLSearchParams(searchParams);
        if (!nextParams.has('editClub')) return;
        nextParams.delete('editClub');
        navigate(buildMyPageUrl('clubs', nextParams), { replace: true });
    };

    return (
        <div className="min-h-screen pb-20 md:pb-0">
            <main className="mx-auto max-w-[1380px] px-3 py-3 md:px-6 md:py-7">
                <div className="mb-3 flex items-center gap-2 md:mb-5 md:gap-3">
                    <button
                        onClick={handleClose}
                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-50 px-3 text-[11px] font-black text-slate-500 ring-1 ring-slate-200/80 transition hover:text-[#166534] hover:ring-[#166534]/30 md:h-10 md:px-4 md:text-xs"
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
                    <aside className="hidden space-y-3 lg:block">
                        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-[#e9efe9]">
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

                        <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-[#e9efe9]">
                            <div className="space-y-1.5">
                                {sidebarMenu.map((item) => {
                                    const Icon = item.icon;
                                    const selected = activeTab === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => navigateMyPageTab(item.key)}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-black transition',
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
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-black text-slate-600 transition hover:bg-slate-50"
                                >
                                    <History size={16} />
                                    診断履歴
                                </button>
                                <button
                                    onClick={() => navigate('/pros')}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-black text-slate-600 transition hover:bg-slate-50"
                                >
                                    <Trophy size={16} />
                                    お気に入りプロ
                                </button>
                            </div>
                        </div>

                        <div className="rounded-lg bg-[#163c29] p-4 text-white shadow-sm">
                            <div className="text-sm font-black">登録クラブから診断へ</div>
                            <p className="mt-1 text-xs leading-5 text-white/75">
                                保存した番手と飛距離を診断に使えます。パターとボールは別情報として扱います。
                            </p>
                            <button
                                onClick={() => navigate('/diagnosis')}
                                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[#c8a96a] px-4 py-2.5 text-xs font-black text-[#163c29] transition hover:bg-[#d4b67c]"
                            >
                                クラブ診断をはじめる
                            </button>
                        </div>
                    </aside>

                    <div className="min-w-0">
                        <section className="mb-3 border-b border-[#dfe7df] pb-3 md:mb-4 md:pb-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="hidden text-sm font-bold text-slate-500 md:block">あなたのゴルフデータと診断結果を確認できます。</div>
                                    <h1 className="mt-0.5 text-2xl font-black tracking-tight text-[#151719] md:mt-1 md:text-5xl">マイページ</h1>
                                </div>
                                <div className="flex flex-col gap-2 lg:min-w-[360px]">
                                    {user.isLoggedIn && (
                                        <button
                                            onClick={handleLogout}
                                            className="inline-flex min-h-[40px] items-center justify-center gap-2 self-start rounded-xl bg-slate-50 px-3 text-xs font-black text-slate-600 ring-1 ring-slate-200/80 transition hover:text-[#166534] hover:ring-[#166534]/30 lg:min-h-[46px] lg:self-end lg:rounded-2xl lg:px-4 lg:text-sm"
                                        >
                                            <LogOut size={16} />
                                            ログアウト
                                        </button>
                                    )}
                                    <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-50 p-1 ring-1 ring-slate-200/70 lg:hidden">
                                        {sidebarMenu.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.key}
                                                    onClick={() => navigateMyPageTab(item.key)}
                                                    className={cn(
                                                        'flex min-h-[40px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-black transition',
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
                    <section className="mb-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-golf-200/70 md:mb-4 md:p-5">
                        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">
                                    <LogIn size={12} />
                                    Guest Mode
                                </div>
                                <h2 className="mt-1 text-base font-black tracking-tight text-trust-navy md:text-2xl">
                                    内容を保存して、続きから再開できます
                                </h2>
                                <p className="mt-1 hidden text-sm leading-relaxed text-slate-600 md:block">
                                    クラブ登録、診断結果、お気に入りがアカウントに残ります。
                                </p>
                            </div>
                            <div className="flex shrink-0 flex-col gap-2 md:min-w-[220px]">
                            <button
                                onClick={() => setShowAuth(true)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-trust-navy px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
                            >
                                <LogIn size={16} />
                                ログインして保存する
                            </button>
                            <button
                                onClick={() => openBagTabWithFocus()}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200/80 transition-colors hover:bg-slate-50 md:min-h-[48px]"
                            >
                                セッティング登録を始める
                            </button>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'view' && (
                    <div className="space-y-2.5 pb-5 md:space-y-4 md:pb-8">
                        <section className="rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-200 md:p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaede7] text-xl font-black text-[#176534] md:h-16 md:w-16 md:text-2xl">
                                        {profileInitial}
                                    </div>
                                    <div>
                                        <div className="text-lg font-black tracking-tight text-[#151719] md:text-xl">{profile.name || 'My Golfer'}</div>
                                        <div className="mt-1 inline-flex rounded-full bg-[#eef4ef] px-2.5 py-1 text-[9px] font-black text-[#176534] md:mt-2 md:px-3 md:text-[10px]">
                                            {profileBadge}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigateMyPageTab('profile')}
                                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-black text-[#176534] ring-1 ring-slate-200/80 transition hover:bg-slate-100 md:min-h-[42px] md:gap-2 md:px-3 md:py-2 md:text-xs"
                                >
                                    <Edit3 size={14} />
                                    編集
                                </button>
                            </div>

                            <div className="mt-2.5 rounded-lg bg-[#f7faf7] p-2.5 md:mt-4 md:p-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-black text-[#151719]">進行状況</div>
                                    <div className="text-xs font-black text-slate-400">{dashboardScore}/100</div>
                                </div>
                                <div className="mt-2.5 grid grid-cols-2 gap-2 md:mt-4 md:gap-3">
                                    {scoreBars.map((item) => (
                                        <div key={item.label} className="rounded-lg bg-white/80 p-2 md:p-3">
                                            <div className="text-[10px] uppercase text-slate-400">{item.label}</div>
                                            <div className="mt-0.5 text-base font-black text-[#151719] md:mt-1 md:text-lg">{item.helper}</div>
                                            <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                                                <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.value}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2.5 grid grid-cols-2 gap-2 md:mt-4 md:grid-cols-3">
                                    <button onClick={() => navigateMyPageTab('clubs')} className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-[#176534] px-3 py-2 text-[11px] font-black text-white md:min-h-[44px] md:rounded-xl md:py-3 md:text-xs">マイクラブ</button>
                                    <button onClick={() => navigateMyPageTab('profile')} className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-black text-trust-navy ring-1 ring-slate-200/80 md:min-h-[44px] md:rounded-xl md:py-3 md:text-xs">プロフィール</button>
                                    <button onClick={() => navigate('/diagnosis')} className="col-span-2 inline-flex min-h-[38px] items-center justify-center rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-black text-trust-navy ring-1 ring-slate-200/80 md:col-span-1 md:min-h-[44px] md:rounded-xl md:py-3 md:text-xs">診断する</button>
                                </div>
                            </div>

                            <div className="mt-2.5 rounded-lg bg-slate-50 px-3 py-1.5 md:mt-4 md:px-4 md:py-2.5">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500">
                                    <span>{hasUnsavedChanges ? `未保存 ${pendingBagChangeCount}件` : 'クラウド保存済み'}</span>
                                    <span>{lastSavedClubCount > 0 ? `保存済み ${lastSavedClubCount}本` : `登録 ${profile.myBag.clubs.length}本`}</span>
                                    {lastCloudSavedAt && <span>前回保存 {new Date(lastCloudSavedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>}
                                </div>
                                {saveStatus === 'error' && saveErrorDetail && <div className="mt-2 text-xs font-bold text-rose-600">{saveErrorDetail}</div>}
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
                        extendedColumnsSaved={Boolean(saveDebugInfo?.extendedColumnsSaved)}
                        missingExtendedColumns={saveDebugInfo?.missingExtendedColumns || []}
                        onManualSave={(settingOverride) => {
                            return manualSaveMyBag(settingOverride || profile.myBag);
                        }}
                        onManualSaveClub={(clubId, settingOverride) => {
                            return manualSaveMyBagClub(clubId, settingOverride || profile.myBag);
                        }}
                        onReloadFromCloud={syncWithSupabase}
                        intakeMode={(searchParams.get('focus') as 'missing-clubs' | 'ball-first' | null) || 'default'}
                        requestedEditClubId={searchParams.get('editClub')}
                        onConsumeRequestedEditClubId={consumeRequestedEditClub}
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
                        isManualSaveInFlight={isManualSaveInFlight}
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
                                onClick={() => navigateMyPageTab(item.key)}
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
