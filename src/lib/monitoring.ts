import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';
import posthog from 'posthog-js';
import { captureMessage } from './sentry';

// Initialize PostHog
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (import.meta.env.DEV) posthog.debug();
    },
    capture_pageview: true,
    capture_pageleave: true,
  });
}

// Track Web Vitals
export function trackWebVitals() {
  if (import.meta.env.PROD) {
    onCLS(metric => sendToAnalytics(metric, 'CLS'));
    onFID(metric => sendToAnalytics(metric, 'FID'));
    onLCP(metric => sendToAnalytics(metric, 'LCP'));
    onFCP(metric => sendToAnalytics(metric, 'FCP'));
    onTTFB(metric => sendToAnalytics(metric, 'TTFB'));
  }
}

// Track custom events
export function trackEvent(name: string, properties?: Record<string, any>) {
  if (import.meta.env.PROD) {
    posthog.capture(name, properties);
  }
}

// Track errors
export function trackError(error: Error, context?: Record<string, any>) {
  if (import.meta.env.PROD) {
    captureMessage(error.message, 'error');
    posthog.capture('error', {
      error: error.message,
      stack: error.stack,
      ...context,
    });
  }
}

// Track performance metrics
function sendToAnalytics(metric: any, metricName: string) {
  const { name, value, delta, id } = metric;
  
  // Send to PostHog
  posthog.capture('web_vital', {
    name: metricName,
    value: Math.round(value),
    delta: Math.round(delta),
    id,
  });

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`Web Vital: ${metricName}`, {
      value: Math.round(value),
      delta: Math.round(delta),
    });
  }
}

// Track user session
export function trackUserSession(userId: string, traits?: Record<string, any>) {
  if (import.meta.env.PROD) {
    posthog.identify(userId, traits);
  }
}

// Track page views
export function trackPageView(url: string, properties?: Record<string, any>) {
  if (import.meta.env.PROD) {
    posthog.capture('$pageview', {
      $current_url: url,
      ...properties,
    });
  }
} 