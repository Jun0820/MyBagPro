import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import {
    type UserAccount, type UserProfile, type DiagnosisHistoryItem,
    INITIAL_ACCOUNT, INITIAL_PROFILE
} from '../types/golf';
import type { ClubSetting } from '../types/golf';
import { generateFittingDiagnosis, type DiagnosisResult } from '../lib/gemini';
import { convertProfileToCustomerData, sendToGoogleSheets } from '../lib/googleSheets';
import { supabase } from '../lib/supabase';
import { buildStoredSocialLinks, normalizeUserSocialLinks } from '../lib/userSocials';
import { trackEvent } from '../lib/analytics';

interface DiagnosisContextType {
    user: UserAccount;
    setUser: (user: UserAccount) => void;
    profile: UserProfile;
    setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    updateProfile: (field: keyof UserProfile, value: any) => void;

    // Diagnosis State
    step: number;
    setStep: (step: number) => void;
    isAnalyzing: boolean;
    diagnosisError: string | null;
    resultData: DiagnosisResult | null;
    runDiagnosis: () => Promise<boolean>;
    resetDiagnosis: () => void;
    restoreDiagnosisResult: (historyItem: DiagnosisHistoryItem) => void;

    // UI State
    showAuth: boolean;
    setShowAuth: (show: boolean) => void;
    showMyPage: boolean;
    setShowMyPage: (show: boolean) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    isManualSaveInFlight: boolean;
    saveErrorDetail: string | null;
    hasUnsavedChanges: boolean;
    pendingBagChangeCount: number;
    pendingBagChangeIds: string[];
    lastCloudSavedAt: string | null;
    lastSaveTargetClubCount: number;
    lastSavedClubCount: number;
    saveDebugInfo: {
        expectedCount: number;
        receivedCount: number;
        dedupedCount: number;
        verifiedCount: number;
    } | null;
    syncWithSupabase: () => Promise<void>;
    manualSave: (profileOverride?: UserProfile) => Promise<void>;
    manualSaveMyBag: (myBagOverride: ClubSetting) => Promise<void>;
}

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

