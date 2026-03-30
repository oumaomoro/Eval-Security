import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';

// Initialize Sentry for React Error Tracking
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn('[Analytics] Sentry DSN not found. Error tracking is disabled locally.');
    return;
  }
  
  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0, 
    replaysSessionSampleRate: 0.1, 
    replaysOnErrorSampleRate: 1.0, 
  });
  console.log('[Analytics] Sentry Error Tracking Initialized');
};

// Initialize PostHog for Product Usage Analytics
export const initPostHog = () => {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    console.warn('[Analytics] PostHog API Key not found. Usage tracking is disabled locally.');
    return;
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    autocapture: true,
    person_profiles: 'identified_only',
    capture_pageview: true 
  });
  console.log('[Analytics] PostHog Usage Tracking Initialized');
};

// Identify User across Sentry & PostHog
export const identifyUser = (user, profile) => {
  if (!user) return;

  const userData = {
    email: user.email,
    name: profile?.full_name || 'CyberOptimize User',
    company: profile?.company_name || '',
    plan: profile?.plan || 'free',
    role: profile?.role || 'user'
  };

  // Identify in Posthog
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.identify(user.id, userData);
  }

  // Identify in Sentry
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({ id: user.id, ...userData });
  }
};

// Clear User data entirely on Logout
export const resetAnalyticsUser = () => {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.reset();
  }
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
};
