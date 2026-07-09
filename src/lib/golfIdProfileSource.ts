import { supabase } from './supabase';
import {
  defaultGolfIdVisibility,
  emptyGolfIdSocialLinks,
  normalizeGolfIdUsername,
  type GolfIdSocialLinks,
  type GolfIdRecord,
} from './golfId';

export type GolfIdLoadStatus = 'ok' | 'not_found' | 'connection_error' | 'permission_error' | 'table_missing' | 'render_error';

export type GolfIdLoadResult = {
  status: GolfIdLoadStatus;
  profile: GolfIdRecord | null;
  message?: string;
};

const PUBLIC_QUERY_TIMEOUT_MS = 12000;
const PUBLIC_LIST_QUERY_TIMEOUT_MS = 1800;
const FALLBACK_JSON_PATH = '/golf-id-profiles-fallback.json';
let fallbackGolfIdProfilesCache: GolfIdRecord[] | null = null;

type LegacyClubRow = {
  number?: string;
  brand?: string;
  model?: string;
  shaft?: string;
  loft?: string;
  distance?: string;
  carryDistance?: string;
};

type LegacyProfileRow = {
  id?: string;
  name?: string | null;
  head_speed?: number | string | null;
  golf_history?: string | null;
  current_ball?: string | null;
  sns_links?: {
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    x?: string;
    custom1?: {
      label?: string;
      description?: string;
      url?: string;
    };
    custom2?: {
      label?: string;
      description?: string;
      url?: string;
    };
    customLinks?: Array<{
      label?: string;
      description?: string;
      url?: string;
    }>;
    golfId?: Partial<GolfIdRecord> & {
      best_score?: number | string | null;
      average_score?: number | string | null;
      target_score?: number | string | null;
      head_speed?: number | string | null;
    };
    bagSnapshot?: {
      clubs?: LegacyClubRow[];
      profileStats?: {
        bestScore?: number | string | null;
        averageScore?: number | string | null;
      };
    };
  } | null;
  is_public?: boolean | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export const isMissingGolfProfilesTableError = (error: unknown) => {
  const maybeError = error as { code?: string; message?: string } | null;
  return maybeError?.code === 'PGRST205' || /Could not find the table 'public\.golf_profiles'/i.test(maybeError?.message || '');
};

export const classifyGolfIdError = (error: unknown): GolfIdLoadStatus => {
  const maybeError = error as { code?: string; message?: string } | null;
  if (isMissingGolfProfilesTableError(error)) return 'table_missing';
  if (maybeError?.code === '42501' || /permission|rls|policy/i.test(maybeError?.message || '')) return 'permission_error';
  return 'connection_error';
};

const withTimeout = async <T,>(promise: PromiseLike<T>, label: string, timeoutMs = PUBLIC_QUERY_TIMEOUT_MS): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const loadFallbackGolfIdProfiles = async (): Promise<GolfIdRecord[]> => {
  if (fallbackGolfIdProfilesCache) return fallbackGolfIdProfilesCache;
  if (typeof fetch !== 'function') return [];
  try {
    const response = await withTimeout(
      fetch(FALLBACK_JSON_PATH, { cache: 'force-cache' }),
      'Golf ID fallback JSON',
      900,
    );
    if (!response.ok) return [];
    const rows = await response.json();
    fallbackGolfIdProfilesCache = Array.isArray(rows) ? (rows as GolfIdRecord[]) : [];
    return fallbackGolfIdProfilesCache;
  } catch {
    return [];
  }
};

const loadFallbackGolfIdProfile = async (username: string): Promise<GolfIdLoadResult> => {
  const normalizedUsername = normalizeGolfIdUsername(username);
  const rows = await loadFallbackGolfIdProfiles();
  const profile = rows.find((row) => normalizeGolfIdUsername(row.username || row.nickname || '') === normalizedUsername);
  if (!profile) return { status: 'not_found', profile: null };
  return { status: 'ok', profile: { ...profile, username: normalizeGolfIdUsername(profile.username || normalizedUsername) } };
};

const toNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatClubLine = (club: LegacyClubRow) => {
  const head = [club.number, club.brand, club.model].filter(Boolean).join(' ');
  const shaft = club.shaft ? ` / ${club.shaft}` : '';
  const distance = club.distance ? ` / ${club.distance}y` : '';
  return `${head}${shaft}${distance}`.trim();
};

const normalizeLegacySocialUrl = (value: unknown, baseUrl: string, handlePrefix = '') => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  const cleanHandle = text.replace(/^@+/, '').replace(/^\/+/, '');
  return `${baseUrl}${handlePrefix}${cleanHandle}`;
};

