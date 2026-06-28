export type SharePayload = {
  title?: string;
  text: string;
  url: string;
};

export type ShareResult = {
  ok: boolean;
  message: string;
  method: 'native' | 'copy' | 'window' | 'error';
};

const fallbackCopy = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!ok) throw new Error('copy command failed');
};

export const copyToClipboard = async (value: string): Promise<ShareResult> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      fallbackCopy(value);
    }
    return { ok: true, message: 'コピーしました', method: 'copy' };
  } catch {
    return { ok: false, message: 'コピーできませんでした。URLを長押ししてコピーしてください。', method: 'error' };
  }
};

export const nativeShare = async ({ title = 'Golf ID', text, url }: SharePayload): Promise<ShareResult> => {
  if (!navigator.share) {
    return { ok: false, message: 'この端末では共有シートを開けません。', method: 'error' };
  }

  try {
    await navigator.share({ title, text, url });
    return { ok: true, message: '共有画面を開きました', method: 'native' };
  } catch {
    return { ok: false, message: '共有をキャンセルしました', method: 'error' };
  }
};

export const shareToX = ({ text, url }: SharePayload) => {
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
  return { ok: true, message: 'Xの共有画面を開きました', method: 'window' } satisfies ShareResult;
};

export const shareToLine = ({ url }: SharePayload) => {
  const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
  return { ok: true, message: 'LINEの共有画面を開きました', method: 'window' } satisfies ShareResult;
};

export const copyUrlForSocialProfile = async (platform: 'instagram' | 'tiktok', payload: SharePayload): Promise<ShareResult> => {
  const copied = await copyToClipboard(payload.url);
  if (!copied.ok) return copied;

  const native = await nativeShare(payload);
  if (native.ok) {
    return {
      ok: true,
      message: `URLをコピーしました。共有画面から${platform === 'instagram' ? 'Instagram' : 'TikTok'}に送れます。`,
      method: 'native',
    };
  }

  return {
    ok: true,
    message:
      platform === 'instagram'
        ? 'URLをコピーしました。Instagramのプロフィールやストーリーズに貼り付けて共有できます。'
        : 'URLをコピーしました。TikTokプロフィールや投稿文に貼り付けて共有できます。',
    method: copied.method,
  };
};

export const shareToInstagram = async ({ title = 'Golf ID', text, url }: SharePayload): Promise<ShareResult> => {
  return copyUrlForSocialProfile('instagram', { title, text, url });
};

export const shareToTikTok = async ({ title = 'Golf ID', text, url }: SharePayload): Promise<ShareResult> => {
  return copyUrlForSocialProfile('tiktok', { title, text, url });
};
