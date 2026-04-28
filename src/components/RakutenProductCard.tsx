import React, { useEffect, useState } from 'react';
import { ShoppingBag, AlertCircle, Loader2 } from 'lucide-react';
import { searchRakutenProducts, getRakutenProductImage } from '../utils/rakutenApi';
import { getAffiliateUrl } from '../utils/affiliate';
import { getRakutenCache, setRakutenCache, getCacheKey } from '../lib/rakutenCache';
import { cn } from '../lib/utils';

interface RakutenProductCardProps {
    brand?: string;
    model?: string;
    category?: string;
    className?: string;
    showPrice?: boolean;
    showShop?: boolean;
}

export const RakutenProductCard: React.FC<RakutenProductCardProps> = ({
    brand,
    model,
    category,
    className,
    showPrice = true,
    showShop = true,
}) => {
    const [product, setProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!brand || !model) return;

        const fetchProduct = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const cacheKey = getCacheKey(brand, model, category);
                
                // Try to get from cache first
                const cachedProduct = getRakutenCache(cacheKey);
                if (cachedProduct) {
                    setProduct(cachedProduct);
                    setIsLoading(false);
                    return;
                }

                // Fetch from API if not cached
                const searchTerm = `${brand} ${model}`;
                const results = await searchRakutenProducts(searchTerm, 1);

                if (results.length > 0) {
                    setProduct(results[0]);
                    // Cache the result
                    setRakutenCache(cacheKey, results[0]);
                } else {
                    setError('商品が見つかりません');
                }
            } catch (err) {
                console.error('Failed to fetch Rakuten product:', err);
                setError('商品情報の取得に失敗しました');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [brand, model, category]);

    if (isLoading) {
        return (
            <div className={cn('flex items-center justify-center bg-slate-50 rounded-lg p-4', className)}>
                <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className={cn('flex items-center gap-2 bg-slate-50 rounded-lg p-3 text-xs text-slate-500', className)}>
                <AlertCircle size={14} />
                {error || '画像なし'}
            </div>
        );
    }

    const imageUrl = getRakutenProductImage(product.mediumImageUrl, 'medium');
    const affiliateUrl = getAffiliateUrl(product.itemUrl, 'rakuten');

    return (
        <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                'group relative overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:shadow-md',
                className
            )}
        >
            <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={product.itemName}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/0 group-hover:bg-black/5 transition-colors">
                    <ShoppingBag size={20} className="text-white/0 group-hover:text-white/60 transition-colors" />
                </div>
            </div>

            <div className="p-3 space-y-2">
                <div className="text-sm font-black text-trust-navy line-clamp-2">{product.itemName}</div>

                {showPrice && (
                    <div className="text-sm font-bold text-[#176534]">
                        ¥{product.price.toLocaleString()}
                    </div>
                )}

                {showShop && (
                    <div className="text-xs text-slate-500">{product.shopName}</div>
                )}

                <div className="pt-2 inline-flex items-center gap-1 rounded-full bg-[#166534]/10 px-2 py-1 text-xs font-black text-[#166534]">
                    <ShoppingBag size={12} />
                    楽天で見る
                </div>
            </div>
        </a>
    );
};
