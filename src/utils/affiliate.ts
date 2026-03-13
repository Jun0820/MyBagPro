
export const getAffiliateUrl = (brand: string, modelName: string, shop: 'AMAZON' | 'RAKUTEN' | 'RAKUTEN_GOLF_PARTNER' | 'RAKUTEN_GOLF_PARTNER_ANNEX' | 'YAHOO' = 'RAKUTEN'): string => {
    const query = encodeURIComponent(`${brand} ${modelName}`);

    switch (shop) {
        case 'AMAZON':
            // StoreID: funrecipe0f-22
            return `https://www.amazon.co.jp/s?k=${query}&tag=funrecipe0f-22`;
        case 'RAKUTEN':
            // Rakuten Affiliate ID: 1f433d4e.d742b51d.1f433d4f.c13174af
            const target = encodeURIComponent(`https://search.rakuten.co.jp/search/mall/${query}`);
            return `https://hb.afl.rakuten.co.jp/hgc/1f433d4e.d742b51d.1f433d4f.c13174af/?pc=${target}&m=${target}`;
        case 'RAKUTEN_GOLF_PARTNER':
            // Rakuten Golf Partner (Shop ID: 226919)
            // Rakuten Affiliate ID: 1f433d4e.d742b51d.1f433d4f.c13174af
            const rgpTarget = encodeURIComponent(`https://search.rakuten.co.jp/search/mall/${query}/?sid=226919`);
            return `https://hb.afl.rakuten.co.jp/hgc/1f433d4e.d742b51d.1f433d4f.c13174af/?pc=${rgpTarget}&m=${rgpTarget}`;
        case 'RAKUTEN_GOLF_PARTNER_ANNEX':
            // Rakuten Golf Partner Annex (Shop ID: 285653)
            const annexTarget = encodeURIComponent(`https://search.rakuten.co.jp/search/mall/${query}/?sid=285653`);
            return `https://hb.afl.rakuten.co.jp/hgc/1f433d4e.d742b51d.1f433d4f.c13174af/?pc=${annexTarget}&m=${annexTarget}`;
        case 'YAHOO':
            // ValueCommerce: sid=3762568, pid=892534722
            const yahooTarget = encodeURIComponent(`https://shopping.yahoo.co.jp/search?p=${query}`);
            return `http://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3762568&pid=892534722&vc_url=${yahooTarget}`;
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
