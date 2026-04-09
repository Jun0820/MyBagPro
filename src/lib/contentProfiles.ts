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

const MIN_PUBLISHED_CLUBS = 14;
const PROFILE_LIST_FETCH_LIMIT = 500;

const typeLabelMap: Record<SettingProfileRow['profile_type'], PublicSettingProfile['type']> = {
  tour_pro: 'Tour Pro',
  influencer: 'Influencer',
  amateur: 'Amateur',
  legend: 'Legend',
};

const formatHeadSpeed = (value: number | null) => (value ? `${value.toFixed(1)} m/s` : '未公開');
const formatAverageScore = (value: number | null) => (value ? `${value}` : '未公開');
const formatBestScore = (value: number | null) => (value ? `${value}` : undefined);
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
      }));

    const strengths = [profile.feature_1, profile.feature_2, profile.feature_3].filter(Boolean) as string[];
    const type = typeLabelMap[profile.profile_type];
    const metadata = getProfileMetadata(profile.slug);
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
      kanaName: profile.kana_name || undefined,
      type,
      category: metadata.category,
      categoryLabel: metadata.categoryLabel,
      contractStatus: metadata.contractStatus,
      contractLabel: metadata.contractLabel,
      contractMaker: metadata.contractMaker,
      contractDisplay:
        metadata.contractStatus === 'club_contract'
          ? metadata.contractMaker || '契約メーカー確認中'
          : metadata.contractLabel,
      tagline: inferTagline(strengths, type),
      summary: profile.summary || '2026シーズン基準で確認していく掲載用プロフィールです。',
      birthDate: profile.birth_date,
      age: getAge(profile.birth_date),
      genderLabel: getGenderLabel(metadata.category),
      birthplace: profile.birthplace,
      nationality: profile.nationality,
      headSpeed: formatHeadSpeed(profile.head_speed_mps),
      averageScore: formatAverageScore(profile.average_score),
      bestScore: formatBestScore(profile.best_score),
      style: inferStyle(strengths),
      ball: profile.ball_name || '未公開',
      strengths: strengths.length > 0 ? strengths : ['確認中'],
      clubs,
      youtubeChannel: profile.youtube_channel || undefined,
      instagramHandle: profile.instagram_handle || undefined,
      xHandle: profile.x_handle || undefined,
      websiteUrl: profile.website_url || undefined,
      sources,
      seasonYear: profile.season_year,
      latestSourcePolicy: profile.latest_source_policy,
    };
  });

export const fetchPublishedSettingProfiles = async (): Promise<PublicSettingProfile[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const { data: profiles, error } = await supabase
      .from('setting_profiles')
      .select('id, slug, display_name, kana_name, birth_date, birthplace, nationality, profile_type, season_year, head_speed_mps, average_score, best_score, ball_name, youtube_channel, instagram_handle, x_handle, website_url, feature_1, feature_2, feature_3, summary, latest_source_policy, is_featured')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('season_year', { ascending: false })
      .limit(PROFILE_LIST_FETCH_LIMIT);

    if (error || !profiles || profiles.length === 0) return [];

    const profileIds = profiles.map((profile) => profile.id);
    const { data: bagItems } = await supabase
      .from('setting_bag_items')
      .select('profile_id, category, brand, model_name, spec_label, loft_label, shaft_brand, shaft_model, shaft_flex, carry_distance, total_distance, slot_order')
      .in('profile_id', profileIds)
      .order('slot_order', { ascending: true });

    const { data: sources } = await supabase
      .from('content_sources')
      .select('profile_id, source_type, source_url, source_title, checked_at, notes')
      .in('profile_id', profileIds)
      .order('checked_at', { ascending: false });

    const bagRows = (bagItems || []) as BagItemRow[];
    const sourceRows = (sources || []) as SourceRow[];
    const completeProfileIds = profileIds.filter((profileId) =>
      bagRows.filter((item) => item.profile_id === profileId).length >= MIN_PUBLISHED_CLUBS
    );

    return buildProfiles(
      (profiles as SettingProfileRow[]).filter((profile) => completeProfileIds.includes(profile.id)),
      bagRows,
      sourceRows
    );
  } catch (error) {
    console.error('Failed to fetch published setting profiles:', error);
    return [];
  }
};

export const fetchPublishedSettingProfileBySlug = async (slug: string): Promise<PublicSettingProfile | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: profile, error } = await supabase
      .from('setting_profiles')
      .select('id, slug, display_name, kana_name, birth_date, birthplace, nationality, profile_type, season_year, head_speed_mps, average_score, best_score, ball_name, youtube_channel, instagram_handle, x_handle, website_url, feature_1, feature_2, feature_3, summary, latest_source_policy, is_featured')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error || !profile) return null;

    const { data: bagItems } = await supabase
      .from('setting_bag_items')
      .select('profile_id, category, brand, model_name, spec_label, loft_label, shaft_brand, shaft_model, shaft_flex, carry_distance, total_distance, slot_order')
      .eq('profile_id', profile.id)
      .order('slot_order', { ascending: true });

    const { data: sources } = await supabase
      .from('content_sources')
      .select('profile_id, source_type, source_url, source_title, checked_at, notes')
      .eq('profile_id', profile.id)
      .order('checked_at', { ascending: false });

    const bagRows = (bagItems || []) as BagItemRow[];
    const sourceRows = (sources || []) as SourceRow[];
    if (bagRows.length < MIN_PUBLISHED_CLUBS) return null;

    return buildProfiles([profile as SettingProfileRow], bagRows, sourceRows)[0] ?? null;
  } catch (error) {
    console.error('Failed to fetch setting profile by slug:', error);
    return null;
  }
};
