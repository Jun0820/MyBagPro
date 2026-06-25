import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Loader2, Share2, UserRound } from 'lucide-react';
import { useDiagnosis } from '../context/DiagnosisContext';
import { getBrandConfig } from '../config/brand';
import { feedbackFormUrl, hasFeedbackForm, trackFeedbackClick } from '../config/feedback';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { generateDiagnosisResult } from '../lib/diagnosis/rules';
import {
  defaultGolfIdVisibility,
  isValidGolfIdUsername,
  mapRecordToGolfIdForm,
  normalizeGolfIdUsername,
  toNullableNumber,
  type GolfIdFormData,
  type GolfIdRecord,
  type GolfIdVisibilityKey,
} from '../lib/golfId';

const GOLF_PROFILE_TABLE = 'golf_profiles';

const initialForm: GolfIdFormData = {
  username: '',
  nickname: '',
  best_score: '',
  average_score: '',
  target_score: '',
  head_speed: '',
  golf_history: '',
  favorite_club: '',
  weak_club: '',
  current_issue: '',
  club_setting: '',
  visibility: defaultGolfIdVisibility,
};

const publicToggleLabels: Record<GolfIdVisibilityKey, string> = {
  best_score: 'ベストスコア',
  average_score: '平均スコア',
  target_score: '目標スコア',
  head_speed: 'ヘッドスピード',
  golf_history: 'ゴルフ歴',
  favorite_club: '得意クラブ',
  weak_club: '苦手クラブ',
  club_setting: 'クラブセッティング',
  current_issue: '今の悩み',
};

const textInputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const inputClass = (hasError?: boolean) =>
  `${textInputClass} ${hasError ? 'border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-100' : ''}`;

