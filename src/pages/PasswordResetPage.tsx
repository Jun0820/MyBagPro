import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Lock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { applySeo } from '../lib/seo';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

const getResetRedirectTo = () => `${window.location.origin}/reset-password`;

export const PasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    applySeo({
      title: 'パスワードをリセット | Golf ID',
      description: 'Golf ID / MyBagProのログインパスワードをリセットします。',
      path: '/reset-password',
    });

    let mounted = true;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasRecoverySession(Boolean(data.session));
      setLoading(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasRecoverySession(Boolean(session));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const sendResetEmail = async () => {
    setMessage('');
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('メールアドレスを入力してください。');
      return;
    }

    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: getResetRedirectTo(),
    });
    setSubmitting(false);

    if (resetError) {
      setError('リセットメールを送信できませんでした。メールアドレスを確認してください。');
      trackEvent('password_reset_request_failed', { reason: resetError.message });
      return;
    }

    setMessage('パスワード再設定メールを送信しました。メール内のリンクを開いて新しいパスワードを設定してください。');
    trackEvent('password_reset_requested', { source: 'reset_page' });
  };

  const updatePassword = async () => {
    setMessage('');
    setError('');
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }
    if (password !== passwordConfirm) {
      setError('確認用パスワードが一致しません。');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError('パスワードを更新できませんでした。もう一度リセットメールから開き直してください。');
      trackEvent('password_reset_update_failed', { reason: updateError.message });
      return;
    }

    setMessage('パスワードを更新しました。新しいパスワードでログインできます。');
    setPassword('');
    setPasswordConfirm('');
    trackEvent('password_reset_updated', { source: 'reset_page' });
  };

  return (
    <main className="min-h-screen bg-[#F7F8F5] px-4 py-10 text-[#111827]">
      <section className="mx-auto max-w-md rounded-[1.8rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight">パスワードをリセット</h1>
        <p className="mt-2 text-sm font-bold leading-7 text-slate-600">
          Golf ID / MyBagProのログインに使うパスワードを再設定できます。
        </p>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-black text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            確認しています...
          </div>
        ) : hasRecoverySession ? (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-black text-slate-500">新しいパスワード</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                placeholder="6文字以上"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-500">新しいパスワード（確認）</span>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                autoComplete="new-password"
                className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                placeholder="もう一度入力"
              />
            </label>
            <button
              type="button"
              onClick={updatePassword}
              disabled={submitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 text-sm font-black text-white transition hover:bg-emerald-900 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              パスワードを更新する
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-black text-slate-500">メールアドレス</span>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                  placeholder="your@example.com"
                />
              </div>
            </label>
            <button
              type="button"
              onClick={sendResetEmail}
              disabled={submitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 text-sm font-black text-white transition hover:bg-emerald-900 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              リセットメールを送る
            </button>
          </div>
        )}

        {message && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800 ring-1 ring-emerald-100">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700 ring-1 ring-rose-100">
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/admin" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-700">
            管理画面へ戻る
          </Link>
          <Link to="/mypage" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-700">
            マイページへ
          </Link>
        </div>
      </section>
    </main>
  );
};
