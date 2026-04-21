const STORAGE_KEY = 'mybagpro_recently_viewed';

export type RecentlyViewedItem = {
    id: string;
    type: 'profile' | 'article' | 'club';
    title: string;
    subtitle?: string;
    href: string;
    viewedAt: string;
};

const isBrowser = typeof window !== 'undefined';

const readItems = (): RecentlyViewedItem[] => {
    if (!isBrowser) return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeItems = (items: RecentlyViewedItem[]) => {
    if (!isBrowser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const getRecentlyViewed = () => readItems();

export const saveRecentlyViewed = (item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    const items = readItems();
    const next: RecentlyViewedItem[] = [
        { ...item, viewedAt: new Date().toISOString() },
        ...items.filter((existing) => existing.id !== item.id),
    ].slice(0, 8);
    writeItems(next);
    return next;
};
