import { toast } from 'sonner';
import { supabase } from './supabase';

interface ErrorContext {
  component: string;
  error: Error;
  timestamp: Date;
  userId?: string;
  stackTrace?: string;
}

class ErrorRecoverySystem {
  private static instance: ErrorRecoverySystem;
  private errorQueue: ErrorContext[] = [];
  private recoveryStrategies: Map<string, () => Promise<void>> = new Map();
  private isRecovering = false;

  private constructor() {
    this.initializeRecoveryStrategies();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorRecoverySystem {
    if (!ErrorRecoverySystem.instance) {
      ErrorRecoverySystem.instance = new ErrorRecoverySystem();
    }
    return ErrorRecoverySystem.instance;
  }

  private initializeRecoveryStrategies() {
    this.recoveryStrategies.set('ai-router', async () => {
      console.log('🔧 Recovering AI Router...');
      // Reset AI router state
      localStorage.removeItem('ai-router-cache');
      // Clear any stuck requests
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.unregister();
      }
    });

    this.recoveryStrategies.set('supabase', async () => {
      console.log('🔧 Recovering Supabase connection...');
      // Reset auth state
      await supabase.auth.signOut();
      // Clear cached data
      localStorage.removeItem('supabase.auth.token');
    });

    this.recoveryStrategies.set('react-render', async () => {
      console.log('🔧 Recovering React render...');
      // Clear React DevTools cache if available
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = null;
      }
    });

    this.recoveryStrategies.set('memory-leak', async () => {
      console.log('🔧 Recovering from memory leak...');
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      // Clear large caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    });
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        component: 'promise-rejection',
        error: new Error(event.reason),
        timestamp: new Date(),
        stackTrace: event.reason?.stack
      });
      event.preventDefault();
    });

    // Catch JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        component: 'javascript-error',
        error: event.error || new Error(event.message),
        timestamp: new Date(),
        stackTrace: event.error?.stack
      });
    });

    // Monitor performance issues
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.duration > 5000) {
            this.handleError({
              component: 'performance',
              error: new Error(`Slow operation: ${entry.name} took ${entry.duration}ms`),
              timestamp: new Date()
            });
          }
        }
      });
      observer.observe({ entryTypes: ['measure'] });
    }
  }

  async handleError(context: ErrorContext) {
    console.error('🚨 Error detected:', context);
    
    this.errorQueue.push(context);
    
    // Prevent error loops
    if (this.isRecovering) {
      console.log('⏳ Recovery already in progress, queuing error...');
      return;
    }

    await this.attemptRecovery(context);
  }

  private async attemptRecovery(context: ErrorContext) {
    this.isRecovering = true;
    
    try {
      // Identify error type and apply appropriate recovery
      const errorType = this.classifyError(context);
      const strategy = this.recoveryStrategies.get(errorType);
      
      if (strategy) {
        console.log(`🔄 Applying recovery strategy: ${errorType}`);
        await strategy();
        toast.success(`System recovered from ${errorType} error`);
      } else {
        console.log('🔄 Applying generic recovery...');
        await this.genericRecovery();
        toast.info('System recovery attempted');
      }

      // Log recovery attempt
      await this.logRecoveryAttempt(context, errorType);
      
    } catch (recoveryError) {
      console.error('❌ Recovery failed:', recoveryError);
      toast.error('System recovery failed - please refresh the page');
    } finally {
      this.isRecovering = false;
    }
  }

  private classifyError(context: ErrorContext): string {
    const errorMessage = context.error.message.toLowerCase();
    const stackTrace = context.stackTrace?.toLowerCase() || '';

    if (errorMessage.includes('ai') || errorMessage.includes('router') || errorMessage.includes('provider')) {
      return 'ai-router';
    }
    
    if (errorMessage.includes('supabase') || errorMessage.includes('auth') || errorMessage.includes('database')) {
      return 'supabase';
    }
    
    if (errorMessage.includes('render') || stackTrace.includes('react') || errorMessage.includes('component')) {
      return 'react-render';
    }
    
    if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      return 'memory-leak';
    }

    return 'generic';
  }

  private async genericRecovery() {
    // Clear all localStorage except essential data
    const essentialKeys = ['supabase.auth.token', 'user-preferences'];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !essentialKeys.includes(key)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear session storage
    sessionStorage.clear();
    
    // Reset any global state
    if (window.__APP_STATE__) {
      window.__APP_STATE__ = {};
    }
  }

  private async logRecoveryAttempt(context: ErrorContext, strategy: string) {
    try {
      await supabase
        .from('error_recovery_logs')
        .insert({
          component: context.component,
          error_message: context.error.message,
          stack_trace: context.stackTrace,
          recovery_strategy: strategy,
          timestamp: context.timestamp.toISOString(),
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.warn('Failed to log recovery attempt:', error);
    }
  }

  // Public methods for manual recovery
  async forceRecovery(type: string = 'generic') {
    const strategy = this.recoveryStrategies.get(type);
    if (strategy) {
      await strategy();
      toast.success(`Manual recovery completed: ${type}`);
    }
  }

  getErrorQueue(): ErrorContext[] {
    return [...this.errorQueue];
  }

  clearErrorQueue() {
    this.errorQueue = [];
  }
}

export const errorRecovery = ErrorRecoverySystem.getInstance();