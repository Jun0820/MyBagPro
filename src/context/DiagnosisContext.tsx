import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import {
    type UserAccount, type UserProfile, type DiagnosisHistoryItem,
    INITIAL_ACCOUNT, INITIAL_PROFILE
} from '../types/golf';
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
    syncWithSupabase: () => Promise<void>;
    manualSave: () => Promise<void>;
}

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

export const DiagnosisProvider = ({ children }: { children: ReactNode }) => {
    // State initialization from localStorage or defaults
    const [user, setUser] = useState<UserAccount>(() => {
        const saved = localStorage.getItem('mybagpro_user');
        return saved ? JSON.parse(saved) : INITIAL_ACCOUNT;
    });

    const [profile, setProfile] = useState<UserProfile>(() => {
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
    const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);
    const userRef = useRef(user);
    const profileRef = useRef(profile);
    const resultDataRef = useRef(resultData);
    const isRemoteSaveInFlightRef = useRef(false);
    const pendingRemoteSaveRef = useRef(false);
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

    const normalizeClubIds = (clubs: UserProfile['myBag']['clubs']) =>
        clubs.map((club) => ({
            ...club,
            id: typeof club.id === 'string' && isUuid(club.id) ? club.id : generateUuid(),
        }));

    const buildBagSnapshot = (clubs: UserProfile['myBag']['clubs'], ball?: string) => ({
        clubs: normalizeClubIds(clubs).map((club) => ({
            ...club,
            flex: club.flex || '',
            number: club.number || '',
            worry: club.worry || '',
        })),
        ...(ball ? { ball } : {}),
        updatedAt: new Date().toISOString(),
    });

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
                worry: snapshot?.worry || '',
            };
        });
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
        const { data, error } = await supabase
            .from('clubs')
            .select('id')
            .eq('user_id', userId);

        assertSupabaseOk({ error }, 'clubs verify');

        const savedIds = new Set((data || []).map((club) => club.id));
        const missingIds = expectedIds.filter((id) => !savedIds.has(id));

        if (expectedIds.length > 0 && missingIds.length > 0) {
            throw new Error(`clubs verify: missing ${missingIds.length} saved clubs`);
        }
    };

    const computeClubDiff = (
        previousClubs: UserProfile['myBag']['clubs'],
        nextClubs: UserProfile['myBag']['clubs'],
        userId: string,
    ) => {
        const previousById = new Map(previousClubs.map((club) => [club.id, club]));
        const nextById = new Map(nextClubs.map((club) => [club.id, club]));

        const toUpsert = nextClubs
            .filter((club) => {
                const previous = previousById.get(club.id);
                if (!previous) return true;
                return (
                    previous.category !== club.category ||
                    previous.brand !== club.brand ||
                    previous.model !== club.model ||
                    previous.shaft !== club.shaft ||
                    previous.loft !== club.loft ||
                    previous.distance !== club.distance
                );
            })
            .map((club) => ({
                id: club.id,
                user_id: userId,
                category: club.category,
                brand: club.brand,
                model: club.model,
                shaft: club.shaft,
                loft: club.loft,
                distance: club.distance,
            }));

        const toDelete = previousClubs
            .filter((club) => !nextById.has(club.id))
            .map((club) => club.id);

        return { toUpsert, toDelete };
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
    };

    const performRemoteSave = async (reason: 'auto' | 'manual') => {
        const activeUser = userRef.current;
        const activeProfile = profileRef.current;
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
            pendingRemoteSaveRef.current = true;
            if (reason === 'manual') {
                setSaveStatus('idle');
            }
            return false;
        }

        const { normalizedClubs, profilePayload, signature } = buildRemoteSavePayload(activeUser, activeProfile);

        if (reason === 'auto' && signature === lastRemoteSaveSignatureRef.current) {
            if (saveStatus !== 'error') {
                setSaveStatus('idle');
            }
            return true;
        }

        if (isRemoteSaveInFlightRef.current) {
            pendingRemoteSaveRef.current = true;
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

            const profileUpsertResult = await supabase.from('profiles').upsert(profilePayload);
            assertSupabaseOk(profileUpsertResult, `profiles ${reason}-save`);

            const { toUpsert, toDelete } = computeClubDiff(
                lastRemoteBagSnapshotRef.current.clubs,
                normalizedClubs,
                activeUser.id,
            );

            if (toDelete.length > 0) {
                const deleteResult = await supabase.from('clubs').delete().in('id', toDelete);
                assertSupabaseOk(deleteResult, `clubs delete before ${reason}-save`);
            }

            if (toUpsert.length > 0) {
                const clubsUpsertResult = await supabase.from('clubs').upsert(toUpsert);
                assertSupabaseOk(clubsUpsertResult, `clubs ${reason}-save`);
            }

            await verifyClubWrite(activeUser.id, normalizedClubs.map((club) => club.id));

            lastRemoteSaveSignatureRef.current = signature;
            lastRemoteBagSnapshotRef.current = {
                clubs: normalizedClubs,
                ball: activeProfile.myBag.ball || '',
            };
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
                pendingRemoteSaveRef.current = false;
                window.setTimeout(() => {
                    void performRemoteSave('auto');
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

    const syncWithSupabase = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setSaveErrorDetail(null);
        setSaveStatus('saving');
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError) {
                throw new Error(`profiles sync: ${profileError.message}`);
            }

            if (profileData) {
                const normalizedSocials = normalizeUserSocialLinks(profileData.sns_links);
                const snapshotClubs = normalizedSocials.bagSnapshot?.clubs || [];
                const syncedProfile = {
                    ...profileRef.current,
                    name: profileData.name || profileRef.current.name,
                    gender: profileData.gender || profileRef.current.gender,
                    age: profileData.age || profileRef.current.age,
                    headSpeed: profileData.head_speed || profileRef.current.headSpeed,
                    birthdate: profileData.birthdate || profileRef.current.birthdate,
                    golfHistory: profileData.golf_history || profileRef.current.golfHistory,
                    snsLinks: normalizedSocials,
                    coverPhoto: profileData.cover_photo || profileRef.current.coverPhoto,
                    isPublic: profileData.is_public ?? profileRef.current.isPublic,
                    currentBall: profileData.current_ball || profileRef.current.currentBall,
                    bestScore: normalizedSocials.profileStats?.bestScore ?? profileRef.current.bestScore,
                    averageScore: normalizedSocials.profileStats?.averageScore ?? profileRef.current.averageScore,
                    myBag: {
                        ...profileRef.current.myBag,
                        ball: profileData.current_ball || profileRef.current.myBag.ball,
                        clubs: snapshotClubs.length > 0 ? snapshotClubs : profileRef.current.myBag.clubs,
                    },
                };
                profileRef.current = syncedProfile;
                setProfile(prev => ({
                    ...prev,
                    name: profileData.name || prev.name,
                    gender: profileData.gender || prev.gender,
                    age: profileData.age || prev.age,
                    headSpeed: profileData.head_speed || prev.headSpeed,
                    birthdate: profileData.birthdate || prev.birthdate,
                    golfHistory: profileData.golf_history || prev.golfHistory,
                    snsLinks: normalizedSocials,
                    coverPhoto: profileData.cover_photo || prev.coverPhoto,
                    isPublic: profileData.is_public ?? prev.isPublic,
                    currentBall: profileData.current_ball || prev.currentBall,
                    bestScore: normalizedSocials.profileStats?.bestScore ?? prev.bestScore,
                    averageScore: normalizedSocials.profileStats?.averageScore ?? prev.averageScore,
                    myBag: {
                        ...prev.myBag,
                        ball: profileData.current_ball || prev.myBag.ball,
                        clubs: snapshotClubs.length > 0 ? snapshotClubs : prev.myBag.clubs,
                    },
                }));
            }

            const { data: clubData, error: clubsError } = await supabase
                .from('clubs')
                .select('*')
                .eq('user_id', user.id);

            assertSupabaseOk({ error: clubsError }, 'clubs sync');

            if (clubData) {
                const normalizedSocials = normalizeUserSocialLinks(profileData?.sns_links);
                const snapshotClubs = normalizedSocials.bagSnapshot?.clubs || [];
                const nextProfile = {
                    ...profileRef.current,
                    myBag: {
                        ...profileRef.current.myBag,
                        clubs: clubData.length > 0
                            ? mergeCloudClubsWithSnapshot(clubData, snapshotClubs)
                            : snapshotClubs,
                    }
                };
                profileRef.current = nextProfile;
                setProfile(nextProfile);
                lastRemoteSaveSignatureRef.current = buildRemoteSavePayload(userRef.current, nextProfile).signature;
                lastRemoteBagSnapshotRef.current = {
                    clubs: nextProfile.myBag.clubs,
                    ball: nextProfile.myBag.ball || '',
                };
                setHasUnsavedChanges(false);
                setPendingBagChangeCount(0);
            } else if (profileRef.current && userRef.current.isLoggedIn && userRef.current.id) {
                lastRemoteSaveSignatureRef.current = buildRemoteSavePayload(userRef.current, profileRef.current).signature;
                lastRemoteBagSnapshotRef.current = {
                    clubs: profileRef.current.myBag.clubs,
                    ball: profileRef.current.myBag.ball || '',
                };
                setHasUnsavedChanges(false);
                setPendingBagChangeCount(0);
            }
            markSaveStatusSaved();
        } catch (e) {
            console.error("Sync error:", e);
            setSaveStatus('error');
            setSaveErrorDetail(e instanceof Error ? e.message : String(e));
        } finally {
            setIsInitialSyncComplete(true);
            if (pendingRemoteSaveRef.current) {
                pendingRemoteSaveRef.current = false;
                window.setTimeout(() => {
                    void performRemoteSave('auto');
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

    // Persistence with Status Feedback
    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void performRemoteSave('auto');
        }, 800);
        return () => clearTimeout(timeoutId);
    }, [user.id, user.isLoggedIn, profile, resultData, isInitialSyncComplete]);
    
    // Manual Save Trigger (Immediate)
    const manualSave = async () => {
        if (userRef.current.isLoggedIn && userRef.current.id && !isInitialSyncComplete) {
            await syncWithSupabase();
        }
        await performRemoteSave('manual');
    };

    const updateProfile = (field: keyof UserProfile, value: any) => {
        setProfile(prev => {
            const nextProfile = { ...prev, [field]: value };
            persistLocalSnapshot(user, nextProfile, resultData);
            return nextProfile;
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
            syncWithSupabase,
            manualSave
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
