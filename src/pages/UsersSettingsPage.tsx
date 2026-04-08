import { ArrowRight, Users, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UsersSettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen space-y-8 pb-20">
      <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-10 md:py-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-golf-50 px-4 py-2 text-xs font-black text-golf-700">
          <Users size={14} />
          みんなのMy Bag
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-trust-navy md:text-6xl">
          一般ゴルファーの
          <span className="text-golf-700">現実的なセッティング</span>
          を見られる場所へ
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
          プロの構成だけでなく、一般ゴルファーのバッグも見られるようになると、自分に近い参考例を探しやすくなります。今は公開準備中ですが、今後の中心導線になるページです。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black text-slate-400">これからできること</div>
          <h2 className="mt-3 text-lg font-black text-trust-navy">自分に近い人を探す</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">ヘッドスピードや平均スコアが近い人のバッグを見ると、真似しやすい候補が見つかります。</p>
        </article>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black text-slate-400">これからできること</div>
          <h2 className="mt-3 text-lg font-black text-trust-navy">公開バッグを比較する</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">プロだけでなく、一般ユーザー同士でも構成の違いを見比べられるようにしていきます。</p>
        </article>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black text-slate-400">これからできること</div>
          <h2 className="mt-3 text-lg font-black text-trust-navy">公開から診断へ進む</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">公開バッグを見たあとに、そのまま比較やAI診断へつなげられる体験を目指しています。</p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="text-xs font-black text-slate-400">現在の状態</div>
        <h2 className="mt-3 text-2xl font-black text-trust-navy">一般ユーザーの公開バッグは準備中です</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          サンプルバッグや仮データは表示しません。公開バッグ機能は、確認済みプロフィールの導線と運用ルールが整ってから段階的に開放します。
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate('/mybag/create')}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
          >
            自分のMy Bagを作る
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/settings/pros')}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700"
          >
            先にプロのセッティングを見る
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-6 md:p-8">
        <div className="inline-flex items-center gap-2 text-xs font-black text-cyan-700">
          <Waves size={14} />
          今後の広がり
        </div>
        <h2 className="mt-3 text-2xl font-black text-trust-navy">見る人が、次に公開する人になる流れを作る</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          一般ユーザーの一覧は、サイトの回遊を増やす大事な入口です。自分に近いセッティングが見られると、次は自分のバッグも登録したくなる流れを作れます。
        </p>
      </section>
    </div>
  );
};
