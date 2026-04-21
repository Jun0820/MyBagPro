import type { UserProfile } from '../types/golf';

const STORAGE_KEY = 'mybagpro_compare_shortlist';

export interface CompareShortlistItem {
    id: string;
    savedAt: string;
    sourceCategory: string;
    brand: string;
    modelName: string;
    shaft?: string;
    loft?: string;
    matchPercentage: number;
    rank: number;
}

const isBrowser = typeof window !== 'undefined';

const readStorage = (): CompareShortlistItem[] => {
    if (!isBrowser) return [];

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeStorage = (items: CompareShortlistItem[]) => {
    if (!isBrowser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const getCompareShortlist = () => readStorage();

export const removeCompareShortlistItem = (id: string) => {
    const next = readStorage().filter((item) => item.id !== id);
    writeStorage(next);
    return next;
};

export const saveDiagnosisRankingsToCompare = (profile: UserProfile, rankings: any[] = []) => {
    const existing = readStorage();
    const now = new Date().toISOString();

    const nextCandidates = rankings.slice(0, 3).map((item, index) => ({
        id: `${item.brand}-${item.modelName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        savedAt: now,
        sourceCategory: profile.targetCategory || '診断結果',
        brand: item.brand || '',
        modelName: item.modelName || '',
        shaft: typeof item.shafts?.[0] === 'string' ? item.shafts[0] : item.shafts?.[0]?.modelName || '',
        loft: item.loft ? String(item.loft) : '',
        matchPercentage: Number(item.matchPercentage || 0),
        rank: index + 1,
    }));

    const mergedMap = new Map<string, CompareShortlistItem>();

    for (const item of [...nextCandidates, ...existing]) {
        if (!item.brand || !item.modelName) continue;
        if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
        }
    }

    const merged = Array.from(mergedMap.values())
        .sort((a, b) => {
            if (a.rank !== b.rank) return a.rank - b.rank;
            return b.savedAt.localeCompare(a.savedAt);
        })
        .slice(0, 6);

    writeStorage(merged);
    return merged;
};
