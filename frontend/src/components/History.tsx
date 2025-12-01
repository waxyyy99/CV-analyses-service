import { useEffect, useState } from 'react';
import { api } from '../api';
import { Loader } from 'lucide-react';
import { ResumeScore } from '../App';

interface HistoryProps {
  token: string;
  onSelectAnalysis: (analysis: ResumeScore) => void;
}

export function History({ token, onSelectAnalysis }: HistoryProps) {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const result = await api.getAnalysisHistory(token);
        setAnalyses(result.analyses);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No analysis history yet</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis History</h2>
      <div className="space-y-4">
        {analyses.map((analysis) => (
          <div key={analysis.id} className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-800">{analysis.resumeFilename}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(analysis.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{analysis.score.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Score</p>
              </div>
            </div>
            <button
              onClick={() => onSelectAnalysis(analysis)}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              View Details →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
