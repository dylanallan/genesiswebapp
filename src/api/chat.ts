import { apiConfig, getAuthHeaders } from './config';

export const chatApi = {
  async sendMessage(message: string, token: string) {
    try {
      const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.chat}`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  },

  async getHistory(token: string) {
    try {
      const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.chat}/history`, {
        headers: getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      return await response.json();
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  }
};