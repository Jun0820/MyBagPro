import { supabase } from './supabase';
import {
  defaultGolfIdVisibility,
  normalizeGolfIdUsername,
  type GolfIdRecord,
} from './golfId';

export type GolfIdLoadStatus = 'ok' | 'not_found' | 'connection_error' | 'permission_error' | 'table_missing' | 'render_error';

export type GolfIdLoadResult = {
  status: GolfIdLoadStatus;
  profile: GolfIdRecord | null;
  message?: string;
};

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

export const mapLegacyProfileToGolfId = (row: LegacyProfileRow, requestedUsername?: string): GolfIdRecord => {
  const username = normalizeGolfIdUsername(requestedUsername || row.name || row.id || 'golfer');
  const snapshot = row.sns_links?.bagSnapshot;
  const stats = snapshot?.profileStats || {};
  const clubs = (snapshot?.clubs || []).map(formatClubLine).filter(Boolean);

  return {
    id: row.id || username,
    username,
    nickname: row.name?.trim() || username,
    best_score: toNumberOrNull(stats.bestScore),
    average_score: toNumberOrNull(stats.averageScore),
    target_score: null,
    head_speed: toNumberOrNull(row.head_speed),
    golf_history: row.golf_history || null,
    favorite_club: null,
    weak_club: null,
    current_issue: null,
    club_setting: clubs.join('\n'),
    visibility: defaultGolfIdVisibility,
    diagnosis_result: {
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
  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,head_speed,golf_history,current_ball,sns_links,is_public,updated_at,created_at')
    .ilike('name', username)
    .eq('is_public', true)
    .limit(1);

  if (error) {
    return { status: classifyGolfIdError(error), profile: null, message: error.message };
  }

  const row = data?.[0] as LegacyProfileRow | undefined;
  if (!row) return { status: 'not_found', profile: null };

  return { status: 'ok', profile: mapLegacyProfileToGolfId(row, username) };
};

export const loadPublicGolfIdProfile = async (username: string): Promise<GolfIdLoadResult> => {
  const normalizedUsername = normalizeGolfIdUsername(username);

  const { data, error } = await supabase
    .from('golf_profiles')
    .select('*')
    .eq('username', normalizedUsername)
    .maybeSingle();

  if (!error && data) return { status: 'ok', profile: data as GolfIdRecord };

  if (!error && !data) {
    const fallback = await supabase
      .from('golf_profiles')
      .select('*')
      .ilike('username', normalizedUsername)
      .maybeSingle();

    if (!fallback.error && fallback.data) return { status: 'ok', profile: fallback.data as GolfIdRecord };
    if (fallback.error && !isMissingGolfProfilesTableError(fallback.error)) {
      return { status: classifyGolfIdError(fallback.error), profile: null, message: fallback.error.message };
    }

    return loadLegacyGolfIdProfile(normalizedUsername);
  }

  if (isMissingGolfProfilesTableError(error)) return loadLegacyGolfIdProfile(normalizedUsername);

  return { status: classifyGolfIdError(error), profile: null, message: error?.message };
};

export const loadPublicGolfIdProfiles = async (limit = 30): Promise<GolfIdRecord[]> => {
  const { data, error } = await supabase
    .from('golf_profiles')
    .select('id,username,nickname,best_score,target_score,head_speed,current_issue,visibility,diagnosis_result,updated_at')
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (!error && data) return data as GolfIdRecord[];
  if (error && !isMissingGolfProfilesTableError(error)) throw error;

  const legacy = await supabase
    .from('profiles')
    .select('id,name,head_speed,golf_history,current_ball,sns_links,is_public,updated_at,created_at')
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (legacy.error) throw legacy.error;
  return ((legacy.data || []) as LegacyProfileRow[]).map((row) => mapLegacyProfileToGolfId(row));
};
