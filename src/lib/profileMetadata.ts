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
  contractMaker?: string;
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
  'keita-nakajima': { category: 'japan_men', contractStatus: 'club_contract', contractMaker: 'テーラーメイド' },
  'takumi-kanaya': { category: 'japan_men', contractStatus: 'club_contract', contractMaker: 'PING' },
  'ryo-hisatsune': { category: 'japan_men', contractStatus: 'club_contract', contractMaker: 'PING' },
  'taiga-semikawa': { category: 'japan_men', contractStatus: 'club_contract', contractMaker: 'テーラーメイド' },
  'kensei-hirata': { category: 'japan_men', contractStatus: 'checking' },
  'shugo-imahira': { category: 'japan_men', contractStatus: 'club_contract', contractMaker: '本間ゴルフ' },
  'yuki-inamori': { category: 'japan_men', contractStatus: 'club_contract' },
  'yuto-katsuragawa': { category: 'japan_men', contractStatus: 'checking' },
  'riki-kawamoto': { category: 'japan_men', contractStatus: 'club_contract' },
  'kazuki-higa': { category: 'japan_men', contractStatus: 'club_contract' },
  'satoshi-kodaira': { category: 'japan_men', contractStatus: 'free_contract' },
  'tatsunori-shogenji': { category: 'japan_men', contractStatus: 'checking' },
  'aguri-iwasaki': { category: 'japan_men', contractStatus: 'checking' },
  'rikuya-hoshino': { category: 'japan_men', contractStatus: 'club_contract', contractMaker: 'キャロウェイ' },
  'hiroshi-iwata': { category: 'japan_men', contractStatus: 'free_contract' },
  'mikumu-horikawa': { category: 'japan_men', contractStatus: 'checking' },
  'ryosuke-kinoshita': { category: 'japan_men', contractStatus: 'club_contract', contractMaker: 'テーラーメイド' },
  'taichi-nabetani': { category: 'japan_men', contractStatus: 'checking' },
  'takamitsu-tokimatsu': { category: 'japan_men', contractStatus: 'club_contract', contractMaker: 'ブリヂストン' },
  'tomoharu-otsuki': { category: 'japan_men', contractStatus: 'checking' },
  'yosuke-tsukada': { category: 'japan_men', contractStatus: 'checking' },
  'yui-kawamoto': { category: 'japan_women', contractStatus: 'club_contract', contractMaker: 'キャロウェイ' },
  'akie-iwai': { category: 'japan_women', contractStatus: 'club_contract', contractMaker: 'ヨネックス' },
  'chisato-iwai': { category: 'japan_women', contractStatus: 'club_contract', contractMaker: 'ヨネックス' },
  'rio-takeda': { category: 'japan_women', contractStatus: 'checking' },
  'ayaka-furue': { category: 'japan_women', contractStatus: 'checking' },
  'yuka-saso': { category: 'japan_women', contractStatus: 'checking' },
  'mao-saigo': { category: 'japan_women', contractStatus: 'checking' },
  'miyuu-yamashita': { category: 'japan_women', contractStatus: 'checking' },
  'nasa-hataoka': { category: 'japan_women', contractStatus: 'checking' },
  'yuuka-yasuda': { category: 'japan_women', contractStatus: 'checking' },
  'sakura-koiwai': { category: 'japan_women', contractStatus: 'checking' },
  'nana-suganuma': { category: 'japan_women', contractStatus: 'checking' },
  'kokona-sakurai': { category: 'japan_women', contractStatus: 'checking' },
  'shiho-kuwaki': { category: 'japan_women', contractStatus: 'checking' },
  'ayaka-watanabe': { category: 'japan_women', contractStatus: 'checking' },
  'erika-kikuchi': { category: 'japan_women', contractStatus: 'checking' },
  'haruka-kawasaki': { category: 'japan_women', contractStatus: 'checking' },
  'hina-arakaki': { category: 'japan_women', contractStatus: 'checking' },
  'hinako-shibuno': { category: 'japan_women', contractStatus: 'checking' },
  'saki-nagamine': { category: 'japan_women', contractStatus: 'checking' },
  'ai-suzuki': { category: 'japan_women', contractStatus: 'checking' },
  'mone-inami': { category: 'japan_women', contractStatus: 'checking' },
  'yuri-yoshida': { category: 'japan_women', contractStatus: 'checking' },
  'yuna-nishimura': { category: 'japan_women', contractStatus: 'checking' },
  'minami-katsu': { category: 'japan_women', contractStatus: 'checking' },
  'momoko-osato': { category: 'japan_women', contractStatus: 'checking' },
  'saiki-fujita': { category: 'japan_women', contractStatus: 'checking' },
  'asuka-kashiwabara': { category: 'japan_women', contractStatus: 'checking' },
  'minjee-lee': { category: 'overseas_women', contractStatus: 'club_contract', contractMaker: 'キャロウェイ' },
  'lydia-ko': { category: 'overseas_women', contractStatus: 'checking' },
  'nelly-korda': { category: 'overseas_women', contractStatus: 'checking' },
  'jeeno-thitikul': { category: 'overseas_women', contractStatus: 'checking' },
  'celine-boutier': { category: 'overseas_women', contractStatus: 'checking' },
  'charley-hull': { category: 'overseas_women', contractStatus: 'checking' },
  'hannah-green': { category: 'overseas_women', contractStatus: 'checking' },
  'lilia-vu': { category: 'overseas_women', contractStatus: 'checking' },
  'brooke-henderson': { category: 'overseas_women', contractStatus: 'checking' },
  'ruoning-yin': { category: 'overseas_women', contractStatus: 'checking' },
  'angel-yin': { category: 'overseas_women', contractStatus: 'checking' },
  'allisen-corpuz': { category: 'overseas_women', contractStatus: 'checking' },
  'jin-young-ko': { category: 'overseas_women', contractStatus: 'checking' },
  'hyo-joo-kim': { category: 'overseas_women', contractStatus: 'checking' },
  'amy-yang': { category: 'overseas_women', contractStatus: 'checking' },
  'georgia-hall': { category: 'overseas_women', contractStatus: 'checking' },
  'leona-maguire': { category: 'overseas_women', contractStatus: 'checking' },
  'linn-grant': { category: 'overseas_women', contractStatus: 'checking' },
  'carlota-ciganda': { category: 'overseas_women', contractStatus: 'checking' },
  'megan-khang': { category: 'overseas_women', contractStatus: 'checking' },
  'ashleigh-buhai': { category: 'overseas_women', contractStatus: 'checking' },
  'lexi-thompson': { category: 'overseas_women', contractStatus: 'checking' },
  'inbee-park': { category: 'overseas_women', contractStatus: 'checking' },
  'danielle-kang': { category: 'overseas_women', contractStatus: 'checking' },
  'ariya-jutanugarn': { category: 'overseas_women', contractStatus: 'checking' },
  'moriya-jutanugarn': { category: 'overseas_women', contractStatus: 'checking' },
  'patty-tavatanakit': { category: 'overseas_women', contractStatus: 'checking' },
  'rose-zhang': { category: 'overseas_women', contractStatus: 'checking' },
  'maya-stark': { category: 'overseas_women', contractStatus: 'checking' },
  'haeran-ryu': { category: 'overseas_women', contractStatus: 'checking' },
  'alison-lee': { category: 'overseas_women', contractStatus: 'checking' },
  'andrea-lee': { category: 'overseas_women', contractStatus: 'checking' },
  'ally-ewing': { category: 'overseas_women', contractStatus: 'checking' },
  'lauren-coughlin': { category: 'overseas_women', contractStatus: 'checking' },
  'jennifer-kupcho': { category: 'overseas_women', contractStatus: 'checking' },
  'nanna-koerstz-madsen': { category: 'overseas_women', contractStatus: 'checking' },
  'anna-nordqvist': { category: 'overseas_women', contractStatus: 'checking' },
  'madelene-sagstrom': { category: 'overseas_women', contractStatus: 'checking' },
  'ryann-odtoole': { category: 'overseas_women', contractStatus: 'checking' },
  'gaby-lopez': { category: 'overseas_women', contractStatus: 'checking' },
  'collin-morikawa': { category: 'overseas_men', contractStatus: 'club_contract', contractMaker: 'テーラーメイド' },
  'nick-taylor': { category: 'overseas_men', contractStatus: 'free_contract' },
  'cameron-young': { category: 'overseas_men', contractStatus: 'club_contract', contractMaker: 'タイトリスト' },
  'wyndham-clark': { category: 'overseas_men', contractStatus: 'club_contract', contractMaker: 'タイトリスト' },
  'thorbjorn-olesen': { category: 'overseas_men', contractStatus: 'free_contract' },
  'jason-day': { category: 'overseas_men', contractStatus: 'free_contract' },
  'peter-malnati': { category: 'overseas_men', contractStatus: 'free_contract' },
  'viktor-hovland': { category: 'overseas_men', contractStatus: 'club_contract', contractMaker: 'PING' },
  'tommy-fleetwood': { category: 'overseas_men', contractStatus: 'free_contract' },
  'thomas-detry': { category: 'overseas_men', contractStatus: 'free_contract' },
  'jordan-spieth': { category: 'overseas_men', contractStatus: 'free_contract' },
  'tony-finau': { category: 'overseas_men', contractStatus: 'free_contract' },
  'sepp-straka': { category: 'overseas_men', contractStatus: 'free_contract' },
  'adam-scott': { category: 'overseas_men', contractStatus: 'free_contract' },
  'tom-kim': { category: 'overseas_men', contractStatus: 'club_contract', contractMaker: 'タイトリスト' },
  'matt-mccarty': { category: 'overseas_men', contractStatus: 'checking' },
  'xander-schauffele': { category: 'overseas_men', contractStatus: 'free_contract' },
  'ludvig-aberg': { category: 'overseas_men', contractStatus: 'club_contract', contractMaker: 'テーラーメイド' },
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
    contractMaker: partial.contractMaker,
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
