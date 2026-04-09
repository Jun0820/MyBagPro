export type ProfileCategory =
  | 'japan_men'
  | 'japan_women'
  | 'overseas_men'
  | 'overseas_women'
  | 'influencer'
  | 'lesson_pro';

export type ContractStatus = 'club_contract' | 'free_contract' | 'checking';

export interface ProfileMetadata {
  category: ProfileCategory;
  categoryLabel: string;
  contractStatus: ContractStatus;
  contractLabel: string;
}

const defaultMetadata: ProfileMetadata = {
  category: 'japan_men',
  categoryLabel: '日本男子',
  contractStatus: 'checking',
  contractLabel: '契約情報確認中',
};

const categoryLabelMap: Record<ProfileCategory, string> = {
  japan_men: '日本男子',
  japan_women: '日本女子',
  overseas_men: '海外男子',
  overseas_women: '海外女子',
  influencer: 'インフルエンサー',
  lesson_pro: 'レッスンプロ',
};

const contractLabelMap: Record<ContractStatus, string> = {
  club_contract: 'クラブ契約プロ',
  free_contract: '契約フリー',
  checking: '契約情報確認中',
};

const metadataBySlug: Record<string, Partial<ProfileMetadata>> = {
  'ryo-ishikawa': { category: 'japan_men', contractStatus: 'free_contract' },
  'keita-nakajima': { category: 'japan_men', contractStatus: 'club_contract' },
  'takumi-kanaya': { category: 'japan_men', contractStatus: 'club_contract' },
  'ryo-hisatsune': { category: 'japan_men', contractStatus: 'club_contract' },
  'taiga-semikawa': { category: 'japan_men', contractStatus: 'club_contract' },
  'kensei-hirata': { category: 'japan_men', contractStatus: 'checking' },
  'shugo-imahira': { category: 'japan_men', contractStatus: 'club_contract' },
  'yuki-inamori': { category: 'japan_men', contractStatus: 'club_contract' },
  'yuto-katsuragawa': { category: 'japan_men', contractStatus: 'checking' },
  'riki-kawamoto': { category: 'japan_men', contractStatus: 'club_contract' },
  'kazuki-higa': { category: 'japan_men', contractStatus: 'club_contract' },
  'satoshi-kodaira': { category: 'japan_men', contractStatus: 'free_contract' },
  'tatsunori-shogenji': { category: 'japan_men', contractStatus: 'checking' },
  'aguri-iwasaki': { category: 'japan_men', contractStatus: 'checking' },
  'rikuya-hoshino': { category: 'japan_men', contractStatus: 'club_contract' },
  'hiroshi-iwata': { category: 'japan_men', contractStatus: 'free_contract' },
  'mikumu-horikawa': { category: 'japan_men', contractStatus: 'checking' },
  'ryosuke-kinoshita': { category: 'japan_men', contractStatus: 'club_contract' },
  'taichi-nabetani': { category: 'japan_men', contractStatus: 'checking' },
  'takamitsu-tokimatsu': { category: 'japan_men', contractStatus: 'club_contract' },
  'tomoharu-otsuki': { category: 'japan_men', contractStatus: 'checking' },
  'yosuke-tsukada': { category: 'japan_men', contractStatus: 'checking' },
  'yui-kawamoto': { category: 'japan_women', contractStatus: 'club_contract' },
  'minjee-lee': { category: 'overseas_women', contractStatus: 'club_contract' },
  'collin-morikawa': { category: 'overseas_men', contractStatus: 'club_contract' },
  'nick-taylor': { category: 'overseas_men', contractStatus: 'free_contract' },
  'cameron-young': { category: 'overseas_men', contractStatus: 'club_contract' },
  'wyndham-clark': { category: 'overseas_men', contractStatus: 'club_contract' },
  'thorbjorn-olesen': { category: 'overseas_men', contractStatus: 'free_contract' },
  'jason-day': { category: 'overseas_men', contractStatus: 'free_contract' },
  'peter-malnati': { category: 'overseas_men', contractStatus: 'free_contract' },
  'viktor-hovland': { category: 'overseas_men', contractStatus: 'club_contract' },
  'tommy-fleetwood': { category: 'overseas_men', contractStatus: 'free_contract' },
  'thomas-detry': { category: 'overseas_men', contractStatus: 'free_contract' },
  'jordan-spieth': { category: 'overseas_men', contractStatus: 'free_contract' },
  'tony-finau': { category: 'overseas_men', contractStatus: 'free_contract' },
  'sepp-straka': { category: 'overseas_men', contractStatus: 'free_contract' },
  'adam-scott': { category: 'overseas_men', contractStatus: 'free_contract' },
  'tom-kim': { category: 'overseas_men', contractStatus: 'club_contract' },
  'matt-mccarty': { category: 'overseas_men', contractStatus: 'checking' },
  'xander-schauffele': { category: 'overseas_men', contractStatus: 'free_contract' },
  'ludvig-aberg': { category: 'overseas_men', contractStatus: 'club_contract' },
  'justin-thomas': { category: 'overseas_men', contractStatus: 'free_contract' },
};

export const getProfileMetadata = (slug: string): ProfileMetadata => {
  const partial = metadataBySlug[slug] || {};
  const category = partial.category || defaultMetadata.category;
  const contractStatus = partial.contractStatus || defaultMetadata.contractStatus;

  return {
    category,
    categoryLabel: categoryLabelMap[category],
    contractStatus,
    contractLabel: contractLabelMap[contractStatus],
  };
};

export const profileCategories: Array<{ id: 'all' | ProfileCategory; label: string }> = [
  { id: 'all', label: 'すべて' },
  { id: 'japan_men', label: '日本男子' },
  { id: 'japan_women', label: '日本女子' },
  { id: 'overseas_men', label: '海外男子' },
  { id: 'overseas_women', label: '海外女子' },
  { id: 'influencer', label: 'インフルエンサー' },
  { id: 'lesson_pro', label: 'レッスンプロ' },
];
