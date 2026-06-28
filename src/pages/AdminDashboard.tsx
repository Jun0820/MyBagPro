import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  FileText,
  Flag,
  Image,
  LineChart,
  Link2,
  MousePointerClick,
  RefreshCw,
  Share2,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { useDiagnosis } from '../context/DiagnosisContext';
import type { UserAccount } from '../types/golf';
import { loadPublicGolfIdProfiles } from '../lib/golfIdProfileSource';
import { trackEvent } from '../lib/analytics';

type PeriodValue = {
  today: number;
  sevenDays: number;
  thirtyDays: number;
  previousSevenDays: number;
  previousThirtyDays: number;
};

type KpiMetric = PeriodValue & {
  id: string;
  label: string;
  helper: string;
  format?: 'number' | 'currency';
  icon: ReactNode;
};

type DailyPoint = {
  date: string;
  signups: number;
  publicPages: number;
  diagnosisCompleted: number;
  snsShares: number;
  productClicks: number;
};

type FunnelStep = {
  label: string;
  value: number;
};

type RankingRow = Record<string, string | number>;

type AdminDashboardData = {
  generatedAt: string;
  kpis: KpiMetric[];
  funnel: FunnelStep[];
  daily: DailyPoint[];
  latestGolfProfiles: RankingRow[];
  popularPages: RankingRow[];
  articleRankings: RankingRow[];
  productCategoryRankings: RankingRow[];
  diagnosisTypeRankings: RankingRow[];
  notes: string[];
};

const eventNames = {
  visits: ['page_view', 'session_start'],
  diagnosisStart: ['start_ai_diagnosis', 'diagnosis_start'],
  diagnosisCompleted: ['diagnosis_success', 'diagnosis_result_view', 'diagnosis_complete'],
  snsImageGenerated: ['share_image_generated', 'sns_image_generated', 'bag_share_image_generated', 'player_card_generate'],
  snsShared: ['share', 'sns_share', 'sns_share_click', 'share_public_bag', 'open_profile_channel'],
  urlCopy: ['url_copy_click'],
  publicPageSignup: ['public_page_signup', 'signup_from_public_page', 'public_page_signup_click', 'golf_id_create_complete'],
  productClick: ['product_click', 'rakuten_click', 'affiliate_click', 'select_item'],
} as const;

const normalizeAdminEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) return normalized;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${localPart.split('+')[0].replace(/\./g, '')}@gmail.com`;
  }
  return normalized;
};

const fallbackAdminEmails = ['junpei.t.820@gmail.com', 'j_tommy_820@yahoo.co.jp'];
const configuredAdminEmails = String(import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
  .split(',')
  .map(normalizeAdminEmail)
  .filter(Boolean);
const adminEmails = Array.from(new Set([...fallbackAdminEmails.map(normalizeAdminEmail), ...configuredAdminEmails]));

const dayMs = 24 * 60 * 60 * 1000;

const startOfLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * dayMs);
const iso = (date: Date) => date.toISOString();
const dayKey = (date: Date) => iso(startOfLocalDay(date)).slice(0, 10);

const emptyPeriod = (): PeriodValue => ({
  today: 0,
  sevenDays: 0,
  thirtyDays: 0,
  previousSevenDays: 0,
  previousThirtyDays: 0,
});

const formatNumber = (value: number) => new Intl.NumberFormat('ja-JP').format(Math.round(value));
const formatCurrency = (value: number) => `¥${formatNumber(value)}`;

const summarizeSocialLinks = (value: unknown) => {
  const links = (value || {}) as {
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    x?: string;
    custom1?: { url?: string };
    custom2?: { url?: string };
  };
  const labels = [
    links.youtube ? 'YT' : '',
    links.instagram ? 'IG' : '',
    links.tiktok ? 'TT' : '',
    links.x ? 'X' : '',
    links.custom1?.url ? 'Link1' : '',
    links.custom2?.url ? 'Link2' : '',
  ].filter(Boolean);
  return labels.length > 0 ? labels.join(' / ') : '-';
};

const periodDelta = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const safeCount = async (
  table: string,
  from: Date,
  to: Date,
  options: { dateColumn?: string; eq?: Record<string, string | number | boolean>; eventNames?: readonly string[] } = {},
) => {
  if (!isSupabaseConfigured) return 0;
  try {
    let query = (supabase as any)
      .from(table)
      .select('*', { count: 'exact', head: true })
      .gte(options.dateColumn || 'created_at', iso(from))
      .lt(options.dateColumn || 'created_at', iso(to));

    Object.entries(options.eq || {}).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    if (options.eventNames?.length) {
      query = query.in('event_name', [...options.eventNames]);
    }

    const { count, error } = await query;
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
};

const safeRows = async <T,>(
  table: string,
  select: string,
  options: {
    from?: Date;
    to?: Date;
    dateColumn?: string;
    eventNames?: readonly string[];
    limit?: number;
    eq?: Record<string, string | number | boolean>;
    orderBy?: string;
    ascending?: boolean;
  } = {},
): Promise<T[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    let query = (supabase as any).from(table).select(select);
    if (options.from) query = query.gte(options.dateColumn || 'created_at', iso(options.from));
    if (options.to) query = query.lt(options.dateColumn || 'created_at', iso(options.to));
    if (options.eventNames?.length) query = query.in('event_name', [...options.eventNames]);
    Object.entries(options.eq || {}).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    if (options.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error || !data) return [];
    return data as T[];
  } catch {
    return [];
  }
};

const buildPeriodMetric = async (
  table: string,
  options: { dateColumn?: string; eq?: Record<string, string | number | boolean>; eventNames?: readonly string[] } = {},
): Promise<PeriodValue> => {
  const today = startOfLocalDay(new Date());
  const tomorrow = addDays(today, 1);
  const sevenStart = addDays(today, -6);
  const previousSevenStart = addDays(sevenStart, -7);
  const previousSevenEnd = sevenStart;
  const thirtyStart = addDays(today, -29);
  const previousThirtyStart = addDays(thirtyStart, -30);
  const previousThirtyEnd = thirtyStart;

  const [todayCount, sevenDays, thirtyDays, previousSevenDays, previousThirtyDays] = await Promise.all([
    safeCount(table, today, tomorrow, options),
    safeCount(table, sevenStart, tomorrow, options),
    safeCount(table, thirtyStart, tomorrow, options),
    safeCount(table, previousSevenStart, previousSevenEnd, options),
    safeCount(table, previousThirtyStart, previousThirtyEnd, options),
  ]);

  return { today: todayCount, sevenDays, thirtyDays, previousSevenDays, previousThirtyDays };
};

const sumEventValue = async (from: Date, to: Date) => {
  const rows = await safeRows<Record<string, unknown>>('analytics_events', 'value,revenue,commission,created_at,event_name', {
    from,
    to,
    eventNames: ['purchase', 'affiliate_purchase', 'commission_confirmed'],
    limit: 5000,
  });
  return rows.reduce((sum, row) => {
    const value = Number(row.commission ?? row.revenue ?? row.value ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
};

const buildRevenueMetric = async (): Promise<PeriodValue> => {
  const today = startOfLocalDay(new Date());
  const tomorrow = addDays(today, 1);
  const sevenStart = addDays(today, -6);
  const previousSevenStart = addDays(sevenStart, -7);
  const thirtyStart = addDays(today, -29);
  const previousThirtyStart = addDays(thirtyStart, -30);
  const [todayValue, sevenDays, thirtyDays, previousSevenDays, previousThirtyDays] = await Promise.all([
    sumEventValue(today, tomorrow),
    sumEventValue(sevenStart, tomorrow),
    sumEventValue(thirtyStart, tomorrow),
    sumEventValue(previousSevenStart, sevenStart),
    sumEventValue(previousThirtyStart, thirtyStart),
  ]);
  return { today: todayValue, sevenDays, thirtyDays, previousSevenDays, previousThirtyDays };
};

const countRowsByDay = (rows: Array<Record<string, unknown>>, key: string) => {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const rawDate = row.created_at || row.published_at || row.updated_at;
    if (!rawDate) return;
    const parsed = new Date(String(rawDate));
    if (Number.isNaN(parsed.getTime())) return;
    const dateKey = dayKey(parsed);
    map.set(dateKey, (map.get(dateKey) || 0) + 1);
  });
  return { key, map };
};

const aggregateBy = (rows: Array<Record<string, unknown>>, labelKeys: string[], metricKeys: string[], limit = 6): RankingRow[] => {
  const grouped = new Map<string, RankingRow>();
  rows.forEach((row) => {
    const label = labelKeys.map((key) => String(row[key] || '')).find(Boolean) || '未分類';
    const current = grouped.get(label) || { name: label };
    metricKeys.forEach((key) => {
      const fallbackIncrement = key === metricKeys[0] ? 1 : 0;
      current[key] = Number(current[key] || 0) + Number(row[key] ?? fallbackIncrement);
    });
    grouped.set(label, current);
  });
  return [...grouped.values()]
    .sort((a, b) => Number(b[metricKeys[0]] || 0) - Number(a[metricKeys[0]] || 0))
    .slice(0, limit);
};

const loadAdminDashboardData = async (): Promise<AdminDashboardData> => {
  const now = new Date();
  const today = startOfLocalDay(now);
  const tomorrow = addDays(today, 1);
  const thirtyStart = addDays(today, -29);
  const dayKeys = Array.from({ length: 30 }, (_, index) => dayKey(addDays(thirtyStart, index)));

  const [
    signups,
    golfProfiles,
    publicPages,
    clubs,
    visits,
    diagnosisCompleted,
    snsImageGenerated,
    snsShared,
    urlCopy,
    publicPageSignup,
    productClicks,
    revenue,
  ] = await Promise.all([
    buildPeriodMetric('profiles'),
    buildPeriodMetric('golf_profiles'),
    buildPeriodMetric('profiles', { eq: { is_public: true } }),
    buildPeriodMetric('clubs'),
    buildPeriodMetric('analytics_events', { eventNames: eventNames.visits }),
    buildPeriodMetric('analytics_events', { eventNames: eventNames.diagnosisCompleted }),
    buildPeriodMetric('analytics_events', { eventNames: eventNames.snsImageGenerated }),
    buildPeriodMetric('analytics_events', { eventNames: eventNames.snsShared }),
    buildPeriodMetric('analytics_events', { eventNames: eventNames.urlCopy }),
    buildPeriodMetric('analytics_events', { eventNames: eventNames.publicPageSignup }),
    buildPeriodMetric('analytics_events', { eventNames: eventNames.productClick }),
    buildRevenueMetric().catch(() => emptyPeriod()),
  ]);

  const [signupRows, golfProfileRows, diagnosisRows, snsShareRows, productClickRows, visitRows] = await Promise.all([
    safeRows<Record<string, unknown>>('profiles', 'created_at', { from: thirtyStart, to: tomorrow, limit: 5000 }),
    safeRows<Record<string, unknown>>('golf_profiles', 'created_at,username,nickname,best_score,target_score', { from: thirtyStart, to: tomorrow, limit: 5000 }),
    safeRows<Record<string, unknown>>('analytics_events', 'created_at,event_name', { from: thirtyStart, to: tomorrow, eventNames: eventNames.diagnosisCompleted, limit: 5000 }),
    safeRows<Record<string, unknown>>('analytics_events', 'created_at,event_name', { from: thirtyStart, to: tomorrow, eventNames: eventNames.snsShared, limit: 5000 }),
    safeRows<Record<string, unknown>>('analytics_events', 'created_at,event_name', { from: thirtyStart, to: tomorrow, eventNames: eventNames.productClick, limit: 5000 }),
    safeRows<Record<string, unknown>>('analytics_events', 'created_at,event_name', { from: thirtyStart, to: tomorrow, eventNames: eventNames.visits, limit: 5000 }),
  ]);

  const dailyMaps = [
    countRowsByDay(signupRows, 'signups'),
    countRowsByDay(golfProfileRows, 'publicPages'),
    countRowsByDay(diagnosisRows, 'diagnosisCompleted'),
    countRowsByDay(snsShareRows, 'snsShares'),
    countRowsByDay(productClickRows, 'productClicks'),
  ];

  const daily = dayKeys.map((date) => ({
    date: date.slice(5).replace('-', '/'),
    signups: dailyMaps[0].map.get(date) || 0,
    publicPages: dailyMaps[1].map.get(date) || 0,
    diagnosisCompleted: dailyMaps[2].map.get(date) || 0,
    snsShares: dailyMaps[3].map.get(date) || 0,
    productClicks: dailyMaps[4].map.get(date) || 0,
  }));

  const [publicPageEvents, articleEvents, categoryEvents, diagnosisTypeEvents, fallbackPublicPages, fallbackArticles, latestGolfProfiles, fallbackGolfProfiles] = await Promise.all([
    safeRows<Record<string, unknown>>('analytics_events', 'page_title,page_path,event_name,pv,sns_clicks,create_clicks,signup_count,created_at', { from: thirtyStart, to: tomorrow, limit: 5000 }),
    safeRows<Record<string, unknown>>('analytics_events', 'article_title,page_title,event_name,pv,diagnosis_start_count,diagnosis_complete_count,product_clicks,created_at', { from: thirtyStart, to: tomorrow, limit: 5000 }),
    safeRows<Record<string, unknown>>('analytics_events', 'item_category,category,diagnosis_type,event_name,clicks,created_at', { from: thirtyStart, to: tomorrow, eventNames: eventNames.productClick, limit: 5000 }),
    safeRows<Record<string, unknown>>('analytics_events', 'diagnosis_type,event_name,count,created_at', { from: thirtyStart, to: tomorrow, eventNames: [...eventNames.diagnosisStart, ...eventNames.diagnosisCompleted], limit: 5000 }),
    safeRows<Record<string, unknown>>('profiles', 'name,id,updated_at,is_public', { eq: { is_public: true }, limit: 6 }),
    safeRows<Record<string, unknown>>('content_articles', 'title,slug,published_at,published', { eq: { published: true }, limit: 6 }),
    safeRows<Record<string, unknown>>('golf_profiles', 'username,nickname,best_score,target_score,social_links,created_at', { orderBy: 'created_at', ascending: false, limit: 10 }),
    loadPublicGolfIdProfiles(10).catch(() => []),
  ]);

  const popularPages = aggregateBy(publicPageEvents, ['page_title', 'page_path'], ['pv', 'sns_clicks', 'create_clicks', 'signup_count']);
  const articleRankings = aggregateBy(articleEvents, ['article_title', 'page_title'], ['pv', 'diagnosis_start_count', 'diagnosis_complete_count', 'product_clicks']);
  const productCategoryRankings = aggregateBy(categoryEvents, ['item_category', 'category'], ['clicks']);
  const diagnosisTypeRankings = aggregateBy(diagnosisTypeEvents, ['diagnosis_type'], ['count']);

  const effectiveGolfProfiles: PeriodValue =
    golfProfiles.thirtyDays === 0 && fallbackGolfProfiles.length > 0
      ? { today: fallbackGolfProfiles.length, sevenDays: fallbackGolfProfiles.length, thirtyDays: fallbackGolfProfiles.length, previousSevenDays: 0, previousThirtyDays: 0 }
      : golfProfiles;

  const kpis: KpiMetric[] = [
    { id: 'signups', label: '登録者数', helper: 'アカウント作成の増加', icon: <Users size={18} />, ...signups },
    { id: 'golf-id', label: 'Golf ID作成数', helper: '公開Golf IDの作成', icon: <UserRound size={18} />, ...effectiveGolfProfiles },
    { id: 'public-pages', label: '公開ページ作成数', helper: 'ユーザー公開ページ', icon: <FileText size={18} />, ...publicPages },
    { id: 'diagnosis', label: 'AI診断完了数', helper: '診断結果到達', icon: <Stethoscope size={18} />, ...diagnosisCompleted },
    { id: 'sns-image', label: 'SNS画像生成数', helper: '共有素材の作成', icon: <Image size={18} />, ...snsImageGenerated },
    { id: 'sns-share', label: 'SNS共有数', helper: '外部流入の起点', icon: <Share2 size={18} />, ...snsShared },
    { id: 'url-copy', label: 'URLコピー数', helper: 'プロフィール貼り付け準備', icon: <Link2 size={18} />, ...urlCopy },
    { id: 'public-signup', label: '公開ページ経由の新規登録数', helper: '紹介ループの成果', icon: <Link2 size={18} />, ...publicPageSignup },
    { id: 'product-click', label: '商品クリック数', helper: '購入検討への遷移', icon: <MousePointerClick size={18} />, ...productClicks },
    { id: 'revenue', label: '売上/成果報酬', helper: 'アフィリエイト成果', icon: <CircleDollarSign size={18} />, format: 'currency', ...revenue },
  ];

  const fallbackPageRows = fallbackPublicPages.map((row) => ({
    name: String(row.name || '公開ページ'),
    pv: 0,
    sns_clicks: 0,
    create_clicks: 0,
    signup_count: 0,
  }));
  const fallbackArticleRows = fallbackArticles.map((row) => ({
    name: String(row.title || '記事'),
    pv: 0,
    diagnosis_start_count: 0,
    diagnosis_complete_count: 0,
    product_clicks: 0,
  }));

  return {
    generatedAt: now.toISOString(),
    kpis,
    funnel: [
      { label: '訪問数', value: visits.thirtyDays || visitRows.length },
      { label: '会員登録数', value: signups.thirtyDays },
      { label: 'ゴルフデータページ作成数', value: effectiveGolfProfiles.thirtyDays || publicPages.thirtyDays },
      { label: 'AI診断完了数', value: diagnosisCompleted.thirtyDays },
      { label: 'SNS画像生成数', value: snsImageGenerated.thirtyDays },
      { label: 'SNS共有数', value: snsShared.thirtyDays },
      { label: '公開ページ経由の新規登録数', value: publicPageSignup.thirtyDays },
      { label: '商品クリック数', value: productClicks.thirtyDays },
    ],
    daily,
    latestGolfProfiles: (latestGolfProfiles.length > 0
      ? latestGolfProfiles.map((row) => ({
          name: String(row.nickname || row.username || 'Golf ID'),
          username: String(row.username || '-'),
          best_score: row.best_score ? Number(row.best_score) : '-',
          target_score: row.target_score ? Number(row.target_score) : '-',
          social_links: summarizeSocialLinks(row.social_links),
          created_at: row.created_at ? new Date(String(row.created_at)).toLocaleDateString('ja-JP') : '-',
        }))
      : fallbackGolfProfiles.map((row) => ({
          name: row.nickname || row.username || 'Golf ID',
          username: row.username || '-',
          best_score: row.best_score ?? '-',
          target_score: row.target_score ?? '-',
          social_links: summarizeSocialLinks(row.social_links),
          created_at: row.updated_at ? new Date(String(row.updated_at)).toLocaleDateString('ja-JP') : '-',
        }))),
    popularPages: popularPages.length ? popularPages : fallbackPageRows,
    articleRankings: articleRankings.length ? articleRankings : fallbackArticleRows,
    productCategoryRankings: productCategoryRankings.length ? productCategoryRankings : [
      { name: 'ドライバー', clicks: 0, diagnosis_type: '-' },
      { name: 'フェアウェイウッド/UT', clicks: 0, diagnosis_type: '-' },
      { name: 'ボール', clicks: 0, diagnosis_type: '-' },
    ],
    diagnosisTypeRankings: diagnosisTypeRankings.length ? diagnosisTypeRankings : [
      { name: 'スライス改善', count: 0 },
      { name: '飛距離アップ', count: 0 },
      { name: 'パター改善', count: 0 },
      { name: '100切り', count: 0 },
      { name: '90切り', count: 0 },
      { name: 'クラブ見直し', count: 0 },
      { name: '中古クラブ検討', count: 0 },
    ],
    notes: [
      clubs.thirtyDays > 0 ? `直近30日のクラブ登録/更新は${formatNumber(clubs.thirtyDays)}件です。` : 'クラブ登録イベントはプロフィール保存データから補完できます。',
      'GA4イベントは将来 analytics_events に同期すると同じUIでランキングへ反映できます。',
    ],
  };
};

const KpiCard = ({ metric }: { metric: KpiMetric }) => {
  const delta = periodDelta(metric.sevenDays, metric.previousSevenDays);
  const positive = delta >= 0;
  const formatter = metric.format === 'currency' ? formatCurrency : formatNumber;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#176534]">{metric.icon}</div>
        <div className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black', positive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {delta > 0 ? '+' : ''}{delta}%
        </div>
      </div>
      <div className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{metric.label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight text-trust-navy">{formatter(metric.thirtyDays)}</div>
      <div className="mt-1 text-xs font-bold text-slate-500">{metric.helper}</div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 p-2">
          <div className="text-[10px] font-black text-slate-400">今日</div>
          <div className="mt-0.5 text-sm font-black text-slate-700">{formatter(metric.today)}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <div className="text-[10px] font-black text-slate-400">7日</div>
          <div className="mt-0.5 text-sm font-black text-slate-700">{formatter(metric.sevenDays)}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <div className="text-[10px] font-black text-slate-400">30日</div>
          <div className="mt-0.5 text-sm font-black text-slate-700">{formatter(metric.thirtyDays)}</div>
        </div>
      </div>
    </div>
  );
};

const FunnelChart = ({ steps }: { steps: FunnelStep[] }) => {
  const max = Math.max(...steps.map((step) => step.value), 1);
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const width = Math.max(6, (step.value / max) * 100);
        return (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs font-black text-slate-500">
              <span>{index + 1}. {step.label}</span>
              <span className="text-trust-navy">{formatNumber(step.value)}</span>
            </div>
            <div className="h-8 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
              <div className="flex h-full items-center rounded-lg bg-gradient-to-r from-[#176534] to-cyan-600 px-3 text-xs font-black text-white" style={{ width: `${width}%` }}>
                {width > 22 ? `${Math.round(width)}%` : ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LineTrend = ({ data, activeKey }: { data: DailyPoint[]; activeKey: keyof Omit<DailyPoint, 'date'> }) => {
  const width = 760;
  const height = 230;
  const padding = 24;
  const values = data.map((point) => Number(point[activeKey] || 0));
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (value / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="overflow-hidden rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[230px] w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + ratio * (height - padding * 2);
          return <line key={ratio} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
        })}
        <polyline points={points} fill="none" stroke="#176534" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const [x, y] = points.split(' ')[index].split(',').map(Number);
          return <circle key={`${index}-${value}`} cx={x} cy={y} r="4" fill="#176534" stroke="white" strokeWidth="2" />;
        })}
      </svg>
      <div className="flex justify-between text-[10px] font-black text-slate-400">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

const RankingTable = ({ title, columns, rows }: { title: string; columns: Array<[string, string]>; rows: RankingRow[] }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="text-base font-black text-trust-navy">{title}</h3>
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-black text-slate-500">
          <tr>
            {columns.map(([key, label]) => <th key={key} className="px-3 py-2">{label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={`${row.name}-${index}`} className="text-slate-700">
              {columns.map(([key]) => (
                <td key={key} className={cn('px-3 py-2 font-bold', key !== 'name' && 'text-right tabular-nums')}>
                  {typeof row[key] === 'number' ? formatNumber(Number(row[key])) : String(row[key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const LatestGolfProfilesTable = ({ rows }: { rows: RankingRow[] }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="text-base font-black text-trust-navy">最新作成Golf ID</h3>
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-black text-slate-500">
          <tr>
            <th className="px-3 py-2">ニックネーム</th>
            <th className="px-3 py-2">公開ページ</th>
            <th className="px-3 py-2">SNS</th>
            <th className="px-3 py-2 text-right">ベスト</th>
            <th className="px-3 py-2 text-right">目標</th>
            <th className="px-3 py-2">作成日</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length > 0 ? (
            rows.map((row, index) => {
              const username = String(row.username || '');
              return (
                <tr key={`${username}-${index}`} className="text-slate-700">
                  <td className="px-3 py-2 font-bold">{String(row.name || 'Golf ID')}</td>
                  <td className="px-3 py-2 font-bold">
                    {username && username !== '-' ? (
                      <a href={`https://golfid.jp/u/${username}`} target="_blank" rel="noreferrer" className="text-[#176534] underline-offset-2 hover:underline">
                        /u/{username}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-3 py-2 font-bold text-slate-500">{String(row.social_links ?? '-')}</td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums">{String(row.best_score ?? '-')}</td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums">{String(row.target_score ?? '-')}</td>
                  <td className="px-3 py-2 font-bold">{String(row.created_at ?? '-')}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="px-3 py-5 text-center text-sm font-bold text-slate-400">
                まだGolf IDが作成されていません。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const trendOptions: Array<{ key: keyof Omit<DailyPoint, 'date'>; label: string }> = [
  { key: 'signups', label: '登録者数' },
  { key: 'publicPages', label: '公開ページ作成数' },
  { key: 'diagnosisCompleted', label: 'AI診断完了数' },
  { key: 'snsShares', label: 'SNS共有数' },
  { key: 'productClicks', label: '商品クリック数' },
];

