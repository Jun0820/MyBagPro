import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Database, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClubImageCard } from '../components/clubs/ClubImageCard';
import { loadClubBrands, loadClubModels, type ClubBrand, type ClubModel } from '../lib/clubMaster';
import { applySeo } from '../lib/seo';

const keyBrands = ['TaylorMade', 'Callaway', 'PING', 'Titleist', 'Srixon', 'Cleveland', 'Mizuno', 'Bridgestone', 'Cobra', 'PRGR', 'Yamaha', 'Honma', 'XXIO', 'Odyssey'];

export const ClubsCatalogPage = () => {
  const [brands, setBrands] = useState<ClubBrand[]>([]);
  const [models, setModels] = useState<ClubModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    applySeo({
      title: 'クラブ図鑑 | MyBagPro',
      description: '2006年以降のゴルフクラブのブランド、モデル、画像、ソース、権利情報を整理するMyBagProのクラブ図鑑です。',
      path: '/clubs',
      image: '/article-visuals/clubs-grass.jpg',
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [brandRows, modelRows] = await Promise.all([loadClubBrands(), loadClubModels()]);
        if (!mounted) return;
        setBrands(brandRows);
        setModels(modelRows);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'クラブマスターを読み込めませんでした。');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const brandNames = useMemo(() => (brands.length > 0 ? brands.map((brand) => brand.name) : keyBrands), [brands]);

  return (
    <div className="min-h-screen bg-[#F7F8F5] pb-20">
      <section className="rounded-[2rem] bg-[#0B0F0D] px-5 py-8 text-white md:px-8 md:py-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#C7A45D] ring-1 ring-white/12">
          <Database size={14} />
          Club Database
        </div>
        <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">クラブ画像とモデル情報を、権利情報つきで蓄積する。</h1>
        <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/72">
          MyBagProは、2006年以降のクラブモデルをSEO資産として整備していきます。画像は出典・ライセンス・確認日を管理し、権利不明な画像を勝手に保存しません。
        </p>
        <a
          href="https://golfid.jp/create"
          className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#C7A45D] px-5 text-sm font-black text-[#0B0F0D]"
        >
          このクラブ、あなたにも合う？
          <ArrowRight size={16} />
        </a>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ['画像権利を管理', 'source_url、license_status、credit、verified_atを保持します。'],
          ['2006年以降に対応', 'release_yearで年代別のクラブ図鑑へ拡張できます。'],
          ['Golf IDと接続', '将来はMy Bagのクラブ選択と画像表示につなげます。'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <ShieldCheck className="h-5 w-5 text-[#1F7A4D]" />
            <h2 className="mt-3 text-base font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{body}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-[1.7rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1F7A4D]">Brands</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">主要ブランド</h2>
          </div>
          <Link to="/clubs/drivers" className="text-sm font-black text-[#1F7A4D]">ドライバー一覧へ</Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {brandNames.map((name) => (
            <span key={name} className="rounded-full bg-[#F5F7F4] px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-black/5">{name}</span>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1F7A4D]">Verified Models</p>
            <h2 className="text-2xl font-black text-slate-950">登録済みクラブモデル</h2>
          </div>
        </div>

        {loading && <div className="rounded-2xl bg-white p-5 text-sm font-black text-slate-500 ring-1 ring-black/5">クラブマスターを読み込んでいます...</div>}
        {error && <div className="rounded-2xl bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-800 ring-1 ring-amber-100">クラブマスターSQL適用後に一覧が表示されます。{error}</div>}
        {!loading && !error && models.length === 0 && (
          <div className="rounded-[1.7rem] bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
            <h3 className="text-xl font-black text-slate-950">確認済みモデルから順番に公開します。</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
              サンプル製品や権利不明画像は出しません。まずは主要ブランドから、公式URL・画像権利・確認日つきで登録していきます。
            </p>
          </div>
        )}
        {models.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {models.slice(0, 24).map((model) => (
              <ClubImageCard key={model.id} model={model} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-[1.7rem] bg-[#0B0F0D] p-5 text-white">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C7A45D]">Golf ID</p>
        <h2 className="mt-2 text-2xl font-black">Golf IDを作って、AI上達診断を受ける</h2>
        <p className="mt-2 text-sm font-semibold leading-7 text-white/70">
          気になるクラブを見つけたら、自分のスコア・悩み・使用クラブと合わせて診断できます。
        </p>
        <a href="https://golfid.jp/create" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-[#0B0F0D]">
          無料でGolf IDを作る
        </a>
      </section>
    </div>
  );
};
