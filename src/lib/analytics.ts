declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

let initialized = false;

export const isAnalyticsEnabled = Boolean(GA_MEASUREMENT_ID);

const pageLocation = () =>
  `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

export const initAnalytics = () => {
  if (!isAnalyticsEnabled || initialized || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(..._args: unknown[]) {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_location: pageLocation(),
    page_path: window.location.pathname + window.location.hash,
    debug_mode: true,
    send_page_view: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  initialized = true;
};

export const trackPageView = (path: string, title: string) => {
  if (!isAnalyticsEnabled || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: title,
    page_location: pageLocation(),
    page_path: path,
    debug_mode: true,
  });

  window.gtag('event', 'page_view', {
    page_title: title,
    page_location: pageLocation(),
    page_path: path,
    debug_mode: true,
  });
};

export const trackEvent = (eventName: string, params: AnalyticsParams = {}) => {
  if (!isAnalyticsEnabled || !window.gtag) return;

  window.gtag('event', eventName, {
    ...params,
    page_location: pageLocation(),
    debug_mode: true,
  });
};
