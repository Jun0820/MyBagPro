import { ArrowRight, Users, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UsersSettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-10 md:px-10 md:py-14">
        <div className="inline-flex items-center gap-2 rounded-full bg-golf-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-golf-700">
          <Users size={14} />
          Community Bags
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-trust-navy md:text-6xl">
          みんなのMy Bagを見て、自分に近い現実解を探せる場所へ。
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          一般ゴルファーのセッティングは、プロよりも自分事化しやすいのが強みです。
          この一覧は、将来的にヘッドスピードや平均スコアで絞って回遊しやすくする前提のベースになります。
        </p>
      </section>

      <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Community Publishing</div>
        <h2 className="mt-3 text-2xl font-black text-trust-navy">一般ユーザーの公開バッグは準備中です。</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          サンプルバッグや仮データは表示しません。公開バッグ機能は、確認済みプロフィール導線と運用ルールが整ってから開放します。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/mybag/create')}
            className="inline-flex items-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-900"
          >
            自分のMy Bagを作る
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] bg-slate-900 px-6 py-8 text-white md:px-8">
        <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">
          <Waves size={14} />
          Growth Loop
        </div>
        <h2 className="mt-3 text-2xl font-black">見る人が、次に登録する人になる構造を作る。</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          一般ユーザーの一覧は、UGCを増やす入口です。バッグ公開のメリットを明確にして、比較や診断の文脈で投稿が増える導線にしていくのが相性良いです。
        </p>
      </section>
    </div>
  );
};
