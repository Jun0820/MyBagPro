export interface TournamentSpotlight {
  articleSlug: string;
  tourKey: 'pga' | 'lpga' | 'jgto' | 'jlpga';
  tourLabel: string;
  tournamentName: string;
  statusLabel: string;
  eventDates: string;
  summary: string;
  featuredPlayerSlugs: string[];
}

export const tournamentSpotlights: TournamentSpotlight[] = [
  {
    articleSlug: 'rbc-heritage-2026-spotlight',
    tourKey: 'pga',
    tourLabel: 'PGA TOUR',
    tournamentName: 'RBCヘリテージ',
    statusLabel: '開催中',
    eventDates: '2026年4月16日-19日',
    summary:
      '2026年4月18日時点で開催中。ハーバータウンで見たいスコッティ・シェフラー、コリン・モリカワ、松山英樹の最新セッティングを、ショット精度とクラブ構成の観点で整理しました。',
    featuredPlayerSlugs: ['scottie-scheffler', 'collin-morikawa', 'hideki-matsuyama'],
  },
  {
    articleSlug: 'jm-eagle-la-championship-2026-spotlight',
    tourKey: 'lpga',
    tourLabel: 'LPGA',
    tournamentName: 'JM Eagle LA選手権',
    statusLabel: '開催中',
    eventDates: '2026年4月16日-19日',
    summary:
      'ロサンゼルス開催の今週大会では、ネリー・コルダ、パティ・タバタナキット、ローズ・チャンのセッティングを見比べると、女子ツアー上位勢の飛距離設計がつかみやすくなります。',
    featuredPlayerSlugs: ['nelly-korda', 'patty-tavatanakit', 'rose-zhang'],
  },
  {
    articleSlug: 'maezawa-cup-2026-spotlight',
    tourKey: 'jgto',
    tourLabel: 'JGTO',
    tournamentName: '前澤杯 MAEZAWA CUP',
    statusLabel: '次戦注目',
    eventDates: '2026年4月23日-26日',
    summary:
      'JGTOは次戦の前澤杯へ視線が移るタイミングです。中島啓太、石川遼、生源寺龍憲のセッティングを先回りで整理し、注目どころを追いやすくしました。',
    featuredPlayerSlugs: ['keita-nakajima', 'ryo-ishikawa', 'tatsunori-shogenji'],
  },
  {
    articleSlug: 'kkt-vantelin-ladies-2026-spotlight',
    tourKey: 'jlpga',
    tourLabel: 'JLPGA',
    tournamentName: 'KKT杯バンテリンレディスオープン',
    statusLabel: '開催中',
    eventDates: '2026年4月17日-19日',
    summary:
      '熊本開催の今週大会では、竹田麗央、山下美夢有、佐久間朱莉のセッティングを並べると、国内女子の飛距離帯とクラブ構成の違いが分かりやすく見えてきます。',
    featuredPlayerSlugs: ['rio-takeda', 'miyuu-yamashita', 'sakuma-akari'],
  },
  {
    articleSlug: 'world-ladies-salonpas-cup-2026-setting-spotlight',
    tourKey: 'jlpga',
    tourLabel: 'JLPGA',
    tournamentName: 'ワールドレディスサロンパス杯',
    statusLabel: '注目選手',
    eventDates: '2026年5月7日-10日',
    summary:
      '国内メジャーを前に、佐久間朱莉、竹田麗央、山下美夢有のセッティングを並べて見ると、スコアメイク型と飛距離型の違いが見えやすくなります。',
    featuredPlayerSlugs: ['sakuma-akari', 'rio-takeda', 'miyuu-yamashita'],
  },
  {
    articleSlug: 'kiyomoto-miyako-baba-young-jlpga-watch-2026',
    tourKey: 'jlpga',
    tourLabel: 'JLPGA',
    tournamentName: '若手女子プロ特集',
    statusLabel: '見比べる',
    eventDates: '2026年5月時点',
    summary:
      '清本美波、都玲華、馬場咲希のページを見比べると、若手女子プロでもクラブ構成の個性が大きく違うことが分かります。',
    featuredPlayerSlugs: ['minami-kiyomoto', 'reika-miyako', 'saki-baba'],
  },
  {
    articleSlug: 'yamaha-ladies-and-stepup-2026-watchlist',
    tourKey: 'jlpga',
    tourLabel: 'JLPGA',
    tournamentName: 'ヤマハレディース葛城と下部ツアー注目組',
    statusLabel: '関連ページ',
    eventDates: '2026年5月時点',
    summary:
      '記事内で触れている選手のうち、すでにページ化済みの都玲華、寺西飛香留、三浦桃香は、そのままセッティング詳細まで辿れます。',
    featuredPlayerSlugs: ['reika-miyako', 'hikaru-teranishi', 'momoka-miura'],
  },
  {
    articleSlug: 'mizuho-americas-open-2026-japan-watch',
    tourKey: 'lpga',
    tourLabel: 'LPGA',
    tournamentName: 'みずほアメリカズオープン',
    statusLabel: '日本勢注目',
    eventDates: '2026年5月7日-10日',
    summary:
      '日本勢の中でも、すでにページ化済みの馬場咲希はそのままセッティング詳細へ進めます。',
    featuredPlayerSlugs: ['saki-baba'],
  },
];

export const getTournamentSpotlightByArticleSlug = (slug?: string | null) =>
  tournamentSpotlights.find((spotlight) => spotlight.articleSlug === slug);
