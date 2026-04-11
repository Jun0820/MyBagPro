import { instagramProfileImages } from './instagramProfileImages';
import { getProfileSocialOverride } from './profileSocials';

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
  sourceType: 'instagram_profile' | 'commons';
  src: string;
  fallbackSrc?: string;
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

export interface ProfileVisualOptions {
  preferInstagramPortrait?: boolean;
}

interface InstagramProfileImageEntry {
  src: string;
  handle?: string;
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

const golfBackdrop = (start: string, end: string, accent: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${start}"/>
          <stop offset="100%" stop-color="${end}"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#sky)"/>
      <rect y="620" width="1600" height="280" fill="${accent}"/>
      <path d="M0 690 C210 590, 420 560, 640 640 S1080 760, 1600 620 L1600 900 L0 900 Z" fill="#0f5132" opacity="0.45"/>
      <path d="M0 720 C300 630, 470 650, 760 720 S1180 800, 1600 700 L1600 900 L0 900 Z" fill="#0b3d2e" opacity="0.55"/>
      <circle cx="1180" cy="220" r="68" fill="#ffffff" opacity="0.18"/>
      <rect x="1110" y="330" width="8" height="180" rx="4" fill="#f8fafc"/>
      <path d="M1118 330 L1280 380 L1118 440 Z" fill="#ffffff" opacity="0.95"/>
      <circle cx="420" cy="715" r="16" fill="#ffffff"/>
      <circle cx="416" cy="711" r="2.5" fill="#dbeafe"/>
    </svg>
  `);

const visualPool: Array<Pick<ProfileVisuals, 'hero' | 'portrait' | 'gallery'>> = [
  {
    hero: golfBackdrop('#0f172a', '#1d4ed8', '#2f855a'),
    portrait: portraitPlaceholder,
    gallery: [
      golfBackdrop('#0b132b', '#1c2541', '#2f855a'),
      golfBackdrop('#0f172a', '#134e4a', '#2e7d32'),
      golfBackdrop('#111827', '#1d4ed8', '#2f855a'),
    ],
  },
  {
    hero: golfBackdrop('#082f49', '#0f766e', '#3f9d56'),
    portrait: portraitPlaceholder,
    gallery: [
      golfBackdrop('#0b3b2e', '#166534', '#4ade80'),
      golfBackdrop('#0f172a', '#155e75', '#2f855a'),
      golfBackdrop('#1f2937', '#0f766e', '#3f9d56'),
    ],
  },
  {
    hero: golfBackdrop('#172554', '#2563eb', '#2e8b57'),
    portrait: portraitPlaceholder,
    gallery: [
      golfBackdrop('#172554', '#1d4ed8', '#2f855a'),
      golfBackdrop('#0f172a', '#0f766e', '#4d7c0f'),
      golfBackdrop('#1e3a8a', '#0f766e', '#2e8b57'),
    ],
  },
  {
    hero: golfBackdrop('#0f172a', '#14532d', '#2f855a'),
    portrait: portraitPlaceholder,
    gallery: [
      golfBackdrop('#111827', '#166534', '#4ade80'),
      golfBackdrop('#082f49', '#1d4ed8', '#2f855a'),
      golfBackdrop('#0f172a', '#134e4a', '#3f9d56'),
    ],
  },
];

const reusableMediaBySlug: Record<string, Partial<ProfileVisuals>> = {
  'hideki-matsuyama': {
    portraitMedia: {
      kind: 'image',
      sourceType: 'commons',
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
      sourceType: 'commons',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Rory%20McIlroy%20Ryder%20Cup%202025-195%20%28cropped%29.jpg',
      alt: 'Rory McIlroy during the 2025 Ryder Cup.',
      attribution: {
        creator: 'Bryan Berlin',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rory_McIlroy_Ryder_Cup_2025-195_(cropped).jpg',
        licenseLabel: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        note: 'WikiPortraitsの再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'nelly-korda': {
    portraitMedia: {
      kind: 'image',
      sourceType: 'commons',
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
      sourceType: 'commons',
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
      sourceType: 'commons',
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
      sourceType: 'commons',
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
      sourceType: 'commons',
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
      sourceType: 'commons',
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
      sourceType: 'commons',
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
      sourceType: 'commons',
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
      sourceType: 'commons',
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
  'patrick-cantlay': {
    portraitMedia: {
      kind: 'image',
      sourceType: 'commons',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Patrick%20Cantlay%20Ryder%20Cup%202025-146%20%28cropped%29.jpg',
      alt: 'Patrick Cantlay during the 2025 Ryder Cup.',
      attribution: {
        creator: 'Bryan Berlin',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Patrick_Cantlay_Ryder_Cup_2025-146_(cropped).jpg',
        licenseLabel: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        note: 'WikiPortraitsの再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'shane-lowry': {
    portraitMedia: {
      kind: 'image',
      sourceType: 'commons',
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
      sourceType: 'commons',
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
      sourceType: 'commons',
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
      sourceType: 'commons',
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
      sourceType: 'commons',
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
      sourceType: 'commons',
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
  'xander-schauffele': {
    portraitMedia: {
      kind: 'image',
      sourceType: 'commons',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Xander%20Schauffele%20Ryder%20Cup%202025%20%28cropped%29.jpg',
      alt: 'Xander Schauffele during the 2025 Ryder Cup.',
      attribution: {
        creator: 'Bryan Berlin',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Xander_Schauffele_Ryder_Cup_2025_(cropped).jpg',
        licenseLabel: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        note: 'WikiPortraitsの再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'keegan-bradley': {
    portraitMedia: {
      kind: 'image',
      sourceType: 'commons',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/BMW%20Aronimink%20Tournament%20-%202018%20-%20Keegan%20Bradley%20%2830732646368%29.jpg',
      alt: 'Keegan Bradley at the 2018 BMW Championship at Aronimink.',
      attribution: {
        creator: 'Michael Stokes',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:BMW_Aronimink_Tournament_-_2018_-_Keegan_Bradley_(30732646368).jpg',
        licenseLabel: 'CC BY 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
        note: 'Flickr review済みの再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
  'cameron-smith': {
    portraitMedia: {
      kind: 'image',
      sourceType: 'commons',
      src: 'https://commons.wikimedia.org/wiki/Special:FilePath/2017%20Australian%20Open%20-%20Cameron%20Smith%20%2842152296975%29%20%28cropped%29.jpg',
      alt: 'Cameron Smith at the 2017 Australian Open.',
      attribution: {
        creator: 'Justin Falconer',
        sourceLabel: 'Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:2017_Australian_Open_-_Cameron_Smith_(42152296975)_(cropped).jpg',
        licenseLabel: 'CC BY 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
        note: 'Flickr review済みの再利用可能画像。人物画像のため大会や国ごとのパブリシティ権は別途留意。',
      },
    },
  },
};

const hashSlug = (slug: string) =>
  [...slug].reduce((total, char) => total + char.charCodeAt(0), 0);

const buildInstagramPortraitMedia = (instagramHandle: string, profileImageSrc: string, fallbackSrc?: string): ProfilePortraitMedia => {
  const normalizedHandle = instagramHandle.replace(/^@/, '').trim();

  return {
    kind: 'image',
    sourceType: 'instagram_profile',
    src: profileImageSrc,
    fallbackSrc,
    alt: `${normalizedHandle} のInstagramプロフィール画像`,
    attribution: {
      creator: `@${normalizedHandle}`,
      creatorUrl: `https://www.instagram.com/${normalizedHandle}/`,
      sourceLabel: 'Instagram',
      sourceUrl: `https://www.instagram.com/${normalizedHandle}/`,
      licenseLabel: 'プロフィール画像',
      note: '公開Instagramアカウントのプロフィール画像を参照しています。画像の権利はアカウント所有者または権利者に帰属します。',
    },
  };
};

