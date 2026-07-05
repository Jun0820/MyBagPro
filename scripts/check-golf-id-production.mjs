import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

function loadEnv(filename) {
  const filepath = path.join(projectRoot, filename);
  if (!fs.existsSync(filepath)) return {};
  const entries = {};
  for (const line of fs.readFileSync(filepath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eqIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    entries[key] = value;
  }
  return entries;
}

const localEnv = loadEnv('.env.local');
const baseEnv = loadEnv('.env');
const supabaseUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL || baseEnv.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || localEnv.VITE_SUPABASE_ANON_KEY || baseEnv.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.');
  process.exit(1);
}

const headers = {
  apikey: anonKey,
  authorization: `Bearer ${anonKey}`,
};

async function getJson(endpoint) {
  const response = await fetch(`${supabaseUrl}${endpoint}`, { headers });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { response, json };
}

const checks = [];

const tableCheck = await getJson('/rest/v1/golf_profiles?select=id,username,nickname,is_public,updated_at&limit=1');
checks.push({
  name: 'golf_profiles table exists',
  ok: tableCheck.response.ok,
  status: tableCheck.response.status,
  detail: tableCheck.response.ok ? 'ok' : tableCheck.json?.message || tableCheck.json,
});

const publicCheck = await getJson('/rest/v1/golf_profiles?is_public=eq.true&select=id,username,nickname&limit=5');
checks.push({
  name: 'public select policy works',
  ok: publicCheck.response.ok,
  status: publicCheck.response.status,
  detail: publicCheck.response.ok ? `${Array.isArray(publicCheck.json) ? publicCheck.json.length : 0} rows visible` : publicCheck.json?.message || publicCheck.json,
});

const tommyCheck = await getJson('/rest/v1/golf_profiles?username=ilike.tommy&select=username,nickname,best_score,target_score,head_speed,is_public&limit=1');
checks.push({
  name: '/u/tommy canonical data exists',
  ok: tommyCheck.response.ok && Array.isArray(tommyCheck.json) && tommyCheck.json.length > 0,
  status: tommyCheck.response.status,
  detail: tommyCheck.response.ok ? tommyCheck.json : tommyCheck.json?.message || tommyCheck.json,
});

console.log(JSON.stringify({ supabaseUrlConfigured: Boolean(supabaseUrl), checks }, null, 2));

if (checks.some((check) => !check.ok)) {
  console.error('\nGolf ID production DB is not fully ready. Apply docs/sql/golf-profiles-production-bootstrap.sql in Supabase SQL Editor.');
  process.exit(1);
}

console.log('\nGolf ID production DB is ready.');
