import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardList, Eye, EyeOff, Loader2, QrCode, Share2, UserRound, UsersRound } from 'lucide-react';
import { useDiagnosis } from '../context/DiagnosisContext';
import { feedbackFormUrl, hasFeedbackForm, trackFeedbackClick } from '../config/feedback';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { golfIdDesign } from '../config/design';
import { GolfIdPreviewCard } from '../components/golfid/GolfIdUi';
import { SharePanel } from '../components/golfid/SharePanel';
import { MyBagManager } from '../features/gear/MyBagManager';
import { isMissingGolfProfilesTableError, loadOwnGolfIdProfile } from '../lib/golfIdProfileSource';
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
import { TargetCategory, type ClubSetting } from '../types/golf';

const GOLF_PROFILE_TABLE = 'golf_profiles';

const isMissingGolfProfileColumnError = (error: { code?: string; message?: string } | null) =>
  error?.code === 'PGRST204' || /Could not find .* column|schema cache/i.test(error?.message || '');

const toCompatibleGolfProfilePayload = (payload: Record<string, unknown>) => ({
  ...(payload.id ? { id: payload.id } : {}),
  user_id: payload.user_id,
  username: payload.username,
  nickname: payload.nickname,
  best_score: payload.best_score,
  average_score: payload.average_score,
  target_score: payload.target_score,
  head_speed: payload.head_speed,
  golf_history: payload.golf_history,
  favorite_club: payload.favorite_club,
  weak_club: payload.weak_club,
  current_issue: payload.current_issue,
  club_setting: payload.club_setting,
  clubs: payload.clubs,
  social_links: payload.social_links,
  visibility: payload.visibility,
  diagnosis_result: payload.diagnosis_result,
  is_public: payload.is_public,
});

const formatClubForGolfId = (club: ClubSetting['clubs'][number]) => {
  const number = club.number || (club.category === TargetCategory.BALL ? 'BALL' : club.category === TargetCategory.PUTTER ? 'PT' : '');
  const head = [number, club.brand, club.model].filter(Boolean).join(' ').trim();
  const shaft = [club.shaft, club.shaftWeight, club.flex].filter(Boolean).join(' ').trim();
  const distance = club.distance || club.carryDistance;
  return [head, shaft, distance ? `${distance}y` : ''].filter(Boolean).join(' / ').trim();
};

const buildClubSettingText = (setting: ClubSetting) =>
  setting.clubs
    .map(formatClubForGolfId)
    .filter(Boolean)
    .join('\n');

const buildGolfProfileClubs = (setting: ClubSetting) =>
  setting.clubs.map((club) => ({
    id: club.id,
    number: club.number || (club.category === TargetCategory.BALL ? 'BALL' : club.category === TargetCategory.PUTTER ? 'PT' : ''),
    category: club.category,
    brand: club.brand || '',
    model: club.model || '',
    shaft: [club.shaft, club.shaftWeight, club.flex].filter(Boolean).join(' ').trim(),
    loft: club.loft || '',
    distance: club.distance || '',
    carry_distance: club.carryDistance || '',
    memo: club.memo || '',
  }));

