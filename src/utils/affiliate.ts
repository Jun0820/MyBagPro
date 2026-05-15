
const AMAZON_ASSOCIATE_TAG = 'mybagpro-22';
const RAKUTEN_AFFILIATE_ID = import.meta.env.VITE_RAKUTEN_AFFILIATE_ID || '1f433d4e.d742b51d.1f433d4f.c13174af';
const YAHOO_VALUECOMMERCE_SID = '3762568';
const YAHOO_VALUECOMMERCE_PID = '892534722';

export type AffiliateShopId = 'AMAZON' | 'RAKUTEN' | 'RAKUTEN_GOLF_PARTNER' | 'RAKUTEN_GOLF_PARTNER_ANNEX' | 'YAHOO';

const normalizeShopId = (shop: AffiliateShopId | string = 'RAKUTEN'): AffiliateShopId => {
    const normalized = shop.toUpperCase();
    if (normalized === 'AMAZON') return 'AMAZON';
    if (normalized === 'YAHOO') return 'YAHOO';
    if (normalized === 'RAKUTEN_GOLF_PARTNER') return 'RAKUTEN_GOLF_PARTNER';
    if (normalized === 'RAKUTEN_GOLF_PARTNER_ANNEX') return 'RAKUTEN_GOLF_PARTNER_ANNEX';
    return 'RAKUTEN';
};

const rakutenAffiliateUrl = (targetUrl: string): string => {
    const target = encodeURIComponent(targetUrl);
    return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${target}&m=${target}`;
};

export const getRakutenAffiliateUrl = (targetUrl: string): string => rakutenAffiliateUrl(targetUrl);

export const getAffiliateUrl = (brand: string, modelName: string, shop: AffiliateShopId | string = 'RAKUTEN'): string => {
    const queryText = `${brand} ${modelName}`.trim().replace(/\s+/g, ' ');
    const query = encodeURIComponent(queryText);
    const shopId = normalizeShopId(shop);

    switch (shopId) {
        case 'AMAZON':
            return `https://www.amazon.co.jp/s?k=${query}&tag=${AMAZON_ASSOCIATE_TAG}`;
        case 'RAKUTEN':
            return rakutenAffiliateUrl(`https://search.rakuten.co.jp/search/mall/${query}`);
        case 'RAKUTEN_GOLF_PARTNER':
            // Rakuten Golf Partner (Shop ID: 226919)
            return rakutenAffiliateUrl(`https://search.rakuten.co.jp/search/mall/${query}/?sid=226919`);
        case 'RAKUTEN_GOLF_PARTNER_ANNEX':
            // Rakuten Golf Partner Annex (Shop ID: 285653)
            return rakutenAffiliateUrl(`https://search.rakuten.co.jp/search/mall/${query}/?sid=285653`);
        case 'YAHOO':
            const yahooTarget = encodeURIComponent(`https://shopping.yahoo.co.jp/search?p=${query}`);
            return `http://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${YAHOO_VALUECOMMERCE_SID}&pid=${YAHOO_VALUECOMMERCE_PID}&vc_url=${yahooTarget}`;
        default:
            return `https://www.google.com/search?q=${query}`;
    }
};

export const AFFILIATE_SHOPS = [
    { id: 'RAKUTEN', name: '楽天市場', icon: '🛍️', color: 'bg-red-600' },
    { id: 'YAHOO', name: 'Yahoo!', icon: '📱', color: 'bg-orange-500' },
    { id: 'AMAZON', name: 'Amazon', icon: '📦', color: 'bg-slate-800' },
    { id: 'RAKUTEN_GOLF_PARTNER', name: 'Golf Partner', icon: '⛳️', color: 'bg-green-600' },
    { id: 'RAKUTEN_GOLF_PARTNER_ANNEX', name: 'Golf Partner 別館', icon: '🏢', color: 'bg-emerald-600' }
] as const;
