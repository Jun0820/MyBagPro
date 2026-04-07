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

export interface PublicSettingProfile {
  slug: string;
  name: string;
  type: 'Tour Pro' | 'Influencer' | 'Amateur' | 'Legend';
  tagline: string;
  summary: string;
  headSpeed: string;
  averageScore: string;
  bestScore?: string;
  style: string;
  ball: string;
  strengths: string[];
  clubs: PublicBagClub[];
  seasonYear?: number | null;
  latestSourcePolicy?: string | null;
}

interface SettingProfileRow {
  id: string;
  slug: string;
  display_name: string;
  profile_type: 'tour_pro' | 'influencer' | 'amateur' | 'legend';
  season_year: number | null;
  head_speed_mps: number | null;
  average_score: number | null;
  best_score: number | null;
  ball_name: string | null;
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

const MIN_PUBLISHED_CLUBS = 14;

const typeLabelMap: Record<SettingProfileRow['profile_type'], PublicSettingProfile['type']> = {
  tour_pro: 'Tour Pro',
  influencer: 'Influencer',
  amateur: 'Amateur',
  legend: 'Legend',
};

const formatHeadSpeed = (value: number | null) => (value ? `${value.toFixed(1)} m/s` : '未公開');
const formatAverageScore = (value: number | null) => (value ? `${value}` : '未公開');
const formatBestScore = (value: number | null) => (value ? `${value}` : undefined);

const inferTagline = (strengths: string[], type: PublicSettingProfile['type']) => {
  if (strengths.length > 0) {
    return `${strengths.slice(0, 2).join('・')}が際立つ${type === 'Influencer' ? '発信者' : '注目'}セッティング`;
  }
  return '2026シーズン基準で追っていく掲載プロフィール';
};

const inferStyle = (strengths: string[]) => strengths[0] || '最新セッティング';

const buildProfiles = (profiles: SettingProfileRow[], bagItems: BagItemRow[]): PublicSettingProfile[] =>
  profiles.map((profile) => {
    const clubs = bagItems
      .filter((item) => item.profile_id === profile.id)
      .sort((a, b) => a.slot_order - b.slot_order)
      .map((item) => ({
        category: item.category,
        brand: item.brand || undefined,
        model: item.model_name,
        specLabel: item.spec_label || undefined,
        loft: item.loft_label || undefined,
        shaftBrand: item.shaft_brand || undefined,
        shaftModel: item.shaft_model || undefined,
        shaftFlex: item.shaft_flex || undefined,
        carryDistance: item.carry_distance,
        totalDistance: item.total_distance,
      }));

    const strengths = [profile.feature_1, profile.feature_2, profile.feature_3].filter(Boolean) as string[];
    const type = typeLabelMap[profile.profile_type];

    return {
      slug: profile.slug,
      name: profile.display_name,
      type,
      tagline: inferTagline(strengths, type),
      summary: profile.summary || '2026シーズン基準で確認していく掲載用プロフィールです。',
      headSpeed: formatHeadSpeed(profile.head_speed_mps),
      averageScore: formatAverageScore(profile.average_score),
      bestScore: formatBestScore(profile.best_score),
      style: inferStyle(strengths),
      ball: profile.ball_name || '未公開',
      strengths: strengths.length > 0 ? strengths : ['確認中'],
      clubs,
      seasonYear: profile.season_year,
      latestSourcePolicy: profile.latest_source_policy,
    };
  });

export const fetchPublishedSettingProfiles = async (): Promise<PublicSettingProfile[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const { data: profiles, error } = await supabase
      .from('setting_profiles')
      .select('id, slug, display_name, profile_type, season_year, head_speed_mps, average_score, best_score, ball_name, feature_1, feature_2, feature_3, summary, latest_source_policy, is_featured')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('season_year', { ascending: false })
      .limit(30);

    if (error || !profiles || profiles.length === 0) return [];

    const profileIds = profiles.map((profile) => profile.id);
    const { data: bagItems } = await supabase
      .from('setting_bag_items')
      .select('profile_id, category, brand, model_name, spec_label, loft_label, shaft_brand, shaft_model, shaft_flex, carry_distance, total_distance, slot_order')
      .in('profile_id', profileIds)
      .order('slot_order', { ascending: true });

    const bagRows = (bagItems || []) as BagItemRow[];
    const completeProfileIds = profileIds.filter((profileId) =>
      bagRows.filter((item) => item.profile_id === profileId).length >= MIN_PUBLISHED_CLUBS
    );

    return buildProfiles(
      (profiles as SettingProfileRow[]).filter((profile) => completeProfileIds.includes(profile.id)),
      bagRows
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
      .select('id, slug, display_name, profile_type, season_year, head_speed_mps, average_score, best_score, ball_name, feature_1, feature_2, feature_3, summary, latest_source_policy, is_featured')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error || !profile) return null;

    const { data: bagItems } = await supabase
      .from('setting_bag_items')
      .select('profile_id, category, brand, model_name, spec_label, loft_label, shaft_brand, shaft_model, shaft_flex, carry_distance, total_distance, slot_order')
      .eq('profile_id', profile.id)
      .order('slot_order', { ascending: true });

    const bagRows = (bagItems || []) as BagItemRow[];
    if (bagRows.length < MIN_PUBLISHED_CLUBS) return null;

    return buildProfiles([profile as SettingProfileRow], bagRows)[0] ?? null;
  } catch (error) {
    console.error('Failed to fetch setting profile by slug:', error);
    return null;
  }
};