const initialForm: GolfIdFormData = {
  username: '',
  nickname: '',
  bio: '',
  avatar_url: '',
  cover_image_url: '',
  best_score: '',
  best_score_ladies: '',
  best_score_back: '',
  best_score_champion: '',
  average_score: '',
  target_score: '',
  head_speed: '',
  golf_history: '',
  frequent_area: '',
  home_course: '',
  role_title: '',
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
  golfIdDesign.input;

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

const buildLegacyGolfIdPayload = (
  userId: string,
  username: string,
  payload: Record<string, unknown>,
  socialLinks: {
    youtube: string | null;
    instagram: string | null;
    tiktok: string | null;
    x: string | null;
    custom1: { label: string; url: string | null };
    custom2: { label: string; url: string | null };
  },
) => {
  const updatedAt = new Date().toISOString();
  const bestScore = payload.best_score as number | null;
  const averageScore = payload.average_score as number | null;
  const clubSetting = typeof payload.club_setting === 'string' ? payload.club_setting : '';
  const clubs = clubSetting
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      id: `golf-id-club-${index + 1}`,
      category: 'club',
      number: '',
      brand: '',
      model: line,
      shaft: '',
      distance: '',
      carryDistance: '',
    }));

  return {
    id: userId,
    name: username,
    is_public: true,
    head_speed: payload.head_speed,
    golf_history: payload.golf_history,
    updated_at: updatedAt,
    sns_links: {
      ...(socialLinks.youtube ? { youtube: socialLinks.youtube } : {}),
      ...(socialLinks.instagram ? { instagram: socialLinks.instagram } : {}),
      ...(socialLinks.tiktok ? { tiktok: socialLinks.tiktok } : {}),
      ...(socialLinks.x ? { x: socialLinks.x } : {}),
      ...(socialLinks.custom1.url ? { custom1: socialLinks.custom1 } : {}),
      ...(socialLinks.custom2.url ? { custom2: socialLinks.custom2 } : {}),
      customLinks: [socialLinks.custom1, socialLinks.custom2].filter((link) => link.label && link.url),
      golfId: {
        ...payload,
        id: userId,
        user_id: userId,
        username,
        updated_at: updatedAt,
      },
      ...(bestScore !== null || averageScore !== null || clubs.length > 0
        ? {
            bagSnapshot: {
              ...(clubs.length > 0 ? { clubs } : {}),
              ...(bestScore !== null || averageScore !== null
                ? {
                    profileStats: {
                      ...(bestScore !== null ? { bestScore } : {}),
                      ...(averageScore !== null ? { averageScore } : {}),
                    },
                  }
                : {}),
            },
          }
        : {}),
    },
  };
};

