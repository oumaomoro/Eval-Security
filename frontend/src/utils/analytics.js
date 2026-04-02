import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';

// Initialize Sentry for React Error Tracking
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const isProd = import.meta.env.MODE === 'production';

  if (!dsn) {
    console.warn('[Analytics] Sentry DSN not found. Error tracking is disabled locally.');
    return;
  }

  Sentry.init({
    dsn,
    environment: isProd ? 'production' : 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Only sample 20% of transactions to reduce noise — errors always captured
    tracesSampleRate: isProd ? 0.2 : 0.0,
    // Record replays only on crashes in production
    replaysSessionSampleRate: isProd ? 0.05 : 0.0,
    replaysOnErrorSampleRate: isProd ? 1.0 : 0.0,
    // Filter: only send critical/server errors in production
    beforeSend(event) {
      if (!isProd) return null; // Suppress all local events
      // Drop 4xx client-side errors (e.g., cancelled requests)
      const status = event?.extra?.status || event?.contexts?.response?.status_code;
      if (status && status >= 400 && status < 500) return null;
      return event;
    },
  });
  console.log('[Analytics] Sentry — Production Error Tracking Active');
};

// Initialize PostHog for Product Usage Analytics
export const initPostHog = () => {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    console.warn('[Analytics] PostHog API Key not found. Usage tracking is disabled.');
    return;
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    autocapture: true,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true, // Mask sensitive form inputs for GDPR compliance
    },
    loaded: (ph) => {
      if (import.meta.env.MODE !== 'production') ph.opt_out_capturing();
    },
  });
  console.log('[Analytics] PostHog — Usage Tracking Active');
};

// Identify User across Sentry & PostHog
export const identifyUser = (user, profile) => {
  if (!user) return;

  const userData = {
    email: user.email,
    name: profile?.full_name || 'Costloci User',
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
