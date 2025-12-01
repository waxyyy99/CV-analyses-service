// API client for communicating with backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AuthResponse {
  token: string;
  userId: string;
  name?: string;
  message: string;
}

interface UploadResponse {
  resumeId: string;
  filename: string;
  extractedText: string;
  message: string;
}

interface AnalysisResponse {
  analysisId: string;
  overall: number;
  categories: {
    structure: number;
    content: number;
    keywords: number;
    formatting: number;
    experience: number;
  };
  strengths: string[];
  improvements: string[];
  detailedFeedback: Array<{
    category: string;
    score: number;
    feedback: string;
  }>;
}

interface AnalysisHistory {
  analyses: Array<{
    id: string;
    resumeId: string;
    resumeFilename: string;
    score: number;
    createdAt: string;
  }>;
}

export const api = {
  // Auth
  register: async (email: string, phone: string, password: string, name: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, password, name }),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  // Resume
  uploadResume: async (file: File, token: string): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/resume/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },

  // Analysis
  analyzeResume: async (resumeId: string, token: string): Promise<AnalysisResponse> => {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ resumeId }),
    });
    if (!response.ok) throw new Error('Analysis failed');
    return response.json();
  },

  getAnalysisHistory: async (token: string): Promise<AnalysisHistory> => {
    const response = await fetch(`${API_BASE_URL}/analyses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Fetch history failed');
    return response.json();
  },

  getAnalysis: async (analysisId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Fetch analysis failed');
    return response.json();
  },
};
