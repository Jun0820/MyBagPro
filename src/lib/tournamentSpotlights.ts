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
    articleSlug: 'masters-tournament-2026-spotlight',
    tourKey: 'pga',
    tourLabel: 'PGA TOUR',
    tournamentName: 'マスターズ・トーナメント',
    statusLabel: '開催中',
    eventDates: '2026年4月9日-12日',
    summary:
      '2026年4月10日時点で開催中。スコッティ・シェフラー、ロリー・マキロイ、松山英樹の最新セッティングを軸にオーガスタ攻略の注目ポイントを整理しました。',
    featuredPlayerSlugs: ['scottie-scheffler', 'rory-mcilroy', 'hideki-matsuyama'],
  },
  {
    articleSlug: 'lpga-weekly-spotlight-2026-04-10',
    tourKey: 'lpga',
    tourLabel: 'LPGA',
    tournamentName: 'LPGA 今週の注目選手',
    statusLabel: 'オフ週',
    eventDates: '2026年4月10日時点',
    summary:
      'LPGAは今週オフ週のため、直近のAramco Championshipと次戦JM Eagle LA Championshipを見据えて、ネリー・コルダ、山下美夢有、リディア・コをピックアップしました。',
    featuredPlayerSlugs: ['nelly-korda', 'miyuu-yamashita', 'lydia-ko'],
  },
  {
    articleSlug: 'token-homemate-cup-2026-spotlight',
    tourKey: 'jgto',
    tourLabel: 'JGTO',
    tournamentName: '東建ホームメイトカップ',
    statusLabel: '開催中',
    eventDates: '2026年4月9日-12日',
    summary:
      'JGTO開幕戦の東建ホームメイトカップでチェックしたい、生源寺龍憲、岩﨑亜久竜、石坂友宏のクラブ構成をまとめました。',
    featuredPlayerSlugs: ['tatsunori-shogenji', 'aguri-iwasaki', 'tomohiro-ishizaka'],
  },
  {
    articleSlug: 'fujifilm-studio-alice-2026-spotlight',
    tourKey: 'jlpga',
    tourLabel: 'JLPGA',
    tournamentName: '富士フイルム・スタジオアリス女子オープン',
    statusLabel: '開催中',
    eventDates: '2026年4月10日-12日',
    summary:
      'JLPGAの今週開催大会から、竹田麗央、渋野日向子、小祝さくらのセッティングと飛距離データを追いやすい形に整理しました。',
    featuredPlayerSlugs: ['rio-takeda', 'hinako-shibuno', 'sakura-koiwai'],
  },
];

export const getTournamentSpotlightByArticleSlug = (slug?: string | null) =>
  tournamentSpotlights.find((spotlight) => spotlight.articleSlug === slug);
