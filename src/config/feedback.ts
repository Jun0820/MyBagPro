import { trackEvent } from '../lib/analytics';

export const feedbackFormUrl = (import.meta.env.VITE_FEEDBACK_FORM_URL || '').trim();

export const hasFeedbackForm = feedbackFormUrl.length > 0;

export const trackFeedbackClick = (source: string) => {
  trackEvent('feedback_click', {
    source,
  });
};
