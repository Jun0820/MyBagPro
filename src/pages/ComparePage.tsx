import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, GitCompareArrows, Heart, ShoppingBag } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDiagnosis } from '../context/DiagnosisContext';
import { driverDetails, getDriverDetailBySlug } from '../data/featuredSettings';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfileBySlug, type PublicSettingProfile } from '../lib/contentProfiles';
import { getCompareShortlist } from '../lib/diagnosisCompare';
import { saveFavoriteClub } from '../lib/favoriteClubs';
import { AFFILIATE_SHOPS, getAffiliateUrl } from '../utils/affiliate';

const parseHeadSpeedValue = (value: string) => {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
};

const categoryToDiagnosisPath = (category?: string | null) => {
  switch (category) {
    case 'Driver':
    case 'ドライバー':
      return '/diagnosis/driver';
    case 'フェアウェイウッド':
    case 'Fairway Wood':
      return '/diagnosis/fairway';
    case 'ユーティリティ':
    case 'Utility':
      return '/diagnosis/utility';
    case 'アイアン':
    case 'Iron':
      return '/diagnosis/iron';
    case 'ウェッジ':
    case 'Wedge':
      return '/diagnosis/wedge';
    case 'パター':
    case 'Putter':
      return '/diagnosis/putter';
    default:
      return '/diagnosis';
  }
};

const buildCompareDiagnosisPath = (category: string | undefined | null, profileSlug: string, profileName: string) => {
  const basePath = categoryToDiagnosisPath(category);
  const params = new URLSearchParams({
    source: 'compare',
    priority: category || '',
    profile: profileName,
    profileSlug,
  });
  return `${basePath}?${params.toString()}`;
};

const formatGapMessage = (current: string, target: string) => {
  if (current === '未登録') return 'このカテゴリが未登録なので、まずは入力すると比較しやすくなります。';
  if (target === '未掲載') return '参考プロフィール側でこのカテゴリは未掲載です。';
  if (current === target) return '同じモデルです。方向性はかなり近いです。';
  return 'ここに差があります。優先して見直す候補です。';
};

