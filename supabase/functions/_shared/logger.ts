export interface Logger {
  info: (message: string, data?: any) => void;
  error: (message: string, error?: any) => void;
  warn: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
}

export const createLogger = (context: string): Logger => {
  return {
    info: (message: string, data?: any) => {
      console.log(`[${context}] INFO:`, message, data || '');
    },
    error: (message: string, error?: any) => {
      console.error(`[${context}] ERROR:`, message, error || '');
    },
    warn: (message: string, data?: any) => {
      console.warn(`[${context}] WARN:`, message, data || '');
    },
    debug: (message: string, data?: any) => {
      console.debug(`[${context}] DEBUG:`, message, data || '');
    }
  };
}; 