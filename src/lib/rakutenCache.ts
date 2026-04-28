/**
 * Rakuten Product Cache
 * Implements local storage caching with TTL for Rakuten API responses
 */

interface CachedProduct {
    data: any;
    timestamp: number;
    ttl: number; // milliseconds
}

const CACHE_PREFIX = 'rakuten_cache_';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const getRakutenCache = (key: string): any | null => {
    try {
        const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
        if (!cached) return null;

        const { data, timestamp, ttl } = JSON.parse(cached) as CachedProduct;
        const now = Date.now();
        const age = now - timestamp;

        // Check if cache has expired
        if (age > ttl) {
            localStorage.removeItem(`${CACHE_PREFIX}${key}`);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error reading Rakuten cache:', error);
        return null;
    }
};

export const setRakutenCache = (key: string, data: any, ttl: number = DEFAULT_TTL): void => {
    try {
        const cacheData: CachedProduct = {
            data,
            timestamp: Date.now(),
            ttl,
        };
        localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error writing Rakuten cache:', error);
    }
};

export const clearRakutenCache = (key?: string): void => {
    try {
        if (key) {
            localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        } else {
            // Clear all Rakuten cache
            const keys = Object.keys(localStorage);
            keys.forEach((k) => {
                if (k.startsWith(CACHE_PREFIX)) {
                    localStorage.removeItem(k);
                }
            });
        }
    } catch (error) {
        console.error('Error clearing Rakuten cache:', error);
    }
};

export const getCacheKey = (brand: string, model: string, category?: string): string => {
    return `${brand}_${model}_${category || 'general'}`.toLowerCase().replace(/\s+/g, '_');
};
