import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clipboard, Eye, EyeOff, Loader2, Share2, UserRound } from 'lucide-react';
import { useDiagnosis } from '../context/DiagnosisContext';
import { feedbackFormUrl, hasFeedbackForm, trackFeedbackClick } from '../config/feedback';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { generateDiagnosisResult } from '../lib/diagnosis/rules';
import {
  defaultGolfIdVisibility,
  emptyGolfIdSocialLinks,
  type GolfIdSocialLinkKey,
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
  social_links: emptyGolfIdSocialLinks,
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

const socialUrlLabels: Record<GolfIdSocialLinkKey, string> = {
  youtube: 'YouTube URL',
  instagram: 'Instagram URL',
  tiktok: 'TikTok URL',
  x: 'X URL',
};

const socialUrlPlaceholders: Record<GolfIdSocialLinkKey, string> = {
  youtube: 'https://www.youtube.com/@yourname',
  instagram: 'https://www.instagram.com/yourname',
  tiktok: 'https://www.tiktok.com/@yourname',
  x: 'https://x.com/yourname',
};

const normalizeOptionalUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
};

export const GolfIdCreatePage = () => {
  const navigate = useNavigate();
  const { user, profile, setShowAuth } = useDiagnosis();
  const [activeStep, setActiveStep] = useState(1);
  const [form, setForm] = useState<GolfIdFormData>(initialForm);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof GolfIdFormData, string>>>({});
  const [socialErrors, setSocialErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    trackEvent('golf_id_create_start', {
      source: 'create_page',
    });
  }, []);

  useEffect(() => {
    trackEvent('golf_id_step_view', {
      step: activeStep,
      source: 'create_page',
    });
  }, [activeStep]);

  const publicUrl = useMemo(() => {
    const username = normalizeGolfIdUsername(form.username);
    return username ? `https://golfid.jp/u/${username}` : 'https://golfid.jp/u/username';
  }, [form.username]);

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

  const updateSocialUrl = (key: GolfIdSocialLinkKey, value: string) => {
    setForm((current) => ({
      ...current,
      social_links: {
        ...current.social_links,
        [key]: value,
      },
    }));
  };

  const updateCustomLink = (key: 'custom1' | 'custom2', field: 'label' | 'url', value: string) => {
    setForm((current) => ({
      ...current,
      social_links: {
        ...current.social_links,
        [key]: {
          ...current.social_links[key],
          [field]: value,
        },
      },
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

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      trackEvent('url_copy_click', {
        source: 'create_page',
        username: normalizeGolfIdUsername(form.username),
      });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('URLをコピーできませんでした。ブラウザの設定を確認してください。');
    }
  };

  const saveGolfId = async () => {
    setMessage('');
    setError('');
    setFieldErrors({});
    setSocialErrors({});

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

    const nextSocialErrors: Record<string, string> = {};
    const normalizedSocialLinks = {
      youtube: normalizeOptionalUrl(form.social_links.youtube || ''),
      instagram: normalizeOptionalUrl(form.social_links.instagram || ''),
      tiktok: normalizeOptionalUrl(form.social_links.tiktok || ''),
      x: normalizeOptionalUrl(form.social_links.x || ''),
      custom1: {
        label: form.social_links.custom1?.label?.trim() || '',
        url: normalizeOptionalUrl(form.social_links.custom1?.url || ''),
      },
      custom2: {
        label: form.social_links.custom2?.label?.trim() || '',
        url: normalizeOptionalUrl(form.social_links.custom2?.url || ''),
      },
    };

    (Object.keys(socialUrlLabels) as GolfIdSocialLinkKey[]).forEach((key) => {
      if (normalizedSocialLinks[key] === null) nextSocialErrors[key] = `${socialUrlLabels[key]}の形式を確認してください。`;
    });
    if (normalizedSocialLinks.custom1.url === null) nextSocialErrors.custom1_url = '自由URL 1の形式を確認してください。';
    if (normalizedSocialLinks.custom2.url === null) nextSocialErrors.custom2_url = '自由URL 2の形式を確認してください。';

    if (Object.keys(nextSocialErrors).length > 0) {
      setSocialErrors(nextSocialErrors);
      setError('SNSリンクのURL形式を確認してください。');
      return;
    }

    setSaving(true);
    const { data: usernameOwner, error: usernameCheckError } = await supabase
      .from(GOLF_PROFILE_TABLE)
      .select('id')
      .ilike('username', username)
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
      social_links: normalizedSocialLinks,
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

    const savedUsername = normalizeGolfIdUsername((data as { username?: string } | null)?.username || username);
    setExistingId((data as { id?: string } | null)?.id || existingId);
    setMessage('Golf IDを保存しました。公開ページへ移動します。');
    trackEvent('golf_id_create_complete', {
      username: savedUsername,
      diagnosis_type: diagnosisResult.diagnosisType,
    });
    navigate(`/u/${savedUsername}`);
  };

  const stepItems = [
    { number: 1, label: 'Golf ID' },
    { number: 2, label: 'Score' },
    { number: 3, label: 'My Golf' },
    { number: 4, label: 'My Bag' },
    { number: 5, label: 'Links' },
    { number: 6, label: 'Publish' },
  ];

  return (
    <main className="bg-slate-50">
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_340px] lg:px-6 lg:py-12">
        <div className="space-y-5">
          <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm ring-1 ring-slate-900 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Golf ID Builder</p>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black text-emerald-100 ring-1 ring-emerald-300/20">
                β版公開中
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {existingId ? 'あなたのGolf IDを更新' : 'あなたのGolf IDを作ろう。'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
              クラブ、スコア、悩み、目標をまとめると、AIがあなたの“次の一手”を提案します。作成したGolf IDは、SNSプロフィールに貼って共有できます。
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black text-emerald-100">
              <span className="rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">3分で作成できます</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">あとから編集できます</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">見せたい項目だけ公開できます</span>
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

          <nav className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:grid-cols-6">
            {stepItems.map((step) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(step.number)}
                className={`rounded-xl px-2 py-2 text-center transition ${
                  activeStep === step.number ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <span className="block text-[10px] font-black">STEP {step.number}</span>
                <span className="mt-0.5 block truncate text-[11px] font-black">{step.label}</span>
              </button>
            ))}
          </nav>

          {(message || error) && (
            <div className={`rounded-xl px-4 py-3 text-sm font-bold ${error ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'}`}>
              {error || message}
            </div>
          )}

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">STEP 1 / Golf ID</p>
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
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">STEP 2 / Score</p>
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
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">STEP 3 / My Golf</p>
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
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">STEP 4 / My Bag</p>
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
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">STEP 5 / SNS Links</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">発信リンク</h2>
            <p className="text-xs font-bold text-slate-500">あなたの発信場所をまとめましょう。YouTube、Instagram、TikTok、X、自由URLをGolf IDに表示できます。</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(Object.keys(socialUrlLabels) as GolfIdSocialLinkKey[]).map((key) => (
                <label key={key} className="space-y-1.5">
                  <span className="text-xs font-black text-slate-600">{socialUrlLabels[key]}</span>
                  <input
                    className={inputClass(Boolean(socialErrors[key]))}
                    value={form.social_links[key] || ''}
                    onChange={(event) => updateSocialUrl(key, event.target.value)}
                    placeholder={socialUrlPlaceholders[key]}
                  />
                  {socialErrors[key] && <p className="text-xs font-bold text-rose-600">{socialErrors[key]}</p>}
                </label>
              ))}
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">自由URL 1 ラベル</span>
                <input
                  className={textInputClass}
                  value={form.social_links.custom1?.label || ''}
                  onChange={(event) => updateCustomLink('custom1', 'label', event.target.value)}
                  placeholder="レッスン予約"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">自由URL 1 URL</span>
                <input
                  className={inputClass(Boolean(socialErrors.custom1_url))}
                  value={form.social_links.custom1?.url || ''}
                  onChange={(event) => updateCustomLink('custom1', 'url', event.target.value)}
                  placeholder="https://example.com"
                />
                {socialErrors.custom1_url && <p className="text-xs font-bold text-rose-600">{socialErrors.custom1_url}</p>}
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">自由URL 2 ラベル</span>
                <input
                  className={textInputClass}
                  value={form.social_links.custom2?.label || ''}
                  onChange={(event) => updateCustomLink('custom2', 'label', event.target.value)}
                  placeholder="使用クラブ一覧"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">自由URL 2 URL</span>
                <input
                  className={inputClass(Boolean(socialErrors.custom2_url))}
                  value={form.social_links.custom2?.url || ''}
                  onChange={(event) => updateCustomLink('custom2', 'url', event.target.value)}
                  placeholder="https://example.com"
                />
                {socialErrors.custom2_url && <p className="text-xs font-bold text-rose-600">{socialErrors.custom2_url}</p>}
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">STEP 6 / Publish</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">公開プレビュー・公開設定</h2>
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
            <h2 className="text-base font-black text-slate-950">Golf IDプレビュー</h2>
            <div className="mt-4 overflow-hidden rounded-3xl bg-slate-950 text-white ring-1 ring-slate-900">
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">Golf ID</p>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-emerald-100">Preview</span>
                </div>
                <p className="mt-4 text-2xl font-black">{form.nickname || 'ニックネーム'}</p>
                <p className="mt-1 break-all text-xs font-bold text-slate-300">{publicUrl}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-white p-3 text-center text-slate-950">
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <p className="text-[10px] font-black text-slate-500">平均</p>
                  <p className="text-lg font-black text-emerald-700">{form.average_score || '-'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <p className="text-[10px] font-black text-slate-500">目標</p>
                  <p className="text-lg font-black text-emerald-700">{form.target_score || '-'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <p className="text-[10px] font-black text-slate-500">HS</p>
                  <p className="text-lg font-black text-emerald-700">{form.head_speed || '-'}</p>
                </div>
              </div>
              <div className="space-y-3 bg-white p-4 text-slate-950">
                <div>
                  <p className="text-[11px] font-black text-slate-500">今の悩み</p>
                  <p className="mt-1 text-sm font-bold leading-6">{form.current_issue || '入力した悩みがここに表示されます。'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black text-slate-500">得意クラブ</p>
                    <p className="mt-1 text-sm font-black">{form.favorite_club || '-'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black text-slate-500">苦手クラブ</p>
                    <p className="mt-1 text-sm font-black">{form.weak_club || '-'}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
                  <p className="text-[11px] font-black text-emerald-800">あなたの次の一手</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-800">
                    入力内容をもとに、作成後にあなたの次の一手を表示します。
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <p className="text-[11px] font-black text-slate-500">発信リンク</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      form.social_links.youtube && 'YouTube',
                      form.social_links.instagram && 'Instagram',
                      form.social_links.tiktok && 'TikTok',
                      form.social_links.x && 'X',
                      form.social_links.custom1?.url && (form.social_links.custom1.label || 'Link 1'),
                      form.social_links.custom2?.url && (form.social_links.custom2.label || 'Link 2'),
                    ]
                      .filter(Boolean)
                      .map((label) => (
                        <span key={String(label)} className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-emerald-800 ring-1 ring-emerald-100">
                          {label}
                        </span>
                      ))}
                    {![
                      form.social_links.youtube,
                      form.social_links.instagram,
                      form.social_links.tiktok,
                      form.social_links.x,
                      form.social_links.custom1?.url,
                      form.social_links.custom2?.url,
                    ].some(Boolean) && <span className="text-xs font-bold text-slate-400">SNSリンクを入力するとここに表示されます。</span>}
                  </div>
                </div>
                {existingId && (
                  <div className="grid gap-2">
                    <Link
                      to={`/u/${normalizeGolfIdUsername(form.username)}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white"
                    >
                      公開ページを見る
                    </Link>
                    <button
                      type="button"
                      onClick={copyPublicUrl}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-800"
                    >
                      <Clipboard className="h-4 w-4" />
                      {copied ? 'コピーしました' : 'URLをコピー'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
};
