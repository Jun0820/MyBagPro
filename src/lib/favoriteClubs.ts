const STORAGE_KEY = 'mybagpro_favorite_clubs';

export interface FavoriteClubItem {
    id: string;
    savedAt: string;
    brand: string;
    modelName: string;
    category: string;
    shaft?: string;
    loft?: string;
}

const isBrowser = typeof window !== 'undefined';

const readStorage = (): FavoriteClubItem[] => {
    if (!isBrowser) return [];

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeStorage = (items: FavoriteClubItem[]) => {
    if (!isBrowser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const getFavoriteClubs = () => readStorage();

export const saveFavoriteClub = (item: Omit<FavoriteClubItem, 'savedAt'>) => {
    const existing = readStorage();
    const nextItem: FavoriteClubItem = {
        ...item,
        savedAt: new Date().toISOString(),
    };

    const merged = [nextItem, ...existing.filter((club) => club.id !== item.id)].slice(0, 12);
    writeStorage(merged);
    return merged;
};

export const removeFavoriteClub = (id: string) => {
    const next = readStorage().filter((item) => item.id !== id);
    writeStorage(next);
    return next;
};
