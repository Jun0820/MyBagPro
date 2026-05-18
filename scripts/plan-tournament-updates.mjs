import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const docsDir = path.join(projectRoot, 'docs');
const reportsDir = path.join(docsDir, 'tournament-update-reports');

const normalizeName = (value = '') =>
  value
    .toString()
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const slugify = (value = '') =>
  value
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const formatDate = () => new Date().toISOString().slice(0, 10);

const readJson = (filepath) => JSON.parse(fs.readFileSync(filepath, 'utf8'));

const loadExistingProfiles = () => {
  const profiles = new Map();
  const nameIndex = new Map();
  const seedFiles = fs
    .readdirSync(docsDir)
    .filter((filename) => filename.endsWith('-seed.json'))
    .map((filename) => path.join(docsDir, filename));

  for (const filepath of seedFiles) {
    try {
      const payload = readJson(filepath);
      const profile = payload.profile;
      if (!profile?.slug) continue;

      const entry = {
        slug: profile.slug,
        displayName: profile.display_name || profile.slug,
        seedFile: path.relative(projectRoot, filepath),
        verifiedAt: profile.verified_at || null,
        seasonYear: profile.season_year || null,
        latestSourcePolicy: profile.latest_source_policy || null,
        articleSlug: payload.article?.slug || null,
      };

      profiles.set(profile.slug, entry);
      nameIndex.set(normalizeName(profile.display_name), entry);
      if (profile.kana_name) nameIndex.set(normalizeName(profile.kana_name), entry);
    } catch (error) {
      console.warn(`Skipped invalid seed file: ${filepath}`);
    }
  }

  return { profiles, nameIndex };
};

const sourceStatus = (player) => {
  const sources = player.witbSources || [];
  const confirmed = sources.filter((source) => source.status === 'confirmed');
  const candidates = sources.filter((source) => source.status !== 'confirmed');

  if (confirmed.length > 0) return { label: 'confirmed', sources: confirmed };
  if (candidates.length > 0) return { label: 'candidate', sources: candidates };
  return { label: 'missing', sources: [] };
};

const resolveProfile = (player, indexes) => {
  if (player.slug && indexes.profiles.has(player.slug)) {
    return indexes.profiles.get(player.slug);
  }

  const byName = indexes.nameIndex.get(normalizeName(player.name));
  if (byName) return byName;

  return null;
};

const makeSearchLink = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

const actionFor = ({ profile, source }) => {
  if (!profile && source.label === 'confirmed') return 'create_profile';
  if (!profile && source.label === 'candidate') return 'research_then_create';
  if (!profile) return 'research_sources';
  if (source.label === 'confirmed') return 'review_update_profile';
  if (source.label === 'candidate') return 'verify_candidate_source';
  return 'monitor_only';
};

const actionLabel = {
  create_profile: 'ページ作成',
  research_then_create: 'ソース確認後にページ作成',
  research_sources: 'WITBソース調査',
  review_update_profile: '既存ページ更新確認',
  verify_candidate_source: '候補ソース検証',
  monitor_only: '監視継続',
};

const buildRows = (intake, indexes) => {
  const rows = [];

  for (const tournament of intake.tournaments || []) {
    for (const player of tournament.topFinishers || []) {
      const profile = resolveProfile(player, indexes);
      const source = sourceStatus(player);
      const inferredSlug = player.slug || profile?.slug || slugify(player.name) || 'needs-slug';
      const action = actionFor({ profile, source });

      rows.push({
        tourKey: tournament.tourKey || '',
        tournamentName: tournament.name || '',
        eventDates: tournament.eventDates || '',
        resultSourceUrl: tournament.resultSourceUrl || '',
        articleSlug: tournament.articleSlug || '',
        position: player.position || '',
        name: player.name,
        score: player.score || '',
        slug: inferredSlug,
        profileExists: Boolean(profile),
        seedFile: profile?.seedFile || '',
        verifiedAt: profile?.verifiedAt || '',
        sourceStatus: source.label,
        sourceUrls: source.sources.map((item) => item.url).filter(Boolean),
        action,
        clubSettingSearch: makeSearchLink(`"${player.name}" クラブセッティング`),
        witbSearch: makeSearchLink(`"${player.name}" WITB`),
      });
    }
  }

  return rows;
};

