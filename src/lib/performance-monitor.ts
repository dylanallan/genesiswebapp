import { toast } from 'sonner';

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  networkLatency: number;
  errorRate: number;
  componentCount: number;
  fps: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    memoryUsage: 0,
    renderTime: 0,
    networkLatency: 0,
    errorRate: 0,
    componentCount: 0,
    fps: 60
  };
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsHistory: number[] = [];

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitor memory usage
    this.monitorMemory();
    
    // Monitor render performance
    this.monitorRenderPerformance();
    
    // Monitor network performance
    this.monitorNetworkPerformance();
    
    // Monitor component lifecycle
    this.monitorComponentLifecycle();

    // Monitor FPS
    this.monitorFPS();

    // Start periodic checks
    setInterval(() => {
      this.checkPerformanceThresholds();
    }, 5000);
  }

  private monitorMemory() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (this.metrics.memoryUsage > 90) {
          console.warn('🚨 High memory usage detected:', this.metrics.memoryUsage + '%');
          this.triggerMemoryCleanup();
        }
      }, 2000);
    }
  }

  private monitorRenderPerformance() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.metrics.renderTime = entry.duration;
            
            if (entry.duration > 100) {
              console.warn('🐌 Slow render detected:', entry.name, entry.duration + 'ms');
            }
          }
        }
      });
      
      observer.observe({ entryTypes: ['measure'] });
      this.observers.push(observer);
    }
  }

  private monitorNetworkPerformance() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.networkLatency = navEntry.responseEnd - navEntry.requestStart;
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    }
  }

  private monitorComponentLifecycle() {
    // Hook into React DevTools if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const originalOnCommitFiberRoot = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot;
      
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = (id, root, ...args) => {
        this.metrics.componentCount = this.countComponents(root);
        
        if (this.metrics.componentCount > 1000) {
          console.warn('🚨 High component count detected:', this.metrics.componentCount);
        }
        
        if (originalOnCommitFiberRoot) {
          originalOnCommitFiberRoot(id, root, ...args);
        }
      };
    }
  }

  private monitorFPS() {
    const updateFPS = () => {
      this.frameCount++;
      const now = performance.now();
      
      if (now - this.lastFrameTime >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
        this.fpsHistory.push(fps);
        
        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }
        
        this.metrics.fps = fps;
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
      
      requestAnimationFrame(updateFPS);
    };
    
    updateFPS();
  }

  private countComponents(fiber: any): number {
    let count = 0;
    
    const traverse = (node: any) => {
      if (node) {
        count++;
        traverse(node.child);
        traverse(node.sibling);
      }
    };
    
    traverse(fiber);
    return count;
  }

  private checkPerformanceThresholds() {
    const issues = [];
    
    if (this.metrics.memoryUsage > 80) {
      issues.push(`High memory usage: ${this.metrics.memoryUsage.toFixed(1)}%`);
    }
    
    if (this.metrics.renderTime > 50) {
      issues.push(`Slow rendering: ${this.metrics.renderTime.toFixed(1)}ms`);
    }
    
    if (this.metrics.componentCount > 500) {
      issues.push(`High component count: ${this.metrics.componentCount}`);
    }
    
    if (this.metrics.fps < 30) {
      issues.push(`Low framerate: ${this.metrics.fps} FPS`);
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ Performance issues detected:', issues);
      this.optimizePerformance();
    }
  }

  private async triggerMemoryCleanup() {
    try {
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          
          // Keep only recent entries
          const cutoff = Date.now() - (60 * 60 * 1000); // 1 hour
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const date = new Date(response.headers.get('date') || 0);
              if (date.getTime() < cutoff) {
                await cache.delete(request);
              }
            }
          }
        }
      }
      
      // Clear large objects from memory
      this.clearLargeObjects();
      
      toast.success('Memory cleanup completed');
    } catch (error) {
      console.error('Memory cleanup failed:', error);
    }
  }

  private clearLargeObjects() {
    // Clear any large cached objects
    if (window.__LARGE_CACHE__) {
      window.__LARGE_CACHE__ = {};
    }
    
    // Clear React DevTools cache
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.rendererInterfaces) {
      Object.keys(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces).forEach(key => {
        delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces[key];
      });
    }
  }

  private optimizePerformance() {
    // Debounce optimization calls
    if (this.optimizePerformance.timeout) {
      clearTimeout(this.optimizePerformance.timeout);
    }
    
    this.optimizePerformance.timeout = setTimeout(() => {
      this.triggerMemoryCleanup();
      
      // Suggest React optimizations
      if (this.metrics.componentCount > 500) {
        console.log('💡 Consider using React.memo() for frequently re-rendering components');
      }
      
      if (this.metrics.renderTime > 50) {
        console.log('💡 Consider using useMemo() and useCallback() for expensive operations');
      }
    }, 1000);
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Extend the function to include timeout property
(PerformanceMonitor.prototype.optimizePerformance as any).timeout = null;

// Add missing types for window
declare global {
  interface Window {
    gc?: () => void;
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
    __LARGE_CACHE__?: Record<string, any>;
    __APP_STATE__?: Record<string, any>;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();