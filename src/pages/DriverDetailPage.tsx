import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveRecentlyViewed } from '../lib/recentlyViewed';

export const DriverDetailPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    saveRecentlyViewed({
      id: 'club:drivers-catalog',
      type: 'club',
      title: '人気ドライバー詳細',
      subtitle: '確認済みモデルのみ順次公開',
      href: '/clubs/drivers',
    });
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <button
        onClick={() => navigate('/clubs/drivers')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-trust-navy"
      >
        <ArrowLeft size={16} />
        人気ドライバー一覧へ戻る
      </button>
      <section className="rounded-[2rem] border border-slate-200 bg-white p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
          <ShoppingBag size={14} />
          Verified Data Only
        </div>
        <h1 className="mt-5 text-3xl font-black text-trust-navy md:text-5xl">ドライバー詳細ページは実データ確認後に公開します。</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          サンプル製品や仮スペックは表示しません。ブランド、モデル、シャフト、飛距離、参照元まで確認できたドライバーから順次公開します。
        </p>
      </section>
    </div>
  );
};
