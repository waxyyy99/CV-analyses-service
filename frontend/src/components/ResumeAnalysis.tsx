import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CheckCircle2, AlertCircle, ArrowLeft, TrendingUp, Award } from 'lucide-react';
import { ResumeScore } from '../App';

interface ResumeAnalysisProps {
  analysis: ResumeScore;
  onReset: () => void;
}

export function ResumeAnalysis({ analysis, onReset }: ResumeAnalysisProps) {
  const safeScore = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Отлично';
    if (score >= 8) return 'Хорошо';
    if (score >= 7) return 'Удовлетворительно';
    if (score >= 6) return 'Требует улучшений';
    return 'Нужна серьезная доработка';
  };

  // Convert 0-10 score to percentage for progress bar
  const scoreToPercent = (score: number) => (score / 10) * 100;

  const overallScore = safeScore(analysis.overall);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onReset} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Проверить другое резюме
      </Button>

      {/* Overall Score */}
      <Card className="shadow-xl border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600" />
              Общая оценка
            </span>
            <Badge variant={getScoreBadgeVariant(analysis.overall)} className="text-lg px-4 py-2">
              {analysis.overall}/10
            </Badge>
          </CardTitle>
          <CardDescription>
            Ваше резюме: {getScoreLabel(analysis.overall)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={scoreToPercent(analysis.overall)} className="h-3" />
            <p className={`text-center ${getScoreColor(analysis.overall)}`}>
              {overallScore.toFixed(1)}/10
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">По категориям</TabsTrigger>
          <TabsTrigger value="strengths">Сильные стороны</TabsTrigger>
          <TabsTrigger value="improvements">Рекомендации</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Детальная оценка по категориям
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(analysis.categories).map(([key, value]) => {
                const labels: Record<string, string> = {
                  structure: 'Структура',
                  content: 'Содержание',
                  keywords: 'Ключевые слова',
                  formatting: 'Форматирование',
                  experience: 'Опыт работы',
                };

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>{labels[key]}</span>
                      <span className={`${getScoreColor(value)}`}>
                        {value.toFixed(1)}/10
                      </span>
                    </div>
                    <Progress value={scoreToPercent(value)} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Detailed Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Подробная обратная связь</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.detailedFeedback.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-gray-900">{item.category}</h4>
                    <Badge variant={getScoreBadgeVariant(item.score)}>
                      {item.score.toFixed(1)}/10
                    </Badge>
                  </div>
                  <p className="text-gray-600">{item.feedback}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strengths Tab */}
        <TabsContent value="strengths">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Сильные стороны вашего резюме
              </CardTitle>
              <CardDescription>
                Эти элементы делают ваше резюме привлекательным для работодателей
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.strengths.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-900">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Пока не выявлено явных сильных сторон
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Рекомендации по улучшению
              </CardTitle>
              <CardDescription>
                Внесите эти изменения, чтобы повысить шансы на успех
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.improvements.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-900">{improvement}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Отличная работа! Серьезных замечаний не найдено
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="text-blue-900 mb-3">💡 Дополнительные советы</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Адаптируйте резюме под каждую конкретную вакансию</li>
            <li>• Используйте цифры и метрики для описания достижений</li>
            <li>• Избегайте общих фраз, будьте конкретны</li>
            <li>• Проверьте орфографию и грамматику</li>
            <li>• Используйте активные глаголы (достиг, создал, улучшил)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}