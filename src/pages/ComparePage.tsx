import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle2, GitCompareArrows, Plus, ShoppingBag, Wrench } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDiagnosis } from '../context/DiagnosisContext';
import { getDriverDetailBySlug } from '../data/featuredSettings';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfileBySlug, type PublicSettingProfile } from '../lib/contentProfiles';

const parseHeadSpeedValue = (value: string) => {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
};

export const ComparePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useDiagnosis();
  const [targetSetting, setTargetSetting] = useState<PublicSettingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const settingSlug = searchParams.get('setting');

  useEffect(() => {
    let isMounted = true;

    const loadSetting = async () => {
      if (!settingSlug) {
        setTargetSetting(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const result = await fetchPublishedSettingProfileBySlug(settingSlug);
      if (isMounted) {
        setTargetSetting(result);
        setIsLoading(false);
      }
    };

    loadSetting();

    return () => {
      isMounted = false;
    };
  }, [settingSlug]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-3xl font-black text-trust-navy">比較対象を読み込んでいます。</h1>
        <p className="mt-3 text-sm text-slate-600">確認済みの掲載データを取得中です。</p>
      </div>
    );
  }

  if (!targetSetting) {
    return (
      <div className="min-h-[60vh] rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-3xl font-black text-trust-navy">比較対象がありません。</h1>
        <p className="mt-3 text-sm text-slate-600">確認済みの掲載プロフィールから比較を開始してください。</p>
        <button
          onClick={() => navigate('/settings/pros')}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
        >
          掲載一覧へ戻る
        </button>
      </div>
    );
  }

  const currentBag = profile.myBag?.clubs ?? [];
  const currentHeadSpeed = profile.headSpeed || null;
  const targetHeadSpeed = parseHeadSpeedValue(targetSetting.headSpeed);

  const comparisonRows = useMemo(() => {
    const targetClubMap = new Map(targetSetting.clubs.map((club) => [club.category, club.model]));
    const currentClubMap = new Map(currentBag.map((club) => [club.category, `${club.brand} ${club.model}`.trim()]));
    const categories = Array.from(new Set([...targetClubMap.keys(), ...currentClubMap.keys()]));

    return categories.map((category) => ({
      category,
      target: targetClubMap.get(category) ?? '未掲載',
      current: currentClubMap.get(category) ?? '未登録',
      matched: targetClubMap.get(category) && currentClubMap.get(category) && targetClubMap.get(category) === currentClubMap.get(category),
    }));
  }, [currentBag, targetSetting.clubs]);

  const matchedCount = comparisonRows.filter((row) => row.matched).length;
  const currentBagFilled = currentBag.length > 0;
  const targetDriver = targetSetting.clubs.find((club) => club.category === 'Driver');
  const targetDriverDetail = targetDriver?.productSlug ? getDriverDetailBySlug(targetDriver.productSlug) : undefined;
  const replacementCandidates = useMemo(() => {
    const candidates = comparisonRows
      .filter((row) => !row.matched && row.target !== '未掲載')
      .slice(0, 3)
      .map((row) => {
        const targetClub = targetSetting.clubs.find((club) => club.category === row.category);
        const driverDetail = targetClub?.productSlug ? getDriverDetailBySlug(targetClub.productSlug) : undefined;

        return {
          category: row.category,
          current: row.current,
          target: row.target,
          reason:
            row.current === '未登録'
              ? `${row.category} が未登録なので、まずは参考候補を置いて全体像を揃えるのが近道です。`
              : `${targetSetting.name} と違いが出ているカテゴリです。ここを合わせると全体の方向性が近づきます。`,
          detail:
            row.category === 'Driver' && driverDetail
              ? `${driverDetail.fit} / ${driverDetail.launch} / ${driverDetail.priceRange}`
              : `${targetSetting.style} に寄せやすいカテゴリ候補`,
          primaryLabel: row.category === 'Driver' && driverDetail ? '製品詳細を見る' : '比較を続ける',
          primaryAction: () => {
            if (row.category === 'Driver' && driverDetail) {
              trackEvent('view_product_detail', {
                source_page: 'compare_page',
                profile_slug: targetSetting.slug,
                profile_name: targetSetting.name,
                product_slug: driverDetail.slug,
                product_name: `${driverDetail.brand} ${driverDetail.name}`,
                category: 'drivers',
              });
              navigate(`/clubs/drivers/${driverDetail.slug}`);
              return;
            }
            trackEvent('start_ai_diagnosis', {
              source_page: 'compare_page',
              reference_profile_slug: targetSetting.slug,
              reference_profile_name: targetSetting.name,
              target_category: row.category,
            });
            navigate('/diagnosis');
          },
          secondaryLabel: row.category === 'Driver' && driverDetail ? '購入先を比較する' : 'My Bagを整える',
          secondaryAction: () => {
            if (row.category === 'Driver' && driverDetail) {
              trackEvent('view_buy_options', {
                source_page: 'compare_page',
                profile_slug: targetSetting.slug,
                profile_name: targetSetting.name,
                product_slug: driverDetail.slug,
                product_name: `${driverDetail.brand} ${driverDetail.name}`,
                category: 'drivers',
              });
              navigate(`/buy/drivers/${driverDetail.slug}`);
              return;
            }
            trackEvent('begin_mybag_creation', {
              source_page: 'compare_page',
              reference_profile_slug: targetSetting.slug,
            });
            navigate('/mybag/create');
          },
        };
      });

    if (candidates.length > 0) return candidates;

    return targetSetting.clubs.slice(0, 3).map((club) => ({
      category: club.category,
      current: 'かなり近い構成',
      target: club.model,
      reason: '一致度が高いので、大きな入れ替えよりもスペックやボール最適化のほうが効きやすい状態です。',
      detail: '次はAI診断で細かな差分を詰める段階',
      primaryLabel: 'AI診断へ進む',
      primaryAction: () => {
        trackEvent('start_ai_diagnosis', {
          source_page: 'compare_page',
          reference_profile_slug: targetSetting.slug,
          reference_profile_name: targetSetting.name,
          target_category: club.category,
        });
        navigate('/diagnosis');
      },
      secondaryLabel: 'My Bagを確認する',
      secondaryAction: () => navigate('/mypage'),
    }));
  }, [comparisonRows, navigate, targetSetting, targetDriverDetail]);

  const recommendedActions = useMemo(() => {
    const actions: Array<{
      title: string;
      description: string;
      cta: string;
      onClick: () => void;
      icon: 'compare' | 'buy' | 'edit';
    }> = [];

    const missingCategories = comparisonRows.filter((row) => row.current === '未登録');
    const differentCategories = comparisonRows.filter((row) => !row.matched && row.current !== '未登録' && row.target !== '未掲載');
    const driverDifferent = comparisonRows.find((row) => row.category === 'Driver' && !row.matched);

    if (driverDifferent && targetDriverDetail) {
      actions.push({
        title: `まずは ${targetDriverDetail.name} を比較候補に入れる`,
        description: `${targetSetting.name} の入口になっているドライバーです。使用者情報と購入比較を先に見ると、全体の方向性を掴みやすいです。`,
        cta: '使用ドライバーを見る',
        onClick: () => {
          trackEvent('view_product_detail', {
            source_page: 'compare_page',
            profile_slug: targetSetting.slug,
            profile_name: targetSetting.name,
            product_slug: targetDriverDetail.slug,
            product_name: `${targetDriverDetail.brand} ${targetDriverDetail.name}`,
            category: 'drivers',
          });
          navigate(`/clubs/drivers/${targetDriverDetail.slug}`);
        },
        icon: 'buy',
      });
    }

    if (missingCategories.length > 0) {
      actions.push({
        title: `未登録の ${missingCategories[0].category} を埋める`,
        description: `比較精度を上げるには、まず My Bag の空欄を埋めるのが最短です。いまは ${missingCategories.length} カテゴリが未登録です。`,
        cta: 'My Bagを整える',
        onClick: () => {
          trackEvent('begin_mybag_creation', {
            source_page: 'compare_page',
            reference_profile_slug: targetSetting.slug,
            target_category: missingCategories[0].category,
          });
          navigate('/mybag/create');
        },
        icon: 'edit',
      });
    }

    if (differentCategories.length > 0) {
      actions.push({
        title: `差分の大きい ${differentCategories[0].category} をAI診断する`,
        description: `一致していないカテゴリから優先的に見直すと、参考セッティングとの差を自分向けに翻訳しやすくなります。`,
        cta: 'AI診断へ進む',
        onClick: () => {
          trackEvent('start_ai_diagnosis', {
            source_page: 'compare_page',
            reference_profile_slug: targetSetting.slug,
            reference_profile_name: targetSetting.name,
            target_category: differentCategories[0].category,
          });
          navigate('/diagnosis');
        },
        icon: 'compare',
      });
    }

    if (actions.length === 0) {
      actions.push({
        title: 'かなり近い構成です',
        description: 'ここまで揃っているなら、次はボールや細かなスペック差をAI診断で詰めると効果的です。',
        cta: 'AI診断へ進む',
        onClick: () => {
          trackEvent('start_ai_diagnosis', {
            source_page: 'compare_page',
            reference_profile_slug: targetSetting.slug,
            reference_profile_name: targetSetting.name,
          });
          navigate('/diagnosis');
        },
        icon: 'compare',
      });
    }

    return actions.slice(0, 3);
  }, [comparisonRows, navigate, targetDriverDetail, targetSetting.name, targetSetting.slug]);

  const renderActionIcon = (icon: 'compare' | 'buy' | 'edit') => {
    switch (icon) {
      case 'buy':
        return <ShoppingBag size={16} className="text-amber-700" />;
      case 'edit':
        return <Wrench size={16} className="text-cyan-700" />;
      default:
        return <BarChart3 size={16} className="text-golf-700" />;
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-trust-navy"
      >
        <ArrowLeft size={16} />
        前のページへ戻る
      </button>

      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-white md:px-10 md:py-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">
          <GitCompareArrows size={14} />
          Compare Settings
        </div>
        <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
          {targetSetting.name} の構成と、あなたのバッグを見比べる。
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
          参考になるセッティングを見つけたら、そのまま自分の14本との差を確認できると次の行動が明確になります。
        </p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              <BarChart3 size={14} />
              Quick Snapshot
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Reference</div>
                <div className="mt-2 text-sm font-bold text-trust-navy">{targetSetting.name}</div>
                <div className="mt-1 text-sm text-slate-600">{targetSetting.style}</div>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Match Count</div>
                <div className="mt-2 text-sm font-bold text-trust-navy">{matchedCount} / {comparisonRows.length}</div>
                <div className="mt-1 text-sm text-slate-600">同カテゴリの一致本数</div>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Reference HS</div>
                <div className="mt-2 text-sm font-bold text-trust-navy">{targetSetting.headSpeed}</div>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Your HS</div>
                <div className="mt-2 text-sm font-bold text-trust-navy">
                  {currentHeadSpeed ? `${currentHeadSpeed} m/s` : '未登録'}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {currentHeadSpeed && targetHeadSpeed ? `差分 ${Math.abs(currentHeadSpeed - targetHeadSpeed)} m/s` : 'まずはプロフィール入力'}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Club Comparison</div>
            <div className="mt-5 space-y-3">
              {comparisonRows.map((row) => (
                <div key={row.category} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{row.category}</div>
                    {row.matched ? (
                      <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                        <CheckCircle2 size={14} />
                        Match
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Reference</div>
                      <div className="mt-2 text-sm font-bold text-trust-navy">{row.target}</div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Your Bag</div>
                      <div className="mt-2 text-sm font-bold text-trust-navy">{row.current}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-6">
            <h2 className="text-2xl font-black text-trust-navy">この比較の次にやること</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              比較で差が見えたら、そこで終わらせずに My Bag 登録や AI 診断へ進めると体験がつながります。
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                onClick={() => navigate('/diagnosis')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
              >
                AI診断で最適化する
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/mybag/create')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300 bg-white px-5 py-3 text-sm font-black text-cyan-700"
              >
                <Plus size={16} />
                My Bagを整える
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-6">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">Recommended Next Actions</div>
            <h2 className="mt-2 text-xl font-black text-trust-navy">比較結果からのおすすめ</h2>
            <div className="mt-5 space-y-3">
              {recommendedActions.map((action) => (
                <div key={action.title} className="rounded-[1.25rem] border border-amber-200 bg-white px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{renderActionIcon(action.icon)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-trust-navy">{action.title}</div>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{action.description}</p>
                      <button
                        onClick={action.onClick}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-black text-amber-700 transition-colors hover:text-amber-800"
                      >
                        {action.cta}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Suggested Replacements</div>
            <h2 className="mt-2 text-xl font-black text-trust-navy">次に見直す候補</h2>
            <div className="mt-5 space-y-4">
              {replacementCandidates.map((candidate) => (
                <div key={`${candidate.category}-${candidate.target}`} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{candidate.category}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-golf-700">Priority</div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Current</div>
                      <div className="mt-2 text-sm font-bold text-trust-navy">{candidate.current}</div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Suggested</div>
                      <div className="mt-2 text-sm font-bold text-trust-navy">{candidate.target}</div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{candidate.reason}</p>
                  <div className="mt-3 text-sm font-bold text-golf-700">{candidate.detail}</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={candidate.primaryAction}
                      className="inline-flex items-center gap-2 rounded-full bg-trust-navy px-4 py-2.5 text-sm font-black text-white"
                    >
                      {candidate.primaryLabel}
                      <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={candidate.secondaryAction}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 transition-colors hover:border-golf-400 hover:text-golf-700"
                    >
                      {candidate.secondaryLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Reference Strengths</div>
            <h2 className="mt-2 text-xl font-black text-trust-navy">{targetSetting.name} が参考になる理由</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {targetSetting.strengths.map((strength) => (
                <span key={strength} className="rounded-full border border-golf-200 bg-golf-50 px-3 py-2 text-xs font-bold text-golf-700">
                  {strength}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-600">{targetSetting.summary}</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Status</div>
            <h2 className="mt-2 text-xl font-black text-trust-navy">
              {currentBagFilled ? '比較できる状態です' : '比較をもっと正確にするには、My Bag 登録が先です'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {currentBagFilled
                ? 'すでに登録済みのクラブ情報を使って比較しています。次は診断でギャップや買い替え候補を見せる流れが自然です。'
                : 'まだ自分のクラブが少ないので、比較は暫定です。14本を登録すると、差分がもっと具体的に見えるようになります。'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
