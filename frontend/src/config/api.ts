// API Configuration
// Change this URL if your backend is running on a different address
export const API_BASE_URL = 'http://localhost:3000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  
  // Resume
  UPLOAD_RESUME: `${API_BASE_URL}/resume/upload`,
  
  // Analysis
  ANALYZE: `${API_BASE_URL}/analyze`,
  GET_ANALYSES: `${API_BASE_URL}/analyses`,
  GET_ANALYSIS: (id: string) => `${API_BASE_URL}/analyses/${id}`,
};