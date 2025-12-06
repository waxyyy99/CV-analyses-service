import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { History, Loader2, FileText, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';

interface AnalysisHistoryItem {
  id: string;
  resumeId: string;
  resumeFilename: string;
  score: number;
  createdAt: string;
}

interface AnalysisHistoryProps {
  onSelectAnalysis: (analysisId: string) => void;
}

export function AnalysisHistory({ onSelectAnalysis }: AnalysisHistoryProps) {
  const { token } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.GET_ANALYSES, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить историю');
      }

      const data = await response.json();
      setAnalyses(data.analyses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки истории');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'destructive';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Загрузка истории...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600" />
          История анализов
        </CardTitle>
        <CardDescription>
          Ваши предыдущие проверки резюме
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analyses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Пока нет анализов</p>
            <p className="text-gray-400">Загрузите резюме для анализа</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onSelectAnalysis(analysis.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <p className="text-gray-900 truncate">
                        {analysis.resumeFilename || 'Резюме'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(analysis.createdAt)}</span>
                    </div>
                  </div>
                  <Badge variant={getScoreBadgeVariant(analysis.score)}>
                    {analysis.score}/10
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {analyses.length > 0 && (
          <Button
            variant="outline"
            onClick={fetchAnalyses}
            className="w-full mt-4"
          >
            Обновить
          </Button>
        )}
      </CardContent>
    </Card>
  );
}