import { ArrowLeft, Check, ShoppingCart } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AFFILIATE_SHOPS, getAffiliateUrl } from '../utils/affiliate';
import { getDriverDetailBySlug } from '../data/featuredSettings';

export const BuyPage = () => {
  const navigate = useNavigate();
  const { category, slug } = useParams<{ category: string; slug: string }>();

  const isDriver = category === 'drivers';
  const driver = isDriver && slug ? getDriverDetailBySlug(slug) : undefined;

  if (!driver) {
    return (
      <div className="min-h-[60vh] rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-3xl font-black text-trust-navy">購入比較は準備中です。</h1>
        <p className="mt-3 text-sm text-slate-600">確認済みの製品データが揃ったものから順次公開します。</p>
        <button
          onClick={() => navigate('/clubs/drivers')}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
        >
          一覧へ戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <button
        onClick={() => navigate(`/clubs/drivers/${driver.slug}`)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-trust-navy"
      >
        <ArrowLeft size={16} />
        製品詳細へ戻る
      </button>

      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white md:px-10 md:py-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">
          <ShoppingCart size={14} />
          Buy Comparison
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">{driver.brand} {driver.name}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
          閲覧の次にある行動として、購入先比較を置いています。新品・中古・ECショップを横断して、すぐ次の行動へ進める構成です。
        </p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Product Summary</div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">{driver.heroCatch}</h2>
          <div className="mt-6 space-y-3">
            {driver.idealFor.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <Check size={16} className="text-golf-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[1.25rem] border border-amber-100 bg-amber-50 px-4 py-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Price Range</div>
            <div className="mt-2 text-sm font-bold text-trust-navy">{driver.priceRange}</div>
          </div>
        </div>

        <div className="space-y-4">
          {AFFILIATE_SHOPS.map((shop) => (
            <a
              key={shop.id}
              href={getAffiliateUrl(driver.brand, driver.name, shop.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Shop</div>
                <div className="mt-2 text-2xl font-black text-trust-navy">{shop.name}</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {driver.brand} {driver.name} をそのまま検索し、在庫や価格を確認できます。
                </p>
              </div>
              <div className="inline-flex items-center justify-center rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white">
                在庫を見る
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};
