import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const inputPath = path.join(projectRoot, 'public', 'published-profiles-fallback.json');
const outputPath =
  process.argv[2] ||
  path.join(projectRoot, 'docs', `pro-club-settings-export-${new Date().toISOString().slice(0, 10)}.csv`);

const payload = JSON.parse(await readFile(inputPath, 'utf8'));
const profiles = payload.profiles || [];

const columns = [
  ['player_slug', '選手スラッグ'],
  ['player_name', '選手名'],
  ['kana_name', '読み'],
  ['profile_type', 'プロフィール種別'],
  ['segment', 'カテゴリ'],
  ['season_year', '年度'],
  ['usage_confirmed_period', '使用確認時期'],
  ['verified_at', '更新日'],
  ['is_published', '公開状態'],
  ['pro_page_url', 'プロ詳細URL'],
  ['slot_order', '並び順'],
  ['club_category', 'クラブカテゴリ'],
  ['spec_label', '番手'],
  ['brand', 'メーカー'],
  ['model_name', 'モデル'],
  ['loft_label', 'ロフト'],
  ['shaft_brand', 'シャフトメーカー'],
  ['shaft_model', 'シャフトモデル'],
  ['shaft_weight', 'シャフト重量'],
  ['shaft_flex', 'フレックス'],
  ['carry_distance', 'キャリー距離'],
  ['total_distance', '総距離'],
  ['source_note', 'クラブ別メモ'],
  ['primary_source_title', '主な確認ソース'],
  ['primary_source_url', '主な確認ソースURL'],
  ['primary_source_checked_at', 'ソース確認日'],
  ['all_source_urls', '全ソースURL'],
  ['summary', 'プロフィール概要'],
];

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
};

const formatIsoDateText = (value) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

const normalizeValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value).replace(/\r?\n/g, ' ').trim();
};

const csvEscape = (value) => {
  const text = normalizeValue(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const pickPrimarySource = (sources = []) => {
  return (
    sources.find((source) => source.source_type === 'article') ||
    sources.find((source) => source.source_type === 'official') ||
    sources[0] ||
    {}
  );
};

const extractSourceDateLabel = (source = {}) => {
  const text = [source.source_title, source.notes].filter(Boolean).join(' ');

  const publishedIsoMatch = text.match(/Published\s+(20\d{2}-\d{1,2}-\d{1,2})/i);
  if (publishedIsoMatch?.[1]) return formatIsoDateText(publishedIsoMatch[1]);

  const japaneseFullDateMatch = text.match(/(20\d{2}年\d{1,2}月\d{1,2}日)/);
  if (japaneseFullDateMatch?.[1]) return japaneseFullDateMatch[1];

  const japaneseMonthMatch = text.match(/(20\d{2}年\d{1,2}月)/);
  if (japaneseMonthMatch?.[1]) return japaneseMonthMatch[1];

  const witbMonthMatch = text.match(
    /WITB\s+(20\d{2})\s*\((January|February|March|April|May|June|July|August|September|October|November|December)\)/i
  );
  if (witbMonthMatch?.[1] && witbMonthMatch?.[2]) {
    const monthMap = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };
    return `${witbMonthMatch[1]}年${monthMap[witbMonthMatch[2].toLowerCase()]}月`;
  }

  const yearEventMatch = text.match(
    /(20\d{2}年[^。\n]*?(?:トーナメント|選手権|オープン|カップ|クラウンズ|Championship|Open|Classic|Invitational|Cup|Masters))/i
  );
  if (yearEventMatch?.[1]) return yearEventMatch[1].trim();

  return '';
};

const toUsagePeriodLabel = (value = '') => {
  const yearMonthMatch = value.match(/(20\d{2})年\s*(\d{1,2})月/);
  if (yearMonthMatch?.[1] && yearMonthMatch?.[2]) {
    return `${yearMonthMatch[1]}年${Number(yearMonthMatch[2])}月`;
  }

  const yearMatch = value.match(/(20\d{2})年/);
  if (yearMatch?.[1]) return `${yearMatch[1]}年`;

  return '';
};

const getUsageConfirmedPeriod = (sources = [], seasonYear = null) => {
  const sourcesWithDate = sources.filter((source) => extractSourceDateLabel(source));
  const source =
    sourcesWithDate.find((item) => item.source_type === 'article') ||
    sourcesWithDate.find((item) => item.source_type === 'youtube') ||
    sourcesWithDate.find((item) => item.source_type === 'official') ||
    sourcesWithDate[0];
  const sourceDate = extractSourceDateLabel(source);
  const usagePeriodLabel = toUsagePeriodLabel(sourceDate);
  if (usagePeriodLabel) return usagePeriodLabel;
  return seasonYear ? `${seasonYear}年確認` : '';
};

const rows = [];

for (const entry of profiles) {
  const profile = entry.profile || {};
  const bagItems = entry.bagItems || [];
  const sources = entry.sources || [];
  const primarySource = pickPrimarySource(sources);
  const base = {
    player_slug: profile.slug,
    player_name: profile.display_name,
    kana_name: profile.kana_name,
    profile_type: profile.profile_type,
    segment: profile.segment,
    season_year: profile.season_year,
    usage_confirmed_period: getUsageConfirmedPeriod(sources, profile.season_year),
    verified_at: formatDate(profile.verified_at),
    is_published: profile.is_published,
    pro_page_url: profile.slug ? `https://www.mybagpro.jp/pros/${profile.slug}` : '',
    primary_source_title: primarySource.source_title,
    primary_source_url: primarySource.source_url,
    primary_source_checked_at: formatDate(primarySource.checked_at),
    all_source_urls: sources.map((source) => source.source_url).filter(Boolean).join(' | '),
    summary: profile.summary,
  };

  if (bagItems.length === 0) {
    rows.push(base);
    continue;
  }

  for (const item of bagItems) {
    rows.push({
      ...base,
      slot_order: item.slot_order,
      club_category: item.category,
      spec_label: item.spec_label,
      brand: item.brand,
      model_name: item.model_name,
      loft_label: item.loft_label,
      shaft_brand: item.shaft_brand,
      shaft_model: item.shaft_model,
      shaft_weight: item.shaft_weight,
      shaft_flex: item.shaft_flex,
      carry_distance: item.carry_distance,
      total_distance: item.total_distance,
      source_note: item.source_note,
    });
  }
}

const csv = [
  columns.map(([, label]) => csvEscape(label)).join(','),
  ...rows.map((row) => columns.map(([key]) => csvEscape(row[key])).join(',')),
].join('\n');

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `\uFEFF${csv}\n`);

console.log(JSON.stringify({ outputPath, profiles: profiles.length, rows: rows.length }, null, 2));
