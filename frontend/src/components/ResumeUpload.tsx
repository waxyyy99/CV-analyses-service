import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface ResumeUploadProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

export function ResumeUpload({ onAnalyze, isAnalyzing }: ResumeUploadProps) {
  const [resumeText, setResumeText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (resumeText.trim().length < 50) {
      setError('Пожалуйста, введите больше информации (минимум 50 символов)');
      return;
    }
    setError('');
    onAnalyze(resumeText);
  };

  const handleLoadExample = () => {
    const exampleResume = `Иванов Иван Иванович
Email: ivanov@example.com
Телефон: +7 (999) 123-45-67

ОПЫТ РАБОТЫ

Senior Frontend Developer | Tech Company
Январь 2021 - настоящее время
• Разработка и поддержка веб-приложений на React и TypeScript
• Увеличение производительности приложения на 40% через оптимизацию
• Внедрение автоматизированного тестирования, покрытие 85%
• Менторство 3 junior разработчиков

Frontend Developer | Startup Inc.
Март 2019 - Декабрь 2020
• Создание пользовательских интерфейсов с использованием React
• Интеграция с REST API и GraphQL
• Участие в code review и планировании спринтов

ОБРАЗОВАНИЕ

Московский государственный университет
Бакалавр, Компьютерные науки, 2015-2019

НАВЫКИ

Языки программирования: JavaScript, TypeScript, Python
Фреймворки: React, Next.js, Vue.js
Инструменты: Git, Docker, Webpack, Jest
Soft skills: Работа в команде, Agile методологии, Английский язык (B2)`;

    setResumeText(exampleResume);
    setError('');
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Вставьте текст резюме
        </CardTitle>
        <CardDescription>
          Скопируйте содержимое вашего резюме в текстовое поле ниже для анализа
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            placeholder="Вставьте ваше резюме здесь...&#10;&#10;Включите:&#10;• Контактную информацию&#10;• Опыт работы&#10;• Образование&#10;• Навыки и компетенции"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="min-h-[400px] resize-y"
            disabled={isAnalyzing}
          />
          {resumeText.trim().length > 0 && (
            <div className="absolute bottom-3 right-3 text-gray-400 pointer-events-none">
              {resumeText.trim().length} символов
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={handleSubmit}
            disabled={isAnalyzing || resumeText.trim().length === 0}
            className="flex-1 min-w-[200px]"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Анализируем...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Анализировать резюме
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleLoadExample}
            disabled={isAnalyzing}
            size="lg"
          >
            Загрузить пример
          </Button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-blue-900">
            💡 <span className="ml-1">Совет:</span> Для наилучшего результата включите всю информацию из вашего резюме: контакты, опыт работы, образование, навыки и достижения.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