export const DiagnosisProvider = ({ children }: { children: ReactNode }) => {
    // State initialization from localStorage or defaults
    const [user, setUser] = useState<UserAccount>(() => {
        const saved = localStorage.getItem('mybagpro_user');
        return saved ? JSON.parse(saved) : INITIAL_ACCOUNT;
    });

    const [profile, setProfileInternal] = useState<UserProfile>(() => {
        const saved = localStorage.getItem('mybagpro_profile');
        return saved ? JSON.parse(saved) : INITIAL_PROFILE;
    });

    const [step, setStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
    const [resultData, setResultData] = useState<DiagnosisResult | null>(() => {
        const saved = localStorage.getItem('mybagpro_result_data');
        return saved ? JSON.parse(saved) : null;
    });
    const [showAuth, setShowAuth] = useState(false);
    const [showMyPage, setShowMyPage] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isManualSaveInFlight, setIsManualSaveInFlight] = useState(false);
    const [saveErrorDetail, setSaveErrorDetail] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [pendingBagChangeCount, setPendingBagChangeCount] = useState(0);
    const [pendingBagChangeIds, setPendingBagChangeIds] = useState<string[]>([]);
    const [lastCloudSavedAt, setLastCloudSavedAt] = useState<string | null>(null);
    const [lastSaveTargetClubCount, setLastSaveTargetClubCount] = useState(0);
    const [lastSavedClubCount, setLastSavedClubCount] = useState(0);
    const [saveDebugInfo, setSaveDebugInfo] = useState<{
        expectedCount: number;
        receivedCount: number;
        dedupedCount: number;
        verifiedCount: number;
    } | null>(null);
    const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);
    const userRef = useRef(user);
    const profileRef = useRef(profile);
    const resultDataRef = useRef(resultData);
    const isRemoteSaveInFlightRef = useRef(false);
    const pendingRemoteSaveRef = useRef(false);
    const pendingRemoteSaveReasonRef = useRef<'auto' | 'manual' | null>(null);
    const saveStatusResetTimerRef = useRef<number | null>(null);
    const lastRemoteSaveSignatureRef = useRef<string | null>(null);
    const lastRemoteBagSnapshotRef = useRef<{ clubs: UserProfile['myBag']['clubs']; ball: string }>({ clubs: [], ball: '' });

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        profileRef.current = profile;
    }, [profile]);

    useEffect(() => {
        resultDataRef.current = resultData;
    }, [resultData]);

    const setProfile: React.Dispatch<React.SetStateAction<UserProfile>> = (value) => {
        setProfileInternal((prev) => {
            const next = typeof value === 'function' ? value(prev) : value;
            profileRef.current = next;
            persistLocalSnapshot(userRef.current, next, resultDataRef.current);
            return next;
        });
    };

    const persistLocalSnapshot = (nextUser: UserAccount, nextProfile: UserProfile, nextResultData: DiagnosisResult | null) => {
        localStorage.setItem('mybagpro_user', JSON.stringify(nextUser));
        localStorage.setItem('mybagpro_profile', JSON.stringify(nextProfile));
        if (nextResultData) {
            localStorage.setItem('mybagpro_result_data', JSON.stringify(nextResultData));
        } else {
            localStorage.removeItem('mybagpro_result_data');
        }
    };

    const clearSaveStatusResetTimer = () => {
        if (saveStatusResetTimerRef.current) {
            window.clearTimeout(saveStatusResetTimerRef.current);
            saveStatusResetTimerRef.current = null;
        }
    };

    const queuePendingRemoteSave = (reason: 'auto' | 'manual') => {
        pendingRemoteSaveRef.current = true;
        if (reason === 'manual' || !pendingRemoteSaveReasonRef.current) {
            pendingRemoteSaveReasonRef.current = reason;
        }
    };

    const markSaveStatusSaved = () => {
        clearSaveStatusResetTimer();
        setSaveErrorDetail(null);
        setLastCloudSavedAt(new Date().toISOString());
        setSaveStatus('saved');
        saveStatusResetTimerRef.current = window.setTimeout(() => {
            setSaveStatus('idle');
            saveStatusResetTimerRef.current = null;
        }, 2000);
    };

    const assertSupabaseOk = (result: { error?: { message?: string } | null }, label: string) => {
        if (result.error) {
            throw new Error(`${label}: ${result.error.message || 'unknown supabase error'}`);
        }
    };

    const withTimeout = async <T,>(promiseLike: PromiseLike<T>, label: string, timeoutMs = 12000): Promise<T> => {
        let timer: number | null = null;
        try {
            return await Promise.race([
                Promise.resolve(promiseLike),
                new Promise<T>((_, reject) => {
                    timer = window.setTimeout(() => {
                        reject(new Error(`${label}: request timed out after ${Math.round(timeoutMs / 1000)}s`));
                    }, timeoutMs);
                }),
            ]);
        } finally {
            if (timer) {
                window.clearTimeout(timer);
            }
        }
    };

    const isUuid = (value: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    const generateUuid = () => {
        if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
            return globalThis.crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
            const rand = Math.random() * 16 | 0;
            const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
            return value.toString(16);
        });
    };

    const normalizeClubIds = (clubs: UserProfile['myBag']['clubs']) => {
        const usedIds = new Set<string>();

        return clubs.map((club) => {
            let id = typeof club.id === 'string' && isUuid(club.id) ? club.id : generateUuid();
            while (usedIds.has(id)) {
                id = generateUuid();
            }
            usedIds.add(id);

            return {
                ...club,
                id,
            };
        });
    };

    const buildBagSnapshot = (clubs: UserProfile['myBag']['clubs'], ball?: string) => ({
        clubs: normalizeClubIds(clubs).map((club) => ({
            ...club,
            flex: club.flex || '',
            number: club.number || '',
            carryDistance: club.carryDistance || '',
            worry: club.worry || '',
        })),
        ...(ball ? { ball } : {}),
        updatedAt: new Date().toISOString(),
    });

    const cloneClubs = (clubs: UserProfile['myBag']['clubs']) =>
        clubs.map((club) => ({ ...club }));

    const mergeCloudClubsWithSnapshot = (
        cloudClubs: Array<Record<string, any>>,
        snapshotClubs: UserProfile['myBag']['clubs'],
    ): UserProfile['myBag']['clubs'] => {
        const snapshotById = new Map(snapshotClubs.map((club) => [club.id, club]));

        return cloudClubs.map((club) => {
            const snapshot = snapshotById.get(club.id);
            return {
                id: club.id,
                category: club.category,
                brand: club.brand || '',
                model: club.model || '',
                shaft: club.shaft || '',
                flex: snapshot?.flex || '',
                number: snapshot?.number || '',
                loft: club.loft || '',
                distance: club.distance || '',
                carryDistance: snapshot?.carryDistance || '',
                worry: snapshot?.worry || '',
            };
        });
    };

    const ensureProfileRow = async (authUser: { id: string; email?: string | null; user_metadata?: Record<string, any> | null }) => {
        const activeProfile = profileRef.current;
        const payload = {
            id: authUser.id,
            name: activeProfile.name || authUser.user_metadata?.name || '',
            is_public: activeProfile.isPublic,
            current_ball: activeProfile.myBag.ball || activeProfile.currentBall || null,
            head_speed: activeProfile.headSpeed || null,
            sns_links: buildStoredSocialLinks(activeProfile.snsLinks, {
                bestScore: activeProfile.bestScore,
                averageScore: activeProfile.averageScore,
            }, buildBagSnapshot(activeProfile.myBag.clubs, activeProfile.myBag.ball || activeProfile.currentBall || '')),
            age: activeProfile.age || null,
            gender: activeProfile.gender || null,
            birthdate: activeProfile.birthdate || null,
            golf_history: activeProfile.golfHistory || null,
            updated_at: new Date().toISOString(),
        };

        const profileInsertResult = await supabase
            .from('profiles')
            .upsert(payload, { onConflict: 'id' });

        assertSupabaseOk(profileInsertResult, 'profiles bootstrap');
    };

    const buildRemoteSavePayload = (activeUser: UserAccount, activeProfile: UserProfile) => {
        const normalizedClubs = normalizeClubIds(activeProfile.myBag.clubs);
        const bagSnapshot = buildBagSnapshot(
            normalizedClubs,
            activeProfile.myBag.ball || activeProfile.currentBall || '',
        );

        const profilePayload = {
            id: activeUser.id,
            name: activeProfile.name,
            gender: activeProfile.gender,
            age: activeProfile.age,
            head_speed: activeProfile.headSpeed,
            birthdate: activeProfile.birthdate,
            golf_history: activeProfile.golfHistory,
            current_ball: activeProfile.myBag.ball || activeProfile.currentBall || null,
            sns_links: buildStoredSocialLinks(activeProfile.snsLinks, {
                bestScore: activeProfile.bestScore,
                averageScore: activeProfile.averageScore,
            }, bagSnapshot),
            cover_photo: activeProfile.coverPhoto,
            is_public: activeProfile.isPublic,
            updated_at: new Date().toISOString(),
        };

        const clubPayloads = normalizedClubs.map((club) => ({
            id: club.id,
            user_id: activeUser.id,
            category: club.category,
            brand: club.brand,
            model: club.model,
            shaft: club.shaft,
            loft: club.loft,
            distance: club.distance,
        }));

        const signature = JSON.stringify({
            userId: activeUser.id,
            profile: {
                ...profilePayload,
                updated_at: 'normalized',
            },
            clubs: clubPayloads,
        });

        return { normalizedClubs, profilePayload, clubPayloads, signature };
    };

    const verifyClubWrite = async (userId: string, expectedIds: string[]) => {
        const { data, error } = await withTimeout(
            supabase
                .from('clubs')
                .select('id')
                .eq('user_id', userId),
            'clubs verify fetch',
        );

        assertSupabaseOk({ error }, 'clubs verify');

        const savedIds = new Set((data || []).map((club) => club.id));
        const missingIds = expectedIds.filter((id) => !savedIds.has(id));

        if ((data || []).length !== expectedIds.length) {
            throw new Error(`clubs verify: expected ${expectedIds.length} clubs but found ${(data || []).length}`);
        }

        if (expectedIds.length > 0 && missingIds.length > 0) {
            throw new Error(`clubs verify: missing ${missingIds.length} saved clubs`);
        }

        return (data || []).length;
    };

    const verifyMyBagStateWithRetry = async (
        userId: string,
        expectedClubs: UserProfile['myBag']['clubs'],
        retries = 5,
        delayMs = 1200,
    ) => {
        const expectedIds = expectedClubs.map((club) => club.id);
        const expectedById = new Map(expectedClubs.map((club) => [club.id, club]));

        for (let attempt = 0; attempt < retries; attempt += 1) {
            const { data, error } = await supabase
                .from('clubs')
                .select('id,brand,model,shaft,loft,distance')
                .eq('user_id', userId);

            if (!error && data) {
                const ids = new Set(data.map((club) => club.id));
                const countMatches = data.length === expectedClubs.length;
                const idsMatch = expectedIds.every((id) => ids.has(id));
                const fieldMatches = data.every((club) => {
                    const expected = expectedById.get(club.id);
                    if (!expected) return false;
                    return (
                        (club.brand || '') === (expected.brand || '') &&
                        (club.model || '') === (expected.model || '') &&
                        (club.shaft || '') === (expected.shaft || '') &&
                        (club.loft || '') === (expected.loft || '') &&
                        (club.distance || '') === (expected.distance || '')
                    );
                });

                if (countMatches && idsMatch && fieldMatches) {
                    return {
                        ok: true,
                        verifiedCount: data.length,
                    };
                }
            }

            if (attempt < retries - 1) {
                await new Promise((resolve) => window.setTimeout(resolve, delayMs));
            }
        }

        return {
            ok: false,
            verifiedCount: 0,
        };
    };

    const replaceRemoteClubs = async (
        userId: string,
        clubPayloads: Array<{
            id: string;
            user_id: string;
            category: string;
            brand: string;
            model: string;
            shaft: string;
            loft: string;
            distance: string;
        }>,
        reason: 'auto' | 'manual',
    ) => {
        if (clubPayloads.length === 0) {
            const deleteAllResult = await withTimeout(
                supabase
                    .from('clubs')
                    .delete()
                    .eq('user_id', userId),
                `clubs clear during ${reason}-save`,
            );
            assertSupabaseOk(deleteAllResult, `clubs clear during ${reason}-save`);
            return;
        }

        const deleteAllResult = await withTimeout(
            supabase
                .from('clubs')
                .delete()
                .eq('user_id', userId),
            `clubs replace delete during ${reason}-save`,
        );

        assertSupabaseOk(
            deleteAllResult,
            `clubs replace delete during ${reason}-save`,
        );

        const clubsInsertResult = await withTimeout(
            supabase
                .from('clubs')
                .insert(clubPayloads)
                .select('id'),
            `clubs replace insert during ${reason}-save`,
        );

        assertSupabaseOk(
            clubsInsertResult,
            `clubs replace insert during ${reason}-save`,
        );

        const insertedCount = clubsInsertResult.data?.length || 0;
        if (insertedCount !== clubPayloads.length) {
            throw new Error(`clubs replace insert during ${reason}-save: expected ${clubPayloads.length} rows but got ${insertedCount}`);
        }
    };

    const refreshUnsavedChanges = (activeUser = userRef.current, activeProfile = profileRef.current) => {
        if (!activeUser.isLoggedIn || !activeUser.id || !isInitialSyncComplete) {
            setHasUnsavedChanges(false);
            setPendingBagChangeCount(0);
            setPendingBagChangeIds([]);
            return;
        }

        const { signature, normalizedClubs } = buildRemoteSavePayload(activeUser, activeProfile);
        const hasChanges = signature !== lastRemoteSaveSignatureRef.current;
        const snapshotById = new Map(lastRemoteBagSnapshotRef.current.clubs.map((club) => [club.id, club]));
        let changeCount = 0;
        const changedIds = new Set<string>();

        normalizedClubs.forEach((club) => {
            const previous = snapshotById.get(club.id);
            if (!previous) {
                changeCount += 1;
                changedIds.add(club.id);
                return;
            }

            const changed =
                previous.category !== club.category ||
                previous.brand !== club.brand ||
                previous.model !== club.model ||
                previous.shaft !== club.shaft ||
                previous.flex !== club.flex ||
                previous.number !== club.number ||
                previous.loft !== club.loft ||
                previous.distance !== club.distance ||
                (previous.carryDistance || '') !== (club.carryDistance || '') ||
                (previous.worry || '') !== (club.worry || '');

            if (changed) {
                changeCount += 1;
                changedIds.add(club.id);
            }
        });

        lastRemoteBagSnapshotRef.current.clubs.forEach((club) => {
            if (!normalizedClubs.find((current) => current.id === club.id)) {
                changeCount += 1;
            }
        });

        if ((activeProfile.myBag.ball || '') !== lastRemoteBagSnapshotRef.current.ball) {
            changeCount += 1;
        }

        setHasUnsavedChanges(hasChanges);
        setPendingBagChangeCount(hasChanges ? changeCount : 0);
        setPendingBagChangeIds(hasChanges ? Array.from(changedIds) : []);
        if (hasChanges && !isManualSaveInFlight && saveStatus === 'saved') {
            setSaveStatus('idle');
        }
    };

    const performRemoteSave = async (reason: 'auto' | 'manual', profileOverride?: UserProfile) => {
        const activeUser = userRef.current;
        const activeProfile = profileOverride || profileRef.current;
        const activeResultData = resultDataRef.current;

        persistLocalSnapshot(activeUser, activeProfile, activeResultData);

        if (!activeUser.isLoggedIn || !activeUser.id) {
            if (reason === 'manual') {
                markSaveStatusSaved();
            }
            setHasUnsavedChanges(false);
            setPendingBagChangeCount(0);
            setPendingBagChangeIds([]);
            return true;
        }

        if (!isInitialSyncComplete) {
            if (reason === 'auto') {
                queuePendingRemoteSave(reason);
                if (saveStatus !== 'error') {
                    setSaveStatus('idle');
                }
                return false;
            }
        }

        const { normalizedClubs, profilePayload, clubPayloads, signature } = buildRemoteSavePayload(activeUser, activeProfile);
        setLastSaveTargetClubCount(normalizedClubs.length);
        setSaveDebugInfo({
            expectedCount: normalizedClubs.length,
            receivedCount: clubPayloads.length,
            dedupedCount: clubPayloads.length,
            verifiedCount: 0,
        });

        if (reason === 'auto' && signature === lastRemoteSaveSignatureRef.current) {
            if (saveStatus !== 'error') {
                setSaveStatus('idle');
            }
            return true;
        }

        if (isRemoteSaveInFlightRef.current) {
            queuePendingRemoteSave(reason);
            return false;
        }

        isRemoteSaveInFlightRef.current = true;
        pendingRemoteSaveRef.current = false;
        if (reason === 'manual') {
            clearSaveStatusResetTimer();
            setSaveErrorDetail(null);
            setSaveStatus('saving');
            setIsManualSaveInFlight(true);
        }

        try {
            if (normalizedClubs.some((club, index) => club.id !== activeProfile.myBag.clubs[index]?.id)) {
                const nextProfile = {
                    ...activeProfile,
                    myBag: {
                        ...activeProfile.myBag,
                        clubs: normalizedClubs,
                    },
                };
                profileRef.current = nextProfile;
                setProfile(nextProfile);
                persistLocalSnapshot(activeUser, nextProfile, activeResultData);
            }

            const profileUpsertResult = await withTimeout(
                supabase.from('profiles').upsert(profilePayload),
                `profiles ${reason}-save`,
            );
            assertSupabaseOk(profileUpsertResult, `profiles ${reason}-save`);

            await replaceRemoteClubs(activeUser.id, clubPayloads, reason);

            const verifiedClubCount = await verifyClubWrite(activeUser.id, normalizedClubs.map((club) => club.id));

            lastRemoteSaveSignatureRef.current = signature;
            lastRemoteBagSnapshotRef.current = {
                clubs: cloneClubs(normalizedClubs),
                ball: activeProfile.myBag.ball || '',
            };
            setLastSavedClubCount(verifiedClubCount);
            setSaveDebugInfo({
                expectedCount: normalizedClubs.length,
                receivedCount: clubPayloads.length,
                dedupedCount: clubPayloads.length,
                verifiedCount: verifiedClubCount,
            });
            setHasUnsavedChanges(false);
            setPendingBagChangeCount(0);
            setPendingBagChangeIds([]);
            if (reason === 'manual') {
                markSaveStatusSaved();
            } else if (saveStatus !== 'error') {
                setSaveStatus('idle');
            }
            return true;
        } catch (error) {
            console.error(`${reason} save error:`, error);
            setSaveStatus('error');
            setSaveErrorDetail(error instanceof Error ? error.message : String(error));
            return false;
        } finally {
            if (reason === 'manual') {
                setIsManualSaveInFlight(false);
            }
            isRemoteSaveInFlightRef.current = false;
            if (pendingRemoteSaveRef.current) {
                const nextReason = pendingRemoteSaveReasonRef.current || 'manual';
                pendingRemoteSaveRef.current = false;
                pendingRemoteSaveReasonRef.current = null;
                window.setTimeout(() => {
                    void performRemoteSave(nextReason);
                }, 50);
            }
        }
    };

    // Handle Supabase Auth State
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata?.name || '',
                    memberSince: session.user.created_at,
                    isLoggedIn: true,
                    history: []
                });
                await syncWithSupabase();
            } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
                setUser(INITIAL_ACCOUNT);
                localStorage.removeItem('mybagpro_user');
                localStorage.removeItem('mybagpro_profile');
                setProfile(INITIAL_PROFILE);
                setLastCloudSavedAt(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const syncWithSupabase = async (options?: { showStatus?: boolean }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const showStatus = options?.showStatus ?? false;
        if (showStatus) {
            setSaveErrorDetail(null);
            setSaveStatus('saving');
        }
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError) {
                throw new Error(`profiles sync: ${profileError.message}`);
            }

            if (!profileData) {
                await ensureProfileRow(user);
            }

            const { data: ensuredProfileData, error: ensuredProfileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (ensuredProfileError) {
                throw new Error(`profiles sync reload: ${ensuredProfileError.message}`);
            }

            if (ensuredProfileData) {
                const normalizedSocials = normalizeUserSocialLinks(ensuredProfileData.sns_links);
                const syncedProfile = {
                    ...profileRef.current,
                    name: ensuredProfileData.name || profileRef.current.name,
                    gender: ensuredProfileData.gender || profileRef.current.gender,
                    age: ensuredProfileData.age || profileRef.current.age,
                    headSpeed: ensuredProfileData.head_speed || profileRef.current.headSpeed,
                    birthdate: ensuredProfileData.birthdate || profileRef.current.birthdate,
                    golfHistory: ensuredProfileData.golf_history || profileRef.current.golfHistory,
                    snsLinks: normalizedSocials,
                    coverPhoto: ensuredProfileData.cover_photo || profileRef.current.coverPhoto,
                    isPublic: ensuredProfileData.is_public ?? profileRef.current.isPublic,
                    currentBall: ensuredProfileData.current_ball || profileRef.current.currentBall,
                    bestScore: normalizedSocials.profileStats?.bestScore ?? profileRef.current.bestScore,
                    averageScore: normalizedSocials.profileStats?.averageScore ?? profileRef.current.averageScore,
                    myBag: {
                        ...profileRef.current.myBag,
                        ball: ensuredProfileData.current_ball || profileRef.current.myBag.ball,
                    },
                };
                profileRef.current = syncedProfile;
                setProfile(prev => ({
                    ...prev,
                    name: ensuredProfileData.name || prev.name,
                    gender: ensuredProfileData.gender || prev.gender,
                    age: ensuredProfileData.age || prev.age,
                    headSpeed: ensuredProfileData.head_speed || prev.headSpeed,
                    birthdate: ensuredProfileData.birthdate || prev.birthdate,
                    golfHistory: ensuredProfileData.golf_history || prev.golfHistory,
                    snsLinks: normalizedSocials,
                    coverPhoto: ensuredProfileData.cover_photo || prev.coverPhoto,
                    isPublic: ensuredProfileData.is_public ?? prev.isPublic,
                    currentBall: ensuredProfileData.current_ball || prev.currentBall,
                    bestScore: normalizedSocials.profileStats?.bestScore ?? prev.bestScore,
                    averageScore: normalizedSocials.profileStats?.averageScore ?? prev.averageScore,
                    myBag: {
                        ...prev.myBag,
                        ball: ensuredProfileData.current_ball || prev.myBag.ball,
                    },
                }));
            }

            const { data: clubData, error: clubsError } = await supabase
                .from('clubs')
                .select('*')
                .eq('user_id', user.id);

            assertSupabaseOk({ error: clubsError }, 'clubs sync');

            if (clubData) {
                const normalizedSocials = normalizeUserSocialLinks(ensuredProfileData?.sns_links);
                const snapshotClubs = normalizedSocials.bagSnapshot?.clubs || [];
                const cloudMergedClubs = clubData.length > 0
                    ? mergeCloudClubsWithSnapshot(clubData, snapshotClubs)
                    : [];
                const cloudMergedById = new Map(cloudMergedClubs.map((club) => [club.id, club]));
                const snapshotById = new Map(snapshotClubs.map((club) => [club.id, club]));
                const mergedFromSnapshot = snapshotClubs.map((club) => ({
                    ...club,
                    ...(cloudMergedById.get(club.id) || {}),
                    id: club.id,
                    number: club.number,
                    flex: club.flex,
                    carryDistance: club.carryDistance,
                    worry: club.worry,
                }));
                const cloudOnlyClubs = cloudMergedClubs.filter((club) => !snapshotById.has(club.id));
                const mergedCloudClubs =
                    snapshotClubs.length >= clubData.length && snapshotClubs.length > 0
                        ? [...mergedFromSnapshot, ...cloudOnlyClubs]
                        : (clubData.length > 0
                            ? cloudMergedClubs
                            : (profileRef.current.myBag.clubs.length === 0 ? snapshotClubs : profileRef.current.myBag.clubs));
                const nextProfile = {
                    ...profileRef.current,
                    myBag: {
                        ...profileRef.current.myBag,
                        clubs: mergedCloudClubs,
                    }
                };
                profileRef.current = nextProfile;
                setProfile(nextProfile);
                lastRemoteSaveSignatureRef.current = buildRemoteSavePayload(userRef.current, nextProfile).signature;
                lastRemoteBagSnapshotRef.current = {
                    clubs: cloneClubs(nextProfile.myBag.clubs),
                    ball: nextProfile.myBag.ball || '',
                };
                setLastSaveTargetClubCount(clubData.length);
                setLastSavedClubCount(clubData.length);
                setSaveDebugInfo({
                    expectedCount: clubData.length,
                    receivedCount: clubData.length,
                    dedupedCount: clubData.length,
                    verifiedCount: clubData.length,
                });
                setHasUnsavedChanges(false);
                setPendingBagChangeCount(0);
                setPendingBagChangeIds([]);
            } else if (profileRef.current && userRef.current.isLoggedIn && userRef.current.id) {
                lastRemoteSaveSignatureRef.current = buildRemoteSavePayload(userRef.current, profileRef.current).signature;
                lastRemoteBagSnapshotRef.current = {
                    clubs: cloneClubs(profileRef.current.myBag.clubs),
                    ball: profileRef.current.myBag.ball || '',
                };
                setLastSaveTargetClubCount(0);
                setLastSavedClubCount(0);
                setSaveDebugInfo(null);
                setHasUnsavedChanges(false);
                setPendingBagChangeCount(0);
                setPendingBagChangeIds([]);
            }
            if (showStatus && saveStatus !== 'error') {
                setSaveStatus('idle');
            }
        } catch (e) {
            console.error("Sync error:", e);
            if (showStatus) {
                setSaveStatus('error');
                setSaveErrorDetail(e instanceof Error ? e.message : String(e));
            }
        } finally {
            setIsInitialSyncComplete(true);
            if (pendingRemoteSaveRef.current) {
                const nextReason = pendingRemoteSaveReasonRef.current || 'manual';
                pendingRemoteSaveRef.current = false;
                pendingRemoteSaveReasonRef.current = null;
                window.setTimeout(() => {
                    void performRemoteSave(nextReason);
                }, 50);
            }
        }
    };

    // Keep a local snapshot up to date so edits survive reloads and tab changes.
    useEffect(() => {
        persistLocalSnapshot(user, profile, resultData);
    }, [user, profile, resultData]);

    useEffect(() => {
        refreshUnsavedChanges();
    }, [profile, user.id, user.isLoggedIn, isInitialSyncComplete]);

    // Manual Save Trigger (Immediate)
    const manualSave = async (profileOverride?: UserProfile) => {
        const requestedProfile = profileOverride || profileRef.current;

        profileRef.current = requestedProfile;
        setProfileInternal(requestedProfile);
        persistLocalSnapshot(userRef.current, requestedProfile, resultDataRef.current);

        let saveProfile = requestedProfile;

        await performRemoteSave('manual', saveProfile);
    };

    const manualSaveMyBag = async (myBagOverride: ClubSetting) => {
        let requestedProfile: UserProfile = {
            ...profileRef.current,
            myBag: {
                clubs: cloneClubs(myBagOverride.clubs),
                ball: myBagOverride.ball,
            },
        };

        profileRef.current = requestedProfile;
        setProfileInternal(requestedProfile);
        persistLocalSnapshot(userRef.current, requestedProfile, resultDataRef.current);
        const activeUser = userRef.current;

        if (!activeUser.isLoggedIn || !activeUser.id) {
            markSaveStatusSaved();
            setSaveDebugInfo({
                expectedCount: requestedProfile.myBag.clubs.length,
                receivedCount: requestedProfile.myBag.clubs.length,
                dedupedCount: requestedProfile.myBag.clubs.length,
                verifiedCount: requestedProfile.myBag.clubs.length,
            });
            return;
        }

        const { normalizedClubs, profilePayload, clubPayloads, signature } = buildRemoteSavePayload(activeUser, requestedProfile);
        const idsDiffer = normalizedClubs.some((club, index) => club.id !== requestedProfile.myBag.clubs[index]?.id);
        if (idsDiffer) {
            requestedProfile = {
                ...requestedProfile,
                myBag: {
                    ...requestedProfile.myBag,
                    clubs: cloneClubs(normalizedClubs),
                },
            };
            profileRef.current = requestedProfile;
            setProfileInternal(requestedProfile);
            persistLocalSnapshot(userRef.current, requestedProfile, resultDataRef.current);
        }
        clearSaveStatusResetTimer();
        setSaveErrorDetail(null);
        setSaveStatus('saving');
        setIsManualSaveInFlight(true);
        setLastSaveTargetClubCount(normalizedClubs.length);
        setSaveDebugInfo({
            expectedCount: normalizedClubs.length,
            receivedCount: clubPayloads.length,
            dedupedCount: clubPayloads.length,
            verifiedCount: 0,
        });

        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                throw new Error(`session fetch: ${sessionError.message}`);
            }

            const accessToken = sessionData.session?.access_token;
            if (!accessToken) {
                throw new Error('session fetch: missing access token');
            }

            const response = await withTimeout(
                fetch('/api/save-my-bag', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        profilePayload,
                        clubPayloads,
                        expectedIds: normalizedClubs.map((club) => club.id),
                    }),
                }),
                'my bag api save',
                30000,
            );

            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload?.ok) {
                throw new Error(payload?.error || `my bag api save: HTTP ${response.status}`);
            }

            lastRemoteSaveSignatureRef.current = signature;
            lastRemoteBagSnapshotRef.current = {
                clubs: cloneClubs(normalizedClubs),
                ball: requestedProfile.myBag.ball || '',
            };
            setLastSavedClubCount(Number(payload?.verifiedCount || normalizedClubs.length));
            setSaveDebugInfo({
                expectedCount: Number(payload?.expectedCount || normalizedClubs.length),
                receivedCount: Number(payload?.receivedCount || clubPayloads.length),
                dedupedCount: Number(payload?.dedupedCount || clubPayloads.length),
                verifiedCount: Number(payload?.verifiedCount || normalizedClubs.length),
            });
            setHasUnsavedChanges(false);
            setPendingBagChangeCount(0);
            setPendingBagChangeIds([]);
            markSaveStatusSaved();
        } catch (error) {
            console.error('manual my bag save error:', error);
            const fallbackVerification = activeUser.id
                ? await verifyMyBagStateWithRetry(activeUser.id, normalizedClubs)
                : { ok: false, verifiedCount: 0 };

            if (fallbackVerification.ok) {
                lastRemoteSaveSignatureRef.current = signature;
                lastRemoteBagSnapshotRef.current = {
                    clubs: cloneClubs(normalizedClubs),
                    ball: requestedProfile.myBag.ball || '',
                };
                setLastSavedClubCount(fallbackVerification.verifiedCount);
                setSaveDebugInfo({
                    expectedCount: normalizedClubs.length,
                    receivedCount: clubPayloads.length,
                    dedupedCount: clubPayloads.length,
                    verifiedCount: fallbackVerification.verifiedCount,
                });
                setHasUnsavedChanges(false);
                setPendingBagChangeCount(0);
                setPendingBagChangeIds([]);
                markSaveStatusSaved();
            } else {
                setSaveStatus('error');
                setSaveErrorDetail(error instanceof Error ? error.message : String(error));
            }
        } finally {
            setIsManualSaveInFlight(false);
        }
    };

    const updateProfile = (field: keyof UserProfile, value: any) => {
        setProfile(prev => {
            return { ...prev, [field]: value };
        });
    };

    const translateDiagnosisError = (error: any) => {
        const message = String(error?.message || error || '');
        const lower = message.toLowerCase();

        if (!message) return '診断中に不明なエラーが発生しました。時間をおいて再度お試しください。';
        if (lower.includes('api key is missing')) {
            return '診断設定の読み込みに失敗しました。しばらくしてから再度お試しください。';
        }
        if (
            lower.includes('failed to fetch') ||
            lower.includes('networkerror') ||
            lower.includes('network request failed')
        ) {
            return '通信が不安定なため診断を完了できませんでした。通信環境を確認して再度お試しください。';
        }
        if (
            lower.includes('429') ||
            lower.includes('quota') ||
            lower.includes('resource has been exhausted') ||
            lower.includes('rate limit')
        ) {
            return '診断の利用が集中しています。少し時間をおいて再度お試しください。';
        }
        if (
            lower.includes('json') ||
            lower.includes('unexpected token') ||
            lower.includes('unterminated')
        ) {
            return '診断結果の整形に失敗しました。もう一度診断すると改善する場合があります。';
        }
        if (
            lower.includes('503') ||
            lower.includes('unavailable') ||
            lower.includes('overloaded') ||
            lower.includes('internal')
        ) {
            return '診断サーバーが一時的に不安定です。少し時間をおいて再度お試しください。';
        }

        return '診断中にエラーが発生しました。時間をおいて再度お試しください。';
    };

    const runDiagnosis = async () => {
        setIsAnalyzing(true);
        setDiagnosisError(null);
        // API Key logic matched from App.tsx
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).process?.env?.API_KEY || '';
        const diagnosisCategory = profile.targetCategory || 'unknown';
        const diagnosisMode = profile.diagnosisMode || 'unknown';

        trackEvent('diagnosis_submit', {
            diagnosis_category: diagnosisCategory,
            diagnosis_mode: diagnosisMode,
            head_speed: profile.headSpeed || 0,
            is_logged_in: user.isLoggedIn,
            has_measurement_data: profile.hasMeasurementData,
        });

        try {
            const response = await generateFittingDiagnosis(profile, apiKey);
            setResultData(response);
            localStorage.setItem('mybagpro_result_data', JSON.stringify(response));
            trackEvent('diagnosis_success', {
                diagnosis_category: diagnosisCategory,
                diagnosis_mode: diagnosisMode,
                result_type: response?.result?.type || 'unknown',
                is_logged_in: user.isLoggedIn,
            });

            // Google Sheetsにデータを送信（管理者用）
            const customerData = convertProfileToCustomerData(
                profile,
                user.email || 'guest@example.com',
                true // 同意済みとみなす（診断実行をもって）
            );
            sendToGoogleSheets(customerData);

            // Save history if logged in
            if (user.isLoggedIn) {
                const newHistoryItem = {
                    id: Date.now().toString(),
                    date: new Date().toISOString(),
                    category: profile.targetCategory || 'UNKNOWN',
                    profile: { ...profile },
                    result: response.result
                };

                const updatedUser = {
                    ...user,
                    history: [newHistoryItem, ...(user.history || [])]
                };
                setUser(updatedUser);
            }
            return true;
        } catch (error: any) {
            console.error("Diagnosis error:", error);
            const translatedError = translateDiagnosisError(error);
            const rawMessage = String(error?.message || error || 'unknown_error');
            setDiagnosisError(translatedError);
            trackEvent('diagnosis_error', {
                diagnosis_category: diagnosisCategory,
                diagnosis_mode: diagnosisMode,
                error_message: rawMessage.slice(0, 120),
                translated_error: translatedError,
                is_logged_in: user.isLoggedIn,
            });
            return false;
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetDiagnosis = () => {
        setResultData(null);
        setDiagnosisError(null);
        setStep(1);
        setProfile(prev => ({ ...prev, shotData: undefined, ballPreferences: undefined }));
    };

    const restoreDiagnosisResult = (historyItem: DiagnosisHistoryItem) => {
        setDiagnosisError(null);
        setStep(1);
        setProfile(historyItem.profile);
        const restoredResult = { result: historyItem.result } as DiagnosisResult;
        setResultData(restoredResult);
        localStorage.setItem('mybagpro_result_data', JSON.stringify(restoredResult));
        localStorage.setItem('mybagpro_profile', JSON.stringify(historyItem.profile));
    };

    return (
        <DiagnosisContext.Provider value={{
            user, setUser,
            profile, setProfile, updateProfile,
            step, setStep,
            isAnalyzing,
            diagnosisError,
            resultData,
            runDiagnosis,
            resetDiagnosis,
            restoreDiagnosisResult,
            showAuth, setShowAuth,
            showMyPage, setShowMyPage,
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
            syncWithSupabase,
            manualSave,
            manualSaveMyBag
        }}>
            {children}
        </DiagnosisContext.Provider>
    );
};

export const useDiagnosis = () => {
    const context = useContext(DiagnosisContext);
    if (context === undefined) {
        throw new Error('useDiagnosis must be used within a DiagnosisProvider');
    }
    return context;
};
