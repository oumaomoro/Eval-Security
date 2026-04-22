import * as Sentry from "@sentry/react";
import posthog from "posthog-js";

/**
 * Phase 29: Production Observability Logic
 * This module initializes Sentry (Exception Tracking) and PostHog (Product Analytics)
 * using production-hardened environment variables.
 */

export function initObservability() {
  const isProd = import.meta.env.PROD || import.meta.env.NODE_ENV === 'production';
  
  // 1. PostHog Initialization (Product Analytics & Session Recording)
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST || "https://app.posthog.com";

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only', // Robust privacy compliance
      capture_performance: true,
      session_recording: {
        maskAllInputs: true, // Sovereign privacy defaults
        maskTextSelector: ".mask-text",
      },
      loaded: (ph) => {
        if (!isProd) ph.opt_out_capturing(); // Disable in local dev by default unless forced
      }
    });
  }

  // 2. Sentry Initialization (Error Tracking & Performance)
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: isProd ? 0.2 : 1.0, 
      // Session Replay
      replaysSessionSampleRate: isProd ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,
      
      environment: import.meta.env.MODE || "production",
      
      enabled: isProd, // Only send events in production contexts
    });
  }
}

/**
 * Identify a user across all observability platforms.
 */
export function identifyUser(userId: string, email: string, traits: Record<string, any> = {}) {
  posthog.identify(userId, { email, ...traits });
  Sentry.setUser({ id: userId, email, ...traits });
}

/**
 * Reset identity (e.g. on logout).
 */
export function resetIdentity() {
  posthog.reset();
  Sentry.setUser(null);
}
