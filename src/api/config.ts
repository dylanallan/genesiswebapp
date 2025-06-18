import { environment } from '../environments/environment';

export const apiConfig = {
  baseUrl: environment.supabaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'apikey': environment.supabaseAnonKey
  },
  endpoints: environment.apiEndpoints,
  timeout: 30000 // 30 seconds
};

export const getAuthHeaders = (token: string) => ({
  ...apiConfig.headers,
  'Authorization': `Bearer ${token}`
});