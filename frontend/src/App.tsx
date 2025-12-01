import { useState, useEffect } from 'react';
import { ResumeUpload } from './components/ResumeUpload';
import { ResumeAnalysis } from './components/ResumeAnalysis';
import { Auth } from './components/Auth';
import { History } from './components/History';
import { FileText, LogOut, History as HistoryIcon } from 'lucide-react';
import { api } from './api';

export interface ResumeScore {
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
  detailedFeedback: {
    category: string;
    score: number;
    feedback: string;
  }[];
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));
  const [currentView, setCurrentView] = useState<'upload' | 'analysis' | 'history'>('upload');
  const [analysis, setAnalysis] = useState<ResumeScore | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLogin = (newToken: string, newUserId: string, name: string) => {
    setToken(newToken);
    setUserId(newUserId);
    setUserName(name);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', newUserId);
    localStorage.setItem('userName', name);
  };

  const handleLogout = () => {
    setToken(null);
    setUserId(null);
    setUserName(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setCurrentView('upload');
    setAnalysis(null);
  };

  const handleAnalyze = async (file: File) => {
    if (!token) return;
    setIsAnalyzing(true);

    try {
      // Upload resume
      const uploadRes = await api.uploadResume(file, token);
      setResumeId(uploadRes.resumeId);

      // Analyze
      const analysisRes = await api.analyzeResume(uploadRes.resumeId, token);
      setAnalysis(analysisRes as ResumeScore);
      setCurrentView('analysis');
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setResumeId(null);
    setCurrentView('upload');
  };

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-6xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-900">Resume Analyzer</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {userName}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('history')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-200"
              >
                <HistoryIcon className="w-5 h-5" />
                History
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {currentView === 'upload' && (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-900 mb-2">Analyze Your Resume</h2>
              <p className="text-gray-600">
                Get detailed feedback and recommendations to improve your resume
              </p>
            </div>
            <ResumeUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          </>
        )}

        {currentView === 'analysis' && analysis && (
          <ResumeAnalysis analysis={analysis} onReset={handleReset} />
        )}

        {currentView === 'history' && token && (
          <History token={token} onSelectAnalysis={(analysis) => {
            setAnalysis(analysis);
            setCurrentView('analysis');
          }} />
        )}
      </div>
    </div>
  );
}
