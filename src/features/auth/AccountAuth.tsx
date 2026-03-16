import React, { useState } from 'react';
import { User, Lock, Mail, Loader2, Calendar, Users, Trophy, Plus, Check } from 'lucide-react';
import { type UserAccount, INITIAL_PROFILE, type UserProfile, Gender, GolfHistory } from '../../types/golf';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface AccountAuthProps {
    onLogin: (account: UserAccount, profile?: UserProfile) => void;
    onClose: () => void;
    currentProfile?: UserProfile;
}

export const AccountAuth: React.FC<AccountAuthProps> = ({ onLogin, onClose, currentProfile }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [gender, setGender] = useState<Gender | ''>('');
    const [birthdate, setBirthdate] = useState('');
    const [golfHistory, setGolfHistory] = useState<GolfHistory | ''>('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const translateError = (err: any) => {
        const msg = err?.message || '';
        if (msg.includes('Failed to fetch')) return 'ネットワーク接続エラーが発生しました。インターネット接続を確認してください。';
        if (msg.includes('Email not confirmed')) return 'メールアドレスが確認されていません。メールを確認してください。';
        if (msg.includes('Invalid login credentials')) return 'メールアドレスまたはパスワードが正しくありません。';
        if (msg.includes('User already registered')) return 'このメールアドレスは既に登録されています。';
        if (msg.includes('Password should be at least 6 characters')) return 'パスワードは6文字以上で入力してください。';
        return msg || '認証に失敗しました。時間をおいて再度お試しください。';
    };

    const handleAuth = async () => {
        setError('');
        if (!email || !password) {
            setError('メールアドレスとパスワードを入力してください');
            return;
        }

        setIsLoading(true);
        try {
            if (isRegister) {
                if (!name) {
                    setError('お名前を入力してください');
                    setIsLoading(false);
                    return;
                }

                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name }
                    }
                });

                if (signUpError) throw signUpError;
                
                if (data.session) {
                    const userId = data.session.user.id;
                    const signUpProfile = currentProfile || INITIAL_PROFILE;
                    
                    // Explicitly create profile to ensure it exists
                    await supabase.from('profiles').upsert({
                        id: userId,
                        name: name,
                        is_public: signUpProfile.isPublic,
                        current_ball: signUpProfile.currentBall,
                        head_speed: signUpProfile.headSpeed,
                        sns_links: signUpProfile.snsLinks,
                        age: signUpProfile.age,
                        gender: gender || signUpProfile.gender,
                        birthdate: birthdate || null, // Fix: send null instead of empty string
                        golf_history: golfHistory || null
                    });

                    const newAccount: UserAccount = {
                        id: userId,
                        isLoggedIn: true,
                        name: name,
                        email: email,
                        memberSince: data.session.user.created_at,
                        history: []
                    };
                    onLogin(newAccount, signUpProfile);
                } else {
                    setError('確認メールを送信しました。メールを確認してログインしてください。');
                }
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                if (data.session) {
                    const user = data.session.user;
                    const account: UserAccount = {
                        id: user.id,
                        isLoggedIn: true,
                        name: user.user_metadata?.name || '',
                        email: user.email || '',
                        memberSince: user.created_at,
                        history: []
                    };
                    onLogin(account);
                }
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(translateError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-100 animate-fadeIn overflow-y-auto max-h-[95vh] relative scrollbar-hide">
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
            >
                <Plus size={20} className="rotate-45" />
            </button>

            <div className="text-center mb-8">
                <div className="inline-flex gap-1 p-1 bg-slate-100 rounded-2xl mb-6">
                    <button 
                        onClick={() => { setIsRegister(false); setError(''); }}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-black tracking-widest transition-all",
                            !isRegister ? "bg-white text-trust-navy shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        LOGIN
                    </button>
                    <button 
                        onClick={() => { setIsRegister(true); setError(''); }}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-black tracking-widest transition-all",
                            isRegister ? "bg-white text-trust-navy shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        JOIN
                    </button>
                </div>
                <h2 className="font-black text-3xl text-trust-navy mb-2 tracking-tight">
                    {isRegister ? 'New Account' : 'Welcome Back'}
                </h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {isRegister ? 'Join the MyBagPro Community' : 'Access your golf DNA insights'}
                </p>
            </div>

            <div className="space-y-5">
                {isRegister && (
                    <div className="animate-fadeInDown">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Full Name</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-golf-500 transition-colors" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="トミー さん"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 text-slate-900 rounded-[1.25rem] border border-slate-100 outline-none focus:border-golf-500 focus:bg-white transition-all font-bold"
                            />
                        </div>
                    </div>
                )}
                <div className="animate-fadeInDown" style={{ animationDelay: '0.1s' }}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-golf-500 transition-colors" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="golf@example.com"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 text-slate-900 rounded-[1.25rem] border border-slate-100 outline-none focus:border-golf-500 focus:bg-white transition-all font-bold"
                        />
                    </div>
                </div>
                <div className="animate-fadeInDown" style={{ animationDelay: '0.2s' }}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-golf-500 transition-colors" size={18} />
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="6文字以上"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 text-slate-900 rounded-[1.25rem] border border-slate-100 outline-none focus:border-golf-500 focus:bg-white transition-all font-bold"
                        />
                    </div>
                </div>

                {isRegister && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-fadeInDown" style={{ animationDelay: '0.3s' }}>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Gender</label>
                            <div className="relative group">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-golf-500 transition-colors" size={18} />
                                <select
                                    value={gender}
                                    onChange={e => setGender(e.target.value as Gender)}
                                    className="w-full pl-12 p-3.5 bg-slate-50 text-slate-900 rounded-[1.25rem] border border-slate-100 outline-none focus:border-golf-500 focus:bg-white transition-all appearance-none font-bold text-sm"
                                >
                                    <option value="">未選択</option>
                                    <option value={Gender.MALE}>男性</option>
                                    <option value={Gender.FEMALE}>女性</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Birthdate</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-golf-500 transition-colors" size={18} />
                                <input
                                    type="date"
                                    value={birthdate}
                                    onChange={e => setBirthdate(e.target.value)}
                                    className="w-full pl-12 p-3.5 bg-slate-50 text-slate-900 rounded-[1.25rem] border border-slate-100 outline-none focus:border-golf-500 focus:bg-white transition-all font-bold text-sm"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Golf History</label>
                            <div className="relative group">
                                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-golf-500 transition-colors" size={18} />
                                <select
                                    value={golfHistory}
                                    onChange={e => setGolfHistory(e.target.value as GolfHistory)}
                                    className="w-full pl-12 p-3.5 bg-slate-50 text-slate-900 rounded-[1.25rem] border border-slate-100 outline-none focus:border-golf-500 focus:bg-white transition-all appearance-none font-bold text-sm"
                                >
                                    <option value="">ゴルフ歴を選択してください</option>
                                    {Object.values(GolfHistory).map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3 border border-red-100 animate-shake">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                    {error}
                </div>
            )}

            <button
                onClick={handleAuth}
                disabled={isLoading}
                className="w-full mt-8 h-14 bg-slate-900 text-white font-black rounded-[1.25rem] hover:bg-black transition-all flex items-center justify-center gap-3 text-sm tracking-widest uppercase shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
                {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : (
                    <>
                        {isRegister ? 'アカウントを作成する' : 'ログインする'}
                    </>
                )}
            </button>

            {isRegister && (
                <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Check size={12} strokeWidth={3} /> Registration Benefits
                    </div>
                    <ul className="text-[11px] text-blue-800 space-y-1.5 font-bold">
                        <li className="flex gap-2"><span>・</span> AI診断結果がマイページに自動保存されます</li>
                        <li className="flex gap-2"><span>・</span> あなた専用の「MyBag」URLをSNSでシェア可能に</li>
                    </ul>
                </div>
            )}

            <div className="mt-10 pt-8 border-t border-slate-100 overflow-hidden relative">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">Social Access (Coming Soon)</p>
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-2 gap-3 opacity-40">
                    <button className="flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-not-allowed">
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale" alt="Google" /> Google
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-not-allowed">
                        LINE
                    </button>
                </div>
            </div>
        </div>
    );
};
