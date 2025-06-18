import { toast } from 'sonner';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls?: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;
  private successCount = 0;
  private halfOpenMaxCalls: number;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {
    this.halfOpenMaxCalls = config.halfOpenMaxCalls || 1;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      console.log(`Circuit breaker ${this.name} is now HALF_OPEN`);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxCalls) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        console.log(`Circuit breaker ${this.name} is now CLOSED after successful recovery`);
      }
    } else {
      this.failureCount = Math.max(0, this.failureCount - 1); // Gradually reduce failure count on success
    }
  }

  private onFailure(error: any) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // Log the error for debugging
    console.error(`Circuit breaker ${this.name} failure:`, error);

    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
      console.warn(`🔴 Circuit breaker ${this.name} opened due to ${this.failureCount} failures`);
      
      // Only show toast for user-facing services
      if (this.name === 'ai-router' || this.name === 'chat') {
        toast.error(`Service ${this.name} is temporarily unavailable. Trying alternative methods.`);
      }
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
    this.successCount = 0;
    console.log(`Circuit breaker ${this.name} has been manually reset`);
  }
}

class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  getBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        monitoringPeriod: 10000, // 10 seconds
        halfOpenMaxCalls: 2 // Require 2 successful calls to close the circuit
      };
      
      this.breakers.set(name, new CircuitBreaker(name, config || defaultConfig));
    }
    
    return this.breakers.get(name)!;
  }

  getAllBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  resetAll() {
    this.breakers.forEach(breaker => breaker.reset());
    console.log('All circuit breakers have been reset');
  }

  getStatus(): Record<string, { state: string; failures: number }> {
    const status: Record<string, { state: string; failures: number }> = {};
    this.breakers.forEach((breaker, name) => {
      status[name] = {
        state: breaker.getState(),
        failures: breaker.getFailureCount()
      };
    });
    return status;
  }
}

export { CircuitBreaker, CircuitBreakerManager, CircuitState };
export const circuitBreakerManager = CircuitBreakerManager.getInstance();