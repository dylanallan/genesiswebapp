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
  private maxRetries = 3;
  private retryDelays = [1000, 3000, 5000]; // Exponential backoff

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
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.unregister();
        } catch (error) {
          console.warn('Failed to unregister service worker:', error);
        }
      }
    });

    this.recoveryStrategies.set('supabase', async () => {
      console.log('🔧 Recovering Supabase connection...');
      try {
        // Try to refresh the session
        await supabase.auth.refreshSession();
      } catch (error) {
        console.warn('Failed to refresh session:', error);
        // Clear auth state as a last resort
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
      }
    });

    this.recoveryStrategies.set('react-render', async () => {
      console.log('🔧 Recovering React render...');
      // Clear React DevTools cache if available
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        try {
          window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = null;
        } catch (error) {
          console.warn('Failed to clear React DevTools hook:', error);
        }
      }
    });

    this.recoveryStrategies.set('memory-leak', async () => {
      console.log('🔧 Recovering from memory leak...');
      // Force garbage collection if available
      if (window.gc) {
        try {
          window.gc();
        } catch (error) {
          console.warn('Failed to force garbage collection:', error);
        }
      }
      // Clear large caches
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        } catch (error) {
          console.warn('Failed to clear caches:', error);
        }
      }
    });

    // Add new strategy for edge function errors
    this.recoveryStrategies.set('edge-function', async () => {
      console.log('🔧 Recovering from Edge Function error...');
      try {
        // Check if the edge function is available
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/health-check`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.warn('Edge function health check failed:', response.status);
          toast.error('Edge functions are currently unavailable. Some features may not work.');
        } else {
          console.log('Edge functions are available');
        }
      } catch (error) {
        console.warn('Failed to check edge function health:', error);
        toast.error('Unable to connect to edge functions. Please check your network connection.');
      }
    });

    // Add new strategy for chat-specific errors
    this.recoveryStrategies.set('chat', async () => {
      console.log('🔧 Recovering from chat error...');
      try {
        // Clear chat-related local storage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('chat') || key.includes('message') || key.includes('conversation'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Reset any chat-related state in the app
        if (window.__APP_STATE__ && window.__APP_STATE__.chat) {
          window.__APP_STATE__.chat = {};
        }
      } catch (error) {
        console.warn('Failed to clear chat state:', error);
      }
    });
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        component: 'promise-rejection',
        error: new Error(event.reason?.message || 'Unhandled promise rejection'),
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
      try {
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
      } catch (error) {
        console.warn('Failed to set up performance observer:', error);
      }
    }

    // Monitor fetch errors
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);
        return response;
      } catch (error) {
        // Only handle network errors, not HTTP errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          ErrorRecoverySystem.getInstance().handleError({
            component: 'network',
            error,
            timestamp: new Date()
          });
        }
        throw error;
      }
    };
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
        
        // Try with retries
        let success = false;
        for (let attempt = 0; attempt < this.maxRetries && !success; attempt++) {
          try {
            await strategy();
            success = true;
          } catch (recoveryError) {
            console.warn(`Recovery attempt ${attempt + 1} failed:`, recoveryError);
            if (attempt < this.maxRetries - 1) {
              // Wait before retrying with exponential backoff
              await new Promise(resolve => setTimeout(resolve, this.retryDelays[attempt]));
            }
          }
        }
        
        if (success) {
          toast.success(`System recovered from ${errorType} error`);
        } else {
          toast.error(`Recovery failed after ${this.maxRetries} attempts`);
        }
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

    // Check for chat-related errors
    if (errorMessage.includes('chat') || 
        errorMessage.includes('message') || 
        errorMessage.includes('conversation') ||
        stackTrace.includes('chat')) {
      return 'chat';
    }

    // Check for edge function errors
    if (errorMessage.includes('function') || 
        errorMessage.includes('edge') || 
        errorMessage.includes('supabase.functions') ||
        errorMessage.includes('fetch') && errorMessage.includes('functions/v1')) {
      return 'edge-function';
    }

    // Check for AI-related errors
    if (errorMessage.includes('ai') || 
        errorMessage.includes('router') || 
        errorMessage.includes('provider') ||
        errorMessage.includes('openai') ||
        errorMessage.includes('claude') ||
        errorMessage.includes('gemini')) {
      return 'ai-router';
    }
    
    // Check for Supabase-related errors
    if (errorMessage.includes('supabase') || 
        errorMessage.includes('auth') || 
        errorMessage.includes('database') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403')) {
      return 'supabase';
    }
    
    // Check for React-related errors
    if (errorMessage.includes('render') || 
        stackTrace.includes('react') || 
        errorMessage.includes('component') ||
        errorMessage.includes('hook') ||
        errorMessage.includes('invalid hook call')) {
      return 'react-render';
    }
    
    // Check for memory-related errors
    if (errorMessage.includes('memory') || 
        errorMessage.includes('heap') ||
        errorMessage.includes('out of memory')) {
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

    // Check if service worker needs refreshing
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (error) {
        console.warn('Failed to update service worker:', error);
      }
    }
  }

  private async logRecoveryAttempt(context: ErrorContext, strategy: string) {
    try {
      // Check if we have an authenticated session before logging
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase
        .from('error_recovery_logs')
        .insert({
          component: context.component,
          error_message: context.error.message,
          stack_trace: context.stackTrace,
          recovery_strategy: strategy,
          timestamp: context.timestamp.toISOString(),
          user_agent: navigator.userAgent,
          user_id: session.user.id
        });
    } catch (error) {
      console.warn('Failed to log recovery attempt:', error);
    }
  }

  // Public methods for manual recovery
  async forceRecovery(type: string = 'generic') {
    const strategy = this.recoveryStrategies.get(type);
    if (strategy) {
      try {
        await strategy();
        toast.success(`Manual recovery completed: ${type}`);
        return true;
      } catch (error) {
        console.error(`Manual recovery failed for ${type}:`, error);
        toast.error(`Manual recovery failed: ${type}`);
        return false;
      }
    } else {
      console.warn(`No recovery strategy found for type: ${type}`);
      toast.warning(`Unknown recovery type: ${type}`);
      return false;
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

// Add missing types for window
declare global {
  interface Window {
    gc?: () => void;
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
    __APP_STATE__?: Record<string, any>;
  }
}