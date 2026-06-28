import { isSupabaseConfigured, supabase } from './supabase';

export type ClubCategory = 'driver' | 'fairway_wood' | 'utility' | 'iron' | 'wedge' | 'putter' | 'ball';

export type ClubBrand = {
  id: string;
  name: string;
  slug: string;
  country?: string | null;
  official_url?: string | null;
};

export type ClubImage = {
  id: string;
  club_model_id: string;
  image_url?: string | null;
  storage_path?: string | null;
  source_url?: string | null;
  source_type?: string | null;
  license_status: 'unknown' | 'permitted' | 'affiliate_allowed' | 'own' | 'licensed' | 'prohibited';
  credit?: string | null;
  copyright_notice?: string | null;
  is_primary: boolean;
  is_verified: boolean;
  verified_at?: string | null;
};

export type ClubModel = {
  id: string;
  brand_id: string;
  model_name: string;
  slug: string;
  category: ClubCategory;
  release_year?: number | null;
  end_year?: number | null;
  generation?: string | null;
  official_url?: string | null;
  description?: string | null;
  specs?: Record<string, unknown> | null;
  aliases?: string[] | null;
  is_verified: boolean;
  club_brands?: ClubBrand | null;
  club_images?: ClubImage[] | null;
};

export const categoryLabels: Record<ClubCategory, string> = {
  driver: 'ドライバー',
  fairway_wood: 'フェアウェイウッド',
  utility: 'ユーティリティ',
  iron: 'アイアン',
  wedge: 'ウェッジ',
  putter: 'パター',
  ball: 'ボール',
};

export const permittedImageLicenses = new Set(['permitted', 'affiliate_allowed', 'own', 'licensed']);

export const getPrimaryClubImage = (model: ClubModel) => {
  const images = model.club_images || [];
  return (
    images.find((image) => image.is_primary && image.is_verified && permittedImageLicenses.has(image.license_status)) ||
    images.find((image) => image.is_verified && permittedImageLicenses.has(image.license_status)) ||
    null
  );
};

export const clubImageAlt = (model: ClubModel) => {
  const brandName = model.club_brands?.name || '';
  const category = categoryLabels[model.category] || model.category;
  const year = model.release_year ? `${model.release_year}年モデル` : 'モデル';
  return `${brandName} ${model.model_name} ${category} ${year}`.trim();
};

export const loadClubBrands = async (): Promise<ClubBrand[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('club_brands').select('id,name,slug,country,official_url').order('name', { ascending: true });
  if (error) throw error;
  return (data || []) as ClubBrand[];
};

export const loadClubModels = async (options: { category?: string; brandId?: string; releaseYear?: string; onlyUnverified?: boolean; missingImages?: boolean } = {}) => {
  if (!isSupabaseConfigured) return [] as ClubModel[];

  let query = supabase
    .from('club_models')
    .select('*,club_brands(id,name,slug,country,official_url),club_images(*)')
    .order('release_year', { ascending: false })
    .order('model_name', { ascending: true });

  if (options.category) query = query.eq('category', options.category);
  if (options.brandId) query = query.eq('brand_id', options.brandId);
  if (options.releaseYear) query = query.eq('release_year', Number(options.releaseYear));
  if (options.onlyUnverified) query = query.eq('is_verified', false);

  const { data, error } = await query.limit(120);
  if (error) throw error;

  const models = (data || []) as ClubModel[];
  if (options.missingImages) return models.filter((model) => !getPrimaryClubImage(model));
  return models;
};

export const slugifyClub = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

