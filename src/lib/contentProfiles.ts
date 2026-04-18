import { getProfileMetadata, type ContractStatus, type ProfileCategory } from './profileMetadata';
import { isSupabaseConfigured, supabase } from './supabase';

export interface PublicBagClub {
  category: string;
  model: string;
  brand?: string;
  loft?: string;
  shaftBrand?: string;
  shaftModel?: string;
  shaftFlex?: string;
  specLabel?: string;
  carryDistance?: number | null;
  totalDistance?: number | null;
  sourceNote?: string;
  productSlug?: string;
}

export interface PublicProfileSource {
  type: 'official' | 'tour_photo' | 'youtube' | 'instagram' | 'article' | 'manual';
  title: string;
  url: string;
  checkedAt?: string | null;
  notes?: string | null;
}

export interface PublicSettingProfile {
  slug: string;
  name: string;
  kanaName?: string;
  type: 'Tour Pro' | 'Influencer' | 'Amateur' | 'Legend';
  category: ProfileCategory;
  categoryLabel: string;
  contractStatus: ContractStatus;
  contractLabel: string;
  contractMaker?: string;
  contractDisplay: string;
  tagline: string;
  summary: string;
  birthDate?: string | null;
  age?: number | null;
  genderLabel: string;
  birthplace?: string | null;
  nationality?: string | null;
  headSpeedMps?: number | null;
  headSpeed: string;
  averageScore: string;
  bestScore?: string;
  style: string;
  ball: string;
  strengths: string[];
  clubs: PublicBagClub[];
  youtubeChannel?: string;
  instagramHandle?: string;
  xHandle?: string;
  websiteUrl?: string;
  sources: PublicProfileSource[];
  seasonYear?: number | null;
  latestSourcePolicy?: string | null;
}

interface SettingProfileRow {
  id: string;
  slug: string;
  display_name: string;
  kana_name: string | null;
  birth_date: string | null;
  birthplace: string | null;
  nationality: string | null;
  profile_type: 'tour_pro' | 'influencer' | 'amateur' | 'legend';
  season_year: number | null;
  head_speed_mps: number | null;
  average_score: number | null;
  best_score: number | null;
  ball_name: string | null;
  youtube_channel: string | null;
  instagram_handle: string | null;
  x_handle: string | null;
  website_url: string | null;
  feature_1: string | null;
  feature_2: string | null;
  feature_3: string | null;
  summary: string | null;
  latest_source_policy: string | null;
  is_featured: boolean;
  display_order?: number | null;
  category?: ProfileCategory | null;
  contractStatus?: ContractStatus | null;
  contractMaker?: string | null;
}

interface BagItemRow {
  profile_id: string;
  category: string;
  brand: string | null;
  model_name: string;
  spec_label: string | null;
  loft_label: string | null;
  shaft_brand: string | null;
  shaft_model: string | null;
  shaft_flex: string | null;
  carry_distance: number | null;
  total_distance: number | null;
  source_note?: string | null;
  product_id?: string | null;
  slot_order: number;
}

interface SourceRow {
  profile_id: string;
  source_type: PublicProfileSource['type'];
  source_url: string | null;
  source_title: string | null;
  checked_at: string | null;
  notes: string | null;
}

interface SeedProfilePackage {
  profile: {
    slug: string;
    display_name?: string;
    kana_name?: string | null;
    birth_date?: string | null;
    birthplace?: string | null;
    nationality?: string | null;
    profile_type?: SettingProfileRow['profile_type'];
    season_year?: number | null;
    head_speed_mps?: number | null;
    average_score?: number | null;
    best_score?: number | null;
    ball_name?: string | null;
    youtube_channel?: string | null;
    instagram_handle?: string | null;
    x_handle?: string | null;
    website_url?: string | null;
    feature_1?: string | null;
    feature_2?: string | null;
    feature_3?: string | null;
    summary?: string | null;
    latest_source_policy?: string | null;
    is_featured?: boolean;
    display_order?: number | null;
    category?: ProfileCategory | null;
    contractStatus?: ContractStatus | null;
    contractMaker?: string | null;
    is_published?: boolean;
  };
  bagItems?: Array<{
    category: string;
    brand?: string | null;
    model_name?: string;
    spec_label?: string | null;
    loft_label?: string | null;
    shaft_brand?: string | null;
    shaft_model?: string | null;
    shaft_flex?: string | null;
    carry_distance?: number | null;
    total_distance?: number | null;
    source_note?: string | null;
    slot_order?: number;
  }>;
  bag_items?: Array<{
    category: string;
    brand?: string | null;
    model_name?: string;
    spec_label?: string | null;
    loft_label?: string | null;
    shaft_brand?: string | null;
    shaft_model?: string | null;
    shaft_flex?: string | null;
    carry_distance?: number | null;
    total_distance?: number | null;
    source_note?: string | null;
    slot_order?: number;
  }>;
  sources?: Array<{
    source_type?: PublicProfileSource['type'];
    source_url?: string | null;
    source_title?: string | null;
    checked_at?: string | null;
    notes?: string | null;
  }>;
}

