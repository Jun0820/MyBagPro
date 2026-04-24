/**
 * Rakuten Product Search API Integration
 * Fetches product information and images from Rakuten Market
 */

const RAKUTEN_API_BASE_URL = 'https://app.rakuten.co.jp/services/api/Product/Search/20170426';

interface RakutenProduct {
    itemName: string;
    itemUrl: string;
    mediumImageUrl: string;
    smallImageUrl: string;
    price: number;
    shopName: string;
    itemCaption: string;
}

interface RakutenApiResponse {
    Products: Array<{
        Item: {
            itemName: string;
            itemUrl: string;
            mediumImageUrl?: string;
            smallImageUrl?: string;
            itemPrice: number;
            shopName: string;
            itemCaption: string;
        };
    }>;
}

export const searchRakutenProducts = async (
    keyword: string,
    limit: number = 10
): Promise<RakutenProduct[]> => {
    const applicationId = import.meta.env.VITE_RAKUTEN_APPLICATION_ID;
    const affiliateId = import.meta.env.VITE_RAKUTEN_AFFILIATE_ID;

    if (!applicationId) {
        throw new Error('VITE_RAKUTEN_APPLICATION_ID is not set');
    }

    const params = new URLSearchParams({
        applicationId,
        affiliateId: affiliateId || '',
        keyword,
        hits: limit.toString(),
        imageFlag: '1',
        sort: 'sales',
        formatVersion: '2',
    });

    try {
        const response = await fetch(`${RAKUTEN_API_BASE_URL}?${params}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Rakuten API error: ${response.status}`);
        }

        const data: RakutenApiResponse = await response.json();

        if (!data.Products || data.Products.length === 0) {
            return [];
        }

        return data.Products.map((product) => ({
            itemName: product.Item.itemName,
            itemUrl: product.Item.itemUrl,
            mediumImageUrl: product.Item.mediumImageUrl || product.Item.smallImageUrl || '',
            smallImageUrl: product.Item.smallImageUrl || '',
            price: product.Item.itemPrice,
            shopName: product.Item.shopName,
            itemCaption: product.Item.itemCaption,
        }));
    } catch (error) {
        console.error('Error fetching Rakuten products:', error);
        throw error;
    }
};

export const getRakutenProductImage = (mediumImageUrl: string, size: 'small' | 'medium' = 'medium'): string => {
    if (!mediumImageUrl) return '';

    // Rakuten CDN supports different image sizes
    // Replace the size part in the URL if needed
    if (size === 'small') {
        return mediumImageUrl.replace('/mage', '/smal');
    }

    return mediumImageUrl;
};
