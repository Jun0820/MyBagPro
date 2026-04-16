import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const projectRoot = path.resolve(process.cwd());
const outputPath = path.join(projectRoot, 'public', 'published-profiles-fallback.json');

function loadEnvFile(filename) {
  const filepath = path.join(projectRoot, filename);
  if (!fs.existsSync(filepath)) return {};

  const raw = fs.readFileSync(filepath, 'utf8');
  const entries = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
}

function readConfig() {
  const localEnv = loadEnvFile('.env.local');
  const baseEnv = loadEnvFile('.env');

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    localEnv.VITE_SUPABASE_URL ||
    baseEnv.VITE_SUPABASE_URL ||
    '';

  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    localEnv.VITE_SUPABASE_ANON_KEY ||
    baseEnv.VITE_SUPABASE_ANON_KEY ||
    '';

  return { supabaseUrl, anonKey };
}

async function main() {
  const { supabaseUrl, anonKey } = readConfig();

  if (!supabaseUrl || !anonKey) {
    throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Cannot build public profile snapshot from Supabase.');
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: profiles, error: profileError } = await supabase
    .from('setting_profiles')
    .select('*')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('season_year', { ascending: false })
    .limit(500);

  if (profileError) throw profileError;
  if (!profiles?.length) {
    throw new Error('Supabase returned 0 published profiles. Aborting snapshot generation.');
  }

  const profileIds = profiles.map((profile) => profile.id);

  const [{ data: bagItems, error: bagError }, { data: sources, error: sourceError }] = await Promise.all([
    supabase
      .from('setting_bag_items')
      .select('profile_id, category, brand, model_name, spec_label, loft_label, shaft_brand, shaft_model, shaft_flex, carry_distance, total_distance, source_note, slot_order')
      .in('profile_id', profileIds)
      .order('slot_order', { ascending: true }),
    supabase
      .from('content_sources')
      .select('profile_id, source_type, source_url, source_title, checked_at, notes')
      .in('profile_id', profileIds)
      .order('checked_at', { ascending: false }),
  ]);

  if (bagError) throw bagError;
  if (sourceError) throw sourceError;

  const packages = profiles.map((profile) => ({
    profile: {
      ...profile,
      contractStatus: profile.contractStatus ?? null,
      contractMaker: profile.contractMaker ?? null,
    },
    bagItems: (bagItems || []).filter((item) => item.profile_id === profile.id),
    sources: (sources || []).filter((source) => source.profile_id === profile.id),
  }));

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: 'supabase',
        count: packages.length,
        profiles: packages,
      },
      null,
      2
    ) + '\n'
  );

  console.log(`Generated ${packages.length} published profile fallbacks from Supabase -> ${path.relative(projectRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
