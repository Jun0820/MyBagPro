import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const reportPath = path.join(projectRoot, 'docs', 'gdo-2026-setting-audit.json');
const CHECKED_AT = '2026-05-21T00:00:00.000Z';

const brandRules = [
  ['テーラーメイド', 'TaylorMade'],
  ['TaylorMade', 'TaylorMade'],
  ['キャロウェイ', 'Callaway'],
  ['Callaway', 'Callaway'],
  ['オデッセイ', 'Odyssey'],
  ['スリクソン', 'Srixon'],
  ['ダンロップ', 'Dunlop'],
  ['ミズノ', 'Mizuno'],
  ['Mizuno', 'Mizuno'],
  ['PING', 'PING'],
  ['ピン', 'PING'],
  ['タイトリスト', 'Titleist'],
  ['Titleist', 'Titleist'],
  ['VOKEY', 'Titleist'],
  ['ボーケイ', 'Titleist'],
  ['スコッティキャメロン', 'Scotty Cameron'],
  ['Scotty Cameron', 'Scotty Cameron'],
  ['クリーブランド', 'Cleveland'],
  ['ヨネックス', 'Yonex'],
  ['ブリヂストン', 'Bridgestone'],
  ['フォーティーン', 'Fourteen'],
  ['コブラ', 'Cobra'],
  ['PXG', 'PXG'],
];

const inferBrand = (product = '') => {
  const rule = brandRules.find(([needle]) => product.includes(needle));
  return rule?.[1] || null;
};

const cleanModel = (product = '') =>
  product
    .replace(/\([^)]*(?:番|度|ロフト)[^)]*\)/g, '')
    .replace(/（[^）]*(?:番|度|ロフト)[^）]*）/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeLoft = (value) => (value ? `${value.replace(/\.0$/, '')}°` : null);

const parseShaft = (shaft = '') => {
  const normalized = shaft.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return { shaft_model: null, shaft_weight: null, shaft_flex: null };
  }
  const weight =
    normalized.match(/重さ\s*([0-9]+(?:\.[0-9]+)?g台?)/)?.[1] ||
    normalized.match(/[（(、,\s]([0-9]+(?:\.[0-9]+)?g台?)[、,\s）)]/)?.[1] ||
    null;
  const flex =
    normalized.match(/硬さ\s*([A-Z0-9.]+)/i)?.[1]?.toUpperCase() ||
    normalized.match(/[（(、,\s](X100|S300|S200|R2|SR|R|S|X|TX)[、,\s）)]/i)?.[1]?.toUpperCase() ||
    normalized.match(/[（(、,\s]([0-9]+(?:\.[0-9]+)?)[、,\s）)]/)?.[1] ||
    null;
  const model = normalized
    .replace(/重さ\s*[0-9]+(?:\.[0-9]+)?g台?/g, '')
    .replace(/硬さ\s*[A-Z0-9.]+/gi, '')
    .replace(/[（(]\s*[0-9]+(?:\.[0-9]+)?g台?\s*[、,]?\s*(?:X100|S300|S200|R2|SR|R|S|X|TX)?\s*[）)]/gi, '')
    .replace(/[（(]\s*(?:X100|S300|S200|R2|SR|R|S|X|TX)\s*[）)]/gi, '')
    .replace(/[（(]\s*[、,\s]+\s*[）)]/g, '')
    .replace(/[（(]\s*[）)]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    shaft_model: model || normalized,
    shaft_weight: weight,
    shaft_flex: flex,
  };
};

const parseNumberSpecs = (product) => {
  const specs = [];
  const body = product.match(/[（(]([^）)]*)[）)]/)?.[1] || '';
  for (const match of body.matchAll(/(\d+)番(?:HL|Dタイプ)?(?:[=＝]?\s*)?([0-9.]+)?度?/g)) {
    specs.push({
      number: Number(match[1]),
      loft: normalizeLoft(match[2] || null),
    });
  }
  return specs;
};

const expandIronRange = (product) => {
  const body = product;
  const normalized = body.replace(/―/g, '～').replace(/〜/g, '～');
  const range = normalized.match(/(\d+)番?～(PW|P|W|GW|AW|SW|LW|\d+)番?/i);
  if (range) {
    const start = Number(range[1]);
    const endLabel = range[2].toUpperCase();
    const endMap = { P: 10, W: 10, PW: 10, AW: 11, GW: 11, SW: 12, LW: 13 };
    const end = Number.isFinite(Number(endLabel)) ? Number(endLabel) : (endMap[endLabel] || 10);
    const labels = [];
    for (let n = start; n <= Math.min(end, 9); n += 1) labels.push(`${n}I`);
    if (end >= 10) labels.push('PW');
    if (end >= 11) labels.push('GW');
    if (end >= 12) labels.push('SW');
    if (end >= 13) labels.push('LW');
    return labels;
  }
  const single = normalized.match(/(\d+)番/);
  if (single) return [`${single[1]}I`];
  if (/PW|P\b/i.test(normalized)) return ['PW'];
  return [];
};

