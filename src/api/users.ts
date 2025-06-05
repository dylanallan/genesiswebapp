import { apiConfig, getAuthHeaders } from './config';

export const usersApi = {
  async getCurrentUser(token: string) {
    try {
      const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.users}/me`, {
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      return await response.json();
    } catch (error) {
      console.error('Users API error:', error);
      throw error;
    }
  },

  async updateProfile(token: string, data: any) {
    try {
      const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.users}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Users API error:', error);
      throw error;
    }
  }
};