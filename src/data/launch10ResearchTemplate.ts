import { editorialPolicy } from './editorialPolicy';

export interface Launch10ResearchRecord {
  name: string;
  slug: string;
  profileType: 'tour_pro' | 'influencer';
  seasonYear: number;
  latestSourcePolicy: '2026_season' | 'latest_tournament' | 'representative_setting';
  birthDate: string | null;
  heightCm: number | null;
  birthplace: string | null;
  nationality: string | null;
  headSpeedMps: number | null;
  averageScore: number | null;
  bestScore: number | null;
  ballName: string | null;
  youtubeChannel: string | null;
  instagramHandle: string | null;
  xHandle: string | null;
  feature1: string | null;
  feature2: string | null;
  feature3: string | null;
  summary: string | null;
  driverBrand: string | null;
  driverModel: string | null;
  driverLoft: string | null;
  driverShaftBrand: string | null;
  driverShaftModel: string | null;
  driverShaftFlex: string | null;
  driverCarryDistance: number | null;
  driverTotalDistance: number | null;
  fairwayWoodModel: string | null;
  utilityModel: string | null;
  ironModel: string | null;
  wedgeModel: string | null;
  putterModel: string | null;
  sourceType: 'official' | 'youtube' | 'instagram' | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  checkedAt: string | null;
  notes: string | null;
}

const slugMap: Record<string, string> = {
  '松山 英樹': 'hideki-matsuyama',
  '石川 遼': 'ryo-ishikawa',
  '中島 啓太': 'keita-nakajima',
  '久常 涼': 'ryo-hisatsune',
  '蝉川 泰果': 'taiga-semikawa',
  '堀川 未来夢': 'mikumu-horikawa',
  '中西 直人': 'naoto-nakanishi',
  '片山 晋呉': 'shingo-katayama',
  '星野 英正': 'hide-masa-hoshino',
  'Tera-You': 'tera-you',
};

const influencerSet = new Set(['Tera-You']);

export const launch10ResearchTemplate: Launch10ResearchRecord[] = editorialPolicy.launch10.map((name) => ({
  name,
  slug: slugMap[name] || name,
  profileType: influencerSet.has(name) ? 'influencer' : 'tour_pro',
  seasonYear: 2026,
  latestSourcePolicy: '2026_season',
  birthDate: null,
  heightCm: null,
  birthplace: null,
  nationality: 'Japan',
  headSpeedMps: null,
  averageScore: null,
  bestScore: null,
  ballName: null,
  youtubeChannel: null,
  instagramHandle: null,
  xHandle: null,
  feature1: null,
  feature2: null,
  feature3: null,
  summary: null,
  driverBrand: null,
  driverModel: null,
  driverLoft: null,
  driverShaftBrand: null,
  driverShaftModel: null,
  driverShaftFlex: null,
  driverCarryDistance: null,
  driverTotalDistance: null,
  fairwayWoodModel: null,
  utilityModel: null,
  ironModel: null,
  wedgeModel: null,
  putterModel: null,
  sourceType: null,
  sourceUrl: null,
  sourceTitle: null,
  checkedAt: null,
  notes: null,
}));