const expandWedgeLofts = (product) => {
  const body = product.match(/[（(]([^）)]*)[）)](?=\s*$|[^（(]*$)/)?.[1] || product;
  const numericLofts = body.includes('度')
    ? [...body.matchAll(/([0-9]{2}(?:\.[0-9])?)(?=度|[、,\s]*[0-9]{2}|[、,\s]*$)/g)].map((match) => normalizeLoft(match[1]))
    : [...body.matchAll(/(^|[、,\s])([0-9]{2}(?:\.[0-9])?)(?=$|[、,\s])/g)].map((match) => normalizeLoft(match[2]));
  const lofts = numericLofts.map((loft) => ({
    spec_label: loft,
    loft_label: loft,
  }));
  if (lofts.length > 0) return lofts;
  return ['PW', 'GW', 'AW', 'SW', 'LW']
    .filter((label) => new RegExp(`(^|[、,\\s])${label}($|[、,\\s])`, 'i').test(body))
    .map((label) => ({ spec_label: label, loft_label: null }));
};

const buildItemsFromEntry = (entry, sourceNote) => {
  const product = entry.product.trim();
  const categoryText = entry.genre;
  const brand = inferBrand(product);
  const modelName = cleanModel(product) || product;
  const shaft = parseShaft(entry.shaft);
  const common = {
    brand,
    model_name: modelName,
    ...shaft,
    source_note: sourceNote,
    is_featured_item: false,
  };

  if (categoryText.includes('ドライバー')) {
    const loft = product.match(/(?:ロフト)?\s*([0-9.]+)度/)?.[1] || product.match(/[（(]([0-9.]+)度/)?.[1] || null;
    return [{ category: 'Driver', spec_label: '1W', loft_label: normalizeLoft(loft), ...common, is_featured_item: true }];
  }

  if (categoryText.includes('FW') || categoryText.includes('UT')) {
    const numberSpecs = parseNumberSpecs(product);
    const isUtility = /ユーティリティ|ハイブリッド|HYBRID|UW/i.test(`${product} ${entry.shaft}`);
    if (numberSpecs.length > 0) {
      return numberSpecs.map((spec) => ({
        category: isUtility ? 'Utility' : 'Fairway Wood',
        spec_label: isUtility ? `${spec.number}UT` : `${spec.number}W`,
        loft_label: spec.loft,
        ...common,
      }));
    }
    const loft = product.match(/[（(]([0-9.]+)度[）)]/)?.[1] || null;
    return [{
      category: isUtility ? 'Utility' : 'Fairway Wood',
      spec_label: isUtility ? (product.includes('UW') ? 'UW' : 'UT') : 'FW',
      loft_label: normalizeLoft(loft),
      ...common,
    }];
  }

  if (categoryText.includes('アイアン')) {
    const labels = expandIronRange(product);
    return (labels.length ? labels : ['Iron']).map((label) => ({
      category: label === 'PW' ? 'Wedge' : 'Iron',
      spec_label: label,
      ...common,
    }));
  }

  if (categoryText.includes('ウェッジ')) {
    const wedgeSpecs = expandWedgeLofts(product);
    return (wedgeSpecs.length ? wedgeSpecs : [{ spec_label: null, loft_label: null }]).map((spec) => ({
      category: 'Wedge',
      spec_label: spec.spec_label,
      loft_label: spec.loft_label,
      ...common,
    }));
  }

  if (categoryText.includes('パター')) {
    return [{ category: 'Putter', ...common }];
  }

  return [];
};

const findFirst = (items, predicate) => items.find(predicate);
const summarizeClub = (item) => {
  if (!item) return '-';
  return [item.brand, item.model_name].filter(Boolean).join(' ') || item.model_name || '-';
};

const makeArticle = (seed, gdo) => {
  const name = seed.profile.display_name;
  const tournamentLabel = gdo.tournament || '2026年取材';
  const clubs = seed.bagItems || [];
  const driver = findFirst(clubs, (item) => item.category === 'Driver');
  const woodsAndUtilities = clubs.filter((item) => item.category === 'Fairway Wood' || item.category === 'Utility');
  const irons = clubs.filter((item) => item.category === 'Iron');
  const wedges = clubs.filter((item) => item.category === 'Wedge');
  const putter = findFirst(clubs, (item) => item.category === 'Putter');
  const ball = seed.profile.ball_name || '-';
  const detailPath = `/pros/${seed.profile.slug}`;

  return {
    slug: `${seed.profile.slug}-2026-setting-update`,
    title: `${name}の2026年クラブセッティングを更新しました`,
    excerpt: `${tournamentLabel}時点の使用クラブとボールをGDO確認データで更新しました。`,
    body: `${name}のクラブセッティングについて、${tournamentLabel}時点でGDOが公開した情報をもとに更新しました。

## 今回の更新内容
- ドライバー：${summarizeClub(driver)}
- FW/UT：${woodsAndUtilities.map((item) => item.spec_label || item.category).filter(Boolean).join('、') || '-'}を確認
- アイアン：${irons.map((item) => item.spec_label).filter(Boolean).join('、') || '-'}を確認
- ウェッジ：${wedges.map((item) => item.spec_label || item.loft_label).filter(Boolean).join('、') || '-'}を確認
- パター：${summarizeClub(putter)}
- ボール：${ball}

## MyBagProで確認できること
詳細ページでは、番手、メーカー、モデル、シャフト、重量、ロフト、硬さまで一覧で確認できます。

${name}のクラブセッティング詳細ページは ${detailPath} です。この記事上部の「クラブセッティングを見る」ボタンからも移動できます。

[CALLOUT title="真似るときの注意点"]
プロのセッティングは、ヘッドスピード、打ち出し、スピン量、コース条件に合わせて作られています。同じモデルをそのまま選ぶより、番手構成や距離の作り方を自分のバッグに置き換えて考えるのがおすすめです。
[/CALLOUT]`,
    article_type: 'update',
    season_year: 2026,
    published: true,
    published_at: CHECKED_AT,
  };
};

const updateSeed = (check) => {
  const filePath = path.join(projectRoot, check.file);
  const seed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const gdo = check.gdo;
  const sourceNote = `GDO「${gdo.title}」${gdo.situation ? `（${gdo.situation}）` : ''}で確認。`;
  const bagItems = [];
  let ballName = null;

  for (const entry of gdo.entries) {
    if (entry.genre.includes('ボール')) {
      ballName = entry.product;
      continue;
    }
    bagItems.push(...buildItemsFromEntry(entry, sourceNote));
  }

  seed.profile.season_year = 2026;
  seed.profile.latest_source_policy = 'gdo_2026';
  seed.profile.verified_at = CHECKED_AT;
  seed.profile.feature_1 = '2026年GDO確認';
  seed.profile.feature_2 = gdo.tournament || '最新取材';
  seed.profile.feature_3 = '使用クラブ更新済み';
  seed.profile.summary = `${gdo.tournament || '2026年取材'}時点で確認できた${seed.profile.display_name}のクラブセッティングと使用ボールを掲載するプロフィール。`;
  if (ballName) seed.profile.ball_name = ballName;

  seed.bagItems = bagItems.map((item, index) => ({
    ...item,
    slot_order: index + 1,
  }));

  const otherSources = (seed.sources || []).filter(
    (source) => !String(source.source_url || '').includes(`news.golfdigest.co.jp/players/setting/${check.gdoId}/`)
  );
  seed.sources = [
    ...otherSources,
    {
      source_type: 'article',
      source_url: check.candidateUrl,
      source_title: `GDO ${gdo.title}`,
      checked_at: CHECKED_AT,
      notes: `Used for 2026 full bag and ball confirmation.${gdo.situation ? ` ${gdo.situation}` : ''}`,
    },
  ];

  seed.article = makeArticle(seed, gdo);

  fs.writeFileSync(filePath, `${JSON.stringify(seed, null, 2)}\n`);
  return { file: check.file, slug: seed.profile.slug, name: seed.profile.display_name, items: seed.bagItems.length };
};

const main = () => {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const targets = report.checks.filter((check) => check.needsUpdate && check.gdo?.entries?.length);
  const updated = targets.map(updateSeed);
  console.log(`Updated ${updated.length} seed files from GDO 2026 audit.`);
  for (const item of updated) console.log(`${item.file} (${item.items} clubs)`);
};

main();
