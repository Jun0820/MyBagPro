export type GolfIdVisibilityKey =
  | 'best_score'
  | 'average_score'
  | 'target_score'
  | 'head_speed'
  | 'golf_history'
  | 'favorite_club'
  | 'weak_club'
  | 'club_setting'
  | 'current_issue';

export type GolfIdVisibility = Record<GolfIdVisibilityKey, boolean>;

export interface GolfIdFormData {
  username: string;
  nickname: string;
  best_score: string;
  average_score: string;
  target_score: string;
  head_speed: string;
  golf_history: string;
  favorite_club: string;
  weak_club: string;
  current_issue: string;
  club_setting: string;
  visibility: GolfIdVisibility;
}

export interface GolfIdRecord {
  id: string;
  user_id?: string | null;
  username: string;
  nickname: string;
  best_score?: number | null;
  average_score?: number | null;
  target_score?: number | null;
  head_speed?: number | null;
  golf_history?: string | null;
  favorite_club?: string | null;
  weak_club?: string | null;
  current_issue?: string | null;
  club_setting?: string | null;
  visibility?: Partial<GolfIdVisibility> | null;
  is_public?: boolean | null;
  updated_at?: string | null;
}

export const defaultGolfIdVisibility: GolfIdVisibility = {
  best_score: true,
  average_score: true,
  target_score: true,
  head_speed: true,
  golf_history: true,
  favorite_club: true,
  weak_club: true,
  club_setting: true,
  current_issue: true,
};

export const normalizeGolfIdUsername = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 32);

export const isValidGolfIdUsername = (value: string) => /^[a-z0-9][a-z0-9_.-]{2,31}$/.test(value);

export const toNullableNumber = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const mapRecordToGolfIdForm = (record: GolfIdRecord): GolfIdFormData => ({
  username: record.username || '',
  nickname: record.nickname || '',
  best_score: record.best_score ? String(record.best_score) : '',
  average_score: record.average_score ? String(record.average_score) : '',
  target_score: record.target_score ? String(record.target_score) : '',
  head_speed: record.head_speed ? String(record.head_speed) : '',
  golf_history: record.golf_history || '',
  favorite_club: record.favorite_club || '',
  weak_club: record.weak_club || '',
  current_issue: record.current_issue || '',
  club_setting: record.club_setting || '',
  visibility: {
    ...defaultGolfIdVisibility,
    ...(record.visibility || {}),
  },
});
