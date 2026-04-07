export interface RosterEntry {
  name: string;
  note?: string;
}

export interface RosterGroup {
  slug: string;
  label: string;
  description: string;
  entries: RosterEntry[];
}

export const proRosterGroups: RosterGroup[] = [
  {
    slug: 'top-stars',
    label: 'トップスター',
    description: '世界レベルのスター選手',
    entries: [
      { name: '松山 英樹' },
      { name: '石川 遼' },
      { name: '中島 啓太' },
      { name: '久常 涼' },
      { name: '蝉川 泰果' },
    ],
  },
  {
    slug: 'money-leaders',
    label: '実力派・賞金上位',
    description: '2025-26年ツアーの中心',
    entries: [
      { name: '金谷 拓実' },
      { name: '平田 憲聖' },
      { name: '金子 駆大' },
      { name: '生源寺 龍憲' },
      { name: '今平 周吾' },
    ],
  },
  {
    slug: 'popular-pros',
    label: 'YouTube・人気',
    description: '発信力も高い人気プロ',
    entries: [
      { name: '堀川 未来夢' },
      { name: '中西 直人' },
      { name: '片山 晋呉' },
      { name: '星野 英正' },
      { name: '矢野 東' },
    ],
  },
  {
    slug: 'tour-regulars',
    label: '実力者（50名）',
    description: 'ツアー常連・シード選手',
    entries: [
      { name: '木下 稜介' }, { name: '岩田 寛' }, { name: '比嘉 一貴' }, { name: '小木曽 喬' }, { name: '大岩 龍一' },
      { name: '片岡 尚之' }, { name: '吉田 泰基' }, { name: '佐藤 大平' }, { name: '米澤 蓮' }, { name: '小平 智' },
      { name: '河本 力' }, { name: '下家 秀琉' }, { name: '勝俣 陵' }, { name: '細野 勇策' }, { name: '清水 大成' },
      { name: '杉浦 悠太' }, { name: '池村 寛世' }, { name: '浅地 洋佑' }, { name: '大槻 智春' }, { name: '永野 竜太郎' },
      { name: '石坂 友宏' }, { name: '稲森 佑貴' }, { name: '宮里 優作' }, { name: '岩﨑 亜久竜' }, { name: '大堀 裕次郎' },
      { name: '時松 隆光' }, { name: '嘉数 光倫' }, { name: '桂川 有人' }, { name: '阿久津 未来也' }, { name: '坂本 雄介' },
      { name: '長野 泰雅' }, { name: '岡田 晃平' }, { name: '古川 龍之介' }, { name: '砂川 公佑' }, { name: '安森 一貴' },
      { name: '鈴木 晃祐' }, { name: '塚田 陽亮' }, { name: '香妻 陣一朗' }, { name: '谷原 秀人' }, { name: '武藤 俊憲' },
      { name: '藤本 佳則' }, { name: '池田 勇太' }, { name: '小鯛 竜也' }, { name: '出水田 大二郎' }, { name: '竹安 俊也' },
      { name: '重永 亜斗夢' }, { name: '木下 裕太' }, { name: '近藤 智弘' }, { name: '小袋 秀人' }, { name: '内藤 寛太郎' },
    ],
  },
  {
    slug: 'legends',
    label: 'ベテラン・伝説',
    description: '日本ゴルフ界の礎',
    entries: [
      { name: '青木 功' }, { name: '尾崎 将司' }, { name: '中嶋 常幸' }, { name: '倉本 昌弘' }, { name: '尾崎 直道' },
      { name: '飯合 肇' }, { name: '室田 淳' }, { name: '羽川 豊' }, { name: '湯原 信光' }, { name: '井戸木 鴻樹' },
      { name: '芹澤 信雄' }, { name: '藤田 寛之' }, { name: '谷口 徹' }, { name: '手嶋 多一' }, { name: '宮本 勝昌' },
      { name: '横尾 要' }, { name: '丸山 茂樹' }, { name: '深堀 圭一郎' }, { name: '田中 秀道' }, { name: '横田 真一' },
      { name: '久保谷 健一' }, { name: '今野 康晴' }, { name: '高山 忠洋' }, { name: '矢野 東' }, { name: '近藤 共弘' },
    ],
  },
];

export const youtubeLessonRoster: RosterGroup = {
  slug: 'youtube-lesson',
  label: 'YouTube・レッスン系（30名）',
  description: '掲載初期の流入と拡散に強い発信者候補',
  entries: [
    { name: 'Tera-You', note: 'Tera-You-Golf' },
    { name: 'なみき', note: 'なみきゴルフ' },
    { name: '三觜 喜一', note: 'MITSUHASHI TV' },
    { name: '中井 学', note: '中井学ゴルフチャンネル' },
    { name: 'ひぐけん', note: 'ひぐけんゴルフTV' },
    { name: '菅原 大地', note: 'DaichiゴルフTV' },
    { name: '山本 誠二', note: 'ゴルフTV山本道場' },
    { name: 'ショータイム', note: 'Sho-Time Golf' },
    { name: '浦 大輔', note: 'かっ飛びゴルフ塾' },
    { name: '高島 早百合', note: 'さゆーりゴルフ' },
    { name: '井上 透', note: '井上透ゴルフ大学' },
    { name: '河本 結', note: '河本結ちゃんねる' },
    { name: '石井 良介', note: '試打ラボしだるTV' },
    { name: '横田 真一', note: '横田真一チャンネル' },
    { name: '片山 晋呉', note: '45 GOLF' },
    { name: '堀川 未来夢', note: '堀川未来夢チャンネル' },
    { name: 'UUUM GOLF出演陣', note: 'としみん、かえで、阿部桃子等' },
    { name: 'ringolf陣', note: '三枝こころ、じゅんちゃん等' },
    { name: 'チェケラーGOLF', note: '由姫乃せんぱい' },
    { name: 'マイゴルフ', note: 'BONちゃん、さっちゃん' },
    { name: 'Daichi', note: 'ダイチゴルフ' },
    { name: '星野 英正', note: 'オレに任せろ!' },
    { name: '安田 流', note: '安田流ゴルフレッスン' },
    { name: 'スギプロ', note: 'スギプロチャンネル' },
    { name: '新井 淳', note: 'スコアパーソナルゴルフ' },
    { name: 'MIURA CLUB', note: '三浦辰施' },
    { name: 'Sho', note: 'Sho-Time' },
    { name: '宗光 徹', note: 'Toru Golf TV' },
    { name: '大西 翔太', note: 'コーチ' },
    { name: '橋本 真和', note: 'マサトレ' },
  ],
};

export const requiredProfileFields = [
  '名前',
  '生年月日',
  '身長',
  '出身地(国籍)',
  '属性',
  'HS',
  '平均スコア',
  'ベストスコア',
  '14本',
  '使用ボール',
  'SNS',
  '特徴3つ',
] as const;
