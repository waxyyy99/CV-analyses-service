import { CheckCircle2, AlertCircle, ArrowLeft, TrendingUp, Award } from 'lucide-react';
import { ResumeScore } from '../App';

interface ResumeAnalysisProps {
  analysis: ResumeScore;
  onReset: () => void;
}

export function ResumeAnalysis({ analysis, onReset }: ResumeAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Good';
    if (score >= 7) return 'Fair';
    if (score >= 6) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      <button onClick={onReset} className="flex items-center gap-2 text-blue-600 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Upload Another Resume
      </button>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Overall Score</h2>
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(analysis.overall)}`}>
            {analysis.overall.toFixed(1)}/10
          </div>
        </div>
        <p className="text-gray-700 font-semibold">{getScoreLabel(analysis.overall)}</p>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(analysis.categories).map(([category, score]) => (
          <div key={category} className="bg-white rounded-lg p-6 shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800 capitalize">{category}</h3>
              <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                {score.toFixed(1)}/10
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths */}
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-gray-800">Strengths</h3>
        </div>
        <ul className="space-y-2">
          {analysis.strengths.map((strength, i) => (
            <li key={i} className="flex gap-2 text-gray-700">
              <span className="text-green-600">✓</span>
              {strength}
            </li>
          ))}
        </ul>
      </div>

      {/* Improvements */}
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl font-bold text-gray-800">Areas for Improvement</h3>
        </div>
        <ul className="space-y-2">
          {analysis.improvements.map((improvement, i) => (
            <li key={i} className="flex gap-2 text-gray-700">
              <span className="text-orange-600">!</span>
              {improvement}
            </li>
          ))}
        </ul>
      </div>

      {/* Detailed Feedback */}
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">Detailed Feedback</h3>
        </div>
        <div className="space-y-4">
          {analysis.detailedFeedback.map((feedback, i) => (
            <div key={i} className="border-l-4 border-blue-400 pl-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{feedback.category}</h4>
                <span className={`font-bold ${getScoreColor(feedback.score)}`}>
                  {feedback.score.toFixed(1)}/10
                </span>
              </div>
              <p className="text-gray-700">{feedback.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Analyze Another Resume
        </button>
      </div>
    </div>
  );
}
