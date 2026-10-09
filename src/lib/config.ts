// Genesis Heritage Pro Configuration
// This file handles all environment configuration for the application

export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  ai: {
    providers: string[];
    defaultProvider: string;
  };
  features: {
    voiceEnabled: boolean;
    analyticsEnabled: boolean;
    automationEnabled: boolean;
  };
  app: {
    name: string;
    version: string;
    environment: string;
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  supabase: {
    url: '',
    anonKey: ''
  },
  ai: {
    providers: ['openai', 'anthropic', 'gemini', 'ollama'],
    defaultProvider: 'openai'
  },
  features: {
    voiceEnabled: true,
    analyticsEnabled: true,
    automationEnabled: true
  },
  app: {
    name: 'Genesis Heritage Pro',
    version: '1.0.0',
    environment: 'production'
  }
};

// Get configuration from environment variables or use defaults
export const getConfig = (): AppConfig => {
  const env = import.meta.env;
  
  return {
    supabase: {
      url: env.VITE_SUPABASE_URL || defaultConfig.supabase.url,
      anonKey: env.VITE_SUPABASE_ANON_KEY || defaultConfig.supabase.anonKey
    },
    ai: {
      providers: env.VITE_AI_PROVIDERS?.split(',') || defaultConfig.ai.providers,
      defaultProvider: env.VITE_DEFAULT_AI_PROVIDER || defaultConfig.ai.defaultProvider
    },
    features: {
      voiceEnabled: env.VITE_VOICE_ENABLED !== 'false',
      analyticsEnabled: env.VITE_ANALYTICS_ENABLED !== 'false',
      automationEnabled: env.VITE_AUTOMATION_ENABLED !== 'false'
    },
    app: {
      name: env.VITE_APP_NAME || defaultConfig.app.name,
      version: env.VITE_APP_VERSION || defaultConfig.app.version,
      environment: env.VITE_APP_ENVIRONMENT || defaultConfig.app.environment
    }
  };
};

// Export the current configuration
export const config = getConfig();

// Without these the app cannot talk to its backend; say so plainly instead of failing mysteriously.
export const missingConfig: string[] = [
  ...(config.supabase.url ? [] : ['VITE_SUPABASE_URL']),
  ...(config.supabase.anonKey ? [] : ['VITE_SUPABASE_ANON_KEY']),
];

// Helper functions
export const isDevelopment = () => config.app.environment === 'development';
export const isProduction = () => config.app.environment === 'production';
export const isFeatureEnabled = (feature: keyof AppConfig['features']) => config.features[feature];

// Log configuration (only in development)
if (isDevelopment()) {
  console.log('🔧 App Configuration:', {
    supabase: { url: config.supabase.url, anonKey: config.supabase.anonKey.substring(0, 20) + '...' },
    ai: config.ai,
    features: config.features,
    app: config.app
  });
} 