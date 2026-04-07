import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
    type UserAccount, type UserProfile,
    INITIAL_ACCOUNT, INITIAL_PROFILE
} from '../types/golf';
import { generateFittingDiagnosis, type DiagnosisResult } from '../lib/gemini';
import { convertProfileToCustomerData, sendToGoogleSheets } from '../lib/googleSheets';
import { supabase } from '../lib/supabase';

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
                setProfile(prev => ({
                    ...prev,
                    name: profileData.name || prev.name,
                    gender: profileData.gender || prev.gender,
                    age: profileData.age || prev.age,
                    headSpeed: profileData.head_speed || prev.headSpeed,
                    birthdate: profileData.birthdate || prev.birthdate,
                    golfHistory: profileData.golf_history || prev.golfHistory,
                    snsLinks: profileData.sns_links || prev.snsLinks,
                    coverPhoto: profileData.cover_photo || prev.coverPhoto,
                    isPublic: profileData.is_public ?? prev.isPublic
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

    // Persistence with Status Feedback
    useEffect(() => {
        const saveData = async () => {
            setSaveStatus('saving');
            try {
                // Local Storage
                localStorage.setItem('mybagpro_user', JSON.stringify(user));
                localStorage.setItem('mybagpro_profile', JSON.stringify(profile));
                if (resultData) {
                    localStorage.setItem('mybagpro_result_data', JSON.stringify(resultData));
                } else {
                    localStorage.removeItem('mybagpro_result_data');
                }

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
                        sns_links: profile.snsLinks,
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
            // Local Storage
            localStorage.setItem('mybagpro_user', JSON.stringify(user));
            localStorage.setItem('mybagpro_profile', JSON.stringify(profile));
            
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
                    sns_links: profile.snsLinks,
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
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const runDiagnosis = async () => {
        setIsAnalyzing(true);
        setDiagnosisError(null);
        // API Key logic matched from App.tsx
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).process?.env?.API_KEY || '';

        try {
            const response = await generateFittingDiagnosis(profile, apiKey);
            setResultData(response);

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
            setDiagnosisError(error.message || "AI解析中にエラーが発生しました。");
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
