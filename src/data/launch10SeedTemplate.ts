import { editorialPolicy } from './editorialPolicy';

const slugifyJaName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[()（）]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const launch10SeedTemplate = editorialPolicy.launch10.map((name, index) => ({
  seed_order: index + 1,
  display_name: name,
  slug: slugifyJaName(name),
  profile_type: index < 9 ? 'tour_pro' : 'influencer',
  season_year: 2026,
  latest_source_policy: '2026_season',
  is_featured: true,
  is_published: false,
  average_score: null,
  head_speed_mps: null,
  best_score: null,
  current_ball: null,
  notes: '2026シーズン基準を最優先。情報未確認項目は空欄のまま保持。',
}));
