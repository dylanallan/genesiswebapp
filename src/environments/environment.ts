export const environment = {
  production: false,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  apiKeys: {
    openai: import.meta.env.VITE_OPENAI_API_KEY,
    gemini: import.meta.env.VITE_GEMINI_API_KEY,
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY
  },
  apiEndpoints: {
    chat: '/functions/v1/chat',
    documents: '/functions/v1/documents',
    auth: '/functions/v1/auth',
    users: '/functions/v1/users'
  }
};