const mapLegacySocialLinks = (row: LegacyProfileRow): GolfIdSocialLinks => {
  const links = row.sns_links || {};
  const customLinks = Array.isArray(links.customLinks) ? links.customLinks : [];
  return {
    ...emptyGolfIdSocialLinks,
    youtube: normalizeLegacySocialUrl(links.youtube, 'https://www.youtube.com/'),
    instagram: normalizeLegacySocialUrl(links.instagram, 'https://www.instagram.com/'),
    tiktok: normalizeLegacySocialUrl(links.tiktok, 'https://www.tiktok.com/', '@'),
    x: normalizeLegacySocialUrl(links.x, 'https://x.com/'),
    custom1: {
      label: links.custom1?.label || customLinks[0]?.label || '',
      description: links.custom1?.description || customLinks[0]?.description || '',
      url: links.custom1?.url || customLinks[0]?.url || '',
    },
    custom2: {
      label: links.custom2?.label || customLinks[1]?.label || '',
      description: links.custom2?.description || customLinks[1]?.description || '',
      url: links.custom2?.url || customLinks[1]?.url || '',
    },
  };
};

export const mapLegacyProfileToGolfId = (row: LegacyProfileRow, requestedUsername?: string): GolfIdRecord => {
  const golfId = row.sns_links?.golfId || {};
  const username = normalizeGolfIdUsername(requestedUsername || golfId.username || row.name || row.id || 'golfer');
  const snapshot = row.sns_links?.bagSnapshot;
  const stats = snapshot?.profileStats || {};
  const snapshotClubs = snapshot?.clubs || [];
  const clubs = snapshotClubs.map(formatClubLine).filter(Boolean);
  const golfIdClubs = Array.isArray((golfId as { clubs?: unknown }).clubs)
    ? ((golfId as { clubs?: unknown[] }).clubs || [])
    : [];

  return {
    id: row.id || username,
    username,
    user_id: row.id || null,
    nickname: golfId.nickname?.trim() || row.name?.trim() || username,
    bio: golfId.bio || null,
    avatar_url: golfId.avatar_url || null,
    cover_image_url: golfId.cover_image_url || null,
    best_score: toNumberOrNull(golfId.best_score ?? stats.bestScore),
    best_scores: golfId.best_scores || null,
    average_score: toNumberOrNull(golfId.average_score ?? stats.averageScore),
    target_score: toNumberOrNull(golfId.target_score),
    head_speed: toNumberOrNull(golfId.head_speed ?? row.head_speed),
    golf_history: golfId.golf_history || row.golf_history || null,
    frequent_area: golfId.frequent_area || null,
    home_course: golfId.home_course || null,
    role_title: golfId.role_title || null,
    favorite_club: golfId.favorite_club || null,
    weak_club: golfId.weak_club || null,
    current_issue: golfId.current_issue || null,
    club_setting: golfId.club_setting || clubs.join('\n'),
    clubs: golfIdClubs.length > 0 ? (golfIdClubs as GolfIdRecord['clubs']) : null,
    social_links: mapLegacySocialLinks(row),
    visibility: {
      ...defaultGolfIdVisibility,
      ...(golfId.visibility || {}),
    },
    diagnosis_result: golfId.diagnosis_result || {
      diagnosisType: 'クラブ見直しタイプ',
      currentStatus: '登録済みのクラブ、スコア、ヘッドスピードをもとに現在地を整理できます。',
      priorityIssue: 'まずはGolf IDの項目を埋めて、クラブ構成と目標スコアを見比べましょう。',
      nextAction: 'クラブセッティングとスコア目標を1ページにまとめ、次に見直す番手を明確にしましょう。',
      notRecommendedNow: 'いきなり全クラブを買い替えるより、距離階段と苦手番手から確認しましょう。',
      gearSuggestion: row.current_ball ? `使用ボール: ${row.current_ball}` : 'クラブ構成の抜けや距離差を確認しましょう。',
    },
    is_public: row.is_public ?? true,
    updated_at: row.updated_at || row.created_at || null,
  };
};

export const loadLegacyGolfIdProfile = async (username: string): Promise<GolfIdLoadResult> => {
  let data: unknown[] | null = null;
  let error: { message: string } | null = null;
  try {
    const result = await withTimeout(
      supabase
        .from('profiles')
        .select('id,name,head_speed,golf_history,current_ball,sns_links,is_public,updated_at')
        .eq('name', username)
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(1),
      'legacy Golf ID profile query',
    );
    data = result.data;
    error = result.error;
  } catch (queryError) {
    return { status: 'connection_error', profile: null, message: queryError instanceof Error ? queryError.message : 'legacy query failed' };
  }

  if (error) {
    return { status: classifyGolfIdError(error), profile: null, message: error.message };
  }

  const row = data?.[0] as LegacyProfileRow | undefined;
  if (!row) {
    const fallback = await withTimeout(
      supabase
        .from('profiles')
        .select('id,name,head_speed,golf_history,current_ball,sns_links,is_public,updated_at')
        .filter('sns_links->golfId->>username', 'eq', username)
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(1),
      'legacy Golf ID username query',
    ).catch((queryError) => {
      return { data: null, error: { message: queryError instanceof Error ? queryError.message : 'legacy username query failed' } };
    });

    if (fallback.error) return { status: classifyGolfIdError(fallback.error), profile: null, message: fallback.error.message };
    const fallbackRow = fallback.data?.[0] as LegacyProfileRow | undefined;
    if (!fallbackRow) return loadFallbackGolfIdProfile(username);
    return { status: 'ok', profile: mapLegacyProfileToGolfId(fallbackRow, username) };
  }

  return { status: 'ok', profile: mapLegacyProfileToGolfId(row, username) };
};

