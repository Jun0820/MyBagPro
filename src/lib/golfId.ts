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

export type GolfIdSocialLinkKey = 'youtube' | 'instagram' | 'tiktok' | 'x';

export type GolfIdSocialLinks = Partial<Record<GolfIdSocialLinkKey, string>> & {
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
};

export interface GolfIdFormData {
  username: string;
  nickname: string;
  bio: string;
  avatar_url: string;
  cover_image_url: string;
  best_score: string;
  best_score_ladies: string;
  best_score_back: string;
  best_score_champion: string;
  average_score: string;
  target_score: string;
  head_speed: string;
  golf_history: string;
  frequent_area: string;
  home_course: string;
  role_title: string;
  favorite_club: string;
  weak_club: string;
  current_issue: string;
  club_setting: string;
  social_links: GolfIdSocialLinks;
  visibility: GolfIdVisibility;
}

export interface GolfIdRecord {
  id: string;
  user_id?: string | null;
  username: string;
  nickname: string;
  bio?: string | null;
  avatar_url?: string | null;
  cover_image_url?: string | null;
  best_score?: number | null;
  best_scores?: {
    ladies?: number | null;
    regular?: number | null;
    back?: number | null;
    champion?: number | null;
  } | null;
  average_score?: number | null;
  target_score?: number | null;
  head_speed?: number | null;
  golf_history?: string | null;
  frequent_area?: string | null;
  home_course?: string | null;
  role_title?: string | null;
  favorite_club?: string | null;
  weak_club?: string | null;
  current_issue?: string | null;
  club_setting?: string | null;
  clubs?: Array<{
    id?: string;
    number?: string | null;
    club_label?: string | null;
    label?: string | null;
    category?: string | null;
    brand?: string | null;
    model?: string | null;
    shaft?: string | null;
    loft?: string | null;
    distance?: string | number | null;
    total_distance?: string | number | null;
    carryDistance?: string | number | null;
    carry_distance?: string | number | null;
    memo?: string | null;
  }> | null;
  social_links?: GolfIdSocialLinks | null;
  visibility?: Partial<GolfIdVisibility> | null;
  diagnosis_result?: {
    diagnosisType?: string;
    currentStatus?: string;
    priorityIssue?: string;
    nextAction?: string;
    notRecommendedNow?: string;
    practiceSuggestion?: string;
    gearSuggestion?: string;
  } | null;
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

export const emptyGolfIdSocialLinks: GolfIdSocialLinks = {
  youtube: '',
  instagram: '',
  tiktok: '',
  x: '',
  custom1: {
    label: '',
    url: '',
  },
  custom2: {
    label: '',
    url: '',
  },
};

export const normalizeGolfIdUsername = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 32);

export const isValidGolfIdUsername = (value: string) => /^[a-z0-9][a-z0-9_-]{2,31}$/.test(value);

export const toNullableNumber = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const mapRecordToGolfIdForm = (record: GolfIdRecord): GolfIdFormData => ({
  username: record.username || '',
  nickname: record.nickname || '',
  bio: record.bio || '',
  avatar_url: record.avatar_url || '',
  cover_image_url: record.cover_image_url || '',
  best_score: record.best_score ? String(record.best_score) : '',
  best_score_ladies: record.best_scores?.ladies ? String(record.best_scores.ladies) : '',
  best_score_back: record.best_scores?.back ? String(record.best_scores.back) : '',
  best_score_champion: record.best_scores?.champion ? String(record.best_scores.champion) : '',
  average_score: record.average_score ? String(record.average_score) : '',
  target_score: record.target_score ? String(record.target_score) : '',
  head_speed: record.head_speed ? String(record.head_speed) : '',
  golf_history: record.golf_history || '',
  frequent_area: record.frequent_area || '',
  home_course: record.home_course || '',
  role_title: record.role_title || '',
  favorite_club: record.favorite_club || '',
  weak_club: record.weak_club || '',
  current_issue: record.current_issue || '',
  club_setting: record.club_setting || '',
  social_links: {
    ...emptyGolfIdSocialLinks,
    ...(record.social_links || {}),
    custom1: {
      ...emptyGolfIdSocialLinks.custom1,
      ...(record.social_links?.custom1 || {}),
    },
    custom2: {
      ...emptyGolfIdSocialLinks.custom2,
      ...(record.social_links?.custom2 || {}),
    },
  },
  visibility: {
    ...defaultGolfIdVisibility,
    ...(record.visibility || {}),
  },
});