export const GolfIdCreatePage = () => {
  const brand = getBrandConfig();
  const navigate = useNavigate();
  const { user, profile, setShowAuth } = useDiagnosis();
  const [form, setForm] = useState<GolfIdFormData>(initialForm);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof GolfIdFormData, string>>>({});

  useEffect(() => {
    trackEvent('golf_id_create_start', {
      source: 'create_page',
    });
  }, []);

  const publicUrl = useMemo(() => {
    const username = normalizeGolfIdUsername(form.username);
    return username ? `${brand.url}/u/${username}` : `${brand.url}/u/username`;
  }, [brand.url, form.username]);

  useEffect(() => {
    if (!user.isLoggedIn) {
      setForm((current) => ({
        ...current,
        nickname: current.nickname || profile.name || user.name || '',
        average_score: current.average_score || (profile.averageScore ? String(profile.averageScore) : ''),
        best_score: current.best_score || (profile.bestScore ? String(profile.bestScore) : ''),
        head_speed: current.head_speed || (profile.headSpeed ? String(profile.headSpeed) : ''),
      }));
      return;
    }

    let mounted = true;
    const loadExisting = async () => {
      setLoadingExisting(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from(GOLF_PROFILE_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;
      setLoadingExisting(false);

      if (fetchError) {
        setError('Golf ID保存用テーブルを確認できませんでした。設定完了後に保存できます。');
        return;
      }

      if (data) {
        const record = data as GolfIdRecord;
        setExistingId(record.id);
        setForm(mapRecordToGolfIdForm(record));
        return;
      }

      setForm((current) => ({
        ...current,
        nickname: current.nickname || profile.name || user.name || '',
        username: current.username || normalizeGolfIdUsername(user.name || profile.name || ''),
        average_score: current.average_score || (profile.averageScore ? String(profile.averageScore) : ''),
        best_score: current.best_score || (profile.bestScore ? String(profile.bestScore) : ''),
        head_speed: current.head_speed || (profile.headSpeed ? String(profile.headSpeed) : ''),
        club_setting:
          current.club_setting ||
          profile.myBag.clubs
            .filter((club) => club.brand || club.model)
            .map((club) => `${club.number || club.category} ${[club.brand, club.model].filter(Boolean).join(' ')}`.trim())
            .join('\n'),
      }));
    };

    loadExisting();
    return () => {
      mounted = false;
    };
  }, [profile.averageScore, profile.bestScore, profile.headSpeed, profile.myBag.clubs, profile.name, user.id, user.isLoggedIn, user.name]);

  const updateField = (key: keyof GolfIdFormData, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: key === 'username' ? normalizeGolfIdUsername(value) : value,
    }));
  };

  const toggleVisibility = (key: GolfIdVisibilityKey) => {
    setForm((current) => ({
      ...current,
      visibility: {
        ...current.visibility,
        [key]: !current.visibility[key],
      },
    }));
  };

  const saveGolfId = async () => {
    setMessage('');
    setError('');
    setFieldErrors({});

    if (!user.isLoggedIn) {
      setShowAuth(true);
      return;
    }

    const username = normalizeGolfIdUsername(form.username);
    const nextFieldErrors: Partial<Record<keyof GolfIdFormData, string>> = {};
    if (!form.nickname.trim()) {
      nextFieldErrors.nickname = 'ニックネームを入力してください。';
      setFieldErrors(nextFieldErrors);
      setError('ニックネームを入力してください。');
      return;
    }
    if (!username) {
      nextFieldErrors.username = 'usernameを入力してください。';
      setFieldErrors(nextFieldErrors);
      setError('usernameを入力してください。');
      return;
    }
    if (!isValidGolfIdUsername(username)) {
      nextFieldErrors.username = '3〜32文字の半角英数字、ハイフン、アンダーバーのみ使えます。';
      setFieldErrors(nextFieldErrors);
      setError('usernameは3〜32文字の半角英数字、ハイフン、アンダーバーのみで入力してください。');
      return;
    }
    if (!form.target_score.trim()) {
      nextFieldErrors.target_score = '目標スコアを入力してください。';
      setFieldErrors(nextFieldErrors);
      setError('目標スコアを入力してください。');
      return;
    }
    if (!form.current_issue.trim()) {
      nextFieldErrors.current_issue = '今の悩みを入力してください。';
      setFieldErrors(nextFieldErrors);
      setError('今の悩みを入力してください。');
      return;
    }

    setSaving(true);
    const { data: usernameOwner, error: usernameCheckError } = await supabase
      .from(GOLF_PROFILE_TABLE)
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (usernameCheckError) {
      setSaving(false);
      setError('usernameの確認に失敗しました。時間をおいて再度お試しください。');
      trackEvent('golf_id_save_error', { reason: usernameCheckError.message });
      return;
    }

    if (usernameOwner && usernameOwner.id !== existingId) {
      setSaving(false);
      setFieldErrors({ username: 'このusernameは既に使われています。' });
      setError('このusernameは既に使われています。別のusernameを入力してください。');
      return;
    }

    const diagnosisResult = generateDiagnosisResult(form);
    const payload = {
      ...(existingId ? { id: existingId } : {}),
      user_id: user.id,
      username,
      nickname: form.nickname.trim(),
      best_score: toNullableNumber(form.best_score),
      average_score: toNullableNumber(form.average_score),
      target_score: toNullableNumber(form.target_score),
      head_speed: toNullableNumber(form.head_speed),
      golf_history: form.golf_history.trim() || null,
      favorite_club: form.favorite_club.trim() || null,
      weak_club: form.weak_club.trim() || null,
      current_issue: form.current_issue.trim() || null,
      club_setting: form.club_setting.trim() || null,
      visibility: form.visibility,
      diagnosis_result: diagnosisResult,
      is_public: true,
    };

    const { data, error: saveError } = await supabase.from(GOLF_PROFILE_TABLE).upsert(payload).select('id,username').single();
    setSaving(false);

    if (saveError) {
      const conflict = saveError.message.toLowerCase().includes('duplicate') || saveError.code === '23505';
      if (conflict) setFieldErrors({ username: 'このusernameは既に使われています。' });
      setError(conflict ? 'このusernameは既に使われています。別のusernameを入力してください。' : '保存に失敗しました。時間をおいて再度お試しください。');
      trackEvent('golf_id_save_error', { reason: saveError.message });
      return;
    }

    setExistingId((data as { id?: string } | null)?.id || existingId);
    setMessage('Golf IDを保存しました。公開ページへ移動します。');
    trackEvent('golf_id_create_complete', {
      username,
      diagnosis_type: diagnosisResult.diagnosisType,
    });
    navigate(`/u/${username}`);
  };

  return (
    <main className="bg-slate-50">
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_340px] lg:px-6 lg:py-12">
        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Golf ID</p>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-800 ring-1 ring-emerald-100">
                β版公開中
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">SNSに貼れるGolf IDを作る</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
              先行メンバーは無料でGolf IDを作成できます。まずはクラブ・スコア・悩み・目標をまとめるところから始めましょう。あとから編集できます。
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black text-emerald-800">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-100">3分で作成できます</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-100">見せたい項目だけ公開できます</span>
            </div>
            {!user.isLoggedIn && (
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
              >
                <UserRound className="h-4 w-4" />
                無料登録して作成する
              </button>
            )}
          </div>

          {(message || error) && (
            <div className={`rounded-xl px-4 py-3 text-sm font-bold ${error ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'}`}>
              {error || message}
            </div>
          )}

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">STEP 1</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">基本情報</h2>
                <p className="text-xs font-bold text-slate-500">公開ページの名前とURLを決めます。あとから編集できます。</p>
              </div>
              {loadingExisting && (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  読み込み中
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">ニックネーム</span>
                <input className={inputClass(Boolean(fieldErrors.nickname))} value={form.nickname} onChange={(event) => updateField('nickname', event.target.value)} placeholder="山田 太郎" />
                {fieldErrors.nickname && <p className="text-xs font-bold text-rose-600">{fieldErrors.nickname}</p>}
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">username</span>
                <input className={inputClass(Boolean(fieldErrors.username))} value={form.username} onChange={(event) => updateField('username', event.target.value)} placeholder="taro-golf" />
                <p className="text-[11px] font-bold leading-5 text-slate-500">公開URLに使われます。例: golfid.jp/u/junpei</p>
                {fieldErrors.username && <p className="text-xs font-bold text-rose-600">{fieldErrors.username}</p>}
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">STEP 2</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">スコア・目標</h2>
            <p className="text-xs font-bold text-slate-500">わかる範囲だけで大丈夫です。診断の精度が上がります。</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">ベストスコア</span>
                <input className={textInputClass} inputMode="numeric" value={form.best_score} onChange={(event) => updateField('best_score', event.target.value)} placeholder="82" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">平均スコア</span>
                <input className={textInputClass} inputMode="numeric" value={form.average_score} onChange={(event) => updateField('average_score', event.target.value)} placeholder="96" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">目標スコア</span>
                <input className={inputClass(Boolean(fieldErrors.target_score))} inputMode="numeric" value={form.target_score} onChange={(event) => updateField('target_score', event.target.value)} placeholder="89" />
                {fieldErrors.target_score && <p className="text-xs font-bold text-rose-600">{fieldErrors.target_score}</p>}
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">ヘッドスピード</span>
                <input className={textInputClass} inputMode="decimal" value={form.head_speed} onChange={(event) => updateField('head_speed', event.target.value)} placeholder="42" />
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">STEP 3</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">クラブ・悩み</h2>
            <p className="text-xs font-bold text-slate-500">まずは得意クラブ、苦手クラブ、悩みだけでも入力できます。</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-black text-slate-600">今の悩み</span>
                <textarea className={`${inputClass(Boolean(fieldErrors.current_issue))} min-h-24 resize-y`} value={form.current_issue} onChange={(event) => updateField('current_issue', event.target.value)} placeholder="ドライバーが右に出る。180y前後の番手が安定しない。" />
                {fieldErrors.current_issue && <p className="text-xs font-bold text-rose-600">{fieldErrors.current_issue}</p>}
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">得意クラブ</span>
                <input className={textInputClass} value={form.favorite_club} onChange={(event) => updateField('favorite_club', event.target.value)} placeholder="7W" />
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-black text-slate-600">苦手クラブ</span>
                <input className={textInputClass} value={form.weak_club} onChange={(event) => updateField('weak_club', event.target.value)} placeholder="5I、3Wなど" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">ゴルフ歴</span>
                <input className={textInputClass} value={form.golf_history} onChange={(event) => updateField('golf_history', event.target.value)} placeholder="5年" />
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">STEP 4</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">クラブセッティング</h2>
            <p className="text-xs font-bold text-slate-500">MVPでは自由入力でOKです。あとで番手ごとの登録に広げやすい形にしていきます。</p>
            <div className="mt-5 grid gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">クラブセッティング</span>
                <textarea className={`${textInputClass} min-h-32 resize-y font-mono text-xs`} value={form.club_setting} onChange={(event) => updateField('club_setting', event.target.value)} placeholder={'1W PING G425 LST\n5W TaylorMade Qi10\n4U PING G430 Hybrid'} />
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">公開設定</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">公開設定</h2>
            <p className="text-xs font-bold text-slate-500">見せたい項目だけ公開できます。</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(Object.keys(publicToggleLabels) as GolfIdVisibilityKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleVisibility(key)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-black transition ${
                    form.visibility[key] ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <span>{publicToggleLabels[key]}</span>
                  {form.visibility[key] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>

          {hasFeedbackForm && (
            <a
              href={feedbackFormUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackFeedbackClick('create_page')}
              className="block rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-emerald-800 shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-50"
            >
              使ってみた感想・改善点を送る
            </a>
          )}

          <div className="sticky bottom-3 z-10 flex gap-3 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
            <button
              type="button"
              onClick={saveGolfId}
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:bg-slate-400"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? '作成中...' : '保存して公開'}
            </button>
            <Link
              to="/explore"
              className="hidden items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
            >
              みんなのGolf ID
            </Link>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-200">
              <Share2 className="h-4 w-4" />
              公開URL
            </div>
            <p className="mt-3 break-all rounded-xl bg-white/10 p-3 text-sm font-bold text-white">{publicUrl}</p>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">SNSプロフィールや自己紹介に貼るためのGolf IDページです。</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-base font-black text-slate-950">表示プレビュー</h2>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xl font-black text-slate-950">{form.nickname || 'ニックネーム'}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">@{normalizeGolfIdUsername(form.username) || 'username'}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[10px] font-black text-slate-500">平均</p>
                  <p className="text-lg font-black text-emerald-700">{form.average_score || '-'}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[10px] font-black text-slate-500">目標</p>
                  <p className="text-lg font-black text-emerald-700">{form.target_score || '-'}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-[10px] font-black text-slate-500">HS</p>
                  <p className="text-lg font-black text-emerald-700">{form.head_speed || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
};
