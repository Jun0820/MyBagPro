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
];

export const getTournamentSpotlightByArticleSlug = (slug?: string | null) =>
  tournamentSpotlights.find((spotlight) => spotlight.articleSlug === slug);
