import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

// Using a fallback token for demo/development if none is provided.
const POSTHOG_KEY = (import.meta as any).env?.VITE_POSTHOG_KEY || 'phc_dummy_key_for_development';

export function initPostHog() {
  if (typeof window !== 'undefined') {
    posthog.init(POSTHOG_KEY, {
      api_host: 'https://us.i.posthog.com',
      person_profiles: 'identified_only', // or 'always' to track anonymous users
      autocapture: false, // We'll manually track crucial events
    });
  }
}

export function useAnalytics() {
  const [location] = useLocation();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initPostHog();
    setInitialized(true);
  }, []);

  // Track pageviews
  useEffect(() => {
    if (initialized) {
      posthog.capture('$pageview', { path: location });
    }
  }, [location, initialized]);

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    posthog.capture(eventName, properties);
  };

  const identifyUser = (userId: string, properties?: Record<string, any>) => {
    posthog.identify(userId, properties);
  };

  return { trackEvent, identifyUser };
}