export const loadPublicGolfIdProfile = async (username: string): Promise<GolfIdLoadResult> => {
  const normalizedUsername = normalizeGolfIdUsername(username);
  if (!normalizedUsername) return { status: 'not_found', profile: null };

  let data: unknown[] | null = null;
  let error: { code?: string; message?: string } | null = null;
  try {
    const result = await withTimeout(
      supabase
        .from('golf_profiles')
        .select('*')
        .ilike('username', normalizedUsername)
        .order('updated_at', { ascending: false })
        .limit(1),
      'Golf ID profile query',
    );
    data = result.data;
    error = result.error;
  } catch (queryError) {
    const legacy = await loadLegacyGolfIdProfile(normalizedUsername).catch(() => null);
    if (legacy?.status === 'ok') return legacy;
    const fallback = await loadFallbackGolfIdProfile(normalizedUsername);
    if (fallback.status === 'ok') return fallback;
    return {
      status: legacy?.status && legacy.status !== 'not_found' ? legacy.status : 'connection_error',
      profile: null,
      message: legacy?.message || (queryError instanceof Error ? queryError.message : 'Golf ID profile query failed'),
    };
  }

  if (!error && data?.[0]) {
    const profile = data[0] as GolfIdRecord;
    return { status: 'ok', profile: { ...profile, username: normalizeGolfIdUsername(profile.username || normalizedUsername) } };
  }

  if (!error && (!data || data.length === 0)) {
    return loadLegacyGolfIdProfile(normalizedUsername);
  }

  if (isMissingGolfProfilesTableError(error)) return loadLegacyGolfIdProfile(normalizedUsername);

  const fallback = await loadFallbackGolfIdProfile(normalizedUsername);
  if (fallback.status === 'ok') return fallback;
  return { status: classifyGolfIdError(error), profile: null, message: error?.message };
};

export const loadOwnGolfIdProfile = async (userId: string): Promise<GolfIdLoadResult> => {
  if (!userId) return { status: 'not_found', profile: null };

  let data: unknown[] | null = null;
  let error: { message: string } | null = null;
  try {
    const result = await withTimeout(
      supabase
        .from('golf_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1),
      'own Golf ID profile query',
    );
    data = result.data;
    error = result.error;
  } catch {
    return loadOwnLegacyGolfIdProfile(userId);
  }

  if (!error && data?.[0]) {
    const profile = data[0] as GolfIdRecord;
    return { status: 'ok', profile: { ...profile, username: normalizeGolfIdUsername(profile.username || profile.id || 'golfer') } };
  }

  if (!error) return loadOwnLegacyGolfIdProfile(userId);
  if (isMissingGolfProfilesTableError(error)) return loadOwnLegacyGolfIdProfile(userId);
  return { status: classifyGolfIdError(error), profile: null, message: error.message };
};

export const loadOwnLegacyGolfIdProfile = async (userId: string): Promise<GolfIdLoadResult> => {
  if (!userId) return { status: 'not_found', profile: null };

  const { data, error } = await withTimeout(
    supabase
      .from('profiles')
      .select('id,name,head_speed,golf_history,current_ball,sns_links,is_public,updated_at')
      .eq('id', userId)
      .limit(1),
    'own legacy Golf ID profile query',
  ).catch(() => ({ data: null, error: { message: 'own legacy Golf ID profile query timed out' } }));

  if (error) return { status: classifyGolfIdError(error), profile: null, message: error.message };

  const row = data?.[0] as LegacyProfileRow | undefined;
  if (!row) return { status: 'not_found', profile: null };
  return { status: 'ok', profile: mapLegacyProfileToGolfId(row) };
};

export const loadPublicGolfIdProfiles = async (limit = 30): Promise<GolfIdRecord[]> => {
  const { data, error } = await withTimeout(
    supabase
      .from('golf_profiles')
      .select('id,username,nickname,best_score,target_score,head_speed,current_issue,visibility,diagnosis_result,social_links,updated_at')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(limit),
    'public Golf ID profiles query',
    PUBLIC_LIST_QUERY_TIMEOUT_MS,
  ).catch(async () => ({ data: await loadFallbackGolfIdProfiles(), error: null }));

  if (!error && data) return data as GolfIdRecord[];
  if (error && !isMissingGolfProfilesTableError(error)) throw error;

  const legacy = await withTimeout(
    supabase
      .from('profiles')
      .select('id,name,head_speed,golf_history,current_ball,sns_links,is_public,updated_at')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(limit),
    'legacy public Golf ID profiles query',
    PUBLIC_LIST_QUERY_TIMEOUT_MS,
  ).catch(async () => ({ data: await loadFallbackGolfIdProfiles(), error: null }));

  if (legacy.error) throw legacy.error;
  return ((legacy.data || []) as LegacyProfileRow[]).map((row) => mapLegacyProfileToGolfId(row));
};
