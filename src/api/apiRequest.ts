const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY || 'padle-management-portal-key-2024';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'admin-management-portal-token-2024';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  // Prepare headers with API key and admin token
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'x-admin-token': ADMIN_TOKEN,
    ...(options.headers || {}),
  };
  
  const config: RequestInit = {
    ...options,
    headers,
  };
  
  try {
    console.log('Making API request to:', url);
    console.log('With headers:', headers);
    
    const response = await fetch(url, config);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new Error(
        errorData.remark || 
        errorData.message || 
        `API request failed: ${response.status} ${response.statusText}`
      );
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}