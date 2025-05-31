import { trackEvent } from './analytics';

interface PerformanceMetrics {
  timeToFirstByte: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  cpuUsage: number;
  memoryUsage: number;
  fps: number;
}

let fpsHistory: number[] = [];
let lastFrameTime = performance.now();
let frameCount = 0;

function calculateFPS(): number {
  const now = performance.now();
  frameCount++;

  if (now - lastFrameTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
    fpsHistory.push(fps);
    if (fpsHistory.length > 60) fpsHistory.shift();
    
    frameCount = 0;
    lastFrameTime = now;
    return fps;
  }

  return fpsHistory[fpsHistory.length - 1] || 0;
}

export async function measurePerformance(): Promise<PerformanceMetrics> {
  // CPU Usage estimation
  const startTime = performance.now();
  let count = 0;
  while (performance.now() - startTime < 100) {
    count++;
  }
  const cpuUsage = Math.min((count / 1000000) * 100, 100);

  // Memory Usage
  const memory = performance.memory || { usedJSHeapSize: 0, jsHeapSizeLimit: 0 };
  const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

  // FPS Calculation
  const fps = calculateFPS();

  // Navigation and Paint Metrics
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');

  const metrics: PerformanceMetrics = {
    timeToFirstByte: navigationEntry.responseStart - navigationEntry.requestStart,
    firstContentfulPaint: fcpEntry ? fcpEntry.startTime : 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    cpuUsage,
    memoryUsage,
    fps
  };

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

export function startPerformanceMonitoring(callback: (metrics: PerformanceMetrics) => void) {
  let animationFrameId: number;

  const monitor = async () => {
    const metrics = await measurePerformance();
    callback(metrics);
    animationFrameId = requestAnimationFrame(monitor);
  };

  monitor();

  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}