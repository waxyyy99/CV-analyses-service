import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { FileUpload } from './components/FileUpload';
import { ResumeAnalysis } from './components/ResumeAnalysis';
import { AnalysisHistory } from './components/AnalysisHistory';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { FileText, LogOut, User } from 'lucide-react';
import { toast, Toaster } from 'sonner@2.0.3';
import { API_ENDPOINTS } from './config/api';

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

function MainApp() {
  const { user, logout, token, isAuthenticated } = useAuth();
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ResumeScore | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUploadSuccess = async (resumeId: string, extractedText: string) => {
    setCurrentResumeId(resumeId);
    setIsAnalyzing(true);

    try {
      const response = await fetch(API_ENDPOINTS.ANALYZE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeId }),
      });

      if (!response.ok) {
        throw new Error('Ошибка анализа');
      }

      const data = await response.json();
      
      // Transform API response to match ResumeScore interface
      const analysisResult: ResumeScore = {
        overall: data.overall,
        categories: data.categories,
        strengths: data.strengths,
        improvements: data.improvements,
        detailedFeedback: data.detailedFeedback,
      };

      setAnalysis(analysisResult);
      toast.success('Анализ завершен!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка анализа');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectAnalysis = async (analysisId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_ANALYSIS(analysisId), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить анализ');
      }

      const data = await response.json();
      
      // Transform API response to match ResumeScore interface
      const analysisResult: ResumeScore = {
        overall: data.score.overall,
        categories: data.score.categories,
        strengths: data.score.strengths,
        improvements: data.score.improvements,
        detailedFeedback: data.score.detailedFeedback,
      };

      setAnalysis(analysisResult);
      setCurrentResumeId(data.resumeId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки анализа');
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setCurrentResumeId(null);
  };

  const handleLogout = () => {
    logout();
    setAnalysis(null);
    setCurrentResumeId(null);
  };

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FileText className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-blue-900">Оценка Резюме</h1>
              <p className="text-gray-600">
                Получите детальный анализ вашего резюме
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-5 h-5" />
              <span>{user?.name}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {!analysis ? (
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="upload">Загрузить резюме</TabsTrigger>
              <TabsTrigger value="history">История</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              {isAnalyzing ? (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-blue-900 mb-2">Анализируем ваше резюме...</h3>
                    <p className="text-gray-600">Это может занять несколько секунд</p>
                  </div>
                </div>
              ) : (
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              )}
            </TabsContent>

            <TabsContent value="history">
              <div className="max-w-4xl mx-auto">
                <AnalysisHistory onSelectAnalysis={handleSelectAnalysis} />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <ResumeAnalysis analysis={analysis} onReset={handleReset} />
        )}
      </div>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}