import React, { useState } from 'react';
import { User, Lock, Mail } from 'lucide-react';
import { type UserAccount, INITIAL_PROFILE, type UserProfile } from '../../types/golf';

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
    const [error, setError] = useState('');

    const handleAuth = () => {
        setError('');
        if (!email || !password) {
            setError('メールアドレスとパスワードを入力してください');
            return;
        }

        if (isRegister) {
            if (!name) {
                setError('お名前を入力してください');
                return;
            }
            if (localStorage.getItem(`mybagpro_user_${email}`)) {
                setError('このメールアドレスは既に登録されています');
                return;
            }
            const newAccount: UserAccount = {
                isLoggedIn: true,
                name,
                email,
                password, // Note: In real app, never store plain text password
                memberSince: new Date().toLocaleDateString()
            };
            const initialProfile = currentProfile || INITIAL_PROFILE;
            localStorage.setItem(`mybagpro_user_${email}`, JSON.stringify(newAccount));
            localStorage.setItem(`mybagpro_profile_${email}`, JSON.stringify(initialProfile));
            onLogin(newAccount, initialProfile);
        } else {
            const stored = localStorage.getItem(`mybagpro_user_${email}`);
            if (!stored) {
                setError('ユーザーが見つかりません');
                return;
            }
            const user = JSON.parse(stored);
            if (user.password !== password) {
                setError('パスワードが間違っています');
                return;
            }
            const profile = localStorage.getItem(`mybagpro_profile_${email}`);
            onLogin({ ...user, isLoggedIn: true }, profile ? JSON.parse(profile) : undefined);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200 animate-fadeIn">
            <div className="text-center mb-6">
                <h2 className="font-bold text-2xl mb-2">{isRegister ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</h2>
            </div>
            <div className="space-y-4">
                {isRegister && (
                    <div>
                        <label className="text-xs font-bold text-slate-500">NAME</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full pl-10 p-3 bg-slate-50 text-slate-900 rounded-xl border outline-none focus:border-golf-500"
                            />
                        </div>
                    </div>
                )}
                <div>
                    <label className="text-xs font-bold text-slate-500">EMAIL</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 p-3 bg-slate-50 text-slate-900 rounded-xl border outline-none focus:border-golf-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500">PASSWORD</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 p-3 bg-slate-50 text-slate-900 rounded-xl border outline-none focus:border-golf-500"
                        />
                    </div>
                </div>
            </div>
            {error && <div className="mt-4 p-3 bg-red-50 text-red-500 text-sm font-bold rounded-xl text-center">{error}</div>}

            <button
                onClick={handleAuth}
                className="w-full mt-6 py-4 bg-trust-navy text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
                {isRegister ? 'アカウント作成' : 'ログイン'}
            </button>

            <div className="mt-4 text-center">
                <button
                    onClick={() => { setIsRegister(!isRegister); setError(''); }}
                    className="text-sm text-slate-400 underline hover:text-slate-600"
                >
                    {isRegister ? 'ログインはこちら' : '新規作成はこちら'}
                </button>
            </div>
            <div className="mt-4 text-center">
                <button onClick={onClose} className="text-sm font-bold text-slate-400 hover:text-slate-600">
                    閉じる
                </button>
            </div>
        </div>
    );
};
