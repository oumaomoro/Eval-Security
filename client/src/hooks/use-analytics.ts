import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const POSTHOG_KEY = (import.meta as any).env?.VITE_POSTHOG_KEY || 'phc_dummy_key_for_development';

export function initPostHog() {
  if (typeof window !== 'undefined') {
    posthog.init(POSTHOG_KEY, {
      api_host: 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      autocapture: false,
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

  // Track pageviews in both PostHog and Google Analytics
  useEffect(() => {
    if (initialized) {
      posthog.capture('$pageview', { path: location });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_path: location,
          page_location: window.location.href,
          page_title: document.title,
        });
      }
    }
  }, [location, initialized]);

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    posthog.capture(eventName, properties);
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties || {});
    }
  };

  const identifyUser = (userId: string, properties?: Record<string, any>) => {
    posthog.identify(userId, properties);
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('set', 'user_properties', {
        user_id: userId,
        ...(properties || {}),
      });
    }
  };

  return { trackEvent, identifyUser };
}