const FALLBACK_PROFILES_PATH = '/published-profiles-fallback.json';
let fallbackProfilesPromise: Promise<PublicSettingProfile[]> | null = null;

const PROFILE_LIST_FETCH_LIMIT = 500;
const SUPABASE_PAGE_SIZE = 1000;
const PLACEHOLDER_VALUES = new Set(['-', '－', '—', '未公開']);

const typeLabelMap: Record<SettingProfileRow['profile_type'], PublicSettingProfile['type']> = {
  tour_pro: 'Tour Pro',
  influencer: 'Influencer',
  amateur: 'Amateur',
  legend: 'Legend',
};

const formatHeadSpeed = (value: number | null) => (value ? `${value.toFixed(1)} m/s` : '未公開');
const formatAverageScore = (value: number | null) => (value ? `${value}` : '未公開');
const formatBestScore = (value: number | null) => (value ? `${value}` : undefined);
const normalizeOptionalText = (value: string | null | undefined) => {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized || PLACEHOLDER_VALUES.has(normalized)) return undefined;
  return normalized;
};
const getAge = (value: string | null) => {
  if (!value) return null;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthday) age -= 1;
  return age;
};
const getGenderLabel = (category: ProfileCategory) => {
  if (category === 'japan_women' || category === 'overseas_women') return '女性';
  if (category === 'japan_men' || category === 'overseas_men') return '男性';
  return '不明';
};
const formatLoftLabel = (value: string | null) => {
  if (!value) return undefined;

  return value
    .replace(/\s*degrees?\b/gi, '°')
    .replace(/\s*degree\b/gi, '°')
    .replace(/\s+plus\b/gi, '°+')
    .replace(/°\s+\+/g, '°+')
    .trim();
};

const inferTagline = (strengths: string[], type: PublicSettingProfile['type']) => {
  if (strengths.length > 0) {
    return `${strengths.slice(0, 2).join('・')}が際立つ${type === 'Influencer' ? '発信者' : '注目'}セッティング`;
  }
  return '2026シーズン基準で追っていく掲載プロフィール';
};

const inferStyle = (strengths: string[]) => strengths[0] || '最新セッティング';

