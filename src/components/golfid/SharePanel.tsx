import { useState } from 'react';
import { CheckCircle2, Clipboard, ExternalLink, Instagram, Link2, MessageCircle, Music2, Share2, X } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';
import { copyToClipboard, copyUrlForSocialProfile, nativeShare, shareToLine, shareToX } from '../../lib/share';
import { golfIdDesign } from '../../config/design';

type ShareLocation = 'public_top' | 'public_bottom' | 'created_modal' | 'edit_panel' | string;
type ShareVariant = 'compact' | 'full' | 'owner' | 'public';
type ShareEventValue = string | number | boolean | null | undefined;

type SharePanelProps = {
  url: string;
  title: string;
  text: string;
  username?: string;
  variant?: ShareVariant;
  location: ShareLocation;
  heading?: string;
  description?: string;
  publicPageHref?: string;
  className?: string;
};

const guideCopy: Record<'instagram' | 'tiktok', string> = {
  instagram: 'URLをコピーしました。Instagramのプロフィール欄、ストーリーズ、投稿文に貼り付けて共有できます。',
  tiktok: 'URLをコピーしました。TikTokプロフィールや投稿文に貼り付けて共有できます。',
};

const emitShareEvent = (eventName: string, params: Record<string, ShareEventValue>) => {
  trackEvent(eventName, params);
};

