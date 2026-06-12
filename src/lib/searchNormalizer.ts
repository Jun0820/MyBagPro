type SearchValue = string | number | null | undefined;

const aliasGroups = [
  ['ping', 'ピン', 'ぴん'],
  ['taylormade', 'テーラーメイド', 'テイラーメイド', 'テーラー', 'テイラー'],
  ['callaway', 'キャロウェイ', 'キャラウェイ'],
  ['titleist', 'タイトリスト'],
  ['srixon', 'スリクソン'],
  ['dunlop', 'ダンロップ'],
  ['bridgestone', 'ブリヂストン', 'ブリジストン', 'tour b', 'ツアーb', 'bs'],
  ['mizuno', 'ミズノ'],
  ['yamaha', 'ヤマハ'],
  ['odyssey', 'オデッセイ'],
  ['scotty cameron', 'スコッティキャメロン', 'スコッティ'],
  ['cleveland', 'クリーブランド'],
  ['cobra', 'コブラ'],
  ['prgr', 'プロギア'],
  ['fourteen', 'フォーティーン', '14'],
  ['onoff', 'オノフ'],
  ['xxio', 'ゼクシオ'],
  ['driver', '1w', '1番ウッド', 'ドライバー'],
  ['mini driver', 'ミニドライバー', 'ミニドラ'],
  ['fairway wood', 'fairwaywood', 'fw', 'フェアウェイウッド'],
  ['3w', '3番ウッド', 'スプーン'],
  ['4w', '4番ウッド', 'バフィー'],
  ['5w', '5番ウッド', 'クリーク'],
  ['7w', '7番ウッド', 'ショートウッド'],
  ['9w', '9番ウッド'],
  ['utility', 'ut', 'hybrid', 'u', 'ユーティリティ', 'ハイブリッド'],
  ['3u', '3ut', '3番ユーティリティ', '3番ハイブリッド'],
  ['4u', '4ut', '4番ユーティリティ', '4番ハイブリッド'],
  ['5u', '5ut', '5番ユーティリティ', '5番ハイブリッド'],
  ['6u', '6ut', '6番ユーティリティ', '6番ハイブリッド'],
  ['driving iron', 'di', 'ドライビングアイアン', 'ユーティリティアイアン'],
  ['iron', 'アイアン'],
  ['wedge', 'ウェッジ'],
  ['putter', 'pt', 'パター'],
  ['ball', 'ボール'],
  ['pro v1x', 'prov1x', 'プロv1x', 'プロブイワンx', 'プロブイワンエックス'],
  ['pro v1', 'prov1', 'プロv1', 'プロブイワン'],
  ['tp5x', 'tp 5x'],
  ['tp5', 'tp 5'],
  ['z-star xv', 'zstarxv', 'ゼットスターxv'],
  ['z-star', 'zstar', 'ゼットスター'],
] as const;

const toHiragana = (value: string) =>
  value.replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));

export const normalizeSearchText = (value: SearchValue) => {
  if (value === null || value === undefined) return '';

  return toHiragana(String(value).normalize('NFKC').toLowerCase())
    .replace(/[（）()[\]{}【】「」『』"'`´｀・,，.．:：;；/／\\|｜_＿\-−ー―~〜\s°]/g, '')
    .trim();
};

const normalizedAliasGroups = aliasGroups.map((group) => group.map((value) => normalizeSearchText(value)).filter(Boolean));

export const getSearchVariants = (query: SearchValue) => {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  const variants = new Set([normalized]);
  normalizedAliasGroups.forEach((group) => {
    if (group.some((alias) => alias.includes(normalized) || normalized.includes(alias))) {
      group.forEach((alias) => variants.add(alias));
    }
  });

  return Array.from(variants);
};

export const buildSearchIndex = (values: SearchValue[]) => {
  const normalizedValues = values.map((value) => normalizeSearchText(value)).filter(Boolean);
  const index = new Set(normalizedValues);
  const joined = normalizedValues.join('');

  normalizedAliasGroups.forEach((group) => {
    if (group.some((alias) => joined.includes(alias))) {
      group.forEach((alias) => index.add(alias));
    }
  });

  return Array.from(index).join(' ');
};

export const matchesSearchText = (values: SearchValue[], query: SearchValue) => {
  const variants = getSearchVariants(query);
  if (variants.length === 0) return true;

  const index = buildSearchIndex(values);
  return variants.some((variant) => index.includes(variant));
};
