import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
    type UserAccount, type UserProfile,
    INITIAL_ACCOUNT, INITIAL_PROFILE
} from '../types/golf';
import type { DiagnosisResult } from '../lib/diagnosis_logic';
import { generateFittingDiagnosis } from '../lib/gemini';
import { convertProfileToCustomerData, sendToGoogleSheets } from '../lib/googleSheets';

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
    resultData: DiagnosisResult | null;
    runDiagnosis: () => Promise<void>;
    resetDiagnosis: () => void;

    // UI State
    showAuth: boolean;
    setShowAuth: (show: boolean) => void;
    showMyPage: boolean;
    setShowMyPage: (show: boolean) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
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
    const [resultData, setResultData] = useState<DiagnosisResult | null>(() => {
        const saved = localStorage.getItem('mybagpro_result_data');
        return saved ? JSON.parse(saved) : null;
    });
    const [showAuth, setShowAuth] = useState(false);
    const [showMyPage, setShowMyPage] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Persistence with Status Feedback
    useEffect(() => {
        const saveData = async () => {
            setSaveStatus('saving');
            try {
                localStorage.setItem('mybagpro_user', JSON.stringify(user));
                localStorage.setItem('mybagpro_profile', JSON.stringify(profile));
                if (resultData) {
                    localStorage.setItem('mybagpro_result_data', JSON.stringify(resultData));
                } else {
                    localStorage.removeItem('mybagpro_result_data');
                }
                setSaveStatus('saved');
                // Reset to idle after 2 seconds
                const timer = setTimeout(() => setSaveStatus('idle'), 2000);
                return () => clearTimeout(timer);
            } catch (e) {
                console.error("Save error:", e);
                setSaveStatus('error');
            }
        };

        saveData();
    }, [user, profile, resultData]);

    const updateProfile = (field: keyof UserProfile, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const runDiagnosis = async () => {
        setIsAnalyzing(true);
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
        } catch (error) {
            console.error("Diagnosis error:", error);
            // Handle error appropriately
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetDiagnosis = () => {
        setResultData(null);
        setStep(1);
        setProfile(prev => ({ ...prev, shotData: undefined, ballPreferences: undefined }));
    };

    return (
        <DiagnosisContext.Provider value={{
            user, setUser,
            profile, setProfile, updateProfile,
            step, setStep,
            isAnalyzing,
            resultData,
            runDiagnosis,
            resetDiagnosis,
            showAuth, setShowAuth,
            showMyPage, setShowMyPage,
            saveStatus
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
