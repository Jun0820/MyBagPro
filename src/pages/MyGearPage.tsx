import { useNavigate } from 'react-router-dom';
import { useDiagnosis } from '../context/DiagnosisContext';
import { MyBagView } from '../features/gear/MyBagView';
import { MyBagManager } from '../features/gear/MyBagManager';
import { ProfileManager } from '../features/gear/ProfileManager';
import { ArrowLeft, Edit3, User, Eye, LogOut, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

export const MyGearPage = () => {
    const { profile, updateProfile, user, setUser, resetDiagnosis, saveStatus } = useDiagnosis();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'view' | 'clubs' | 'profile'>('view');

    const handleClose = () => {
        navigate('/');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser({ 
            id: '',
            email: '',
            name: '',
            memberSince: '',
            isLoggedIn: false,
            history: []
        });
        resetDiagnosis();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sticky Header with Navigation */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button 
                        onClick={handleClose}
                        className="flex items-center gap-2 text-slate-500 hover:text-trust-navy font-bold text-xs transition-colors"
                    >
                        <ArrowLeft size={16} />
                        HOME
                    </button>

                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                        <button 
                            onClick={() => setActiveTab('view')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
                                activeTab === 'view' ? "bg-white text-trust-navy shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Eye size={14} />
                            VIEW
                        </button>
                        <button 
                            onClick={() => setActiveTab('clubs')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
                                activeTab === 'clubs' ? "bg-white text-trust-navy shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Edit3 size={14} />
                            CLUBS
                        </button>
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
                                activeTab === 'profile' ? "bg-white text-trust-navy shadow-sm" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <User size={14} />
                            PROFILE
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2">
                             {saveStatus === 'saving' ? (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 animate-pulse">
                                    <Loader2 size={12} className="animate-spin" /> SAVING...
                                </div>
                             ) : saveStatus === 'saved' ? (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                                    <CheckCircle2 size={12} /> SYNCED
                                </div>
                             ) : null}
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-200"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 pt-8">
                {activeTab === 'view' && (
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
                )}

                {activeTab === 'clubs' && (
                    <MyBagManager 
                        setting={profile.myBag}
                        onUpdate={(b: any) => updateProfile('myBag', b)}
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
                    />
                )}
            </main>
        </div>
    );
};
