import { getBrandConfig } from '../config/brand';
import type { PublicArticle } from './articles';

export interface ArticleVisual {
  url: string;
  alt: string;
  caption: string;
}

export const defaultArticleVisual: ArticleVisual = {
  url: '/article-visuals/golf-bag-course.jpg',
  alt: 'ゴルフ場に置かれたクラブバッグ',
  caption: 'クラブ構成を見直すときは、1本単位ではなくバッグ全体の役割で考えると整理しやすくなります。',
};

const genericArticleImages = new Set([
  '/articles/golf-balls-club-pexels-6572967.jpg',
  '/articles/golf-clubs-grass-pexels-20808740.jpg',
  '/articles/golf-green-putting-pexels-8218726.jpg',
]);

const articleVisuals: Array<ArticleVisual & { keywords: string[] }> = [
  {
    url: '/article-visuals/driver-tee.jpg',
    alt: 'ティーアップされたゴルフボール',
    caption: 'ドライバーやティーショットの記事では、飛距離だけでなく打ち出しと方向性も合わせて確認したいところです。',
    keywords: ['ドライバー', '1W', '飛距離', 'ティーショット', 'ミニドライバー', 'Qi35', 'G440', 'ZXi LS'],
  },
  {
    url: '/article-visuals/range-bag.jpg',
    alt: '練習場に置かれたゴルフバッグ',
    caption: 'FW、UT、ミニドライバーは、コースで使う距離とミスの出方から役割を決めると選びやすくなります。',
    keywords: ['UT', 'ユーティリティ', '7W', 'FW', 'フェアウェイウッド', 'ロングアイアン', '5番アイアン', '距離階段'],
  },
  {
    url: '/article-visuals/iron-ball.jpg',
    alt: '芝の上のゴルフボールとアイアン',
    caption: 'アイアン選びでは、番手ごとの飛距離差と球の高さが安定しているかを見ておきたいです。',
    keywords: ['アイアン', '5I', '6I', '7I', 'ロフト', 'コンボ', 'ZXi5', 'BLUEPRINT', 'P770', '241CB'],
  },
  {
    url: '/article-visuals/bunker-wedge.jpg',
    alt: 'バンカーショットを打つゴルファー',
    caption: 'ウェッジ構成は、ロフトの数字だけでなく得意距離とアプローチの使い分けまで見ると実戦的です。',
    keywords: ['ウェッジ', 'バンカー', 'アプローチ', '50°', '52°', '56°', '58°', '60°', 'SM11', 'MG4'],
  },
  {
    url: '/article-visuals/putting-practice.jpg',
    alt: 'パターとゴルフボールの練習セット',
    caption: 'パターはヘッド形状、アライメント、距離感の出し方まで含めて相性を見るのが大切です。',
    keywords: ['パター', 'PT', 'パッティング', 'スパイダー', 'PLD', 'ニューポート', 'マレット'],
  },
  {
    url: '/article-visuals/balls-clubs.jpg',
    alt: '芝の上のゴルフボールとクラブ',
    caption: '使用ボールはスピン量、打感、弾道の高さにも関わるため、クラブとセットで見たいポイントです。',
    keywords: ['ボール', 'TOUR B X', 'TP5x', 'Pro V1x', 'Z-STAR', 'ゴルフボール'],
  },
  {
    url: '/article-visuals/green-flag.jpg',
    alt: 'ゴルフ場のグリーンとフラッグ',
    caption: '大会記事では、コースで求められるショットと選手のクラブ構成をつなげて見ると理解しやすくなります。',
    keywords: ['大会', 'ツアー', '中日クラウンズ', '前澤杯', 'リゾートトラスト', 'トーナメント', '予選', '決勝'],
  },
  {
    url: '/article-visuals/putting-green.jpg',
    alt: '室内パッティンググリーンとゴルフボール',
    caption: '診断や練習テーマの記事では、ミスの傾向をクラブ選びにどう落とし込むかが重要です。',
    keywords: ['診断', '練習', '初心者', '悩み', '苦手', 'ミス', 'スコア', '改善'],
  },
  {
    url: '/article-visuals/clubs-grass.jpg',
    alt: '芝の上に並んだゴルフクラブ',
    caption: 'プロの14本は、同じクラブを真似るよりも番手構成の考え方を読み取るのが大切です。',
    keywords: ['クラブセッティング', '使用クラブ', '番手表', '14本', 'プロフィール', '契約', '比較', 'ランキング'],
  },
];

const normalizeImagePath = (url: string) => {
  try {
    return new URL(url, getBrandConfig().url).pathname;
  } catch {
    return url;
  }
};

export const isGenericArticleImage = (url: string) => genericArticleImages.has(normalizeImagePath(url));

export const getArticleVisual = (article: PublicArticle): ArticleVisual => {
  const haystack = `${article.title}\n${article.excerpt}\n${article.body}`.toLowerCase();
  const visual = articleVisuals.find((candidate) =>
    candidate.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
  );

  return visual || defaultArticleVisual;
};
