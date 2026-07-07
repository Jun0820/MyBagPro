import type { ReactNode } from 'react';
import { ArrowRight, Gauge, Goal, Instagram, Link2, Music2, Share2, Trophy, Youtube } from 'lucide-react';
import { golfIdDesign } from '../../config/design';

type StatValue = string | number | null | undefined;

export const formatGolfIdValue = (value: StatValue, suffix = '') => {
  if (value === null || value === undefined || value === '') return '-';
  return `${value}${suffix}`;
};

export const GolfIdButton = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'gold' | 'darkGhost' | 'light';
}) => {
  const variantClass =
    variant === 'gold'
      ? golfIdDesign.goldButton
      : variant === 'darkGhost'
        ? golfIdDesign.ghostDarkButton
        : variant === 'light'
          ? 'bg-white text-[#0B0F0D] ring-1 ring-black/5 hover:bg-[#F5F7F4]'
          : golfIdDesign.primaryButton;

  return (
    <button
      {...props}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition disabled:cursor-wait disabled:bg-slate-400 ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
};

export const GolfIdSectionCard = ({
  eyebrow,
  title,
  children,
  dark = false,
  className = '',
}: {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) => (
  <section className={`rounded-[1.7rem] p-5 md:p-6 ${dark ? golfIdDesign.darkPanel : golfIdDesign.lightCard} ${className}`}>
    {eyebrow && <p className={dark ? golfIdDesign.badgeDark : golfIdDesign.badgeLight}>{eyebrow}</p>}
    {title && <h2 className={`mt-3 text-xl font-black tracking-tight md:text-2xl ${dark ? 'text-white' : 'text-[#111827]'}`}>{title}</h2>}
    <div className={title || eyebrow ? 'mt-4' : ''}>{children}</div>
  </section>
);

export const GolfIdStatCard = ({
  label,
  value,
  suffix,
  icon = 'trophy',
  dark = false,
}: {
  label: string;
  value: StatValue;
  suffix?: string;
  icon?: 'trophy' | 'goal' | 'gauge';
  dark?: boolean;
}) => {
  const Icon = icon === 'goal' ? Goal : icon === 'gauge' ? Gauge : Trophy;
  return (
    <div className={`rounded-2xl p-4 ${dark ? 'bg-white/10 ring-1 ring-white/12' : 'bg-[#F5F7F4] ring-1 ring-black/5'}`}>
      <Icon className={`h-5 w-5 ${dark ? 'text-[#D7B56D]' : 'text-[#1F7A4D]'}`} />
      <p className={`mt-3 text-[11px] font-black uppercase tracking-[0.12em] ${dark ? 'text-white/55' : 'text-slate-500'}`}>{label}</p>
      <p className={`mt-1 text-2xl font-black tracking-tight ${dark ? 'text-white' : 'text-[#111827]'}`}>
        {formatGolfIdValue(value, suffix)}
      </p>
    </div>
  );
};

export const socialIconMap = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Music2,
  x: Share2,
  custom1: Link2,
  custom2: Link2,
};

export const GolfIdSocialBadge = ({ label, platform = 'custom1' }: { label: string; platform?: keyof typeof socialIconMap }) => {
  const Icon = socialIconMap[platform] || Link2;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black text-white ring-1 ring-white/12">
      <Icon className="h-3.5 w-3.5 text-[#D7B56D]" />
      {label}
    </span>
  );
};

export const GolfIdPreviewCard = ({
  nickname,
  username,
  bestScore,
  targetScore,
  averageScore,
  headSpeed,
  currentIssue,
  favoriteClub,
  weakClub,
  clubLines = [],
  socialLabels = [],
  className = '',
}: {
  nickname?: string;
  username?: string;
  bestScore?: StatValue;
  targetScore?: StatValue;
  averageScore?: StatValue;
  headSpeed?: StatValue;
  currentIssue?: string | null;
  favoriteClub?: string | null;
  weakClub?: string | null;
  clubLines?: string[];
  socialLabels?: Array<{ label: string; platform?: keyof typeof socialIconMap }>;
  className?: string;
}) => {
  const handle = username || 'username';
  return (
    <article className={`overflow-hidden rounded-[2rem] bg-[#0B0F0D] text-white shadow-[0_24px_80px_-46px_rgba(11,15,13,0.95)] ring-1 ring-white/10 ${className}`}>
      <div className="relative p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_10%,rgba(215,181,109,0.28),transparent_26%),radial-gradient(circle_at_14%_78%,rgba(31,122,77,0.35),transparent_30%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#D7B56D]">Golf ID</p>
              <h3 className="mt-3 text-3xl font-black tracking-tight">{nickname || 'Your Name'}</h3>
              <p className="mt-1 text-sm font-bold text-white/62">@{handle}</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-emerald-100 ring-1 ring-white/12">Digital ID</span>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {[
              ['Best', bestScore],
              ['Goal', targetScore],
              ['Avg', averageScore],
              ['HS', headSpeed],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/12">
                <p className="text-[10px] font-black uppercase text-white/45">{label}</p>
                <p className="mt-1 text-lg font-black tracking-tight text-white">{formatGolfIdValue(value, label === 'HS' && value ? '' : '')}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-[#D7B56D] p-4 text-[#0B0F0D]">
            <p className="text-[11px] font-black uppercase tracking-[0.16em]">Share Card</p>
            <p className="mt-2 text-sm font-black leading-6">QRやURLで、コーチ・フィッター・同伴者にあなたのゴルフを共有できます。</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-white p-5 text-[#111827]">
        {(currentIssue || favoriteClub || weakClub) && (
          <div className="rounded-2xl bg-[#F5F7F4] p-4 ring-1 ring-black/5">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#1F7A4D]">My Golf</p>
            {currentIssue && <p className="mt-2 text-sm font-bold leading-6">{currentIssue}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-slate-600">
              <span>得意: {favoriteClub || '-'}</span>
              <span>苦手: {weakClub || '-'}</span>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-[#F5F7F4] p-4 ring-1 ring-black/5">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#1F7A4D]">My Bag</p>
          <div className="mt-2 space-y-1.5">
            {(clubLines.length > 0 ? clubLines.slice(0, 4) : ['1W / Iron / Wedge / Ball']).map((line, index) => (
              <p key={`${line}-${index}`} className="truncate text-sm font-bold text-[#111827]">{line}</p>
            ))}
          </div>
        </div>

        {socialLabels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {socialLabels.map((item) => (
              <span key={`${item.platform}-${item.label}`} className="inline-flex items-center gap-1.5 rounded-full bg-[#0B0F0D] px-3 py-1.5 text-[11px] font-black text-white">
                <ArrowRight className="h-3 w-3 text-[#D7B56D]" />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};
