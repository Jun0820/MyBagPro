const portraitPlaceholder =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 340">
      <circle cx="170" cy="170" r="168" fill="#c9c9c9"/>
      <circle cx="170" cy="126" r="62" fill="#ffffff"/>
      <path d="M62 281c19-53 61-84 108-84s89 31 108 84" fill="#ffffff"/>
    </svg>
  `);

const visualPool = [
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

const hashSlug = (slug: string) =>
  [...slug].reduce((total, char) => total + char.charCodeAt(0), 0);

export const getProfileVisuals = (slug: string) => {
  const index = hashSlug(slug) % visualPool.length;
  return visualPool[index];
};