export const getProfileVisuals = (
  slug: string,
  instagramHandle?: string,
  options: ProfileVisualOptions = {}
): ProfileVisuals => {
  const index = hashSlug(slug) % visualPool.length;
  const base = visualPool[index];
  const override = reusableMediaBySlug[slug];
  const fallbackPortrait = override?.portraitMedia?.src || base.portrait;
  const localInstagramImageEntry = instagramProfileImages[slug];
  const normalizedInstagramHandle = instagramHandle?.replace(/^@/, '').trim().toLowerCase();
  const localOverrideHandle = getProfileSocialOverride(slug)?.instagramHandle?.replace(/^@/, '').trim().toLowerCase();
  const instagramImageData: InstagramProfileImageEntry | undefined =
    typeof localInstagramImageEntry === 'string'
      ? { src: localInstagramImageEntry }
      : localInstagramImageEntry;
  const cachedHandle = instagramImageData?.handle?.replace(/^@/, '').trim().toLowerCase();
  const instagramImageSrc =
    instagramImageData &&
    (!normalizedInstagramHandle || !localOverrideHandle || normalizedInstagramHandle === localOverrideHandle) &&
    (!normalizedInstagramHandle || !cachedHandle || normalizedInstagramHandle === cachedHandle)
      ? instagramImageData.src
      : undefined;
  const instagramPortrait =
    instagramHandle && instagramImageSrc
      ? buildInstagramPortraitMedia(instagramHandle, instagramImageSrc, fallbackPortrait)
      : undefined;
  const commonsPortrait = override?.portraitMedia
    ? { ...override.portraitMedia, fallbackSrc: base.portrait }
    : undefined;
  const portraitMedia = options.preferInstagramPortrait
    ? instagramPortrait || commonsPortrait
    : commonsPortrait || instagramPortrait;
  const portrait = portraitMedia?.src || base.portrait;

  return {
    ...base,
    ...override,
    portraitMedia,
    portrait,
  };
};
