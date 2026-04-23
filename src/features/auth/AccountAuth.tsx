import React, { useState } from 'react';
import { User, Lock, Mail, Loader2, Calendar, Users, Trophy, Plus, Check } from 'lucide-react';
import { type UserAccount, INITIAL_PROFILE, type UserProfile, Gender, GolfHistory } from '../../types/golf';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { buildStoredSocialLinks } from '../../lib/userSocials';

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
                        current_ball: signUpProfile.myBag.ball || signUpProfile.currentBall || null,
                        head_speed: signUpProfile.headSpeed,
                        sns_links: buildStoredSocialLinks(signUpProfile.snsLinks, {
                            bestScore: signUpProfile.bestScore,
                            averageScore: signUpProfile.averageScore,
                        }),
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
        <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.15)] animate-fadeIn scrollbar-hide md:max-h-[95vh] md:rounded-[2.5rem] md:p-8">
            <button 
                onClick={onClose} 
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 md:right-6 md:top-6"
            >
                <Plus size={20} className="rotate-45" />
            </button>

            <div className="mb-6 text-center md:mb-8">
                <div className="mb-5 inline-flex gap-1 rounded-2xl bg-slate-100 p-1 md:mb-6">
                    <button 
                        onClick={() => { setIsRegister(false); setError(''); }}
                        className={cn(
                            "rounded-xl px-5 py-2 text-[11px] font-black tracking-[0.18em] transition-all md:px-6 md:text-xs md:tracking-widest",
                            !isRegister ? "bg-white text-trust-navy shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        LOGIN
                    </button>
                    <button 
                        onClick={() => { setIsRegister(true); setError(''); }}
                        className={cn(
                            "rounded-xl px-5 py-2 text-[11px] font-black tracking-[0.18em] transition-all md:px-6 md:text-xs md:tracking-widest",
                            isRegister ? "bg-white text-trust-navy shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        JOIN
                    </button>
                </div>
                <h2 className="mb-2 text-[1.9rem] font-black tracking-tight text-trust-navy md:text-3xl">
                    {isRegister ? 'New Account' : 'Welcome Back'}
                </h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {isRegister ? 'Join the MyBagPro Community' : 'Access your golf DNA insights'}
                </p>
            </div>

            <div className="mb-5 grid gap-2 sm:grid-cols-3 md:mb-6">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Save</div>
                    <div className="mt-1 text-xs font-black text-trust-navy">My Bag と診断結果を保存</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Resume</div>
                    <div className="mt-1 text-xs font-black text-trust-navy">比較やお気に入りの続きから再開</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cloud</div>
                    <div className="mt-1 text-xs font-black text-trust-navy">ログイン後もクラウドで復元</div>
                </div>
            </div>

            <div className="space-y-4 md:space-y-5">
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
                                className="w-full rounded-[1.125rem] border border-slate-100 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all font-bold focus:border-golf-500 focus:bg-white md:rounded-[1.25rem]"
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
                            className="w-full rounded-[1.125rem] border border-slate-100 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all font-bold focus:border-golf-500 focus:bg-white md:rounded-[1.25rem]"
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
                            className="w-full rounded-[1.125rem] border border-slate-100 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition-all font-bold focus:border-golf-500 focus:bg-white md:rounded-[1.25rem]"
                        />
                    </div>
                </div>

                {isRegister && (
                    <div className="grid grid-cols-1 gap-3 pt-1 animate-fadeInDown md:grid-cols-2 md:gap-4 md:pt-2" style={{ animationDelay: '0.3s' }}>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-1.5 block">Gender</label>
                            <div className="relative group">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-golf-500 transition-colors" size={18} />
                                <select
                                    value={gender}
                                    onChange={e => setGender(e.target.value as Gender)}
                                    className="w-full appearance-none rounded-[1.125rem] border border-slate-100 bg-slate-50 p-3.5 pl-12 text-sm font-bold text-slate-900 outline-none transition-all focus:border-golf-500 focus:bg-white md:rounded-[1.25rem]"
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
                                    className="w-full rounded-[1.125rem] border border-slate-100 bg-slate-50 p-3.5 pl-12 text-sm font-bold text-slate-900 outline-none transition-all focus:border-golf-500 focus:bg-white md:rounded-[1.25rem]"
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
                                    className="w-full appearance-none rounded-[1.125rem] border border-slate-100 bg-slate-50 p-3.5 pl-12 text-sm font-bold text-slate-900 outline-none transition-all focus:border-golf-500 focus:bg-white md:rounded-[1.25rem]"
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
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600 animate-shake md:mt-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                    {error}
                </div>
            )}

            <button
                onClick={handleAuth}
                disabled={isLoading}
                className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-[1.125rem] bg-slate-900 text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 group hover:bg-black md:mt-8 md:rounded-[1.25rem] md:tracking-widest"
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
                <div className="mt-5 rounded-2xl border border-blue-100/50 bg-blue-50/50 p-4 md:mt-6">
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
