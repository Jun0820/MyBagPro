import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import {
    type UserAccount, type UserProfile, type DiagnosisHistoryItem,
    INITIAL_ACCOUNT, INITIAL_PROFILE, TargetCategory
} from '../types/golf';
import type { Club, ClubSetting } from '../types/golf';
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
        extendedColumnsSaved?: boolean;
        missingExtendedColumns?: string[];
        sampleClubs: Array<{
            id: string;
            category: string;
            number: string;
            brand: string;
            model: string;
            distance: string;
        }>;
    } | null;
    syncWithSupabase: () => Promise<void>;
    manualSave: (profileOverride?: UserProfile) => Promise<void>;
    manualSaveMyBag: (myBagOverride: ClubSetting) => Promise<void>;
    manualSaveMyBagClub: (clubId: string, myBagOverride: ClubSetting) => Promise<{ ok: boolean; error?: string }>;
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
        extendedColumnsSaved?: boolean;
        missingExtendedColumns?: string[];
        sampleClubs: Array<{
            id: string;
            category: string;
            number: string;
            brand: string;
            model: string;
            distance: string;
        }>;
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

    const buildSaveDebugSample = (clubs: UserProfile['myBag']['clubs']) =>
        clubs.slice(-4).map((club) => ({
            id: club.id,
            category: club.category,
            number: club.number || '',
            brand: club.brand || '',
            model: club.model || '',
            distance: club.distance || '',
        }));

    const sameStringArray = (left?: string[], right?: string[]) => {
        const normalizedLeft = Array.isArray(left) ? left : [];
        const normalizedRight = Array.isArray(right) ? right : [];
        if (normalizedLeft.length !== normalizedRight.length) return false;
        return normalizedLeft.every((value, index) => value === normalizedRight[index]);
    };

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

    const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit, label: string, timeoutMs = 12000) => {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(input, {
                ...init,
                signal: controller.signal,
            });
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new Error(`${label}: request timed out after ${Math.round(timeoutMs / 1000)}s`);
            }
            throw error;
        } finally {
            window.clearTimeout(timeoutId);
        }
    };

    const isUndefinedColumnSaveError = (error: unknown) => {
        const anyError = error as { code?: string; message?: string } | null;
        const message = String(anyError?.message || error || '').toLowerCase();
        return anyError?.code === '42703' || message.includes('column');
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

    const buildBagSnapshot = (myBag: UserProfile['myBag'], fallbackBall?: string) => ({
        clubs: normalizeClubIds(myBag.clubs).map((club) => ({
            ...club,
            flex: club.flex || '',
            number: club.number || '',
            carryDistance: club.carryDistance || '',
            worry: club.worry || '',
            shaftWeight: club.shaftWeight || '',
            sleeveSetting: club.sleeveSetting || '',
            length: club.length || '',
            lieAngle: club.lieAngle || '',
            bounce: club.bounce || '',
            grind: club.grind || '',
            headShape: club.headShape || '',
            mainUse: club.mainUse || [],
            missTendency: club.missTendency || [],
            memo: club.memo || '',
            copiedFromClubId: club.copiedFromClubId || '',
        })),
        ...((myBag.ball || fallbackBall) ? { ball: myBag.ball || fallbackBall } : {}),
        ...(myBag.name ? { name: myBag.name } : {}),
        ...(myBag.purpose ? { purpose: myBag.purpose } : {}),
        ...(myBag.ballBrand ? { ballBrand: myBag.ballBrand } : {}),
        ...(myBag.ballColor ? { ballColor: myBag.ballColor } : {}),
        ...(myBag.ballMemo ? { ballMemo: myBag.ballMemo } : {}),
        updatedAt: new Date().toISOString(),
    });

    const cloneClubs = (clubs: UserProfile['myBag']['clubs']) =>
        clubs.map((club) => ({ ...club }));

    const mergeRemoteSnapshotClub = (
        currentSnapshotClubs: UserProfile['myBag']['clubs'],
        savedClub: UserProfile['myBag']['clubs'][number],
    ) => {
        const nextClubs = currentSnapshotClubs.map((club) => (club.id === savedClub.id ? { ...savedClub } : { ...club }));
        if (!nextClubs.some((club) => club.id === savedClub.id)) {
            nextClubs.push({ ...savedClub });
        }
        return nextClubs;
    };

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
                flex: snapshot?.flex || club.flex || '',
                number: snapshot?.number || club.number || '',
                loft: club.loft || '',
                distance: club.distance || '',
                carryDistance: snapshot?.carryDistance || club.carry_distance || club.carryDistance || '',
                worry: snapshot?.worry || club.worry || '',
                shaftWeight: snapshot?.shaftWeight || club.shaft_weight || club.shaftWeight || '',
                sleeveSetting: snapshot?.sleeveSetting || club.sleeve_setting || club.sleeveSetting || '',
                length: snapshot?.length || club.length || '',
                lieAngle: snapshot?.lieAngle || club.lie_angle || club.lieAngle || '',
                bounce: snapshot?.bounce || club.bounce || '',
                grind: snapshot?.grind || club.grind || '',
                headShape: snapshot?.headShape || club.head_shape || club.headShape || '',
                mainUse: snapshot?.mainUse || club.main_use || club.mainUse || [],
                missTendency: snapshot?.missTendency || club.miss_tendency || club.missTendency || [],
                memo: snapshot?.memo || club.memo || '',
                copiedFromClubId: snapshot?.copiedFromClubId || club.copied_from_club_id || club.copiedFromClubId || '',
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
            }, buildBagSnapshot(activeProfile.myBag, activeProfile.currentBall || '')),
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
            {
                ...activeProfile.myBag,
                clubs: normalizedClubs,
            },
            activeProfile.currentBall || '',
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
            flex: club.flex || '',
            number: club.number || '',
            loft: club.loft,
            distance: club.distance,
            carryDistance: club.carryDistance || '',
            worry: club.worry || '',
            shaftWeight: club.shaftWeight || '',
            sleeveSetting: club.sleeveSetting || '',
            length: club.length || '',
            lieAngle: club.lieAngle || '',
            bounce: club.bounce || '',
            grind: club.grind || '',
            headShape: club.headShape || '',
            mainUse: club.mainUse || [],
            missTendency: club.missTendency || [],
            memo: club.memo || '',
            copiedFromClubId: club.copiedFromClubId || '',
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

    const buildClubScopedProfilePayload = (activeUser: UserAccount, activeProfile: UserProfile) => ({
        id: activeUser.id,
        current_ball: activeProfile.myBag.ball || activeProfile.currentBall || null,
        sns_links: buildStoredSocialLinks(activeProfile.snsLinks, {
            bestScore: activeProfile.bestScore,
            averageScore: activeProfile.averageScore,
        }, buildBagSnapshot(activeProfile.myBag, activeProfile.currentBall || '')),
        updated_at: new Date().toISOString(),
    });

    const toDirectBaseClubRow = (club: Record<string, any>, activeUser: UserAccount) => ({
        id: club.id,
        user_id: activeUser.id,
        category: club.category || '',
        brand: club.brand || '',
        model: club.model || '',
        shaft: club.shaft || '',
        loft: club.loft || '',
        distance: club.distance || '',
    });

    const toDirectExtendedClubRow = (club: Record<string, any>, activeUser: UserAccount) => ({
        ...toDirectBaseClubRow(club, activeUser),
        flex: club.flex || '',
        number: club.number || '',
        carry_distance: club.carryDistance || '',
        worry: club.worry || '',
        shaft_weight: club.shaftWeight || '',
        sleeve_setting: club.sleeveSetting || '',
        length: club.length || '',
        lie_angle: club.lieAngle || '',
        bounce: club.bounce || '',
        grind: club.grind || '',
        head_shape: club.headShape || '',
        main_use: Array.isArray(club.mainUse) ? club.mainUse : [],
        miss_tendency: Array.isArray(club.missTendency) ? club.missTendency : [],
        memo: club.memo || '',
        copied_from_club_id: isUuid(club.copiedFromClubId || '') ? club.copiedFromClubId : null,
    });

    const buildSaveSuccessPayload = (
        payload: Record<string, any>,
        normalizedClubs: Club[],
        clubPayloads: Array<Record<string, any>>,
    ) => ({
        expectedCount: Number(payload?.expectedCount || normalizedClubs.length),
        receivedCount: Number(payload?.receivedCount || clubPayloads.length),
        dedupedCount: Number(payload?.dedupedCount || clubPayloads.length),
        verifiedCount: Number(payload?.verifiedCount || normalizedClubs.length),
        extendedColumnsSaved: Boolean(payload?.extendedColumnsSaved),
        missingExtendedColumns: Array.isArray(payload?.missingExtendedColumns)
            ? payload.missingExtendedColumns.filter((column: unknown): column is string => typeof column === 'string' && column.trim().length > 0)
            : [],
        sampleClubs: Array.isArray(payload?.sampleClubs) ? payload.sampleClubs : buildSaveDebugSample(normalizedClubs),
    });

    const applyMyBagSaveSuccess = (
        requestedProfile: UserProfile,
        normalizedClubs: Club[],
        clubPayloads: Array<Record<string, any>>,
        signature: string,
        payload: Record<string, any>,
    ) => {
        lastRemoteSaveSignatureRef.current = signature;
        lastRemoteBagSnapshotRef.current = {
            clubs: cloneClubs(normalizedClubs),
            ball: requestedProfile.myBag.ball || '',
        };
        const debugPayload = buildSaveSuccessPayload(payload, normalizedClubs, clubPayloads);
        setLastSavedClubCount(debugPayload.verifiedCount);
        setSaveDebugInfo(debugPayload);
        setHasUnsavedChanges(false);
        setPendingBagChangeCount(0);
        setPendingBagChangeIds([]);
        markSaveStatusSaved();
    };

    const saveMyBagDirectly = async (
        activeUser: UserAccount,
        profilePayload: Record<string, any>,
        clubPayloads: Array<Record<string, any>>,
    ) => {
        const profileResult = await withTimeout(
            supabase.from('profiles').upsert({
                ...profilePayload,
                id: activeUser.id,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' }),
            'profiles direct save',
            10000,
        );
        assertSupabaseOk(profileResult, 'profiles direct save');

        const dedupedPayloads = Array.from(
            new Map(clubPayloads.filter((club) => club.id).map((club) => [club.id, club])).values(),
        );
        let persistedRows: Array<Record<string, any>> = dedupedPayloads.map((club) => toDirectExtendedClubRow(club, activeUser));
        let extendedColumnsSaved = true;

        if (persistedRows.length > 0) {
            let upsertResult = await withTimeout(
                supabase.from('clubs').upsert(persistedRows, { onConflict: 'id' }),
                'clubs direct save',
                10000,
            );

            if (upsertResult.error && isUndefinedColumnSaveError(upsertResult.error)) {
                extendedColumnsSaved = false;
                persistedRows = dedupedPayloads.map((club) => toDirectBaseClubRow(club, activeUser));
                upsertResult = await withTimeout(
                    supabase.from('clubs').upsert(persistedRows, { onConflict: 'id' }),
                    'clubs direct base save',
                    10000,
                );
            }

            assertSupabaseOk(upsertResult, 'clubs direct save');
        }

        const persistedIds = persistedRows.map((club) => club.id).filter(Boolean);
        const deleteQuery = supabase.from('clubs').delete().eq('user_id', activeUser.id);
        const deleteResult = await withTimeout(
            persistedIds.length > 0
                ? deleteQuery.not('id', 'in', `(${persistedIds.join(',')})`)
                : deleteQuery,
            'clubs direct cleanup',
            10000,
        );
        assertSupabaseOk(deleteResult, 'clubs direct cleanup');

        const verifyResult = await withTimeout(
            supabase.from('clubs').select('id').eq('user_id', activeUser.id),
            'clubs direct verify',
            10000,
        );
        assertSupabaseOk(verifyResult, 'clubs direct verify');

        return {
            ok: true,
            expectedCount: clubPayloads.length,
            receivedCount: clubPayloads.length,
            dedupedCount: dedupedPayloads.length,
            verifiedCount: Array.isArray(verifyResult.data) ? verifyResult.data.length : persistedRows.length,
            extendedColumnsSaved,
            missingExtendedColumns: extendedColumnsSaved ? [] : ['詳細項目'],
            sampleClubs: buildSaveDebugSample(profileRef.current.myBag.clubs),
        };
    };

    const saveMyBagClubDirectly = async (
        activeUser: UserAccount,
        profilePayload: Record<string, any>,
        clubPayload: Record<string, any>,
    ) => {
        const profileResult = await withTimeout(
            supabase.from('profiles').upsert({
                ...profilePayload,
                id: activeUser.id,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' }),
            'profiles direct club save',
            10000,
        );
        assertSupabaseOk(profileResult, 'profiles direct club save');

        let row: Record<string, any> = toDirectExtendedClubRow(clubPayload, activeUser);
        let extendedColumnsSaved = true;
        let upsertResult = await withTimeout(
            supabase.from('clubs').upsert(row, { onConflict: 'id' }),
            'club direct save',
            10000,
        );

        if (upsertResult.error && isUndefinedColumnSaveError(upsertResult.error)) {
            extendedColumnsSaved = false;
            row = toDirectBaseClubRow(clubPayload, activeUser);
            upsertResult = await withTimeout(
                supabase.from('clubs').upsert(row, { onConflict: 'id' }),
                'club direct base save',
                10000,
            );
        }

        assertSupabaseOk(upsertResult, 'club direct save');

        const verifyResult = await withTimeout(
            supabase.from('clubs').select('id').eq('user_id', activeUser.id).eq('id', row.id).maybeSingle(),
            'club direct verify',
            10000,
        );
        assertSupabaseOk(verifyResult, 'club direct verify');

        return {
            ok: true,
            receivedCount: 1,
            verifiedCount: verifyResult.data ? 1 : 0,
            extendedColumnsSaved,
            missingExtendedColumns: extendedColumnsSaved ? [] : ['詳細項目'],
        };
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
                (previous.worry || '') !== (club.worry || '') ||
                (previous.shaftWeight || '') !== (club.shaftWeight || '') ||
                (previous.sleeveSetting || '') !== (club.sleeveSetting || '') ||
                (previous.length || '') !== (club.length || '') ||
                (previous.lieAngle || '') !== (club.lieAngle || '') ||
                (previous.bounce || '') !== (club.bounce || '') ||
                (previous.grind || '') !== (club.grind || '') ||
                (previous.headShape || '') !== (club.headShape || '') ||
                !sameStringArray(previous.mainUse, club.mainUse) ||
                !sameStringArray(previous.missTendency, club.missTendency) ||
                (previous.memo || '') !== (club.memo || '') ||
                (previous.copiedFromClubId || '') !== (club.copiedFromClubId || '');

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

        const { profilePayload } = buildRemoteSavePayload(activeUser, activeProfile);

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
            const profileUpsertResult = await withTimeout(
                supabase.from('profiles').upsert(profilePayload),
                `profiles ${reason}-save`,
            );
            assertSupabaseOk(profileUpsertResult, `profiles ${reason}-save`);
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
            } else if (event === 'SIGNED_OUT') {
                setUser(INITIAL_ACCOUNT);
                localStorage.removeItem('mybagpro_user');
                localStorage.removeItem('mybagpro_profile');
                setProfile(INITIAL_PROFILE);
                setLastCloudSavedAt(null);
                setIsInitialSyncComplete(true);
            } else if (event === 'INITIAL_SESSION' && !session) {
                setUser((current) => {
                    if (!current.isLoggedIn) return current;
                    return INITIAL_ACCOUNT;
                });
                setLastCloudSavedAt(null);
                setIsInitialSyncComplete(true);
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
                const mergedCloudClubs =
                    clubData.length > 0
                        ? cloudMergedClubs
                        : (profileRef.current.myBag.clubs.length === 0 ? snapshotClubs : profileRef.current.myBag.clubs);
                const nextProfile = {
                    ...profileRef.current,
                    myBag: {
                        ...profileRef.current.myBag,
                        name: normalizedSocials.bagSnapshot?.name || profileRef.current.myBag.name,
                        purpose: normalizedSocials.bagSnapshot?.purpose || profileRef.current.myBag.purpose,
                        ballBrand: normalizedSocials.bagSnapshot?.ballBrand || profileRef.current.myBag.ballBrand,
                        ballColor: normalizedSocials.bagSnapshot?.ballColor || profileRef.current.myBag.ballColor,
                        ballMemo: normalizedSocials.bagSnapshot?.ballMemo || profileRef.current.myBag.ballMemo,
                        ball: normalizedSocials.bagSnapshot?.ball || ensuredProfileData.current_ball || profileRef.current.myBag.ball,
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
                    sampleClubs: buildSaveDebugSample(nextProfile.myBag.clubs),
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

    useEffect(() => {
        if (saveStatus !== 'saving' || isManualSaveInFlight) return;

        const timeoutId = window.setTimeout(() => {
            setSaveStatus((current) => (current === 'saving' ? 'idle' : current));
        }, 15000);

        return () => window.clearTimeout(timeoutId);
    }, [saveStatus, isManualSaveInFlight]);

    useEffect(() => {
        if (!isManualSaveInFlight) return;

        const timeoutId = window.setTimeout(() => {
            setIsManualSaveInFlight(false);
            setSaveStatus((current) => (current === 'saving' ? 'error' : current));
            setSaveErrorDetail('保存に時間がかかっています。入力内容はこの端末に残っています。少し時間をおいて再度保存してください。');
        }, 20000);

        return () => window.clearTimeout(timeoutId);
    }, [isManualSaveInFlight]);

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
                ...profileRef.current.myBag,
                ...myBagOverride,
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
                extendedColumnsSaved: false,
                sampleClubs: buildSaveDebugSample(requestedProfile.myBag.clubs),
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
            extendedColumnsSaved: false,
            missingExtendedColumns: [],
            sampleClubs: buildSaveDebugSample(normalizedClubs),
        });

        try {
            const { data: sessionData, error: sessionError } = await withTimeout(
                supabase.auth.getSession(),
                'session fetch',
                6000,
            );
            if (sessionError) {
                throw new Error(`session fetch: ${sessionError.message}`);
            }

            const accessToken = sessionData.session?.access_token;
            if (!accessToken) {
                throw new Error('session fetch: missing access token');
            }

            const response = await fetchWithTimeout(
                '/api/save-my-bag',
                {
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
                },
                'my bag api save',
                15000,
            );

            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload?.ok) {
                throw new Error(payload?.error || `my bag api save: HTTP ${response.status}`);
            }

            applyMyBagSaveSuccess(requestedProfile, normalizedClubs, clubPayloads, signature, payload);
        } catch (error) {
            console.warn('manual my bag api save failed; trying direct save fallback:', error);
            try {
                const fallbackPayload = await saveMyBagDirectly(activeUser, profilePayload, clubPayloads);
                applyMyBagSaveSuccess(requestedProfile, normalizedClubs, clubPayloads, signature, fallbackPayload);
            } catch (fallbackError) {
                console.error('manual my bag save error:', { apiError: error, fallbackError });
                setSaveStatus('error');
                setSaveErrorDetail('保存に失敗しました。入力内容はこの端末に残っています。通信環境を確認してもう一度保存してください。');
            }
        } finally {
            setIsManualSaveInFlight(false);
        }
    };

    const manualSaveMyBagClub = async (clubId: string, myBagOverride: ClubSetting): Promise<{ ok: boolean; error?: string }> => {
        let requestedProfile: UserProfile = {
            ...profileRef.current,
            myBag: {
                ...profileRef.current.myBag,
                ...myBagOverride,
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
            const targetClub = requestedProfile.myBag.clubs.find((club) => club.id === clubId);
            setSaveDebugInfo({
                expectedCount: targetClub ? 1 : 0,
                receivedCount: targetClub ? 1 : 0,
                dedupedCount: targetClub ? 1 : 0,
                verifiedCount: targetClub ? 1 : 0,
                extendedColumnsSaved: false,
                missingExtendedColumns: [],
                sampleClubs: buildSaveDebugSample(targetClub ? [targetClub] : []),
            });
            return { ok: true };
        }

        const { normalizedClubs, clubPayloads } = buildRemoteSavePayload(activeUser, requestedProfile);
        const profilePayload = buildClubScopedProfilePayload(activeUser, requestedProfile);
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

        const targetClub = normalizedClubs.find((club) => club.id === clubId) || normalizedClubs.find((_, index) => requestedProfile.myBag.clubs[index]?.id === clubId);
        const targetClubPayload = clubPayloads.find((club) => club.id === targetClub?.id);
        if (!targetClub || !targetClubPayload) {
            const error = 'target club not found';
            setSaveStatus('error');
            setSaveErrorDetail(error);
            return { ok: false, error };
        }

        clearSaveStatusResetTimer();
        setSaveErrorDetail(null);
        setSaveStatus('saving');
        setIsManualSaveInFlight(true);
        setLastSaveTargetClubCount(1);
        setSaveDebugInfo({
            expectedCount: 1,
            receivedCount: 1,
            dedupedCount: 1,
            verifiedCount: 0,
            extendedColumnsSaved: false,
            missingExtendedColumns: [],
            sampleClubs: buildSaveDebugSample([targetClub]),
        });

        try {
            const { data: sessionData, error: sessionError } = await withTimeout(
                supabase.auth.getSession(),
                'session fetch',
                6000,
            );
            if (sessionError) {
                throw new Error(`session fetch: ${sessionError.message}`);
            }

            const accessToken = sessionData.session?.access_token;
            if (!accessToken) {
                throw new Error('session fetch: missing access token');
            }

            const response = await fetchWithTimeout(
                '/api/save-my-bag-club',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        profilePayload,
                        clubPayload: targetClubPayload,
                    }),
                },
                'my bag api club save',
                12000,
            );

            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload?.ok) {
                throw new Error(payload?.error || `my bag api club save: HTTP ${response.status}`);
            }

            const mergedRemoteClubs = mergeRemoteSnapshotClub(lastRemoteBagSnapshotRef.current.clubs, targetClub);
            const mergedRemoteBall = targetClub.category === TargetCategory.BALL
                ? (requestedProfile.myBag.ball || targetClub.model || '')
                : lastRemoteBagSnapshotRef.current.ball;

            lastRemoteBagSnapshotRef.current = {
                clubs: cloneClubs(mergedRemoteClubs),
                ball: mergedRemoteBall,
            };

            const remoteBaselineProfile: UserProfile = {
                ...requestedProfile,
                myBag: {
                    ...requestedProfile.myBag,
                    clubs: cloneClubs(mergedRemoteClubs),
                    ball: mergedRemoteBall,
                },
            };

            lastRemoteSaveSignatureRef.current = buildRemoteSavePayload(activeUser, remoteBaselineProfile).signature;
            setLastSavedClubCount(Number(payload?.verifiedCount || 1));
            setSaveDebugInfo({
                expectedCount: 1,
                receivedCount: Number(payload?.receivedCount || 1),
                dedupedCount: Number(payload?.dedupedCount || 1),
                verifiedCount: Number(payload?.verifiedCount || 1),
                extendedColumnsSaved: Boolean(payload?.extendedColumnsSaved),
                missingExtendedColumns: Array.isArray(payload?.missingExtendedColumns)
                    ? payload.missingExtendedColumns.filter((column: unknown): column is string => typeof column === 'string' && column.trim().length > 0)
                    : [],
                sampleClubs: Array.isArray(payload?.sampleClubs) ? payload.sampleClubs : buildSaveDebugSample([targetClub]),
            });
            refreshUnsavedChanges(activeUser, requestedProfile);
            markSaveStatusSaved();
            return { ok: true };
        } catch (error) {
            console.warn('manual my bag club api save failed; trying direct save fallback:', error);
            try {
                const fallbackPayload = await saveMyBagClubDirectly(activeUser, profilePayload, targetClubPayload);
                const mergedRemoteClubs = mergeRemoteSnapshotClub(lastRemoteBagSnapshotRef.current.clubs, targetClub);
                const mergedRemoteBall = targetClub.category === TargetCategory.BALL
                    ? (requestedProfile.myBag.ball || targetClub.model || '')
                    : lastRemoteBagSnapshotRef.current.ball;

                lastRemoteBagSnapshotRef.current = {
                    clubs: cloneClubs(mergedRemoteClubs),
                    ball: mergedRemoteBall,
                };

                const remoteBaselineProfile: UserProfile = {
                    ...requestedProfile,
                    myBag: {
                        ...requestedProfile.myBag,
                        clubs: cloneClubs(mergedRemoteClubs),
                        ball: mergedRemoteBall,
                    },
                };

                lastRemoteSaveSignatureRef.current = buildRemoteSavePayload(activeUser, remoteBaselineProfile).signature;
                setLastSavedClubCount(Number(fallbackPayload?.verifiedCount || 1));
                setSaveDebugInfo({
                    expectedCount: 1,
                    receivedCount: Number(fallbackPayload?.receivedCount || 1),
                    dedupedCount: 1,
                    verifiedCount: Number(fallbackPayload?.verifiedCount || 1),
                    extendedColumnsSaved: Boolean(fallbackPayload?.extendedColumnsSaved),
                    missingExtendedColumns: Array.isArray(fallbackPayload?.missingExtendedColumns)
                        ? fallbackPayload.missingExtendedColumns.filter((column: unknown): column is string => typeof column === 'string' && column.trim().length > 0)
                        : [],
                    sampleClubs: buildSaveDebugSample([targetClub]),
                });
                refreshUnsavedChanges(activeUser, requestedProfile);
                markSaveStatusSaved();
                return { ok: true };
            } catch (fallbackError) {
                console.error('manual my bag club save error:', { apiError: error, fallbackError });
                setSaveStatus('error');
                const errorMessage = '保存に失敗しました。入力内容はこの端末に残っています。通信環境を確認してもう一度保存してください。';
                setSaveErrorDetail(errorMessage);
                return { ok: false, error: errorMessage };
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
            manualSaveMyBag,
            manualSaveMyBagClub
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