export const CopyUrlButton = ({
  url,
  username,
  location,
  className = '',
  label = 'URLコピー',
  onNotice,
}: {
  url: string;
  username?: string;
  location: ShareLocation;
  className?: string;
  label?: string;
  onNotice?: (message: string, ok: boolean) => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    emitShareEvent('url_copy_click', { location, username });
    const result = await copyToClipboard(url);
    onNotice?.(result.message, result.ok);
    emitShareEvent(result.ok ? 'share_success' : 'share_failed', {
      method: 'copy',
      location,
      username,
    });
    if (result.ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <button type="button" onClick={handleCopy} className={className}>
      <Clipboard className="h-4 w-4" />
      {copied ? 'コピーしました' : label}
    </button>
  );
};

export const ShareGuideModal = ({
  platform,
  onClose,
}: {
  platform: 'instagram' | 'tiktok' | null;
  onClose: () => void;
}) => {
  if (!platform) return null;
  const label = platform === 'instagram' ? 'Instagram' : 'TikTok';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="w-full max-w-md rounded-[1.5rem] bg-white p-5 shadow-2xl ring-1 ring-black/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={golfIdDesign.badgeLight}>{label}で使う</p>
            <h2 className="mt-3 text-xl font-black text-slate-950">URLをコピーしました</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-4 text-sm font-bold leading-7 text-slate-600">{guideCopy[platform]}</p>
        <button
          type="button"
          onClick={onClose}
          className={`mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-black ${golfIdDesign.primaryButton}`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export const ShareButtons = ({
  url,
  title,
  text,
  username,
  location,
  mode = 'full',
  onNotice,
}: {
  url: string;
  title: string;
  text: string;
  username?: string;
  location: ShareLocation;
  mode?: 'compact' | 'full';
  onNotice?: (message: string, ok: boolean) => void;
}) => {
  const [guidePlatform, setGuidePlatform] = useState<'instagram' | 'tiktok' | null>(null);

  const buttonBase =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black transition';
  const lightButton = `${buttonBase} bg-white text-slate-950 ring-1 ring-black/5 hover:bg-emerald-50`;
  const ghostButton = `${buttonBase} bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15`;
  const mutedButton = `${buttonBase} bg-[#F5F7F4] text-slate-900 ring-1 ring-black/5 hover:bg-emerald-50`;

  const handleNativeShare = async () => {
    emitShareEvent('native_share_click', { location, username });
    const result = await nativeShare({ title, text, url });
    if (result.ok) {
      onNotice?.(result.message, true);
      emitShareEvent('share_success', { method: 'native_share', location, username });
      return;
    }

    const copied = await copyToClipboard(url);
    onNotice?.(copied.ok ? '共有シートを開けなかったため、URLをコピーしました。' : copied.message, copied.ok);
    emitShareEvent(copied.ok ? 'share_success' : 'share_failed', {
      method: copied.ok ? 'copy' : 'native_share',
      location,
      username,
    });
  };

  const handleX = () => {
    emitShareEvent('sns_share_click', { platform: 'x', location, username });
    const result = shareToX({ title, text, url });
    onNotice?.(result.message, true);
    emitShareEvent('share_success', { method: 'x', platform: 'x', location, username });
  };

  const handleLine = () => {
    emitShareEvent('sns_share_click', { platform: 'line', location, username });
    const result = shareToLine({ title, text, url });
    onNotice?.(result.message, true);
    emitShareEvent('share_success', { method: 'line', platform: 'line', location, username });
  };

  const handleGuideShare = async (platform: 'instagram' | 'tiktok') => {
    emitShareEvent('sns_share_click', { platform, location, username });
    const result = await copyUrlForSocialProfile(platform, { title, text, url });
    if (!result.ok) {
      onNotice?.(result.message, false);
      emitShareEvent('share_failed', { method: 'copy', platform, location, username });
      return;
    }

    onNotice?.(result.message, true);
    emitShareEvent('share_success', { method: result.method === 'native' ? 'native_share' : 'copy', platform, location, username });
    if (result.method !== 'native') {
      emitShareEvent('share_guide_open', { platform, location, username });
      setGuidePlatform(platform);
    }
  };

  if (mode === 'compact') {
    return (
      <>
        <div className="grid grid-cols-2 gap-2">
          <CopyUrlButton
            url={url}
            username={username}
            location={location}
            onNotice={onNotice}
            className={lightButton}
            label="URLコピー"
          />
          <button type="button" onClick={handleNativeShare} className={ghostButton}>
            <Share2 className="h-4 w-4" />
            共有する
          </button>
        </div>
        <ShareGuideModal platform={guidePlatform} onClose={() => setGuidePlatform(null)} />
      </>
    );
  }

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={handleX} className={mutedButton}>
          <Share2 className="h-4 w-4" />
          Xで共有
        </button>
        <button type="button" onClick={() => handleGuideShare('instagram')} className={mutedButton}>
          <Instagram className="h-4 w-4" />
          Instagramで使う
        </button>
        <button type="button" onClick={() => handleGuideShare('tiktok')} className={mutedButton}>
          <Music2 className="h-4 w-4" />
          TikTokで使う
        </button>
        <button type="button" onClick={handleLine} className={mutedButton}>
          <MessageCircle className="h-4 w-4" />
          LINEで送る
        </button>
        <CopyUrlButton
          url={url}
          username={username}
          location={location}
          onNotice={onNotice}
          className={`${mutedButton} sm:col-span-2`}
          label="URLコピー"
        />
      </div>
      <ShareGuideModal platform={guidePlatform} onClose={() => setGuidePlatform(null)} />
    </>
  );
};

export const SharePanel = ({
  url,
  title,
  text,
  username,
  variant = 'full',
  location,
  heading,
  description,
  publicPageHref,
  className = '',
}: SharePanelProps) => {
  const [notice, setNotice] = useState<{ message: string; ok: boolean } | null>(null);

  const handleNotice = (message: string, ok: boolean) => {
    setNotice({ message, ok });
    window.setTimeout(() => setNotice(null), 3600);
  };

  const compact = variant === 'compact';
  const dark = compact;
  const panelClass = compact
    ? 'rounded-[1.35rem] bg-white/10 p-3 ring-1 ring-white/15'
    : variant === 'owner'
      ? 'rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-black/5'
      : 'rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5';

  return (
    <div className={`${panelClass} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={dark ? 'text-[11px] font-black uppercase tracking-[0.14em] text-[#D7B56D]' : golfIdDesign.badgeLight}>
            {heading || (variant === 'owner' ? 'Share Golf ID' : compact ? 'Golf ID URL' : 'Share')}
          </p>
          {description && (
            <p className={`mt-2 text-sm font-bold leading-6 ${dark ? 'text-white/78' : 'text-slate-600'}`}>
              {description}
            </p>
          )}
        </div>
        {publicPageHref && (
          <a
            href={publicPageHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F7F4] text-emerald-800 ring-1 ring-black/5 transition hover:bg-emerald-50"
            aria-label="公開ページを見る"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className={`mt-3 rounded-2xl px-3 py-2 ${dark ? 'bg-white/10 text-white' : 'bg-[#F5F7F4] text-slate-700 ring-1 ring-black/5'}`}>
        <div className="flex items-center gap-2">
          <Link2 className={`h-4 w-4 shrink-0 ${dark ? 'text-[#D7B56D]' : 'text-emerald-700'}`} />
          <p className="break-all text-sm font-black">{url}</p>
        </div>
      </div>

      {variant === 'owner' && publicPageHref && (
        <a
          href={publicPageHref}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0B0F0D] px-4 text-sm font-black text-white transition hover:bg-[#151C17]"
        >
          <ExternalLink className="h-4 w-4" />
          公開ページを見る
        </a>
      )}

      <div className="mt-3">
        <ShareButtons
          url={url}
          title={title}
          text={text}
          username={username}
          location={location}
          mode={compact ? 'compact' : 'full'}
          onNotice={handleNotice}
        />
      </div>

      {notice && (
        <div className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-black ${
          dark
            ? notice.ok
              ? 'bg-emerald-500/15 text-emerald-100'
              : 'bg-rose-500/15 text-rose-100'
            : notice.ok
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
              : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
        }`}>
          {notice.ok && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{notice.message}</span>
        </div>
      )}
    </div>
  );
};
