import React, { useEffect, useState } from 'react';
import { User, Lock, Mail, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { type UserAccount, INITIAL_PROFILE, type UserProfile } from '../../types/golf';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { buildStoredSocialLinks } from '../../lib/userSocials';

interface AccountAuthProps {
    onLogin: (account: UserAccount, profile?: UserProfile) => void;
    onClose: () => void;
    currentProfile?: UserProfile;
    initialMode?: 'register' | 'login';
    intent?: 'create-profile' | 'login';
}

export const AccountAuth: React.FC<AccountAuthProps> = ({
    onLogin,
    onClose,
    currentProfile,
    initialMode = 'register',
    intent = 'create-profile',
}) => {
    const [isRegister, setIsRegister] = useState(initialMode === 'register');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const draftClubCount = currentProfile?.myBag?.clubs?.length ?? 0;
    const draftBall = currentProfile?.myBag?.ball?.trim() || currentProfile?.currentBall?.trim() || null;
    const draftHeadSpeed = currentProfile?.headSpeed && currentProfile.headSpeed > 0 ? `${currentProfile.headSpeed} m/s` : null;
    const draftAverageScore = currentProfile?.averageScore ? `${currentProfile.averageScore}` : null;
    const hasDraftToCarry = draftClubCount > 0 || Boolean(draftBall) || Boolean(draftHeadSpeed) || Boolean(draftAverageScore);

    useEffect(() => {
        setIsRegister(initialMode === 'register');
        setError('');
    }, [initialMode]);

    const translateError = (err: any) => {
        const msg = err?.message || '';
        if (msg.includes('Failed to fetch')) return 'ネットワーク接続エラーが発生しました。インターネット接続を確認してください。';
        if (msg.includes('Email not confirmed')) return 'メールアドレスが確認されていません。メールを確認してください。';
        if (msg.includes('Invalid login credentials')) return 'メールアドレスまたはパスワードが正しくありません。';
        if (msg.includes('User already registered')) return 'このメールアドレスは既に登録されています。';
        if (msg.includes('Password should be at least 6 characters')) return 'パスワードは6文字以上で入力してください。';
        if (msg.includes('email rate limit exceeded')) return '確認メールの送信回数が上限に達しています。少し時間をおいてから、もう一度登録してください。';
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
                    const { error: profileUpsertError } = await supabase.from('profiles').upsert({
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
                        gender: signUpProfile.gender,
                        birthdate: signUpProfile.birthdate || null,
                        golf_history: signUpProfile.golfHistory || null,
                    });
                    if (profileUpsertError) throw profileUpsertError;

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
        <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.15)] ring-1 ring-slate-100 animate-fadeIn scrollbar-hide md:max-h-[95vh] md:rounded-[2.25rem] md:p-7">
            <button 
                onClick={onClose} 
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 md:right-6 md:top-6"
            >
                <Plus size={20} className="rotate-45" />
            </button>

            <div className="mb-6 text-center md:mb-7">
                <div className="mb-4 inline-flex gap-1 rounded-2xl bg-slate-100 p-1 md:mb-5">
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
                <h2 className="mb-2 text-[1.8rem] font-black tracking-tight text-trust-navy md:text-[2.25rem]">
                    {isRegister ? 'まずマイページを作成' : 'ログインして再開'}
                </h2>
                <p className="text-sm font-bold leading-6 text-slate-500">
                    {isRegister
                        ? 'クラブ登録と診断結果を保存して、次回も続きから使えるようにします。'
                        : '保存したマイクラブと診断結果をここから再開できます。'}
                </p>
            </div>

            <div className="mb-5 rounded-[1.5rem] bg-slate-50 px-4 py-4 md:mb-6 md:px-5">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">
                    {intent === 'create-profile' ? 'Create First' : 'Resume'}
                </div>
                <div className="mt-2 space-y-2 text-sm font-bold leading-6 text-slate-600">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="mt-1 shrink-0 text-[#176534]" />
                        <span>マイクラブと診断結果を保存できます。</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="mt-1 shrink-0 text-[#176534]" />
                        <span>あとでプロフィール情報を追加しても大丈夫です。</span>
                    </div>
                </div>
            </div>

            {hasDraftToCarry && (
                <div className="mb-5 rounded-[1.5rem] bg-golf-50/55 p-4 md:mb-6 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">Current Draft</div>
                            <h3 className="mt-1 text-sm font-black text-trust-navy md:text-base">今の入力内容はそのまま引き継がれます</h3>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-golf-700 shadow-sm">Keep</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-600">
                        <span className="rounded-full bg-white px-3 py-1.5">{draftClubCount}本を下書き保存</span>
                        {draftBall && <span className="rounded-full bg-white px-3 py-1.5">ボール: {draftBall}</span>}
                        {draftHeadSpeed && <span className="rounded-full bg-white px-3 py-1.5">HS: {draftHeadSpeed}</span>}
                        {draftAverageScore && <span className="rounded-full bg-white px-3 py-1.5">平均: {draftAverageScore}</span>}
                    </div>
                </div>
            )}

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

            <div className="mt-5 text-center text-xs font-bold leading-6 text-slate-500 md:mt-6">
                登録後にプロフィール詳細やベストスコアを追加できます。まずは My Page を作って、クラブ登録から始めれば大丈夫です。
            </div>
        </div>
    );
};