const renderMarkdown = (inputFile, intake, rows) => {
  const createdAt = new Date().toISOString();
  const missingProfiles = rows.filter((row) => !row.profileExists).length;
  const confirmedSources = rows.filter((row) => row.sourceStatus === 'confirmed').length;
  const sourceMissing = rows.filter((row) => row.sourceStatus === 'missing').length;
  const byAction = rows.reduce((acc, row) => {
    acc[row.action] = (acc[row.action] || 0) + 1;
    return acc;
  }, {});

  const lines = [
    '# Tournament Update Plan',
    '',
    `- Created: ${createdAt}`,
    `- Intake: \`${path.relative(projectRoot, inputFile)}\``,
    `- Players checked: ${rows.length}`,
    `- Missing profiles: ${missingProfiles}`,
    `- Confirmed WITB sources: ${confirmedSources}`,
    `- Missing WITB sources: ${sourceMissing}`,
    '',
    '## Action Summary',
    '',
    '| Action | Count |',
    '|---|---:|',
    ...Object.entries(byAction).map(([action, count]) => `| ${actionLabel[action] || action} | ${count} |`),
    '',
    '## Player Queue',
    '',
    '| Tournament | Pos | Player | Profile | WITB source | Action | Search |',
    '|---|---:|---|---|---|---|---|',
    ...rows.map((row) => {
      const profileCell = row.profileExists ? `exists: \`${row.slug}\`` : `missing: \`${row.slug}\``;
      const sourceCell =
        row.sourceStatus === 'missing'
          ? 'missing'
          : `${row.sourceStatus} (${row.sourceUrls.length})`;
      return `| ${row.tournamentName} | ${row.position} | ${row.name} | ${profileCell} | ${sourceCell} | ${actionLabel[row.action] || row.action} | [JP](${row.clubSettingSearch}) / [WITB](${row.witbSearch}) |`;
    }),
    '',
    '## Recommended Commands',
    '',
    'After editing or creating profile seed files:',
    '',
    '```bash',
    'npm run supabase:upsert-setting-profile -- docs/<player-slug>-seed.json',
    'npm run supabase:upsert-articles -- docs/<tournament-result-file>.json',
    'npm run build',
    'vercel --prod --yes',
    '```',
    '',
    '## Guardrails',
    '',
    '- Do not create a club setting from leaderboard data alone.',
    '- Mark a WITB source as `confirmed` only when the club model list is directly visible in an official, manufacturer, tour, or reputable golf media source.',
    '- If a player has no confirmed WITB source, create/update the tournament article as a tracking note, but do not invent the 14 clubs.',
    '- After deployment, submit the updated sitemap in Search Console and request indexing for newly created `/pros/<slug>` pages.',
    '',
  ];

  return lines.join('\n');
};

const main = () => {
  const inputArg = process.argv[2];
  if (!inputArg) {
    throw new Error('Usage: node scripts/plan-tournament-updates.mjs <docs/tournament-intake.json>');
  }

  const inputFile = path.resolve(projectRoot, inputArg);
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  const intake = readJson(inputFile);
  const indexes = loadExistingProfiles();
  const rows = buildRows(intake, indexes);

  fs.mkdirSync(reportsDir, { recursive: true });
  const baseName = path.basename(inputFile, '.json');
  const outputBase = `${formatDate()}-${baseName}`;
  const markdownPath = path.join(reportsDir, `${outputBase}.md`);
  const actionsPath = path.join(reportsDir, `${outputBase}.actions.json`);

  fs.writeFileSync(markdownPath, renderMarkdown(inputFile, intake, rows));
  fs.writeFileSync(
    actionsPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        input: path.relative(projectRoot, inputFile),
        rows,
      },
      null,
      2
    )
  );

  console.log(JSON.stringify({
    playersChecked: rows.length,
    report: path.relative(projectRoot, markdownPath),
    actions: path.relative(projectRoot, actionsPath),
  }, null, 2));
};

main();
