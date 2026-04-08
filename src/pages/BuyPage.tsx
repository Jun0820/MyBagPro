import { ArrowLeft, Check, ShoppingCart } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDriverDetailBySlug } from '../data/featuredSettings';
import { trackEvent } from '../lib/analytics';
import { AFFILIATE_SHOPS, getAffiliateUrl } from '../utils/affiliate';

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
    <div className="min-h-screen space-y-8 pb-20">
      <button
        onClick={() => navigate(`/clubs/drivers/${driver.slug}`)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-trust-navy"
      >
        <ArrowLeft size={16} />
        製品詳細へ戻る
      </button>

      <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-10 md:py-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">
          <ShoppingCart size={14} />
          購入比較
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-trust-navy md:text-6xl">
          {driver.brand} {driver.name}
          の購入先を比べる
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
          ここでは、気になったクラブをどこで確認・購入するかを見やすく整理しています。まず製品の特徴を確認して、そのあと各ショップの在庫確認へ進んでください。
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <div className="text-xs font-black text-slate-400">向いている人</div>
            <div className="mt-2 text-sm font-bold text-trust-navy">{driver.fit}</div>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <div className="text-xs font-black text-slate-400">弾道の傾向</div>
            <div className="mt-2 text-sm font-bold text-trust-navy">{driver.launch}</div>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <div className="text-xs font-black text-slate-400">価格帯の目安</div>
            <div className="mt-2 text-sm font-bold text-trust-navy">{driver.priceRange}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-xs font-black text-slate-400">このクラブの見どころ</div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">{driver.heroCatch}</h2>
          <div className="mt-6 space-y-3">
            {driver.idealFor.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                <Check size={16} className="mt-1 shrink-0 text-golf-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-xs font-black text-slate-400">ショップ別に見る</div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">在庫や価格を確認する</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            各ショップで検索結果へ移動します。新品・中古・在庫状況などを確認しながら、自分に合う購入先を選んでください。
          </p>

          <div className="mt-6 space-y-4">
            {AFFILIATE_SHOPS.map((shop, index) => (
              <a
                key={shop.id}
                href={getAffiliateUrl(driver.brand, driver.name, shop.id)}
                onClick={() =>
                  trackEvent('click_affiliate_shop', {
                    source_page: 'buy_page',
                    category: category ?? 'drivers',
                    product_slug: driver.slug,
                    product_name: `${driver.brand} ${driver.name}`,
                    shop_id: shop.id,
                    shop_name: shop.name,
                  })
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition-all hover:-translate-y-0.5 hover:border-golf-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-black text-slate-400">ショップ {index + 1}</div>
                    <div className="mt-2 text-xl font-black text-trust-navy">{shop.name}</div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">外部サイトへ</div>
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  {driver.brand} {driver.name} の検索結果を開きます。価格や在庫、出品状況を確認できます。
                </p>
                <div className="inline-flex items-center justify-center rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white">
                  在庫を見る
                </div>
              </a>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-6 md:p-8">
        <h2 className="text-2xl font-black text-trust-navy">購入前にやっておくと安心なこと</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-cyan-100">
            <div className="text-xs font-black text-slate-400">1</div>
            <div className="mt-2 text-base font-black text-trust-navy">まず製品詳細を見る</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">自分に合うタイプかどうかを確認してからショップへ進みます。</p>
          </div>
          <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-cyan-100">
            <div className="text-xs font-black text-slate-400">2</div>
            <div className="mt-2 text-base font-black text-trust-navy">価格だけで決めない</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">新品か中古か、状態や在庫も合わせて確認するのがおすすめです。</p>
          </div>
          <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-cyan-100">
            <div className="text-xs font-black text-slate-400">3</div>
            <div className="mt-2 text-base font-black text-trust-navy">迷ったら診断に戻る</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">自分に合うか不安なときは、比較やAI診断を先に使う方が失敗しにくいです。</p>
          </div>
        </div>
      </section>
    </div>
  );
};
