import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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
    const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);

    const persistLocalSnapshot = (nextUser: UserAccount, nextProfile: UserProfile, nextResultData: DiagnosisResult | null) => {
        localStorage.setItem('mybagpro_user', JSON.stringify(nextUser));
        localStorage.setItem('mybagpro_profile', JSON.stringify(nextProfile));
        if (nextResultData) {
            localStorage.setItem('mybagpro_result_data', JSON.stringify(nextResultData));
        } else {
            localStorage.removeItem('mybagpro_result_data');
        }
    };

    // Handle Supabase Auth State
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
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
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const syncWithSupabase = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setSaveStatus('saving');
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                const normalizedSocials = normalizeUserSocialLinks(profileData.sns_links);
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
                    },
                }));
            }

            const { data: clubData } = await supabase
                .from('clubs')
                .select('*')
                .eq('user_id', user.id);

            if (clubData) {
                setProfile(prev => ({
                    ...prev,
                    myBag: {
                        ...prev.myBag,
                        clubs: clubData.map(c => ({
                            id: c.id,
                            category: c.category,
                            brand: c.brand,
                            model: c.model,
                            shaft: c.shaft,
                            flex: c.flex,
                            number: c.number,
                            loft: c.loft,
                            distance: c.distance,
                            worry: c.worry
                        }))
                    }
                }));
            }
            setSaveStatus('saved');
            setIsInitialSyncComplete(true);
        } catch (e) {
            console.error("Sync error:", e);
            setSaveStatus('error');
        } finally {
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    };

    // Keep a local snapshot up to date so edits survive reloads and tab changes.
    useEffect(() => {
        persistLocalSnapshot(user, profile, resultData);
    }, [user, profile, resultData]);

    // Persistence with Status Feedback
    useEffect(() => {
        const saveData = async () => {
            setSaveStatus('saving');
            try {
                // Supabase (Remote)
                if (user.isLoggedIn && user.id) {
                    // CRITICAL: Prevent overwriting remote data if initial sync hasn't finished yet
                    if (!isInitialSyncComplete) {
                        console.log("Skipping remote save: initial sync not complete");
                        return;
                    }

                    // Update Profile
                    await supabase.from('profiles').upsert({
                        id: user.id,
                        name: profile.name,
                        gender: profile.gender,
                        age: profile.age,
                        head_speed: profile.headSpeed,
                        birthdate: profile.birthdate,
                        golf_history: profile.golfHistory,
                        current_ball: profile.myBag.ball || profile.currentBall || null,
                        sns_links: buildStoredSocialLinks(profile.snsLinks, {
                            bestScore: profile.bestScore,
                            averageScore: profile.averageScore,
                        }),
                        cover_photo: profile.coverPhoto,
                        is_public: profile.isPublic,
                        updated_at: new Date().toISOString()
                    });

                    // Sync Clubs (Careful with mass upsert/delete)
                    // For simplicity, we'll delete and re-insert for now in this MVP, 
                    // though delta syncing is better for production.
                    await supabase.from('clubs').delete().eq('user_id', user.id);
                    if (profile.myBag.clubs.length > 0) {
                        const clubPayloads = profile.myBag.clubs.map(c => ({
                            id: c.id, // Include stable ID
                            user_id: user.id,
                            category: c.category,
                            brand: c.brand,
                            model: c.model,
                            shaft: c.shaft,
                            number: c.number,
                            loft: c.loft,
                            distance: c.distance,
                            worry: c.worry
                        }));
                        await supabase.from('clubs').upsert(clubPayloads);
                    }
                }

                setSaveStatus('saved');
                const timer = setTimeout(() => setSaveStatus('idle'), 2000);
                return () => clearTimeout(timer);
            } catch (e) {
                console.error("Save error:", e);
                setSaveStatus('error');
            }
        };

        // Debounce save slightly to avoid excessive calls
        const timeoutId = setTimeout(saveData, 1000);
        return () => clearTimeout(timeoutId);
    }, [user.id, user.isLoggedIn, profile, resultData, isInitialSyncComplete]);
    
    // Manual Save Trigger (Immediate)
    const manualSave = async () => {
        setSaveStatus('saving');
        try {
            persistLocalSnapshot(user, profile, resultData);
            
            // Supabase (Remote)
            if (user.isLoggedIn && user.id) {
                if (!isInitialSyncComplete) {
                    throw new Error("Cannot save yet: Initial sync is in progress.");
                }
                await supabase.from('profiles').upsert({
                    id: user.id,
                    name: profile.name,
                    gender: profile.gender,
                    age: profile.age,
                    head_speed: profile.headSpeed,
                    birthdate: profile.birthdate,
                    golf_history: profile.golfHistory,
                    current_ball: profile.myBag.ball || profile.currentBall || null,
                    sns_links: buildStoredSocialLinks(profile.snsLinks, {
                        bestScore: profile.bestScore,
                        averageScore: profile.averageScore,
                    }),
                    cover_photo: profile.coverPhoto,
                    is_public: profile.isPublic,
                    updated_at: new Date().toISOString()
                });

                await supabase.from('clubs').delete().eq('user_id', user.id);
                if (profile.myBag.clubs.length > 0) {
                    const clubPayloads = profile.myBag.clubs.map(c => ({
                        id: c.id, // Include stable ID
                        user_id: user.id,
                        category: c.category,
                        brand: c.brand,
                        model: c.model,
                        shaft: c.shaft,
                        number: c.number,
                        loft: c.loft,
                        distance: c.distance,
                        worry: c.worry
                    }));
                    await supabase.from('clubs').upsert(clubPayloads);
                }
            }
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error("Manual save error:", e);
            setSaveStatus('error');
        }
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
