import { apiConfig } from './config';

export const authApi = {
  async login(email: string, password: string) {
    try {
      const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.auth}/login`, {
        method: 'POST',
        headers: apiConfig.headers,
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Auth API error:', error);
      throw error;
    }
  },

  async register(email: string, password: string) {
    try {
      const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.auth}/register`, {
        method: 'POST',
        headers: apiConfig.headers,
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Auth API error:', error);
      throw error;
    }
  },

  async logout(token: string) {
    try {
      const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.auth}/logout`, {
        method: 'POST',
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Auth API error:', error);
      throw error;
    }
  }
};