const AdminLoginPanel = ({ onLogin }: { onLogin: (account: UserAccount) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const normalizedEmail = normalizeAdminEmail(email);
    if (!adminEmails.includes(normalizedEmail)) {
      setError('このメールアドレスでは管理画面にログインできません。');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        const message = signInError.message.toLowerCase();
        if (message.includes('invalid login credentials')) {
          setError('メールアドレスまたはパスワードが違います。通常ログインと同じパスワードを入力してください。');
          return;
        }
        if (message.includes('email not confirmed')) {
          setError('メール認証が完了していません。認証メールを確認してください。');
          return;
        }
        throw signInError;
      }
      const authUser = data.session?.user;
      if (!authUser || !adminEmails.includes(normalizeAdminEmail(authUser.email || ''))) {
        await supabase.auth.signOut();
        setError('管理者アカウントでログインしてください。');
        return;
      }

      onLogin({
        id: authUser.id,
        isLoggedIn: true,
        name: authUser.user_metadata?.name || 'Admin',
        email: authUser.email || '',
        memberSince: authUser.created_at,
        history: [],
      });
    } catch (loginError) {
      console.error('Admin login error:', loginError);
      setError('ログインできませんでした。メールアドレスとパスワードを確認してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setNotice('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('リセットするメールアドレスを入力してください。');
      return;
    }
    if (!adminEmails.includes(normalizeAdminEmail(normalizedEmail))) {
      setError('このメールアドレスは管理画面の許可リストにありません。');
      return;
    }

    setIsResetting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsResetting(false);

    if (resetError) {
      setError('リセットメールを送信できませんでした。時間をおいて再度お試しください。');
      trackEvent('admin_password_reset_failed', { reason: resetError.message });
      return;
    }

    setNotice('パスワード再設定メールを送信しました。メール内のリンクから新しいパスワードを設定してください。');
    trackEvent('admin_password_reset_requested', { email_domain: normalizedEmail.split('@')[1] || '' });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-[#176534]">
          <BarChart3 size={24} />
        </div>
        <h1 className="mt-5 text-center text-2xl font-black">管理画面ログイン</h1>
        <p className="mt-3 text-center text-sm font-bold leading-7 text-slate-500">
          管理者アカウントでログインしてください。
        </p>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-black text-slate-500">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-1 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-trust-navy outline-none transition focus:border-[#176534] focus:ring-2 focus:ring-[#176534]/15"
              placeholder="admin@example.com"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black text-slate-500">パスワード</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-1 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-trust-navy outline-none transition focus:border-[#176534] focus:ring-2 focus:ring-[#176534]/15"
              placeholder="パスワード"
            />
          </label>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">
            {notice}
          </div>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#176534] px-5 text-sm font-black text-white transition hover:bg-[#12512a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'ログイン中...' : '管理画面にログイン'}
        </button>
        <button
          type="button"
          onClick={handlePasswordReset}
          disabled={isResetting || isSubmitting}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-100 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60"
        >
          {isResetting ? 'リセットメール送信中...' : 'パスワードをリセットする'}
        </button>
      </form>
    </div>
  );
};

export const AdminDashboard = () => {
  const { user, setUser } = useDiagnosis();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTrend, setActiveTrend] = useState<keyof Omit<DailyPoint, 'date'>>('signups');
  const normalizedUserEmail = normalizeAdminEmail(user.email);
  const isAdmin = user.isLoggedIn && adminEmails.includes(normalizedUserEmail);

  useEffect(() => {
    let mounted = true;
    const syncAdminSession = async () => {
      if (isAdmin || !isSupabaseConfigured) return;
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;
      if (!mounted || !authUser) return;
      if (!adminEmails.includes(normalizeAdminEmail(authUser.email || ''))) return;
      setUser({
        id: authUser.id,
        isLoggedIn: true,
        name: authUser.user_metadata?.name || 'Admin',
        email: authUser.email || '',
        memberSince: authUser.created_at,
        history: [],
      });
    };
    syncAdminSession();
    return () => {
      mounted = false;
    };
  }, [isAdmin, setUser]);

  const refresh = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const nextData = await loadAdminDashboardData();
      setData(nextData);
    } catch (loadError) {
      console.error(loadError);
      setError('管理ダッシュボードの集計に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [isAdmin]);

  const activeTrendLabel = useMemo(() => trendOptions.find((option) => option.key === activeTrend)?.label || '登録者数', [activeTrend]);

  return (
    <div className="min-h-screen bg-[#f4f8f5] text-trust-navy">
      <div className="grid min-h-screen grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-white px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#176534] text-white"><BarChart3 size={20} /></div>
            <div>
              <div className="text-lg font-black">MyBagPro</div>
              <div className="text-xs font-bold text-slate-400">Business Dashboard</div>
            </div>
          </div>
          <nav className="mt-8 space-y-1 text-sm font-black text-slate-600">
            {[
              ['成長KPI', Activity],
              ['成長ファネル', Flag],
              ['日別推移', LineChart],
              ['成果ランキング', Sparkles],
            ].map(([label, Icon]) => (
              <div key={String(label)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-[#176534]">
                <Icon size={18} />
                {String(label)}
              </div>
            ))}
          </nav>
          <div className="mt-8 rounded-xl bg-emerald-50 p-4 text-xs font-bold leading-6 text-emerald-900">
            成長ループは「ページ作成 → AI診断 → SNS公開 → 新規登録」で見ます。0が続く項目はイベント計測の追加候補です。
          </div>
        </aside>

        <main className="px-7 py-6">
          {!isAdmin ? (
            <AdminLoginPanel onLogin={setUser} />
          ) : (
          <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#176534]">ADMIN</div>
              <h1 className="mt-1 text-3xl font-black tracking-tight">事業ダッシュボード</h1>
              <p className="mt-2 text-sm font-bold text-slate-500">登録・診断・公開ページ・SNS共有・商品クリックまで、成長ループの詰まりを確認します。</p>
            </div>
            <button type="button" onClick={refresh} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#176534] px-4 text-sm font-black text-white disabled:opacity-60">
              <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
              再集計
            </button>
          </div>

          {!isSupabaseConfigured && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              Supabase環境変数が未設定のため、データは0表示になります。
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900">{error}</div>
          )}

          {loading && !data ? (
            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-black text-slate-500">集計中です...</div>
          ) : data && (
            <>
              <section className="mt-6 grid grid-cols-4 gap-4">
                {data.kpis.map((metric) => <KpiCard key={metric.id} metric={metric} />)}
              </section>

              <section className="mt-6 grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-5">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black">成長ファネル</h2>
                      <p className="mt-1 text-xs font-bold text-slate-500">直近30日の流れ。数値差が大きい箇所が改善候補です。</p>
                    </div>
                    <Flag className="text-[#176534]" size={20} />
                  </div>
                  <FunnelChart steps={data.funnel} />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black">日別推移グラフ</h2>
                      <p className="mt-1 text-xs font-bold text-slate-500">{activeTrendLabel}の直近30日推移</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {trendOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setActiveTrend(option.key)}
                          className={cn('rounded-full px-3 py-1.5 text-xs font-black ring-1', activeTrend === option.key ? 'bg-[#176534] text-white ring-[#176534]' : 'bg-white text-slate-500 ring-slate-200')}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <LineTrend data={data.daily} activeKey={activeTrend} />
                </div>
              </section>

              <section className="mt-6 grid grid-cols-2 gap-5">
                <LatestGolfProfilesTable rows={data.latestGolfProfiles} />
                <RankingTable
                  title="人気公開ページランキング"
                  columns={[
                    ['name', 'ページ名'],
                    ['pv', 'PV'],
                    ['sns_clicks', 'SNSクリック'],
                    ['create_clicks', '自分も作る'],
                    ['signup_count', '登録貢献'],
                  ]}
                  rows={data.popularPages}
                />
                <RankingTable
                  title="記事別成果ランキング"
                  columns={[
                    ['name', '記事タイトル'],
                    ['pv', 'PV'],
                    ['diagnosis_start_count', '診断開始'],
                    ['diagnosis_complete_count', '診断完了'],
                    ['product_clicks', '商品クリック'],
                  ]}
                  rows={data.articleRankings}
                />
                <RankingTable
                  title="商品カテゴリ別クリックランキング"
                  columns={[
                    ['name', 'カテゴリ'],
                    ['clicks', 'クリック数'],
                    ['diagnosis_type', '診断タイプ'],
                  ]}
                  rows={data.productCategoryRankings}
                />
                <RankingTable
                  title="診断タイプ別件数"
                  columns={[
                    ['name', '診断タイプ'],
                    ['count', '件数'],
                  ]}
                  rows={data.diagnosisTypeRankings}
                />
              </section>

              <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-black text-trust-navy">改善メモ</div>
                <div className="mt-2 grid gap-2 text-sm font-bold text-slate-600">
                  {data.notes.map((note) => <div key={note}>・{note}</div>)}
                  <div>・最終集計: {new Date(data.generatedAt).toLocaleString('ja-JP')}</div>
                </div>
              </section>
            </>
          )}
          </>
          )}
        </main>
      </div>
    </div>
  );
};
