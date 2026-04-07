export type FeaturedSettingType = 'Tour Pro' | 'Influencer' | 'Amateur';

export interface FeaturedClub {
  category: string;
  model: string;
  productSlug?: string;
}

export interface FeaturedSetting {
  slug: string;
  name: string;
  type: FeaturedSettingType;
  tagline: string;
  summary: string;
  headSpeed: string;
  averageScore: string;
  style: string;
  ball: string;
  clubs: FeaturedClub[];
  strengths: string[];
}

export const featuredSettings: FeaturedSetting[] = [
  {
    slug: 'rory-mcilroy-inspired',
    name: 'Rory McIlroy Inspired',
    type: 'Tour Pro',
    tagline: '飛距離と操作性を両立した攻撃型セッティング',
    summary: '低スピンドライバーと高弾道アイアンで、ティーショットからグリーンまで主導権を握る構成。',
    headSpeed: '48-50 m/s',
    averageScore: '70台前半',
    style: '飛距離重視',
    ball: 'TaylorMade TP5x',
    clubs: [
      { category: 'Driver', model: 'Qi35 LS', productSlug: 'qi35-max' },
      { category: '3W', model: 'Qi10 Tour' },
      { category: 'Iron', model: 'P770 Combo' },
      { category: 'Wedge', model: 'MG4 50/54/60' },
    ],
    strengths: ['高初速', 'フェード操作', 'ショートゲーム精度'],
  },
  {
    slug: 'ayano-fit-lab',
    name: 'Ayano Fit Lab',
    type: 'Influencer',
    tagline: 'やさしさの中に芯を残した現代アベレージ向け',
    summary: 'ミスヒット耐性を優先しながら、打感と見た目にも妥協しないバランス型の14本。',
    headSpeed: '39-41 m/s',
    averageScore: '80台後半',
    style: '安定感重視',
    ball: 'Titleist AVX',
    clubs: [
      { category: 'Driver', model: 'G440 MAX', productSlug: 'g440-max' },
      { category: '5W', model: 'ELYTE MAX FAST' },
      { category: 'Iron', model: 'i530' },
      { category: 'Putter', model: 'Ai-ONE Seven S' },
    ],
    strengths: ['直進性', '高さの出しやすさ', '再現性'],
  },
  {
    slug: 'single-player-hiro',
    name: 'Single Player Hiro',
    type: 'Amateur',
    tagline: '月例で戦う競技志向のリアルセッティング',
    summary: '見栄えではなくスコアを優先。距離の階段とウェッジ構成を丁寧に整えた実戦派モデル。',
    headSpeed: '43-44 m/s',
    averageScore: '70台後半',
    style: '競技志向',
    ball: 'Titleist Pro V1',
    clubs: [
      { category: 'Driver', model: 'GT3', productSlug: 'gt2' },
      { category: 'Utility', model: 'ZXiU 3U' },
      { category: 'Iron', model: 'T100' },
      { category: 'Wedge', model: 'Vokey SM10 50/56/60' },
    ],
    strengths: ['距離の階段', '風への強さ', '縦距離管理'],
  },
];

export interface DriverSpotlight {
  slug: string;
  name: string;
  brand: string;
  usedBy: number;
  category: string;
  fit: string;
}

export const driverSpotlights: DriverSpotlight[] = [
  { slug: 'qi35-max', name: 'Qi35 MAX', brand: 'TaylorMade', usedBy: 18, category: 'Driver', fit: 'やさしさ重視' },
  { slug: 'g440-max', name: 'G440 MAX', brand: 'PING', usedBy: 14, category: 'Driver', fit: '直進性重視' },
  { slug: 'gt2', name: 'GT2', brand: 'Titleist', usedBy: 11, category: 'Driver', fit: 'バランス型' },
  { slug: 'elyte-core', name: 'ELYTE', brand: 'Callaway', usedBy: 9, category: 'Driver', fit: '高初速型' },
];

export const discoveryPaths = [
  { label: 'プロから探す', description: 'ツアープロの14本を一覧で比較', href: '/settings/pros' },
  { label: 'みんなのMy Bag', description: '一般ゴルファーのリアルな構成を見る', href: '/settings/users' },
  { label: '人気ドライバー', description: 'いま使われているモデルから探す', href: '/clubs/drivers' },
  { label: 'ヘッドスピード別', description: '自分に近い層のバッグを参考にする', href: '/settings/users' },
];

