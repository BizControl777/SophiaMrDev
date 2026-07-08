import { Platform } from 'react-native';

export const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000/api' 
  : 'http://172.28.60.245:3000/api'; // IP do seu backend na rede

export let CURRENT_USER_ID = "00000000-0000-0000-0000-000000000001"; // Mock ID inicial

export const setUserId = (id: string) => {
  CURRENT_USER_ID = id;
};

export const api = {
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error(`API GET error (${endpoint}):`, error);
      throw error;
    }
  },

  post: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error(`API POST error (${endpoint}):`, error);
      throw error;
    }
  },

  patch: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error(`API PATCH error (${endpoint}):`, error);
      throw error;
    }
  },
};