const buildProfiles = (
  profiles: SettingProfileRow[],
  bagItems: BagItemRow[],
  sourceRows: SourceRow[]
): PublicSettingProfile[] =>
  profiles.map((profile) => {
    const clubs = bagItems
      .filter((item) => item.profile_id === profile.id)
      .sort((a, b) => a.slot_order - b.slot_order)
      .map((item) => ({
        category: item.category,
        brand: item.brand || undefined,
        model: item.model_name,
        specLabel: item.spec_label || undefined,
        loft: formatLoftLabel(item.loft_label),
        shaftBrand: item.shaft_brand || undefined,
        shaftModel: item.shaft_model || undefined,
        shaftFlex: item.shaft_flex || undefined,
        carryDistance: item.carry_distance,
        totalDistance: item.total_distance,
        sourceNote: normalizeOptionalText(item.source_note),
      }));

    const strengths = [profile.feature_1, profile.feature_2, profile.feature_3].filter(Boolean) as string[];
    const type = typeLabelMap[profile.profile_type];
    const fallbackMetadata = getProfileMetadata(profile.slug);
    const category = profile.category || fallbackMetadata.category;
    const contractStatus = profile.contractStatus || fallbackMetadata.contractStatus;
    const contractMaker = normalizeOptionalText(profile.contractMaker) || fallbackMetadata.contractMaker;
    const categoryLabelMap: Record<ProfileCategory, string> = {
      japan_men: '日本男子',
      japan_women: '日本女子',
      overseas_men: '海外男子',
      overseas_women: '海外女子',
      influencer: 'インフルエンサー',
      lesson_pro: 'レッスンプロ',
    };
    const contractLabelMap: Record<ContractStatus, string> = {
      club_contract: 'クラブ契約プロ',
      free_contract: '契約フリー',
      checking: '契約情報確認中',
    };
    const sources = sourceRows
      .filter((source) => source.profile_id === profile.id && source.source_url)
      .map((source) => ({
        type: source.source_type,
        title: source.source_title || '確認ソース',
        url: source.source_url as string,
        checkedAt: source.checked_at,
        notes: source.notes,
      }));

    return {
      slug: profile.slug,
      name: profile.display_name,
      kanaName: normalizeOptionalText(profile.kana_name),
      type,
      category,
      categoryLabel: categoryLabelMap[category],
      contractStatus,
      contractLabel: contractLabelMap[contractStatus],
      contractMaker,
      contractDisplay:
        contractStatus === 'club_contract'
          ? contractMaker || '契約メーカー確認中'
          : contractLabelMap[contractStatus],
      tagline: inferTagline(strengths, type),
      summary: profile.summary || '2026シーズン基準で確認していく掲載用プロフィールです。',
      birthDate: normalizeOptionalText(profile.birth_date) || null,
      age: getAge(profile.birth_date),
      genderLabel: getGenderLabel(category),
      birthplace: normalizeOptionalText(profile.birthplace) || null,
      nationality: profile.nationality,
      headSpeedMps: profile.head_speed_mps,
      headSpeed: formatHeadSpeed(profile.head_speed_mps),
      averageScore: formatAverageScore(profile.average_score),
      bestScore: formatBestScore(profile.best_score),
      style: inferStyle(strengths),
      ball: profile.ball_name || '未公開',
      strengths: strengths.length > 0 ? strengths : ['確認中'],
      clubs,
      youtubeChannel: normalizeOptionalText(profile.youtube_channel),
      instagramHandle: normalizeOptionalText(profile.instagram_handle),
      xHandle: normalizeOptionalText(profile.x_handle),
      websiteUrl: normalizeOptionalText(profile.website_url),
      sources,
      seasonYear: profile.season_year,
      latestSourcePolicy: profile.latest_source_policy,
    };
  });

const buildProfilesFromSeedPackages = (packages: SeedProfilePackage[]): PublicSettingProfile[] => {
  const profiles: SettingProfileRow[] = [];
  const bagItems: BagItemRow[] = [];
  const sourceRows: SourceRow[] = [];

  packages.forEach((entry) => {
    const profile = entry.profile;
    if (!profile?.slug || profile.is_published === false) return;

    const profileId = profile.slug;
    profiles.push({
      id: profileId,
      slug: profile.slug,
      display_name: profile.display_name || profile.slug,
      kana_name: profile.kana_name || null,
      birth_date: profile.birth_date || null,
      birthplace: profile.birthplace || null,
      nationality: profile.nationality || null,
      profile_type: profile.profile_type || 'tour_pro',
      season_year: profile.season_year ?? null,
      head_speed_mps: profile.head_speed_mps ?? null,
      average_score: profile.average_score ?? null,
      best_score: profile.best_score ?? null,
      ball_name: profile.ball_name || null,
      youtube_channel: profile.youtube_channel || null,
      instagram_handle: profile.instagram_handle || null,
      x_handle: profile.x_handle || null,
      website_url: profile.website_url || null,
      feature_1: profile.feature_1 || null,
      feature_2: profile.feature_2 || null,
      feature_3: profile.feature_3 || null,
      summary: profile.summary || null,
      latest_source_policy: profile.latest_source_policy || null,
      is_featured: profile.is_featured ?? false,
      display_order: profile.display_order ?? null,
      category: profile.category ?? null,
      contractStatus: profile.contractStatus ?? null,
      contractMaker: profile.contractMaker ?? null,
    });

    (entry.bagItems || entry.bag_items || []).forEach((item, index) => {
      if (!item.category || !item.model_name) return;
      bagItems.push({
        profile_id: profileId,
        category: item.category,
        brand: item.brand || null,
        model_name: item.model_name,
        spec_label: item.spec_label || null,
        loft_label: item.loft_label || null,
        shaft_brand: item.shaft_brand || null,
        shaft_model: item.shaft_model || null,
        shaft_flex: item.shaft_flex || null,
        carry_distance: item.carry_distance ?? null,
        total_distance: item.total_distance ?? null,
        source_note: item.source_note || null,
        slot_order: item.slot_order ?? index + 1,
      });
    });

    (entry.sources || []).forEach((source) => {
      if (!source.source_url) return;
      sourceRows.push({
        profile_id: profileId,
        source_type: source.source_type || 'manual',
        source_url: source.source_url,
        source_title: source.source_title || '確認ソース',
        checked_at: source.checked_at || null,
        notes: source.notes || null,
      });
    });
  });

  return buildProfiles(profiles, bagItems, sourceRows);
};

