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