export interface DriverDetail {
  slug: string;
  name: string;
  brand: string;
  heroCatch: string;
  summary: string;
  fit: string;
  launch: string;
  spin: string;
  forgiveness: string;
  priceRange: string;
  usedBy: string[];
  idealFor: string[];
  watchPoints: string[];
  compareWith: string[];
}

export const driverDetails: DriverDetail[] = [
  {
    slug: 'qi35-max',
    name: 'Qi35 MAX',
    brand: 'TaylorMade',
    heroCatch: 'やさしさと初速の両立を狙う、現代アベレージ向けの主力モデル。',
    summary: 'つかまりと直進性を両立しやすく、ミスヒット時の曲がり幅を抑えながら前に飛ばしたい人に向くドライバー。',
    fit: 'やさしさ重視',
    launch: '中高弾道',
    spin: 'やや低スピン',
    forgiveness: '高い',
    priceRange: '8万〜10万円前後',
    usedBy: ['Rory McIlroy Inspired', 'Ayano Fit Lab'],
    idealFor: ['HS 38-45m/s', '右ミスを減らしたい', '高さを出しやすくしたい'],
    watchPoints: ['吹け上がりやすい人はLS系も比較', '左ミスが強い人はウェイト調整前提'],
    compareWith: ['g440-max', 'gt2'],
  },
  {
    slug: 'g440-max',
    name: 'G440 MAX',
    brand: 'PING',
    heroCatch: '直進性を最優先にしたい人が安心して使いやすい安定型。',
    summary: '寛容性の高さと打ち出しのしやすさが魅力で、コースでの平均点を上げやすいモデル。',
    fit: '直進性重視',
    launch: '高弾道',
    spin: '適正スピン',
    forgiveness: 'かなり高い',
    priceRange: '9万〜11万円前後',
    usedBy: ['Ayano Fit Lab'],
    idealFor: ['HS 36-43m/s', '曲がり幅を抑えたい', 'ラフからの次打を楽にしたい'],
    watchPoints: ['強いフェードヒッターはロフト調整も要確認', '低スピンを最優先なら別モデル比較'],
    compareWith: ['qi35-max', 'elyte-core'],
  },
  {
    slug: 'gt2',
    name: 'GT2',
    brand: 'Titleist',
    heroCatch: '顔つき、操作性、寛容性のバランスがいい王道モデル。',
    summary: '競技志向でもアベレージでも選びやすく、叩ける安心感とコース適性のバランスが強み。',
    fit: 'バランス型',
    launch: '中弾道',
    spin: '適正からやや低スピン',
    forgiveness: '高い',
    priceRange: '9万〜11万円前後',
    usedBy: ['Single Player Hiro'],
    idealFor: ['HS 40-47m/s', '見た目にもこだわりたい', '叩いても左に行きすぎたくない'],
    watchPoints: ['上がりづらい人はロフト選定が重要', '完全なやさしさ重視ならMAX系比較'],
    compareWith: ['qi35-max', 'elyte-core'],
  },
  {
    slug: 'elyte-core',
    name: 'ELYTE',
    brand: 'Callaway',
    heroCatch: '初速感と球の強さを求める人に相性の良い前に行く一本。',
    summary: 'つかまりすぎずに前へ強く飛ばしたい人に向き、芯を外しても球が死ににくいタイプ。',
    fit: '高初速型',
    launch: '中弾道',
    spin: '低スピン',
    forgiveness: '高め',
    priceRange: '8万〜10万円前後',
    usedBy: ['Ayano Fit Lab'],
    idealFor: ['HS 40-47m/s', '前へ強い球が欲しい', 'スピンを少し減らしたい'],
    watchPoints: ['球が上がりにくい人はMAX FAST系も比較', 'キャリー重視ならロフト選定を慎重に'],
    compareWith: ['gt2', 'g440-max'],
  },
];

export const getDriverDetailBySlug = (slug: string) =>
  driverDetails.find((driver) => driver.slug === slug);

export const getFeaturedSettingByName = (name: string) =>
  featuredSettings.find((setting) => setting.name === name);
