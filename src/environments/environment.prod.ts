export const environment = {
  production: true,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  apiKeys: {
    openai: import.meta.env.VITE_OPENAI_API_KEY,
    gemini: import.meta.env.VITE_GEMINI_API_KEY,
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY
  },
  apiEndpoints: {
    chat: '/api/chat',
    documents: '/api/documents',
    auth: '/api/auth',
    users: '/api/users'
  }
};