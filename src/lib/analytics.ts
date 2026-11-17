declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const debug = import.meta.env.DEV && import.meta.env.VITE_GA_DEBUG === 'true';
const hostname = typeof window === 'undefined' ? '' : window.location.hostname.toLowerCase();
const siteBrand = /^(www\.)?mybagpro\.jp$/.test(hostname) ? 'mybagpro'
  : /^(www\.)?golfid\.jp$/.test(hostname) ? 'golfid' : 'preview';

// Preview builds must not inflate the production reports.
export const isAnalyticsEnabled = Boolean(GA_MEASUREMENT_ID) && (siteBrand !== 'preview' || debug);
let initialized = false;
let lastNavigation: string | undefined;
let previousPageLocation: string | undefined;

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

const pageLocation = () => {
  const url = new URL(window.location.href);
  // Preserve campaign attribution, but never send auth fragments or arbitrary form queries.
  const allowed = /^(utm_(source|medium|campaign|id|term|content)|gclid|dclid|gbraid|wbraid)$/;
  for (const key of [...url.searchParams.keys()]) {
    if (!allowed.test(key)) url.searchParams.delete(key);
  }
  url.hash = '';
  return url.href;
};

const commonParams = (): AnalyticsParams => ({
  site_brand: siteBrand,
  site_hostname: hostname,
  page_location: pageLocation(),
  page_path: window.location.pathname,
  ...(debug ? { debug_mode: true } : {}),
});

export const initAnalytics = () => {
  if (!isAnalyticsEnabled || initialized || typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(..._args: unknown[]) {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    ...commonParams(),
    send_page_view: false,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  initialized = true;
};

// Also disable Enhanced Measurement's browser-history page views when releasing.
export const trackPageView = (path: string, title: string, navigationKey = path) => {
  if (!isAnalyticsEnabled || !window.gtag || lastNavigation === navigationKey) return;
  const currentLocation = pageLocation();
  window.gtag('event', 'page_view', {
    ...commonParams(),
    page_title: title,
    page_path: path,
    ...(previousPageLocation ? { page_referrer: previousPageLocation } : {}),
  });
  lastNavigation = navigationKey;
  previousPageLocation = currentLocation;
};

export const trackEvent = (eventName: string, params: AnalyticsParams = {}) => {
  if (!isAnalyticsEnabled || !window.gtag) return;
  window.gtag('event', eventName, {
    ...params,
    ...commonParams(),
  });
};