export const ComparePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useDiagnosis();
  const [targetSetting, setTargetSetting] = useState<PublicSettingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const settingSlug = searchParams.get('setting');
  const shortlistMode = searchParams.get('mode') === 'shortlist';
  const shortlist = useMemo(() => getCompareShortlist(), []);
  const primaryShop = AFFILIATE_SHOPS[0];

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

  if (isLoading && !shortlistMode) {
    return (
      <div className="min-h-[60vh] rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-3xl font-black text-trust-navy">比較対象を読み込んでいます。</h1>
        <p className="mt-3 text-sm text-slate-600">確認済みの掲載データを取得中です。</p>
      </div>
    );
  }

  if (shortlistMode) {
    return (
      <div className="min-h-screen space-y-5 pb-20 md:space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-trust-navy"
        >
          <ArrowLeft size={16} />
          前のページへ戻る
        </button>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-5 shadow-sm md:rounded-[2rem] md:px-10 md:py-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700">
            <GitCompareArrows size={14} />
            比較候補
          </div>
          <h1 className="mt-4 text-[2rem] font-black tracking-tight text-trust-navy md:mt-5 md:text-6xl">
            診断で残した
            <span className="text-golf-700">比較候補</span>
            を見比べる
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:mt-5 md:text-base md:leading-8">
            診断で保存した候補を並べて、まず何を残し、何を見にいくかを決めるためのページです。上位候補から順に、保存・詳細確認・価格比較へ進めます。
          </p>
        </section>

        {shortlist.length === 0 ? (
          <div className="min-h-[40vh] rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-3xl font-black text-trust-navy">比較候補がまだありません。</h2>
            <p className="mt-3 text-sm text-slate-600">診断結果ページで候補を保存すると、このページで見比べられます。</p>
            <button
              onClick={() => navigate('/diagnosis')}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
            >
              診断を始める
            </button>
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] md:gap-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 md:rounded-[2rem] md:p-8">
              <div className="flex items-center gap-2 text-xs font-black text-slate-400">
                <BarChart3 size={14} />
                保存した候補
              </div>
            <div className="mt-4 space-y-3 md:mt-6 md:space-y-4">
              {shortlist.map((item) => {
                  const matchedDriver = driverDetails.find(
                    (driver) =>
                      driver.brand === item.brand &&
                      (driver.name === item.modelName || `${driver.brand} ${driver.name}` === `${item.brand} ${item.modelName}`),
                  );

                  return (
                    <div key={item.id} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 md:rounded-[1.5rem] md:p-5">
                      <div className="mb-3 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white px-3.5 py-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">BEST MATCH</div>
                          <div className="mt-1 text-sm font-black text-trust-navy">{item.brand}</div>
                        </div>
                        <div className="rounded-2xl bg-white px-3.5 py-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">MATCH SCORE</div>
                          <div className="mt-1 text-sm font-black text-trust-navy">{item.matchPercentage.toFixed(1)}%</div>
                        </div>
                        <div className="rounded-2xl bg-white px-3.5 py-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">NEXT STEP</div>
                          <div className="mt-1 text-sm font-black text-trust-navy">詳細 or 価格確認</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {item.sourceCategory} / Rank {item.rank}
                          </div>
                          <h2 className="mt-2 text-lg font-black text-trust-navy md:text-xl">
                            {item.brand} {item.modelName}
                          </h2>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-slate-500">
                              適合率 {item.matchPercentage.toFixed(1)}%
                            </span>
                            {item.shaft && (
                              <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-slate-500">
                                {item.shaft}
                              </span>
                            )}
                            {item.loft && (
                              <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-slate-500">
                                {item.loft}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <button
                            onClick={() => {
                              if (matchedDriver) {
                                navigate(`/clubs/drivers/${matchedDriver.slug}`);
                                return;
                              }
                              navigate('/clubs/drivers');
                            }}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white sm:w-auto"
                          >
                            詳細を見る
                            <ArrowRight size={16} />
                          </button>
                          <button
                            onClick={() => {
                              saveFavoriteClub({
                                id: item.id,
                                brand: item.brand,
                                modelName: item.modelName,
                                category: item.sourceCategory,
                                shaft: item.shaft,
                                loft: item.loft,
                              });
                              trackEvent('save_favorite_club', {
                                source_page: 'compare_shortlist',
                                brand: item.brand,
                                model_name: item.modelName,
                              });
                              alert('✅ お気に入りに保存しました。');
                            }}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 sm:w-auto"
                          >
                            <Heart size={16} />
                            お気に入りに保存
                          </button>
                          <button
                            onClick={() => {
                              trackEvent('click_affiliate_shop', {
                                source_page: 'compare_shortlist',
                                shop_id: primaryShop.id,
                                shop_name: primaryShop.name,
                                brand: item.brand,
                                model_name: item.modelName,
                              });
                              window.open(getAffiliateUrl(item.brand, item.modelName, primaryShop.id), '_blank', 'noopener,noreferrer');
                            }}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 sm:w-auto"
                          >
                            <ShoppingBag size={16} />
                            価格を見る
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <section className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-4 md:rounded-[2rem] md:p-6">
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-cyan-100">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">候補数</div>
                    <div className="mt-2 text-2xl font-black text-trust-navy">{shortlist.length}</div>
                    <div className="mt-2 text-xs leading-relaxed text-slate-500">残している比較候補です。</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-cyan-100">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">主導線</div>
                    <div className="mt-2 text-sm font-black text-trust-navy">詳細 → 保存</div>
                    <div className="mt-2 text-xs leading-relaxed text-slate-500">まずは上位候補を絞ります。</div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-cyan-100">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">次の一手</div>
                    <div className="mt-2 text-sm font-black text-trust-navy">価格 or 再診断</div>
                    <div className="mt-2 text-xs leading-relaxed text-slate-500">迷ったら条件を変えて再確認します。</div>
                  </div>
                </div>
                <h2 className="text-xl font-black text-trust-navy md:text-2xl">次にやるといいこと</h2>
                <div className="mt-4 space-y-3 md:mt-5 md:space-y-4">
                  <div className="rounded-[1.25rem] bg-white p-4 ring-1 ring-cyan-100 md:rounded-[1.5rem] md:p-5">
                    <h3 className="text-base font-black text-trust-navy md:text-lg">上位候補の詳細を見る</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600 md:leading-7">まずは1位か2位のモデル詳細を開いて、価格と使っている人を確認するのがおすすめです。</p>
                    <button
                      onClick={() => navigate('/clubs/drivers')}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 sm:w-auto"
                    >
                      人気ドライバーを見る
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="rounded-[1.25rem] bg-white p-4 ring-1 ring-cyan-100 md:rounded-[1.5rem] md:p-5">
                    <h3 className="text-base font-black text-trust-navy md:text-lg">条件を変えて再診断する</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600 md:leading-7">候補が近いときは、ミス傾向や球筋を変えて再診断すると違いが見えやすくなります。</p>
                    <button
                      onClick={() => navigate('/diagnosis')}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-3 text-sm font-black text-white sm:w-auto"
                    >
                      AI診断へ進む
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </section>
        )}
      </div>
    );
  }

  if (!targetSetting) {
    return (
      <div className="min-h-[60vh] rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-3xl font-black text-trust-navy">比較対象がありません。</h1>
        <p className="mt-3 text-sm text-slate-600">比較したいプロフィールを選んでから、このページへ進んでください。</p>
        <button
          onClick={() => navigate('/settings/pros')}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
        >
          プロ一覧へ戻る
        </button>
      </div>
    );
  }

  const currentBag = profile.myBag?.clubs ?? [];
  const currentHeadSpeed = profile.headSpeed || null;
  const targetHeadSpeed = parseHeadSpeedValue(targetSetting.headSpeed);
  const currentBall = profile.myBag?.ball || '未登録';
  const currentBagCount = currentBag.length;
  const currentDistanceCount = currentBag.filter((club) => String(club.distance || '').trim() !== '').length;
  const currentDistanceCoverage = currentBagCount > 0 ? Math.round((currentDistanceCount / currentBagCount) * 100) : 0;
  const currentFairwayCount = currentBag.filter((club) => club.category === 'フェアウェイウッド').length;
  const currentUtilityCount = currentBag.filter((club) => club.category === 'ユーティリティ').length;
  const currentWedgeCount = currentBag.filter((club) => club.category === 'ウェッジ').length;
  const currentPutterCount = currentBag.filter((club) => club.category === 'パター').length;

  const comparisonRows = useMemo(() => {
    const targetClubMap = new Map(targetSetting.clubs.map((club) => [club.category, club.model]));
    const currentClubMap = new Map(currentBag.map((club) => [club.category, `${club.brand} ${club.model}`.trim()]));
    const categories = Array.from(new Set([...targetClubMap.keys(), ...currentClubMap.keys()]));

    return categories.map((category) => ({
      category,
      target: targetClubMap.get(category) ?? '未掲載',
      current: currentClubMap.get(category) ?? '未登録',
      matched:
        Boolean(targetClubMap.get(category)) &&
        Boolean(currentClubMap.get(category)) &&
        targetClubMap.get(category) === currentClubMap.get(category),
    }));
  }, [currentBag, targetSetting.clubs]);

  const matchedCount = comparisonRows.filter((row) => row.matched).length;
  const missingCount = comparisonRows.filter((row) => row.current === '未登録').length;
  const differenceCount = comparisonRows.filter((row) => !row.matched && row.current !== '未登録' && row.target !== '未掲載').length;
  const firstPriorityRow = comparisonRows.find((row) => row.current === '未登録' || (!row.matched && row.target !== '未掲載'));
  const priorityRows = comparisonRows
    .filter((row) => row.current === '未登録' || (!row.matched && row.target !== '未掲載'))
    .slice(0, 3);
  const matchPercent = comparisonRows.length > 0 ? Math.round((matchedCount / comparisonRows.length) * 100) : 0;
  const hasPreviousMissingCount = searchParams.has('previousMissing');
  const hasPreviousMatchPercent = searchParams.has('previousMatch');
  const previousMissingCount = hasPreviousMissingCount ? Number(searchParams.get('previousMissing')) : null;
  const previousMatchPercent = hasPreviousMatchPercent ? Number(searchParams.get('previousMatch')) : null;
  const refreshedFromBag = searchParams.get('refreshed') === '1';
  const refreshedFromDiagnosis = searchParams.get('reviewed') === '1';
  const reviewedCategory = searchParams.get('reviewedCategory');
  const reviewedModel = searchParams.get('reviewedModel');
  const targetDriver = targetSetting.clubs.find((club) => club.category === 'Driver');
  const targetDriverDetail = targetDriver?.productSlug ? getDriverDetailBySlug(targetDriver.productSlug) : undefined;
  const compareReturnTarget = (() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('refreshed');
    nextParams.set('previousMissing', String(missingCount));
    nextParams.set('previousMatch', String(matchPercent));
    return `/compare${nextParams.toString() ? `?${nextParams.toString()}` : ''}`;
  })();
  const comparisonInsights = [
    currentBagCount >= 8
      ? `自分のバッグは ${currentBagCount} 本登録済みです。かなり全体像を見ながら比較できる状態です。`
      : `自分のバッグは ${currentBagCount} 本登録です。まずは代表番手を埋めると比較の精度が上がります。`,
    currentDistanceCoverage >= 70
      ? `飛距離入力は ${currentDistanceCoverage}% 入っています。番手間の差もかなり追いやすいです。`
      : currentDistanceCoverage > 0
      ? `飛距離入力は ${currentDistanceCoverage}% です。代表番手の飛距離が増えると差分判断がしやすくなります。`
      : '飛距離が未入力なので、モデル差は見えても番手のつながりはまだ読みづらい状態です。',
    currentFairwayCount + currentUtilityCount >= 3
      ? `ロングゲーム側は FW ${currentFairwayCount} 本 / UT ${currentUtilityCount} 本で比較しやすい構成です。`
      : `ロングゲーム側は FW ${currentFairwayCount} 本 / UT ${currentUtilityCount} 本です。ロングゲームの差分はまだ大きく出やすいです。`,
    currentWedgeCount >= 2 && currentPutterCount >= 1
      ? `ショートゲーム側は WEDGE ${currentWedgeCount} 本 + パターでかなり整っています。`
      : `ショートゲーム側は WEDGE ${currentWedgeCount} 本 / パター ${currentPutterCount} 本です。ここを埋めるとスコア側の比較が具体化します。`,
  ];
  const missingBall = currentBall === '未登録';
  const needsBagSetup = currentBagCount < 8 || missingCount > 0;
  const missingImprovement = typeof previousMissingCount === 'number' ? previousMissingCount - missingCount : 0;
  const matchImprovement = typeof previousMatchPercent === 'number' ? matchPercent - previousMatchPercent : 0;
  const compareRefreshMessage =
    refreshedFromBag && (missingImprovement !== 0 || matchImprovement !== 0)
      ? missingImprovement > 0
        ? `比較に戻りました。未登録カテゴリが ${missingImprovement} 件減って、いまは ${missingCount} 件です。`
        : matchImprovement > 0
        ? `比較に戻りました。一致率が ${matchImprovement}% 上がって、いまは ${matchPercent}% です。`
        : `比較に戻りました。いまのバッグ内容を反映しています。`
      : refreshedFromBag
      ? '比較に戻りました。いまのバッグ内容を反映しています。'
      : null;
  const compareDiagnosisMessage =
    refreshedFromDiagnosis && reviewedCategory
      ? `${reviewedCategory} を診断して戻りました。候補は「${reviewedModel || '今回のおすすめ'}」として残しています。差分の見え方をもう一度確認できます。`
      : refreshedFromDiagnosis
      ? '診断結果から比較へ戻りました。残した候補を見比べながら、次に残すものを決められます。'
      : null;

  const nextActions = useMemo(() => {
    const actions: Array<{
      title: string;
      description: string;
      cta: string;
      onClick: () => void;
      variant: 'primary' | 'secondary';
    }> = [];

    if (targetDriverDetail) {
      actions.push({
        title: 'まずは使用ドライバーを見る',
        description: `${targetSetting.name} の方向性をつかむなら、入口になるドライバーから見るのが分かりやすいです。`,
        cta: 'ドライバー詳細を見る',
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
        variant: 'secondary',
      });
    }

    if (missingCount > 0) {
      actions.push({
        title: '未登録のクラブを埋める',
        description: `未登録カテゴリが ${missingCount} 個あります。まずは自分のバッグを整えると比較精度が上がります。`,
        cta: 'My Bagを整える',
        onClick: () => {
          trackEvent('begin_mybag_creation', {
            source_page: 'compare_page',
            reference_profile_slug: targetSetting.slug,
          });
          navigate(`/mybag/create?tab=clubs&focus=missing-clubs&returnTo=${encodeURIComponent(compareReturnTarget)}`);
        },
        variant: 'secondary',
      });
    }

    if (firstPriorityRow) {
      actions.push({
        title: `${firstPriorityRow.category} を優先して診断する`,
        description:
          firstPriorityRow.current === '未登録'
            ? `${firstPriorityRow.category} が未登録なので、まずはこのカテゴリから診断すると次の一手が決まりやすいです。`
            : `${firstPriorityRow.category} に差分があります。いま一番見直しやすいカテゴリです。`,
        cta: `${firstPriorityRow.category} を診断する`,
        onClick: () => {
          trackEvent('start_ai_diagnosis', {
            source_page: 'compare_page',
            reference_profile_slug: targetSetting.slug,
            reference_profile_name: targetSetting.name,
            priority_category: firstPriorityRow.category,
          });
          navigate(buildCompareDiagnosisPath(firstPriorityRow.category, targetSetting.slug, targetSetting.name));
        },
        variant: 'secondary',
      });
    }

    if (missingBall || currentDistanceCoverage < 40) {
      actions.push({
        title: missingBall ? '使用ボールを決める' : 'ボール相性を診断する',
        description: missingBall
          ? '使用ボールが未登録です。ボールが入るとクラブ比較の見え方もかなり具体化します。'
          : 'クラブ差が近いときは、ボール相性まで見ると次の一手が決まりやすくなります。',
        cta: 'ボール診断へ進む',
        onClick: () => {
          trackEvent('start_ball_diagnosis', {
            source_page: 'compare_page',
            reference_profile_slug: targetSetting.slug,
            reference_profile_name: targetSetting.name,
          });
          navigate('/ball-diagnosis');
        },
        variant: 'secondary',
      });
    }

    actions.push({
      title: '差分をもとにAI診断する',
      description:
        differenceCount > 0
          ? `一致していないカテゴリが ${differenceCount} 個あります。AI診断で自分向けに置き換えるのが次の一手です。`
          : '一致度が高いので、細かなスペック差やボールの相性をAI診断で詰める段階です。',
      cta: 'AI診断へ進む',
      onClick: () => {
        trackEvent('start_ai_diagnosis', {
          source_page: 'compare_page',
          reference_profile_slug: targetSetting.slug,
          reference_profile_name: targetSetting.name,
        });
        navigate(`/diagnosis?${new URLSearchParams({
          source: 'compare',
          profile: targetSetting.name,
          profileSlug: targetSetting.slug,
        }).toString()}`);
      },
      variant: 'primary',
    });

    return actions.slice(0, 3);
  }, [currentDistanceCoverage, differenceCount, firstPriorityRow, missingBall, missingCount, navigate, targetDriverDetail, targetSetting]);

  return (
      <div className="min-h-screen space-y-6 pb-20 md:space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-trust-navy"
      >
        <ArrowLeft size={16} />
        前のページへ戻る
      </button>

      <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-sm md:px-10 md:py-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700">
          <GitCompareArrows size={14} />
          比較ページ
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-trust-navy md:text-6xl">
          {targetSetting.name} と
          <span className="text-golf-700">自分のバッグ</span>
          を比べる
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:mt-5 md:text-base md:leading-8">
          どこが同じで、どこが違うのかを整理するページです。まず全体の近さを見て、そのあと差分の大きいカテゴリから見直すと使いやすいです。
        </p>
        {compareDiagnosisMessage && (
          <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-bold leading-relaxed text-cyan-900">
            {compareDiagnosisMessage}
          </div>
        )}
        {compareRefreshMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-relaxed text-emerald-800">
            {compareRefreshMessage}
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <div className="text-xs font-black text-slate-400">参考にする人</div>
            <div className="mt-2 text-base font-black text-trust-navy">{targetSetting.name}</div>
            <div className="mt-1 text-sm text-slate-600">{targetSetting.style}</div>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <div className="text-xs font-black text-slate-400">一致カテゴリ</div>
            <div className="mt-2 text-3xl font-black text-trust-navy">{matchedCount}</div>
            <div className="mt-1 text-sm text-slate-600">全 {comparisonRows.length} カテゴリ中</div>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <div className="text-xs font-black text-slate-400">参考のヘッドスピード</div>
            <div className="mt-2 text-base font-black text-trust-navy">{targetSetting.headSpeed}</div>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <div className="text-xs font-black text-slate-400">自分のヘッドスピード</div>
            <div className="mt-2 text-base font-black text-trust-navy">
              {currentHeadSpeed ? `${currentHeadSpeed} m/s` : '未入力'}
            </div>
            {targetHeadSpeed && currentHeadSpeed && (
              <div className="mt-1 text-sm text-slate-600">差: {Math.abs(targetHeadSpeed - currentHeadSpeed)} m/s</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-trust-navy">
              <GitCompareArrows size={14} />
              あなたの現在地
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">バッグ登録</div>
                <div className="mt-2 text-2xl font-black text-trust-navy">{currentBagCount}本</div>
                <div className="mt-2 text-xs leading-relaxed text-slate-500">比較対象との差分を見る土台です。</div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">飛距離入力</div>
                <div className="mt-2 text-2xl font-black text-trust-navy">{currentDistanceCoverage}%</div>
                <div className="mt-2 text-xs leading-relaxed text-slate-500">番手のつながりを読む材料です。</div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">使用ボール</div>
                <div className="mt-2 text-base font-black text-trust-navy">{currentBall}</div>
                <div className="mt-2 text-xs leading-relaxed text-slate-500">クラブだけでなく相性確認にも効きます。</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {comparisonInsights.map((point) => (
                <div key={point} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600">
                  {point}
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl bg-white px-3.5 py-3 ring-1 ring-slate-200">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">BEST MATCH</div>
                <div className="mt-1 text-sm font-black text-trust-navy">{targetSetting.name}</div>
              </div>
              <div className="rounded-2xl bg-white px-3.5 py-3 ring-1 ring-slate-200">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">MATCH SCORE</div>
                <div className="mt-1 text-sm font-black text-trust-navy">{matchPercent}%</div>
              </div>
              <div className="rounded-2xl bg-white px-3.5 py-3 ring-1 ring-slate-200">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">NEXT STEP</div>
                <div className="mt-1 text-sm font-black text-trust-navy">
                  {needsBagSetup ? 'My Bagを整える' : missingBall ? 'ボールを入れる' : '差分を埋める'}
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => {
                  trackEvent('begin_mybag_creation', {
                    source_page: 'compare_page_quick_actions',
                    reference_profile_slug: targetSetting.slug,
                  });
                  navigate(`/mybag/create?tab=clubs&focus=missing-clubs&returnTo=${encodeURIComponent(compareReturnTarget)}`);
                }}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${
                  needsBagSetup ? 'bg-trust-navy text-white' : 'border border-slate-300 bg-white text-slate-700'
                }`}
              >
                {needsBagSetup ? '不足番手を先に埋める' : 'My Bagを見直す'}
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => {
                  trackEvent('start_ball_diagnosis', {
                    source_page: 'compare_page_quick_actions',
                    reference_profile_slug: targetSetting.slug,
                    reference_profile_name: targetSetting.name,
                  });
                  navigate('/ball-diagnosis');
                }}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${
                  missingBall ? 'bg-cyan-600 text-white' : 'border border-slate-300 bg-white text-slate-700'
                }`}
              >
                {missingBall ? 'まずはボール診断をする' : 'ボール相性も見る'}
                <ArrowRight size={16} />
              </button>
            </div>
            {priorityRows.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Priority Categories</div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {priorityRows.map((row) => (
                    <button
                      key={row.category}
                      onClick={() => {
                        trackEvent('start_ai_diagnosis', {
                          source_page: 'compare_page_priority_categories',
                          reference_profile_slug: targetSetting.slug,
                          reference_profile_name: targetSetting.name,
                          priority_category: row.category,
                        });
                        navigate(buildCompareDiagnosisPath(row.category, targetSetting.slug, targetSetting.name));
                      }}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition-colors hover:bg-slate-100"
                    >
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        {row.current === '未登録' ? '未登録' : '差分あり'}
                      </div>
                      <div className="mt-2 text-base font-black text-trust-navy">{row.category}</div>
                      <div className="mt-2 text-xs leading-relaxed text-slate-500">
                        {row.current === '未登録'
                          ? 'ここを入れると比較の精度が上がります。'
                          : 'このカテゴリから見直すと次の一手が決めやすいです。'}
                      </div>
                      <div className="mt-3 inline-flex items-center gap-2 text-xs font-black text-cyan-700">
                        すぐ診断する
                        <ArrowRight size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-black text-slate-400">
            <BarChart3 size={14} />
            比較の見方
          </div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">まずは差が大きいところから埋める</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            「未登録」「違うモデル」「同じモデル」の3つに分けて見ると分かりやすいです。全部合わせようとするのではなく、次に変える価値が高いところから順に見ていくのがコツです。
          </p>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200">
            <div className="hidden bg-slate-100 md:grid md:grid-cols-[0.8fr_1.4fr_1.4fr_1.8fr]">
              {['カテゴリ', '参考プロフィール', '自分のバッグ', '見かた'].map((heading) => (
                <div key={heading} className="px-4 py-3 text-xs font-black text-slate-500">
                  {heading}
                </div>
              ))}
            </div>
            <div className="divide-y divide-slate-200">
              {comparisonRows.map((row) => (
                <div key={row.category} className="grid gap-3 px-4 py-4 md:grid-cols-[0.8fr_1.4fr_1.4fr_1.8fr] md:items-center">
                  <div>
                    <div className="text-[11px] font-black text-slate-400 md:hidden">カテゴリ</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-black text-trust-navy">{row.category}</div>
                      {refreshedFromDiagnosis && reviewedCategory === row.category && (
                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">
                          見直し済み
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-400 md:hidden">参考プロフィール</div>
                    <div className="text-sm font-bold text-trust-navy">{row.target}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-400 md:hidden">自分のバッグ</div>
                    <div className="text-sm font-bold text-slate-700">{row.current}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-400 md:hidden">見かた</div>
                    <div className={`text-sm font-bold ${row.matched ? 'text-golf-700' : 'text-slate-600'}`}>
                      {formatGapMessage(row.current, row.target)}
                    </div>
                    {refreshedFromDiagnosis && reviewedCategory === row.category && reviewedModel && (
                      <div className="mt-2 text-xs font-bold text-cyan-700">
                        今回の候補: {reviewedModel}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-6">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-cyan-100">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">一致率</div>
                <div className="mt-2 text-2xl font-black text-trust-navy">{matchPercent}%</div>
                <div className="mt-2 text-xs leading-relaxed text-slate-500">同じ方向性の強さです。</div>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-cyan-100">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">差分</div>
                <div className="mt-2 text-2xl font-black text-trust-navy">{differenceCount}</div>
                <div className="mt-2 text-xs leading-relaxed text-slate-500">先に見直す候補です。</div>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-cyan-100">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">未登録</div>
                <div className="mt-2 text-2xl font-black text-trust-navy">{missingCount}</div>
                <div className="mt-2 text-xs leading-relaxed text-slate-500">先に埋めると精度が上がります。</div>
              </div>
            </div>
            <h2 className="text-2xl font-black text-trust-navy">次にやること</h2>
            <div className="mt-5 space-y-4">
              {nextActions.map((action) => (
                <div key={action.title} className="rounded-[1.5rem] bg-white p-5 ring-1 ring-cyan-100">
                  <h3 className="text-lg font-black text-trust-navy">{action.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{action.description}</p>
                  <button
                    onClick={action.onClick}
                    className={`mt-4 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black ${
                      action.variant === 'primary'
                        ? 'bg-cyan-600 text-white'
                        : 'border border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {action.cta}
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
            {priorityRows.length > 0 && (
              <div className="mt-4 rounded-[1.5rem] bg-white p-5 ring-1 ring-cyan-100">
                <h3 className="text-lg font-black text-trust-navy">差分が残っているカテゴリからそのまま診断する</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  比較で止まらないように、優先度の高いカテゴリをそのまま対象診断へつないでいます。まずは上から1つだけ進めるのがおすすめです。
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {priorityRows.map((row) => (
                    <button
                      key={`next-${row.category}`}
                      onClick={() => {
                        trackEvent('start_ai_diagnosis', {
                          source_page: 'compare_page_next_step_categories',
                          reference_profile_slug: targetSetting.slug,
                          reference_profile_name: targetSetting.name,
                          priority_category: row.category,
                        });
                        navigate(buildCompareDiagnosisPath(row.category, targetSetting.slug, targetSetting.name));
                      }}
                      className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-trust-navy transition-colors hover:bg-slate-100"
                    >
                      <span>{row.category} を診断する</span>
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="text-xs font-black text-slate-400">このページの使いどころ</div>
            <h2 className="mt-3 text-2xl font-black text-trust-navy">真似するより、差分を把握するために使う</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              プロの構成をそのまま再現するのではなく、自分のバッグに足りない要素や、方向性の違いを知るためのページです。差分が分かったら、比較・診断・購入比較へ進めます。
            </p>
            {targetDriverDetail && (
              <button
                onClick={() => {
                  trackEvent('view_buy_options', {
                    source_page: 'compare_page',
                    profile_slug: targetSetting.slug,
                    profile_name: targetSetting.name,
                    product_slug: targetDriverDetail.slug,
                    product_name: `${targetDriverDetail.brand} ${targetDriverDetail.name}`,
                    category: 'drivers',
                  });
                  navigate(`/buy/drivers/${targetDriverDetail.slug}`);
                }}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700"
              >
                <ShoppingBag size={16} />
                使用ドライバーの購入先を見る
              </button>
            )}
          </section>
        </div>
      </section>
    </div>
  );
};
