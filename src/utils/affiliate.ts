
const AMAZON_ASSOCIATE_TAG = 'mybagpro-22';
const RAKUTEN_AFFILIATE_ID = import.meta.env.VITE_RAKUTEN_AFFILIATE_ID || '1f433d4e.d742b51d.1f433d4f.c13174af';
const YAHOO_VALUECOMMERCE_SID = '3762568';
const YAHOO_VALUECOMMERCE_PID = '892534722';

export const getAffiliateUrl = (brand: string, modelName: string, shop: 'AMAZON' | 'RAKUTEN' | 'RAKUTEN_GOLF_PARTNER' | 'RAKUTEN_GOLF_PARTNER_ANNEX' | 'YAHOO' = 'RAKUTEN'): string => {
    const query = encodeURIComponent(`${brand} ${modelName}`);

    switch (shop) {
        case 'AMAZON':
            return `https://www.amazon.co.jp/s?k=${query}&tag=${AMAZON_ASSOCIATE_TAG}`;
        case 'RAKUTEN':
            const target = encodeURIComponent(`https://search.rakuten.co.jp/search/mall/${query}`);
            return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${target}&m=${target}`;
        case 'RAKUTEN_GOLF_PARTNER':
            // Rakuten Golf Partner (Shop ID: 226919)
            const rgpTarget = encodeURIComponent(`https://search.rakuten.co.jp/search/mall/${query}/?sid=226919`);
            return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${rgpTarget}&m=${rgpTarget}`;
        case 'RAKUTEN_GOLF_PARTNER_ANNEX':
            // Rakuten Golf Partner Annex (Shop ID: 285653)
            const annexTarget = encodeURIComponent(`https://search.rakuten.co.jp/search/mall/${query}/?sid=285653`);
            return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${annexTarget}&m=${annexTarget}`;
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
