export interface ProfilePortraitAttribution {
  creator: string;
  creatorUrl?: string;
  sourceLabel: string;
  sourceUrl: string;
  licenseLabel: string;
  licenseUrl?: string;
  note?: string;
}

export interface ProfilePortraitMedia {
  kind: 'image';
  src: string;
  alt: string;
  attribution: ProfilePortraitAttribution;
}

export interface ProfileSocialEmbed {
  platform: 'instagram' | 'x';
  postUrl: string;
  title: string;
  accountLabel: string;
  note?: string;
}

export interface ProfileVisuals {
  hero: string;
  portrait: string;
  gallery: string[];
  portraitMedia?: ProfilePortraitMedia;
  socialEmbeds?: ProfileSocialEmbed[];
}

const portraitPlaceholder =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 340">
      <circle cx="170" cy="170" r="168" fill="#c9c9c9"/>
      <circle cx="170" cy="126" r="62" fill="#ffffff"/>
      <path d="M62 281c19-53 61-84 108-84s89 31 108 84" fill="#ffffff"/>
    </svg>
  `);

const visualPool: Array<Pick<ProfileVisuals, 'hero' | 'portrait' | 'gallery'>> = [
  {
    hero:
      'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1600&q=80',
    portrait: portraitPlaceholder,
    gallery: [
      'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    hero:
      'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1600&q=80',
    portrait: portraitPlaceholder,
    gallery: [
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    hero:
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1600&q=80',
    portrait: portraitPlaceholder,
    gallery: [
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    hero:
      'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=1600&q=80',
    portrait: portraitPlaceholder,
    gallery: [
      'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];

const reusableMediaBySlug: Record<string, Partial<ProfileVisuals>> = {
  'hideki-matsuyama': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Hideki%20Matsuyama%20ClevelandGolf4-21.jpg',
      alt: 'Hideki Matsuyama at the 2014 WGC-Bridgestone Invitational.',
      attribution: {
        creator: 'Cleveland Golf',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Hideki_Matsuyama_ClevelandGolf4-21.jpg',
        licenseLabel: 'CC BY 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'rory-mcilroy': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Rory%20McIlroy.jpg',
      alt: 'Rory McIlroy practicing at St Andrews in 2010.',
      attribution: {
        creator: 'tourprogolfclubs',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rory_McIlroy.jpg',
        licenseLabel: 'CC BY-SA 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'nelly-korda': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Nelly_Korda%20at%20the%202022%20KPMG%20Women%27s%20PGA%20Championship.jpg',
      alt: 'Nelly Korda at the 2022 KPMG Women’s PGA Championship.',
      attribution: {
        creator: 'Dylan Buell',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Nelly_Korda_at_the_2022_KPMG_Women%27s_PGA_Championship.jpg',
        licenseLabel: 'CC BY 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
    socialEmbeds: [
      {
        platform: 'x',
        postUrl: 'https://x.com/NellyKorda/status/873318285613432832',
        title: 'Nelly Korda 公式投稿',
        accountLabel: '@NellyKorda',
        note: '公式X埋め込み。表示できない環境ではリンクにフォールバックします。',
      },
    ],
  },
  'lydia-ko': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Lydia%20Ko%20at%20the%202022%20KPMG%20Women%27s%20PGA%20Championship.jpg',
      alt: 'Lydia Ko at the 2022 KPMG Women’s PGA Championship.',
      attribution: {
        creator: 'Dylan Buell',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lydia_Ko_at_the_2022_KPMG_Women%27s_PGA_Championship.jpg',
        licenseLabel: 'CC BY 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'tiger-woods': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tiger%20Woods%20July%202010.jpg',
      alt: 'Tiger Woods in 2010.',
      attribution: {
        creator: 'Keith Allison',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tiger_Woods_July_2010.jpg',
        licenseLabel: 'CC BY-SA 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
    socialEmbeds: [
      {
        platform: 'x',
        postUrl: 'https://x.com/TaylorMadeGolf/status/1812897649261179188',
        title: 'TaylorMade Golf による Tiger Woods 投稿',
        accountLabel: '@TaylorMadeGolf',
        note: '公式X埋め込み。表示できない環境ではリンクにフォールバックします。',
      },
    ],
  },
  'scottie-scheffler': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Scottie%20Scheffler%20Ryder%20Cup%202025%20%28cropped%29.jpg',
      alt: 'Scottie Scheffler during the 2025 Ryder Cup.',
      attribution: {
        creator: 'Bryan Berlin',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Scottie_Scheffler_Ryder_Cup_2025_(cropped).jpg',
        licenseLabel: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        note: 'WikiPortraitsの再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
    socialEmbeds: [
      {
        platform: 'x',
        postUrl: 'https://x.com/TheMasters/status/1908993037998452843',
        title: 'The Masters による Scottie Scheffler 投稿',
        accountLabel: '@TheMasters',
        note: '公式X埋め込み。表示できない環境ではリンクにフォールバックします。',
      },
    ],
  },
  'justin-rose': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Justin%20Rose%20at%202015%20PGA%20Championship.jpg',
      alt: 'Justin Rose at the 2015 PGA Championship.',
      attribution: {
        creator: 'Jhansen23',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Justin_Rose_at_2015_PGA_Championship.jpg',
        licenseLabel: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'tommy-fleetwood': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tommy%20Fleetwood%202023.jpg',
      alt: 'Tommy Fleetwood in 2023.',
      attribution: {
        creator: "Professional Golfers' Association (Great Britain and Ireland)",
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tommy_Fleetwood_2023.jpg',
        licenseLabel: 'CC BY 3.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
        note: 'YouTubeのCC BY公開動画由来の再利用可能画像。人物画像のためパブリシティ権は別途留意。',
      },
    },
  },
  'brooks-koepka': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Brooks%20Koepka%202019%20PGA.jpg',
      alt: 'Brooks Koepka at the 2019 PGA Championship.',
      attribution: {
        creator: 'Joe Schilp',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Brooks_Koepka_2019_PGA.jpg',
        licenseLabel: 'CC BY 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'brian-harman': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Brian%20Harman%20at%202015%20Sony%20Open%20in%20Hawaii%20(portrait).png',
      alt: 'Brian Harman at the 2015 Sony Open in Hawaii Pro-Am.',
      attribution: {
        creator: 'Staff Sgt. Christopher Hubenthal',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Brian_Harman_at_2015_Sony_Open_in_Hawaii_(portrait).png',
        licenseLabel: 'Public domain (U.S. Air Force)',
        note: '米空軍職務著作としてパブリックドメイン扱い。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'patrick-reed': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Patrick%20Reed%2001.jpg',
      alt: 'Patrick Reed at the 2018 U.S. Open.',
      attribution: {
        creator: 'Peetlesnumber1',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Patrick_Reed_01.jpg',
        licenseLabel: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'shane-lowry': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shane%20Lowry%208107.jpg',
      alt: 'Shane Lowry after winning the Irish Open in 2009.',
      attribution: {
        creator: 'This is Golf',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Shane_Lowry_8107.jpg',
        licenseLabel: 'CC BY-SA 3.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
        note: 'VRT確認済みの再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'jordan-spieth': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jordan%20Spieth%2020180927.jpg',
      alt: 'Jordan Spieth during practice day at the 2018 Ryder Cup.',
      attribution: {
        creator: 'EEJB',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Jordan_Spieth_20180927.jpg',
        licenseLabel: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'collin-morikawa': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/2024%20Presidents%20Cup%20-%20Max%20Homa%20and%20Collin%20Morikawa%201.jpg',
      alt: 'Collin Morikawa at the 2024 Presidents Cup.',
      attribution: {
        creator: 'Caddyshack01',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:2024_Presidents_Cup_-_Max_Homa_and_Collin_Morikawa_1.jpg',
        licenseLabel: 'CC BY 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        note: '再利用可能画像。Max Homaも写り込む写真です。人物画像のためパブリシティ権は別途留意。',
      },
    },
  },
  'max-homa': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/2024%20Presidents%20Cup%20-%20Max%20Homa%201.jpg',
      alt: 'Max Homa at the 2024 Presidents Cup.',
      attribution: {
        creator: 'Caddyshack01',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:2024_Presidents_Cup_-_Max_Homa_1.jpg',
        licenseLabel: 'CC BY 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'sam-burns': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/2024%20Presidents%20Cup%20-%20Sam%20Burns.jpg',
      alt: 'Sam Burns at the 2024 Presidents Cup.',
      attribution: {
        creator: 'Caddyshack01',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:2024_Presidents_Cup_-_Sam_Burns.jpg',
        licenseLabel: 'CC BY 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'tony-finau': {
    portraitMedia: {
      kind: 'image',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/2024%20Presidents%20Cup%20-%20Tony%20Finau%201.jpg',
      alt: 'Tony Finau at the 2024 Presidents Cup.',
      attribution: {
        creator: 'Caddyshack01',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:2024_Presidents_Cup_-_Tony_Finau_1.jpg',
        licenseLabel: 'CC BY 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        note: '再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
};

const hashSlug = (slug: string) =>
  [...slug].reduce((total, char) => total + char.charCodeAt(0), 0);

export const getProfileVisuals = (slug: string): ProfileVisuals => {
  const index = hashSlug(slug) % visualPool.length;
  const base = visualPool[index];
  const override = reusableMediaBySlug[slug];
  const portrait = override?.portraitMedia?.src || base.portrait;

  return {
    ...base,
    ...override,
    portrait,
  };
};
