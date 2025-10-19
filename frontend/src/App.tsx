import { useState } from 'react';
import { ResumeUpload } from './components/ResumeUpload';
import { ResumeAnalysis } from './components/ResumeAnalysis';
import { FileText } from 'lucide-react';

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
  const [resumeText, setResumeText] = useState<string>('');
  const [analysis, setAnalysis] = useState<ResumeScore | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = (text: string) => {
    setResumeText(text);
    setIsAnalyzing(true);

    // Simulate analysis delay
    setTimeout(() => {
      const mockAnalysis = analyzeMockResume(text);
      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleReset = () => {
    setResumeText('');
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
            <h1 className="text-blue-900">Оценка Резюме</h1>
          </div>
          <p className="text-gray-600">
            Получите детальный анализ вашего резюме и рекомендации по улучшению
          </p>
        </div>

        {/* Main Content */}
        {!analysis ? (
          <ResumeUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        ) : (
          <ResumeAnalysis analysis={analysis} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

// Mock analysis function
function analyzeMockResume(text: string): ResumeScore {
  const wordCount = text.trim().split(/\s+/).length;
  const hasEmail = /\S+@\S+\.\S+/.test(text);
  const hasPhone = /\+?\d[\d\s\-\(\)]{8,}/.test(text);
  const hasExperience = /опыт|experience|работал|worked/i.test(text);
  const hasEducation = /образование|education|университет|university/i.test(text);
  const hasSkills = /навыки|skills|технологии|technologies/i.test(text);

  // Calculate scores
  const structureScore = Math.min(100, (
    (hasEmail ? 20 : 0) +
    (hasPhone ? 20 : 0) +
    (hasExperience ? 20 : 0) +
    (hasEducation ? 20 : 0) +
    (hasSkills ? 20 : 0)
  ));

  const contentScore = Math.min(100, Math.floor((wordCount / 500) * 100));
  const keywordsScore = Math.floor(Math.random() * 30) + 60;
  const formattingScore = Math.floor(Math.random() * 20) + 75;
  const experienceScore = hasExperience ? Math.floor(Math.random() * 30) + 65 : 40;

  const overall = Math.floor(
    (structureScore + contentScore + keywordsScore + formattingScore + experienceScore) / 5
  );

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (hasEmail && hasPhone) strengths.push('Указаны контактные данные');
  if (wordCount > 300) strengths.push('Достаточный объем информации');
  if (hasExperience) strengths.push('Описан опыт работы');
  if (hasSkills) strengths.push('Перечислены профессиональные навыки');

  if (!hasEmail) improvements.push('Добавьте адрес электронной почты');
  if (!hasPhone) improvements.push('Укажите номер телефона');
  if (wordCount < 200) improvements.push('Добавьте больше деталей о вашем опыте');
  if (!hasEducation) improvements.push('Укажите информацию об образовании');
  if (overall < 70) improvements.push('Используйте больше ключевых слов из описания вакансии');

  return {
    overall,
    categories: {
      structure: structureScore,
      content: contentScore,
      keywords: keywordsScore,
      formatting: formattingScore,
      experience: experienceScore,
    },
    strengths,
    improvements,
    detailedFeedback: [
      {
        category: 'Структура',
        score: structureScore,
        feedback: 'Резюме должно включать контактную информацию, опыт работы, образование и навыки.',
      },
      {
        category: 'Содержание',
        score: contentScore,
        feedback: 'Оптимальный объем резюме - 400-600 слов. Описывайте достижения конкретными примерами.',
      },
      {
        category: 'Ключевые слова',
        score: keywordsScore,
        feedback: 'Используйте термины из описания вакансии для прохождения автоматических систем отбора.',
      },
      {
        category: 'Форматирование',
        score: formattingScore,
        feedback: 'Используйте четкую структуру, маркированные списки и единообразное оформление.',
      },
      {
        category: 'Опыт работы',
        score: experienceScore,
        feedback: 'Опишите обязанности и достижения с использованием цифр и метрик.',
      },
    ],
  };
}
