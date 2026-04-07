import { CarFront, ShoppingBag } from 'lucide-react';

export const DriversCatalogPage = () => {
  return (
    <div className="min-h-screen pb-20">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-6 py-10 text-white md:px-10 md:py-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">
          <CarFront size={14} />
          Driver Catalog
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
          人気ドライバーから、使っている人と購入導線までつなげる。
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
          製品軸のページは、検索流入と収益化の両方を担います。まずは人気モデルの一覧から、使用者と購入を行き来できる入口を置きます。
        </p>
      </section>

      <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">No Sample Products</div>
        <h2 className="mt-3 text-2xl font-black text-trust-navy">ドライバー一覧は確認済みデータのみで公開します。</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          サンプル製品や推定スペックは掲載しません。ブランド、モデル、シャフト、飛距離、参照元URLまで確認できたものから順次公開します。
        </p>
      </section>

      <section className="mt-10 rounded-[2rem] border border-amber-100 bg-amber-50 px-6 py-8 md:px-8">
        <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
          <ShoppingBag size={14} />
          Commerce Layer
        </div>
        <h2 className="mt-3 text-2xl font-black text-trust-navy">このカテゴリページが、そのまま購入比較の入口になります。</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          次の実装では、各モデルに新品・中古・ショップ比較を差し込み、診断結果の候補とも相互にリンクさせると収益導線が太くなります。
        </p>
      </section>
    </div>
  );
};