const loadPublishedProfileFallback = async (): Promise<PublicSettingProfile[]> => {
  if (fallbackProfilesPromise) return fallbackProfilesPromise;

  fallbackProfilesPromise = (async () => {
    if (typeof fetch !== 'function') return [];

    try {
      const response = await fetch(FALLBACK_PROFILES_PATH, { cache: 'force-cache' });
      if (!response.ok) return [];

      const payload = (await response.json()) as { profiles?: SeedProfilePackage[] };
      if (!payload.profiles?.length) return [];

      return buildProfilesFromSeedPackages(payload.profiles);
    } catch (error) {
      console.error('Failed to load published profile fallback:', error);
      return [];
    }
  })();

  return fallbackProfilesPromise;
};

async function fetchAllSupabaseRows<T>(
  queryFactory: (from: number, to: number) => { then: (onfulfilled?: (value: { data: T[] | null; error: unknown }) => unknown, onrejected?: (reason: unknown) => unknown) => unknown }
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1;
    const { data, error } = await queryFactory(from, to);
    if (error) throw error;

    const chunk = (data || []) as T[];
    rows.push(...chunk);

    if (chunk.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }

  return rows;
}

export const fetchPublishedSettingProfiles = async (): Promise<PublicSettingProfile[]> => {
  const fallbackProfiles = await loadPublishedProfileFallback();
  if (fallbackProfiles.length > 0) return fallbackProfiles;
  if (!isSupabaseConfigured) return [];

  try {
    const { data: profiles, error } = await supabase
      .from('setting_profiles')
      .select('*')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('season_year', { ascending: false })
      .limit(PROFILE_LIST_FETCH_LIMIT);

    if (error || !profiles || profiles.length === 0) return [];

    const profileIds = profiles.map((profile) => profile.id);
    const [bagRows, sourceRows] = await Promise.all([
      fetchAllSupabaseRows<BagItemRow>((from, to) =>
        supabase
          .from('setting_bag_items')
          .select('profile_id, category, brand, model_name, spec_label, loft_label, shaft_brand, shaft_model, shaft_flex, carry_distance, total_distance, source_note, slot_order')
          .in('profile_id', profileIds)
          .order('profile_id', { ascending: true })
          .order('slot_order', { ascending: true })
          .range(from, to)
      ),
      fetchAllSupabaseRows<SourceRow>((from, to) =>
        supabase
          .from('content_sources')
          .select('profile_id, source_type, source_url, source_title, checked_at, notes')
          .in('profile_id', profileIds)
          .order('profile_id', { ascending: true })
          .order('checked_at', { ascending: false })
          .range(from, to)
      ),
    ]);

    return buildProfiles(profiles as SettingProfileRow[], bagRows, sourceRows);
  } catch (error) {
    console.error('Failed to fetch published setting profiles:', error);
    return [];
  }
};

export const fetchPublishedSettingProfileBySlug = async (slug: string): Promise<PublicSettingProfile | null> => {
  const fallbackProfiles = await loadPublishedProfileFallback();
  const fallbackMatch = fallbackProfiles.find((profile) => profile.slug === slug) || null;
  if (fallbackMatch) return fallbackMatch;
  if (!isSupabaseConfigured) return null;

  try {
    const { data: profile, error } = await supabase
      .from('setting_profiles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error || !profile) return null;

    const { data: bagItems } = await supabase
      .from('setting_bag_items')
      .select('profile_id, category, brand, model_name, spec_label, loft_label, shaft_brand, shaft_model, shaft_flex, carry_distance, total_distance, source_note, slot_order')
      .eq('profile_id', profile.id)
      .order('slot_order', { ascending: true });

    const { data: sources } = await supabase
      .from('content_sources')
      .select('profile_id, source_type, source_url, source_title, checked_at, notes')
      .eq('profile_id', profile.id)
      .order('checked_at', { ascending: false });

    const bagRows = (bagItems || []) as BagItemRow[];
    const sourceRows = (sources || []) as SourceRow[];

    return buildProfiles([profile as SettingProfileRow], bagRows, sourceRows)[0] ?? null;
  } catch (error) {
    console.error('Failed to fetch setting profile by slug:', error);
    return null;
  }
};