export const GolfIdCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    profile,
    updateProfile,
    saveStatus,
    isManualSaveInFlight,
    saveErrorDetail,
    hasUnsavedChanges,
    pendingBagChangeCount,
    pendingBagChangeIds,
    lastCloudSavedAt,
    lastSaveTargetClubCount,
    lastSavedClubCount,
    manualSaveMyBag,
    manualSaveMyBagClub,
    syncWithSupabase,
    setShowAuth,
  } = useDiagnosis();
  const [activeStep, setActiveStep] = useState(1);
  const [form, setForm] = useState<GolfIdFormData>(initialForm);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof GolfIdFormData, string>>>({});
  const [socialErrors, setSocialErrors] = useState<Record<string, string>>({});

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
        if (isMissingGolfProfilesTableError(fetchError)) {
          const legacy = await loadOwnGolfIdProfile(user.id);
          if (!mounted) return;
          if (legacy.status === 'ok' && legacy.profile) {
            setExistingId(legacy.profile.id);
            setForm(mapRecordToGolfIdForm(legacy.profile));
            return;
          }
          setError('');
        } else {
          setError('Golf ID保存用テーブルを確認できませんでした。時間をおいて再度お試しください。');
        }
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
      bio: current.bio || 'ゴルフをもっとシンプルに、もっと楽しく。',
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

  const updateCustomLink = (key: 'custom1' | 'custom2', field: 'label' | 'description' | 'url', value: string) => {
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
    const nextSocialErrors: Record<string, string> = {};
    const normalizedAvatarUrl = normalizeOptionalUrl(form.avatar_url || '');
    const normalizedCoverUrl = normalizeOptionalUrl(form.cover_image_url || '');
    const normalizedSocialLinks = {
      youtube: normalizeOptionalUrl(form.social_links.youtube || ''),
      instagram: normalizeOptionalUrl(form.social_links.instagram || ''),
      tiktok: normalizeOptionalUrl(form.social_links.tiktok || ''),
      x: normalizeOptionalUrl(form.social_links.x || ''),
      custom1: {
        label: form.social_links.custom1?.label?.trim() || '',
        description: form.social_links.custom1?.description?.trim() || '',
        url: normalizeOptionalUrl(form.social_links.custom1?.url || ''),
      },
      custom2: {
        label: form.social_links.custom2?.label?.trim() || '',
        description: form.social_links.custom2?.description?.trim() || '',
        url: normalizeOptionalUrl(form.social_links.custom2?.url || ''),
      },
    };

    (Object.keys(socialUrlLabels) as GolfIdSocialLinkKey[]).forEach((key) => {
      if (normalizedSocialLinks[key] === null) nextSocialErrors[key] = `${socialUrlLabels[key]}の形式を確認してください。`;
    });
    if (normalizedAvatarUrl === null) nextSocialErrors.avatar_url = 'プロフィール画像URLの形式を確認してください。';
    if (normalizedCoverUrl === null) nextSocialErrors.cover_image_url = '背景画像URLの形式を確認してください。';
    if (normalizedSocialLinks.custom1.url === null) nextSocialErrors.custom1_url = '自由URL 1の形式を確認してください。';
    if (normalizedSocialLinks.custom2.url === null) nextSocialErrors.custom2_url = '自由URL 2の形式を確認してください。';

    if (Object.keys(nextSocialErrors).length > 0) {
      setSocialErrors(nextSocialErrors);
      setError('SNSリンクのURL形式を確認してください。');
      return;
    }

    setSaving(true);
    let useLegacyStorage = false;
    const { data: usernameOwners, error: usernameCheckError } = await supabase
      .from(GOLF_PROFILE_TABLE)
      .select('id,user_id')
      .ilike('username', username)
      .limit(5);

    if (usernameCheckError) {
      if (isMissingGolfProfilesTableError(usernameCheckError)) {
        useLegacyStorage = true;
      } else {
        setSaving(false);
        setError('usernameの確認に失敗しました。時間をおいて再度お試しください。');
        trackEvent('golf_id_save_error', { reason: usernameCheckError.message });
        return;
      }
    }

    const ownUsernameOwner = (usernameOwners || []).find((row) => row.user_id === user.id);
    const targetExistingId = existingId || ownUsernameOwner?.id || null;
    let usernameOwner: { id: string; user_id?: string | null } | undefined = (usernameOwners || []).find(
      (row) => row.id !== targetExistingId && row.user_id !== user.id,
    );
    if (useLegacyStorage) {
      const legacyNameOwner = await supabase
        .from('profiles')
        .select('id')
        .ilike('name', username)
        .limit(5);
      const legacyGolfIdOwner = await supabase
        .from('profiles')
        .select('id')
        .filter('sns_links->golfId->>username', 'eq', username)
        .limit(5);

      if (legacyNameOwner.error || legacyGolfIdOwner.error) {
        setSaving(false);
        setError('usernameの確認に失敗しました。時間をおいて再度お試しください。');
        trackEvent('golf_id_save_error', { reason: legacyNameOwner.error?.message || legacyGolfIdOwner.error?.message });
        return;
      }

      usernameOwner = [...(legacyNameOwner.data || []), ...(legacyGolfIdOwner.data || [])].find((row) => row.id !== user.id);
    }

    if (usernameOwner) {
      setSaving(false);
      setFieldErrors({ username: 'このusernameは既に使われています。' });
      setError('このusernameは既に使われています。別のusernameを入力してください。');
      return;
    }

    const myBagClubSetting = buildClubSettingText(profile.myBag);
    const visibleClubSetting = myBagClubSetting || form.club_setting.trim() || null;
    const profileClubs = buildGolfProfileClubs(profile.myBag);

    const payload = {
      ...(targetExistingId ? { id: targetExistingId } : {}),
      user_id: user.id,
      username,
      nickname: form.nickname.trim(),
      bio: form.bio.trim() || null,
      avatar_url: normalizedAvatarUrl || null,
      cover_image_url: normalizedCoverUrl || null,
      best_score: toNullableNumber(form.best_score),
      best_scores: {
        ladies: toNullableNumber(form.best_score_ladies),
        regular: toNullableNumber(form.best_score),
        back: toNullableNumber(form.best_score_back),
        champion: toNullableNumber(form.best_score_champion),
      },
      average_score: toNullableNumber(form.average_score),
      target_score: toNullableNumber(form.target_score),
      head_speed: toNullableNumber(form.head_speed),
      golf_history: form.golf_history.trim() || null,
      frequent_area: form.frequent_area.trim() || null,
      home_course: form.home_course.trim() || null,
      role_title: form.role_title.trim() || null,
      favorite_club: form.favorite_club.trim() || null,
      weak_club: form.weak_club.trim() || null,
      current_issue: form.current_issue.trim() || null,
      club_setting: visibleClubSetting,
      clubs: profileClubs,
      social_links: normalizedSocialLinks,
      visibility: form.visibility,
      diagnosis_result: null,
      is_public: true,
    };

    let data: { id?: string; username?: string } | null = null;
    let saveError: { code?: string; message: string } | null = null;

    if (!useLegacyStorage) {
      const result = targetExistingId
        ? await supabase
            .from(GOLF_PROFILE_TABLE)
            .update(payload)
            .eq('id', targetExistingId)
            .eq('user_id', user.id)
            .select('id,username')
            .single()
        : await supabase
            .from(GOLF_PROFILE_TABLE)
            .insert(payload)
            .select('id,username')
            .single();
      data = result.data as { id?: string; username?: string } | null;
      saveError = result.error;
      if (saveError && isMissingGolfProfilesTableError(saveError)) {
        useLegacyStorage = true;
      } else if (saveError && isMissingGolfProfileColumnError(saveError)) {
        const compatiblePayload = toCompatibleGolfProfilePayload(payload);
        const compatibleResult = targetExistingId
          ? await supabase
              .from(GOLF_PROFILE_TABLE)
              .update(compatiblePayload)
              .eq('id', targetExistingId)
              .eq('user_id', user.id)
              .select('id,username')
              .single()
          : await supabase
              .from(GOLF_PROFILE_TABLE)
              .insert(compatiblePayload)
              .select('id,username')
              .single();
        data = compatibleResult.data as { id?: string; username?: string } | null;
        saveError = compatibleResult.error;
      }
    }

    if (useLegacyStorage) {
      const legacyPayload = buildLegacyGolfIdPayload(user.id, username, payload, normalizedSocialLinks);
      const legacyResult = await supabase
        .from('profiles')
        .upsert(legacyPayload, { onConflict: 'id' })
        .select('id,name')
        .single();
      data = legacyResult.data ? { id: legacyResult.data.id, username: username } : null;
      saveError = legacyResult.error;
    }

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
    });
    navigate(`/u/${savedUsername}?created=1`);
  };

  const stepItems = [
    { number: 1, label: '編集' },
    { number: 2, label: '共有' },
    { number: 3, label: '設定' },
  ];
  const stepPanelClass = (step: number) => (activeStep === step ? '' : 'hidden');
  const normalizedUsername = normalizeGolfIdUsername(form.username);
  const isMyPageProfile = location.pathname.startsWith('/mypage/profile');
  const heroTitle = isMyPageProfile
    ? 'Golf IDを編集'
    : existingId
      ? 'あなたのGolf IDを更新'
      : 'あなたのGolf IDを作ろう。';
  const heroDescription = isMyPageProfile
    ? '表示名、スコア、My Bag、SNSリンクを整えて、すぐ共有できるゴルフ名刺にしましょう。'
    : '60秒で、表示名・スコア・SNSリンクを1ページに。My Bagはあとから追加できます。';
  const shareTitle = `${form.nickname.trim() || normalizedUsername || 'あなた'}のGolf ID`;
  const shareText = '自分のGolf IDを作りました。\nスコア・クラブ・SNSリンクをまとめたゴルフ用プロフィールです。';
  const myBagText = buildClubSettingText(profile.myBag);
  const previewClubLines = myBagText
    ? myBagText.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    : form.club_setting.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  const handleGolfIdMyBagUpdate = (nextOrUpdater: ClubSetting | ((prev: ClubSetting) => ClubSetting)) => {
    const previousText = buildClubSettingText(profile.myBag);
    const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(profile.myBag) : nextOrUpdater;
    const nextText = buildClubSettingText(next);
    updateProfile('myBag', next);
    setForm((current) => {
      if (current.club_setting.trim() && current.club_setting.trim() !== previousText) return current;
      return {
        ...current,
        club_setting: nextText,
      };
    });
  };

  return (
    <main className={golfIdDesign.page}>
      <section className="mx-auto grid max-w-7xl gap-7 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-6 lg:py-12">
        <div className="space-y-5">
          <div className={`rounded-[2rem] p-5 shadow-[0_22px_70px_-48px_rgba(11,15,13,0.9)] sm:p-8 ${golfIdDesign.darkPanel}`}>
            <div className="flex flex-wrap items-center gap-2">
              <p className={golfIdDesign.badgeDark}>Golf ID</p>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black text-emerald-100 ring-1 ring-emerald-300/20">
                β版公開中
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
              {heroDescription}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black text-emerald-100">
              <span className="rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">{isMyPageProfile ? '公開ページに反映されます' : '60秒で作成できます'}</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">あとから編集できます</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">見せたい項目だけ公開できます</span>
            </div>
            {isMyPageProfile && normalizedUsername && (
              <Link
                to={`/u/${normalizedUsername}`}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-black text-[#0B0F0D] transition hover:bg-emerald-50"
              >
                公開ページを見る
              </Link>
            )}
            {!user.isLoggedIn && (
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${golfIdDesign.goldButton}`}
              >
                <UserRound className="h-4 w-4" />
                無料登録して作成する
              </button>
            )}
          </div>

          <nav className="sticky top-2 z-10 grid grid-cols-3 gap-1 rounded-[1.35rem] bg-white/95 p-1.5 shadow-sm ring-1 ring-black/5 backdrop-blur">
            {stepItems.map((step) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(step.number)}
                className={`rounded-xl px-2 py-2 text-center transition ${
                  activeStep === step.number ? 'bg-[#0B0F0D] text-white shadow-sm' : 'bg-[#F5F7F4] text-slate-500 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <span className="block truncate text-sm font-black">{step.label}</span>
              </button>
            ))}
          </nav>

          <div className="rounded-[1.25rem] bg-[#0B0F0D] p-4 text-white shadow-sm ring-1 ring-white/10 lg:hidden">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#D7B56D]">
              <Share2 className="h-4 w-4" />
              公開URL
            </div>
            <p className="mt-2 break-all rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold">{publicUrl}</p>
          </div>

          {(message || error) && (
            <div className={`rounded-xl px-4 py-3 text-sm font-bold ${error ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'}`}>
              {error || message}
            </div>
          )}

          <div className={`rounded-[1.5rem] p-4 sm:p-6 ${golfIdDesign.lightCard} ${stepPanelClass(1)}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
            <p className={golfIdDesign.badgeLight}>プロフィール</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">表示名と公開URL</h2>
                <p className="text-xs font-bold text-slate-500">まずはここだけで公開できます。My Bagはあとから追加できます。</p>
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
                <span className="text-xs font-black text-slate-600">表示名</span>
                <input className={inputClass(Boolean(fieldErrors.nickname))} value={form.nickname} onChange={(event) => updateField('nickname', event.target.value)} placeholder="山田 太郎" />
                {fieldErrors.nickname && <p className="text-xs font-bold text-rose-600">{fieldErrors.nickname}</p>}
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">ID名</span>
                <input className={inputClass(Boolean(fieldErrors.username))} value={form.username} onChange={(event) => updateField('username', event.target.value)} placeholder="taro-golf" />
                <p className="text-[11px] font-bold leading-5 text-slate-500">公開URLに使われます。例: golfid.jp/u/junpei</p>
                {fieldErrors.username && <p className="text-xs font-bold text-rose-600">{fieldErrors.username}</p>}
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-black text-slate-600">一言コメント</span>
                <input className={textInputClass} value={form.bio} onChange={(event) => updateField('bio', event.target.value)} placeholder="ゴルフをもっとシンプルに、もっと楽しく。" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">プロフィール画像URL</span>
                <input className={inputClass(Boolean(socialErrors.avatar_url))} value={form.avatar_url} onChange={(event) => updateField('avatar_url', event.target.value)} placeholder="https://example.com/avatar.jpg" />
                {socialErrors.avatar_url && <p className="text-xs font-bold text-rose-600">{socialErrors.avatar_url}</p>}
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">背景画像URL</span>
                <input className={inputClass(Boolean(socialErrors.cover_image_url))} value={form.cover_image_url} onChange={(event) => updateField('cover_image_url', event.target.value)} placeholder="https://example.com/cover.jpg" />
                <p className="text-[11px] font-bold leading-5 text-slate-500">この背景画像はプロフィール上段に表示されます。</p>
                {socialErrors.cover_image_url && <p className="text-xs font-bold text-rose-600">{socialErrors.cover_image_url}</p>}
              </label>
            </div>
          </div>

          <div className={`rounded-[1.5rem] p-4 sm:p-6 ${golfIdDesign.lightCard} ${stepPanelClass(1)}`}>
            <p className={golfIdDesign.badgeLight}>スコア</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">スコア・ヘッドスピード</h2>
            <p className="text-xs font-bold text-slate-500">初回はベストスコアとヘッドスピードだけで十分です。</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">レディースティ ベスト</span>
                <input className={textInputClass} inputMode="numeric" value={form.best_score_ladies} onChange={(event) => updateField('best_score_ladies', event.target.value)} placeholder="84" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">レギュラーティ ベスト</span>
                <input className={textInputClass} inputMode="numeric" value={form.best_score} onChange={(event) => updateField('best_score', event.target.value)} placeholder="82" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">バックティ ベスト</span>
                <input className={textInputClass} inputMode="numeric" value={form.best_score_back} onChange={(event) => updateField('best_score_back', event.target.value)} placeholder="86" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">チャンピオンティ ベスト</span>
                <input className={textInputClass} inputMode="numeric" value={form.best_score_champion} onChange={(event) => updateField('best_score_champion', event.target.value)} placeholder="89" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">平均スコア</span>
                <input className={textInputClass} inputMode="numeric" value={form.average_score} onChange={(event) => updateField('average_score', event.target.value)} placeholder="96" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">目標スコア 任意</span>
                <input className={inputClass(Boolean(fieldErrors.target_score))} inputMode="numeric" value={form.target_score} onChange={(event) => updateField('target_score', event.target.value)} placeholder="89" />
                {fieldErrors.target_score && <p className="text-xs font-bold text-rose-600">{fieldErrors.target_score}</p>}
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">ヘッドスピード</span>
                <input className={textInputClass} inputMode="decimal" value={form.head_speed} onChange={(event) => updateField('head_speed', event.target.value)} placeholder="42" />
              </label>
            </div>
          </div>

          <div className={`rounded-[1.5rem] p-4 sm:p-6 ${golfIdDesign.lightCard} ${stepPanelClass(1)}`}>
            <p className={golfIdDesign.badgeLight}>プロフィール</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">よく行くエリア・補足</h2>
            <p className="text-xs font-bold text-slate-500">通常公開に出したい情報だけ入力します。悩みはコーチ共有用としても使えます。</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-black text-slate-600">現在の悩み 任意</span>
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
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">よく行くエリア</span>
                <input className={textInputClass} value={form.frequent_area} onChange={(event) => updateField('frequent_area', event.target.value)} placeholder="関東・東海" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">ホームコース</span>
                <input className={textInputClass} value={form.home_course} onChange={(event) => updateField('home_course', event.target.value)} placeholder="太平洋クラブ御殿場コース" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-black text-slate-600">肩書</span>
                <input className={textInputClass} value={form.role_title} onChange={(event) => updateField('role_title', event.target.value)} placeholder="レッスンプロ" />
              </label>
            </div>
          </div>

          <div className={`rounded-[1.5rem] p-4 sm:p-6 ${golfIdDesign.lightCard} ${stepPanelClass(1)}`}>
            <p className={golfIdDesign.badgeLight}>My Bag</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">クラブセッティング</h2>
            <p className="text-xs font-bold text-slate-500">
              マイクラブと同じ編集画面です。ここで変更した内容を保存して公開すると、Golf IDのMy Bagにも反映されます。
            </p>
            <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white p-2 sm:p-3">
              <MyBagManager
                setting={profile.myBag}
                onUpdate={handleGolfIdMyBagUpdate}
                saveStatus={saveStatus}
                isManualSaveInFlight={isManualSaveInFlight}
                saveErrorDetail={saveErrorDetail}
                hasUnsavedChanges={hasUnsavedChanges}
                pendingBagChangeCount={pendingBagChangeCount}
                pendingBagChangeIds={pendingBagChangeIds}
                lastCloudSavedAt={lastCloudSavedAt}
                lastSaveTargetClubCount={lastSaveTargetClubCount}
                lastSavedClubCount={lastSavedClubCount}
                onManualSave={(settingOverride) => manualSaveMyBag(settingOverride || profile.myBag)}
                onManualSaveClub={(clubId, settingOverride) => manualSaveMyBagClub(clubId, settingOverride || profile.myBag)}
                onReloadFromCloud={syncWithSupabase}
                desktopLayout="table"
              />
            </div>
          </div>

          <div className={`rounded-[1.5rem] p-4 sm:p-6 ${golfIdDesign.lightCard} ${stepPanelClass(1)}`}>
            <p className={golfIdDesign.badgeLight}>SNS & Links</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">発信リンク</h2>
            <p className="text-xs font-bold text-slate-500">初回はSNSリンク1つだけでOKです。あとから追加できます。</p>
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
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-black text-slate-600">自由URL 1 概要</span>
                <input
                  className={textInputClass}
                  value={form.social_links.custom1?.description || ''}
                  onChange={(event) => updateCustomLink('custom1', 'description', event.target.value)}
                  placeholder="マンツーマンレッスン受付中です！"
                />
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
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-black text-slate-600">自由URL 2 概要</span>
                <input
                  className={textInputClass}
                  value={form.social_links.custom2?.description || ''}
                  onChange={(event) => updateCustomLink('custom2', 'description', event.target.value)}
                  placeholder="活動・実績"
                />
              </label>
            </div>
          </div>

          <div className={`rounded-[1.5rem] p-4 sm:p-6 ${golfIdDesign.lightCard} ${stepPanelClass(3)}`}>
            <p className={golfIdDesign.badgeLight}>設定</p>
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

          <div className={`space-y-4 ${stepPanelClass(2)}`}>
            <SharePanel
              url={publicUrl}
              title={shareTitle}
              text={shareText}
              username={normalizedUsername}
              variant="owner"
              location="edit_panel"
              heading="Golf IDを共有"
              description="URL・QR・LINE・SNSで、あなたのゴルフプロフィールをすぐ共有できます。"
              publicPageHref={publicUrl}
            />
            <div className={`rounded-[1.5rem] p-4 sm:p-6 ${golfIdDesign.lightCard}`}>
              <p className={golfIdDesign.badgeLight}>コーチ/フィッター共有</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">専用共有リンク</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-slate-600">
                通常公開ページには表示せず、必要な相手にだけ送るリンクです。コーチには悩みや動画URL、フィッターにはMy Bagや飛距離を共有する設計にします。
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link to={normalizedUsername ? `/u/${normalizedUsername}?mode=coach` : '/create'} className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 ring-1 ring-emerald-100">
                  コーチ共有リンクを確認
                </Link>
                <Link to={normalizedUsername ? `/u/${normalizedUsername}?mode=fitter` : '/create'} className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 ring-1 ring-emerald-100">
                  フィッター共有リンクを確認
                </Link>
              </div>
            </div>
          </div>

          <div className={`rounded-[1.5rem] p-4 sm:p-6 ${golfIdDesign.lightCard} ${stepPanelClass(3)}`}>
            <p className={golfIdDesign.badgeLight}>役割分担</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Golf IDは名刺。MyBagProは診断書。</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-[#F5F7F4] p-4 ring-1 ring-black/5">
                <p className="text-sm font-black text-slate-950">Golf ID</p>
                <p className="mt-1 text-xs font-bold leading-6 text-slate-600">プロフィール、スコア、My Bag、SNS、QRをまとめて共有します。</p>
              </div>
              <div className="rounded-2xl bg-[#F5F7F4] p-4 ring-1 ring-black/5">
                <p className="text-sm font-black text-slate-950">MyBagPro</p>
                <p className="mt-1 text-xs font-bold leading-6 text-slate-600">クラブ構成、課題、番手間ギャップ、AI診断、次の一手を分析します。</p>
              </div>
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

          <div className="flex gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setActiveStep((step) => Math.max(1, step - 1))}
              disabled={activeStep === 1}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-white px-4 text-sm font-black text-slate-700 ring-1 ring-black/5 disabled:opacity-40"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={() => setActiveStep((step) => Math.min(3, step + 1))}
              disabled={activeStep === 3}
              className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl px-4 text-sm font-black disabled:opacity-40 ${golfIdDesign.goldButton}`}
            >
              次へ
            </button>
          </div>

          <div className="sticky bottom-3 z-10 flex gap-3 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
            <button
              type="button"
              onClick={saveGolfId}
              disabled={saving}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition disabled:cursor-wait disabled:bg-slate-400 ${golfIdDesign.primaryButton}`}
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
          <div className={`rounded-[1.5rem] p-5 shadow-sm ${golfIdDesign.darkPanel}`}>
            <div className="flex items-center gap-2 text-sm font-black text-emerald-200">
              <Share2 className="h-4 w-4" />
              公開URL
            </div>
            <p className="mt-3 break-all rounded-xl bg-white/10 p-3 text-sm font-bold text-white">{publicUrl}</p>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">SNSプロフィールや自己紹介に貼るためのGolf IDページです。</p>
          </div>
          <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className={golfIdDesign.badgeLight}>Use Case</p>
            <h2 className="mt-3 text-base font-black text-slate-950">作ったGolf IDは、すぐ共有できます。</h2>
            <div className="mt-3 grid gap-2">
              {[
                { label: 'SNSプロフィールに貼る', icon: Share2 },
                { label: 'ラウンド前にLINEで送る', icon: UsersRound },
                { label: 'コーチ・フィッターに渡す', icon: ClipboardList },
                { label: 'QRでその場で見せる', icon: QrCode },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-[#F5F7F4] px-3 py-2.5 ring-1 ring-black/5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-800 ring-1 ring-black/5">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-black text-slate-700">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {existingId && normalizedUsername && (
            <SharePanel
              url={publicUrl}
              title={shareTitle}
              text={shareText}
              username={normalizedUsername}
              variant="owner"
              location="edit_panel"
              heading="自分のGolf IDを共有"
              description="あなたのGolf IDは公開されています。SNSプロフィールや自己紹介欄に貼って使えます。"
              publicPageHref={publicUrl}
            />
          )}
          <div className="sticky top-24 rounded-[1.7rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
            <h2 className="text-base font-black text-slate-950">公開ページプレビュー</h2>
            <div className="mt-4">
              <GolfIdPreviewCard
                nickname={form.nickname || 'ニックネーム'}
                username={normalizeGolfIdUsername(form.username) || 'username'}
                bestScore={form.best_score}
                targetScore={form.target_score}
                averageScore={form.average_score}
                headSpeed={form.head_speed}
                currentIssue={form.current_issue || '入力した悩みがここに表示されます。'}
                favoriteClub={form.favorite_club}
                weakClub={form.weak_club}
                clubLines={previewClubLines}
                socialLabels={[
                  form.social_links.youtube && { label: 'YouTube', platform: 'youtube' as const },
                  form.social_links.instagram && { label: 'Instagram', platform: 'instagram' as const },
                  form.social_links.tiktok && { label: 'TikTok', platform: 'tiktok' as const },
                  form.social_links.x && { label: 'X', platform: 'x' as const },
                  form.social_links.custom1?.url && { label: form.social_links.custom1.label || 'Link 1', platform: 'custom1' as const },
                  form.social_links.custom2?.url && { label: form.social_links.custom2.label || 'Link 2', platform: 'custom2' as const },
                ].filter(Boolean) as Array<{ label: string; platform: 'youtube' | 'instagram' | 'tiktok' | 'x' | 'custom1' | 'custom2' }>}
              />
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
};
