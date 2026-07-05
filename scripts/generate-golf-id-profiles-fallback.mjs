import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const projectRoot = process.cwd();

function loadEnv(filename) {
  const filepath = path.join(projectRoot, filename);
  if (!fs.existsSync(filepath)) return {};
  const entries = {};
  for (const line of fs.readFileSync(filepath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eqIndex = trimmed.indexOf('=');
    entries[trimmed.slice(0, eqIndex).trim()] = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return entries;
}

const baseEnv = loadEnv('.env');
const localEnv = loadEnv('.env.local');
const supabaseUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL || baseEnv.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || localEnv.VITE_SUPABASE_ANON_KEY || baseEnv.VITE_SUPABASE_ANON_KEY;
const outputPath = path.join(projectRoot, 'public', 'golf-id-profiles-fallback.json');

const normalizeUsername = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 32);

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeSocialUrl = (value, baseUrl, handlePrefix = '') => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  const handle = text.replace(/^@+/, '').replace(/^\/+/, '');
  return `${baseUrl}${handlePrefix}${handle}`;
};

const mapClubLine = (club) => {
  const head = [club?.number, club?.brand, club?.model].filter(Boolean).join(' ');
  const shaft = club?.shaft ? ` / ${club.shaft}` : '';
  const distance = club?.distance ? ` / ${club.distance}y` : '';
  return `${head}${shaft}${distance}`.trim();
};

const defaultDiagnosis = (currentBall) => ({
  diagnosisType: 'クラブ見直しタイプ',
  currentStatus: '登録済みのクラブ、スコア、ヘッドスピードをもとに現在地を整理できます。',
  priorityIssue: 'まずはGolf IDの項目を埋めて、クラブ構成と目標スコアを見比べましょう。',
  nextAction: 'クラブセッティングとスコア目標を1ページにまとめ、次に見直す番手を明確にしましょう。',
  notRecommendedNow: 'いきなり全クラブを買い替えるより、距離階段と苦手番手から確認しましょう。',
  gearSuggestion: currentBall ? `使用ボール: ${currentBall}` : 'クラブ構成の抜けや距離差を確認しましょう。',
});

const mapLegacyProfile = (row) => {
  const links = row.sns_links || {};
  const golfId = links.golfId || {};
  const snapshot = links.bagSnapshot || {};
  const stats = snapshot.profileStats || {};
  const customLinks = Array.isArray(links.customLinks) ? links.customLinks : [];
  const username = normalizeUsername(golfId.username || row.name || row.id || 'golfer');
  const clubs = Array.isArray(snapshot.clubs) ? snapshot.clubs.map(mapClubLine).filter(Boolean) : [];

  return {
    id: row.id || username,
    user_id: row.id || null,
    username,
    nickname: golfId.nickname || row.name || username,
    best_score: toNumberOrNull(golfId.best_score ?? stats.bestScore),
    average_score: toNumberOrNull(golfId.average_score ?? stats.averageScore),
    target_score: toNumberOrNull(golfId.target_score),
    head_speed: toNumberOrNull(golfId.head_speed ?? row.head_speed),
    golf_history: golfId.golf_history || row.golf_history || null,
    favorite_club: golfId.favorite_club || null,
    weak_club: golfId.weak_club || null,
    current_issue: golfId.current_issue || null,
    club_setting: golfId.club_setting || clubs.join('\n'),
    social_links: {
      youtube: normalizeSocialUrl(links.youtube, 'https://www.youtube.com/'),
      instagram: normalizeSocialUrl(links.instagram, 'https://www.instagram.com/'),
      tiktok: normalizeSocialUrl(links.tiktok, 'https://www.tiktok.com/', '@'),
      x: normalizeSocialUrl(links.x, 'https://x.com/'),
      custom1: links.custom1 || customLinks[0] || { label: '', url: '' },
      custom2: links.custom2 || customLinks[1] || { label: '', url: '' },
    },
    visibility: golfId.visibility || {},
    diagnosis_result: golfId.diagnosis_result || defaultDiagnosis(row.current_ball),
    is_public: row.is_public ?? true,
    updated_at: row.updated_at || null,
  };
};

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    fs.writeFileSync(outputPath, JSON.stringify([], null, 2));
    console.log('Generated empty Golf ID fallback because Supabase env is missing.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: golfProfiles, error: golfProfilesError } = await supabase
    .from('golf_profiles')
    .select('*')
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (!golfProfilesError && Array.isArray(golfProfiles)) {
    fs.writeFileSync(outputPath, JSON.stringify(golfProfiles, null, 2));
    console.log(`Generated ${golfProfiles.length} Golf ID fallbacks from golf_profiles.`);
    return;
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id,name,head_speed,golf_history,current_ball,sns_links,is_public,updated_at')
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (profilesError) {
    fs.writeFileSync(outputPath, JSON.stringify([], null, 2));
    console.warn(`Generated empty Golf ID fallback: ${profilesError.message}`);
    return;
  }

  const rows = (profiles || []).map(mapLegacyProfile).filter((profile) => profile.username);
  fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2));
  console.log(`Generated ${rows.length} Golf ID fallbacks from profiles.`);
}

main().catch((error) => {
  fs.writeFileSync(outputPath, JSON.stringify([], null, 2));
  console.warn(`Generated empty Golf ID fallback: ${error.message}`);
});
