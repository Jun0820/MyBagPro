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
    articleSlug: 'pga-championship-2026-result-aaron-rai-setting-review',
    tourKey: 'pga',
    tourLabel: 'PGA TOUR',
    tournamentName: 'PGA Championship',
    statusLabel: '結果更新',
    eventDates: '2026年5月14日-17日',
    summary:
      'アーロン・ライがメジャー初制覇。ライ、ジョン・ラーム、アレックス・スマリーの確認済み14本を、FW・UTで距離を作る視点から振り返ります。',
    featuredPlayerSlugs: ['aaron-rai', 'jon-rahm', 'alex-smalley'],
  },
  {
    articleSlug: 'kroger-queen-city-2026-result-yamashita-setting-review',
    tourKey: 'lpga',
    tourLabel: 'LPGA',
    tournamentName: 'Kroger Queen City Championship',
    statusLabel: '結果更新',
    eventDates: '2026年5月14日-17日',
    summary:
      'ロッティ・ウォード優勝、山下美夢有3位。ウォード、ヘラン・リュウ、山下美夢有の14本をFW・UTの距離設計から比較しやすくしました。',
    featuredPlayerSlugs: ['lottie-woad', 'haeran-ryu', 'miyuu-yamashita', 'jeeno-thitikul'],
  },
  {
    articleSlug: 'kansai-open-2026-result-fujimoto-setting-watch',
    tourKey: 'jgto',
    tourLabel: 'JGTO',
    tournamentName: '関西オープンゴルフ選手権競技',
    statusLabel: '結果更新',
    eventDates: '2026年5月14日-17日',
    summary:
      '藤本佳則が13年ぶりの復活優勝。上位3人の最新14本は追跡対象としつつ、国内男子の番手構成を見る視点を整理しています。',
    featuredPlayerSlugs: ['tomohiro-ishizaka', 'yuta-ikeda', 'mikumu-horikawa'],
  },
  {
    articleSlug: 'sky-rkb-ladies-2026-kuwaki-setting-review',
    tourKey: 'jlpga',
    tourLabel: 'JLPGA',
    tournamentName: 'Sky RKBレディスクラシック',
    statusLabel: '結果更新',
    eventDates: '2026年5月15日-17日',
    summary:
      '桑木志帆が約1年半ぶりの優勝。3U・4Uを入れたブリヂストン中心の構成から、女子プロの距離設計を振り返ります。',
    featuredPlayerSlugs: ['shiho-kuwaki', 'aihi-takano', 'miyu-abe'],
  },
  {
    articleSlug: 'pga-championship-2026-aronimink-setting-watch',
    tourKey: 'pga',
    tourLabel: 'PGA TOUR',
    tournamentName: 'PGA Championship',
    statusLabel: '開催中',
    eventDates: '2026年5月14日-17日',
    summary:
      '2026年5月14日開幕のメジャー週。松山英樹、スコッティ・シェフラー、ローリー・マキロイの14本を、飛距離だけでなくロングゲームとショートゲームのつながりで見比べます。',
    featuredPlayerSlugs: ['hideki-matsuyama', 'scottie-scheffler', 'rory-mcilroy'],
  },
  {
    articleSlug: 'kroger-queen-city-2026-lpga-setting-watch',
    tourKey: 'lpga',
    tourLabel: 'LPGA',
    tournamentName: 'Kroger Queen City Championship',
    statusLabel: '開催中',
    eventDates: '2026年5月14日-17日',
    summary:
      'LPGAの開催週に合わせて、ネリー・コルダ、畑岡奈紗、西郷真央のセッティングを比較。FW・UTで距離を作る考え方を中心に整理しました。',
    featuredPlayerSlugs: ['nelly-korda', 'nasa-hataoka', 'mao-saigo'],
  },
  {
    articleSlug: 'kansai-open-2026-jgto-setting-watch',
    tourKey: 'jgto',
    tourLabel: 'JGTO',
    tournamentName: '関西オープンゴルフ選手権競技',
    statusLabel: '開催中',
    eventDates: '2026年5月14日-17日',
    summary:
      '国内男子の開催週に合わせて、石川遼、中島啓太、生源寺龍憲のクラブ構成を確認。1Wだけでなく、2打目以降の番手設計を見やすくしました。',
    featuredPlayerSlugs: ['ryo-ishikawa', 'keita-nakajima', 'tatsunori-shogenji'],
  },
  {
    articleSlug: 'bridgestone-ladies-2026-jlpga-setting-watch',
    tourKey: 'jlpga',
    tourLabel: 'JLPGA',
    tournamentName: 'ブリヂストンレディスオープン',
    statusLabel: '次戦注目',
    eventDates: '2026年5月21日-24日',
    summary:
      'JLPGA次戦前の予習として、竹田麗央、山下美夢有、佐久間朱莉の14本を見比べる記事を追加。女子プロのFW・UT・ウェッジ構成をクラブ選びに落とし込みます。',
    featuredPlayerSlugs: ['rio-takeda', 'miyuu-yamashita', 'sakuma-akari'],
  },
  {
    articleSlug: 'rbc-heritage-2026-spotlight',
    tourKey: 'pga',
    tourLabel: 'PGA TOUR',
    tournamentName: 'RBCヘリテージ',
    statusLabel: '振り返り',
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
    statusLabel: '振り返り',
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
    statusLabel: '振り返り',
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
    statusLabel: '振り返り',
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
