import { useEffect, useState } from 'react';
import { ArrowRight, Brain, Eye, Plus, Radar, Search, ShoppingBag, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiagnosis } from '../context/DiagnosisContext';
import { discoveryPaths } from '../data/featuredSettings';
import { fetchPublishedSettingProfiles, type PublicSettingProfile } from '../lib/contentProfiles';

export const Home = () => {
  const { user } = useDiagnosis();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<PublicSettingProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      setIsLoadingProfiles(true);
      const data = await fetchPublishedSettingProfiles();
      if (isMounted) {
        setProfiles(data);
        setIsLoadingProfiles(false);
      }
    };

    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-slate-50/50 font-sans text-trust-navy">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-12 text-white md:px-10 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.22),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(34,211,238,0.16),_transparent_30%)]" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-cyan-200">
            <Eye size={14} />
            Settings Discovery Platform
          </div>

          {user?.isLoggedIn && (
            <div className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/90 backdrop-blur-sm">
              おかえりなさい、{user.name} さん
            </div>
          )}

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-7xl md:leading-[1.05]">
                プロとみんなの
                <span className="bg-gradient-to-r from-cyan-300 to-golf-300 bg-clip-text text-transparent">クラブセッティング</span>
                を見つける場所へ。
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                まずは「誰が、何を使っているか」を見てもらうサイトへ。
                ツアープロ、インフルエンサー、一般ゴルファーの14本を見て、
                参考にしたら自分のバッグを登録し、最後にAI診断と購入へつなげます。
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate('/settings/pros')}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-black text-slate-900 shadow-2xl transition-all hover:scale-[1.01]"
                >
                  人気のセッティングを見る
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/mybag/create')}
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-sm font-black text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <Plus size={18} />
                  自分のMy Bagを作る
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                <span>完全無料</span>
                <span>プロ掲載を拡張可能</span>
                <span>AI診断と購入導線を内包</span>
              </div>
            </div>

            <div className="grid gap-4">
              {profiles.slice(0, 3).map((setting) => (
                <button
                  key={setting.slug}
                  onClick={() => navigate(`/settings/pros/${setting.slug}`)}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-left backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">{setting.type}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{setting.headSpeed}</div>
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-white">{setting.name}</h2>
                  <p className="mt-2 text-sm font-bold text-golf-200">{setting.tagline}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {setting.clubs.slice(0, 3).map((club) => (
                      <span key={`${setting.slug}-${club.category}`} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                        {club.model}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
              {!isLoadingProfiles && profiles.length === 0 && (
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-left backdrop-blur-md">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Verified Only</div>
                  <h2 className="mt-3 text-2xl font-black text-white">掲載準備中</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    確認済みの14本データが揃い次第、ここに公開します。途中までしか確認できていない情報は表示しません。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-golf-600">Start Here</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-trust-navy md:text-5xl">
              見たい情報からすぐ入れる導線を先に作る
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {discoveryPaths.map((path) => (
            <button
              key={path.label}
              onClick={() => navigate(path.href)}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="text-sm font-black text-trust-navy">{path.label}</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{path.description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-golf-700">
                Explore
                <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Featured Settings</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-trust-navy md:text-5xl">
              いま見てもらいたいセッティング
            </h2>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {profiles.slice(0, 3).map((setting) => (
            <article key={setting.slug} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {setting.type}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{setting.style}</div>
              </div>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-trust-navy">{setting.name}</h3>
              <p className="mt-2 text-sm font-bold text-golf-700">{setting.tagline}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{setting.summary}</p>

              <div className="mt-5 grid gap-3">
                {setting.clubs.slice(0, 4).map((club) => (
                  <div key={`${setting.slug}-${club.category}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-bold text-slate-500">{club.category}</span>
                    <span className="font-bold text-trust-navy">{club.model}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {setting.strengths.map((strength) => (
                  <span key={strength} className="rounded-full border border-golf-200 bg-golf-50 px-3 py-1 text-xs font-bold text-golf-700">
                    {strength}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/settings/pros/${setting.slug}`)}
                  className="inline-flex items-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-900"
                >
                  セッティングを見る
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate('/diagnosis')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:border-golf-400 hover:text-golf-700"
                >
                  この構成を参考に診断
                </button>
              </div>
            </article>
          ))}
          {!isLoadingProfiles && profiles.length === 0 && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">No Unverified Data</div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-trust-navy">公開できる確認済みセッティングを準備中です。</h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                サンプルや推定値は表示しません。14本の構成が確認できた掲載データから順次公開します。
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Search size={20} />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Popular Drivers</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-trust-navy md:text-4xl">
              人気クラブから使用者と購入に入る導線
            </h2>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-left">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Verified Product Data Only</div>
          <h3 className="mt-2 text-xl font-black text-trust-navy">ドライバー製品データは確認完了後に公開します。</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            サンプル製品は表示しません。ブランド、モデル、シャフト、飛距離、参照元URLまで確認できたものだけ公開します。掲載プロフィール側も14本確認できたものだけを公開します。
          </p>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-8">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Community</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-trust-navy md:text-5xl">
            みんなのMy Bagが増えるほど、サイトが強くなる
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-gradient-to-br from-golf-50 to-cyan-50 p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-golf-700">
              <Users size={14} />
              Community Growth
            </div>
            <h3 className="mt-5 text-3xl font-black tracking-tight text-trust-navy">
              見る人が、次に登録する人になる。
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              一般ユーザーの公開バッグを増やしていくと、プロの世界とアマチュアの現実解を往復できるサイトになります。
              それが比較、診断、購入の導線を自然に強くします。
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/settings/users')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-900"
              >
                みんなのMy Bagを見る
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/mybag/create')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-golf-200 bg-white px-5 py-3 text-sm font-black text-golf-700 transition-colors hover:border-golf-400"
              >
                自分のバッグも公開する
              </button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Community Publishing</div>
            <h3 className="mt-3 text-xl font-black text-trust-navy">一般ユーザー公開は実データ運用開始後に開放します。</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              まずはプロ・インフルエンサーの確認済み掲載を先に整え、その後に一般ユーザーの公開機能を段階的に開放します。
            </p>
          </div>
        </div>
      </section>

      <section className="mt-14 rounded-[2rem] bg-slate-900 px-6 py-8 text-white md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">
              <Brain size={14} />
              AI Conversion Layer
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              見つけたセッティングを、自分向けに最適化する。
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              診断は入口ではなく後半の強い導線です。気になった構成を見つけたあとに、自分のバッグを登録して、
              距離の階段、買い替え候補、相性の良いボールまで無料で提案します。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Step 1</div>
              <h3 className="mt-3 text-lg font-black">自分のMy Bagを登録</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">いま使っている14本を入れるだけで診断の下地ができます。</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Step 2</div>
              <h3 className="mt-3 text-lg font-black">無料AI診断</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">弱点、買い替え候補、相性の良いボールをまとめて提案します。</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Step 3</div>
              <h3 className="mt-3 text-lg font-black">比較して購入</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">気になったクラブは、その場で比較して購入先へ進めます。</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Step 4</div>
              <h3 className="mt-3 text-lg font-black">公開して回遊を増やす</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">公開バッグが増えるほど、参考にされるサイトとして強くなります。</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate('/diagnosis')}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-900"
          >
            <Sparkles size={16} />
            無料AI診断を試す
          </button>
          <button
            onClick={() => navigate('/ball-diagnosis')}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white"
          >
            <Radar size={16} />
            ボール診断を見る
          </button>
          <button
            onClick={() => navigate('/clubs/drivers')}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white"
          >
            <ShoppingBag size={16} />
            人気クラブから購入導線へ
          </button>
        </div>
      </section>
    </div>
  );
};
