import { trackEvent } from './analytics';

interface PerformanceMetrics {
  timeToFirstByte: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

export function measurePerformance(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {
    timeToFirstByte: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0
  };

  // Time to First Byte
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  metrics.timeToFirstByte = navigationEntry.responseStart - navigationEntry.requestStart;

  // First Contentful Paint
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
  if (fcpEntry) {
    metrics.firstContentfulPaint = fcpEntry.startTime;
  }

  // Largest Contentful Paint
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    metrics.largestContentfulPaint = lastEntry.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  // First Input Delay
  new PerformanceObserver((entryList) => {
    const firstInput = entryList.getEntries()[0];
    metrics.firstInputDelay = firstInput.processingStart - firstInput.startTime;
  }).observe({ type: 'first-input', buffered: true });

  // Cumulative Layout Shift
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      metrics.cumulativeLayoutShift += (entry as any).value;
    }
  }).observe({ type: 'layout-shift', buffered: true });

  return metrics;
}

export function optimizePerformance() {
  // Implement performance optimizations
  prefetchCriticalResources();
  optimizeImageLoading();
  implementProgressiveHydration();
}

function prefetchCriticalResources() {
  const criticalUrls = [
    '/api/user-preferences',
    '/api/initial-data'
  ];

  criticalUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

function optimizeImageLoading() {
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.loading) {
      img.loading = 'lazy';
    }
  });
}

function implementProgressiveHydration() {
  // Implement progressive hydration logic
  // This is a placeholder for the actual implementation
}

export function monitorPerformance() {
  const metrics = measurePerformance();
  trackEvent({
    eventType: 'performance_metrics',
    userId: 'system',
    metadata: metrics,
    timestamp: new Date()
  });
}