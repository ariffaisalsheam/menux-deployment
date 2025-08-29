import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, MessageSquare, Frown, Meh, Smile, Star, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { analyticsAPI, aiAPI } from '../../services/api';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { LoadingSkeleton } from '../common/LoadingSpinner';

interface FeedbackAnalytics {
  averageRating: number;
  totalFeedback: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  ratingDistribution: Record<number, number>;
  recentFeedback: Array<{
    id: number;
    rating: number;
    comment: string;
    customerName?: string;
    createdAt: string;
  }>;
}

// Structured AI insights schema expected from backend
interface AIInsights {
  overallSentiment?: 'Positive' | 'Neutral' | 'Negative' | string;
  highlights?: string[];
  keyComplaints?: string[];
  recommendations?: string[];
  summary?: string;
}

export const FeedbackAnalysis: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPro = user?.subscriptionPlan === 'PRO';

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-green-500" />
              Feedback Analysis
            </h1>
            <p className="text-muted-foreground">
              AI-powered sentiment analysis and customer insights
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Pro Feature
          </Badge>
        </div>

        <Card className="border-green-300 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-yellow-500" />
              Upgrade to Pro for AI Feedback Analysis
            </CardTitle>
            <CardDescription className="text-base">
              Understand customer sentiment and get actionable insights from reviews
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-dashed border-2 border-green-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Smile className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Positive</h3>
                    <p className="text-2xl font-bold text-green-600">78%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-green-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Meh className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Neutral</h3>
                    <p className="text-2xl font-bold text-yellow-600">15%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-green-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Frown className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Negative</h3>
                    <p className="text-2xl font-bold text-red-600">7%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4 border-t">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                onClick={() => navigate('/dashboard/upgrade')}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro - ৳1,500/month
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pro users: fetch feedback analytics
  const { data: feedback, loading, error, refetch } = useApi<FeedbackAnalytics>(() => analyticsAPI.getFeedbackAnalytics());

  const total = feedback?.totalFeedback || 0;
  const posPct = total ? Math.round((feedback!.positiveCount / total) * 100) : 0;
  const neuPct = total ? Math.round((feedback!.neutralCount / total) * 100) : 0;
  const negPct = total ? Math.round((feedback!.negativeCount / total) * 100) : 0;

  // AI Insights state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiData, setAiData] = useState<AIInsights | null>(null);
  const [aiCooldown, setAiCooldown] = useState<number>(0);

  // Decrement cooldown every second while active
  useEffect(() => {
    if (aiCooldown <= 0) return;
    const id = setInterval(() => {
      setAiCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [aiCooldown]);

  const buildAIInput = (): string => {
    if (!feedback) return '';
    const lines: string[] = [];
    lines.push('You are an expert analytics assistant. Analyze the following restaurant customer feedback and provide 3-5 concise, actionable insights.');
    lines.push('Highlight sentiment trends, top praise, key complaints, and one suggestion to improve.');
    lines.push('Keep it under 120 words, bullet style.');
    lines.push('---');
    if (feedback.recentFeedback?.length) {
      lines.push('Recent feedback (most recent first):');
      for (const f of feedback.recentFeedback) {
        const ts = new Date(f.createdAt).toLocaleDateString();
        lines.push(`- [${ts}] ${f.customerName || 'Customer'}: ${f.rating}/5 - ${f.comment || '(no comment)'}`);
      }
    } else {
      lines.push('No recent feedback available. Use aggregates below.');
    }
    lines.push('---');
    lines.push(`Totals: ${feedback.totalFeedback}, Avg Rating: ${feedback.averageRating?.toFixed(2) ?? '0.00'}`);
    lines.push(`Distribution: 1★=${feedback.ratingDistribution?.[1] ?? 0}, 2★=${feedback.ratingDistribution?.[2] ?? 0}, 3★=${feedback.ratingDistribution?.[3] ?? 0}, 4★=${feedback.ratingDistribution?.[4] ?? 0}, 5★=${feedback.ratingDistribution?.[5] ?? 0}`);
    return lines.join('\n');
  };

  const generateInsights = async () => {
    try {
      setAiLoading(true);
      setAiError(null);
      setAiData(null);
      const input = buildAIInput();
      if (!input) {
        setAiError('No feedback data available to analyze.');
        setAiLoading(false);
        return;
      }
      const res = await aiAPI.analyzeFeedback(input);
      const result: string = res?.result || res?.description || 'No insights generated.';

      // Try to parse structured JSON
      let parsed: AIInsights | null = null;
      try {
        // Strip possible markdown code fences
        let cleaned = result.trim();
        const fenceMatch = cleaned.match(/```(?:json)?\n([\s\S]*?)```/i);
        if (fenceMatch && fenceMatch[1]) {
          cleaned = fenceMatch[1].trim();
        }
        // Fallback: extract first JSON object block
        if (!(cleaned.trim().startsWith('{') && cleaned.trim().endsWith('}'))) {
          const start = cleaned.indexOf('{');
          const end = cleaned.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
          }
        }

        const maybe = JSON.parse(cleaned);
        if (maybe && typeof maybe === 'object') {
          if (
            'overallSentiment' in maybe ||
            'highlights' in maybe ||
            'keyComplaints' in maybe ||
            'recommendations' in maybe ||
            'summary' in maybe
          ) {
            parsed = maybe as AIInsights;
          }
        }
      } catch {}

      if (parsed) {
        setAiData(parsed);
        setAiSummary(null);
      } else {
        setAiSummary(result);
      }
    } catch (e: any) {
      setAiError(e?.message || 'Failed to generate AI insights.');
      // If backend returned 429, api.ts marks error as retryable and includes retryAfterSeconds
      if ((e as any)?.isRetryable && (e as any)?.retryAfterSeconds) {
        const secs = Number((e as any).retryAfterSeconds) || 60;
        setAiCooldown(secs);
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeleton lines={2} className="w-64" />
          <Badge variant="default" className="flex items-center gap-1 bg-yellow-500">
            <Crown className="w-3 h-3" />
            Pro Active
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={4} />
          ))}
        </div>
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-green-500" />
            Feedback Analysis
          </h1>
          <p className="text-muted-foreground">
            AI-powered sentiment analysis and customer insights
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1 bg-yellow-500">
          <Crown className="w-3 h-3" />
          Pro Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold">Average Rating</h3>
              <p className="text-3xl font-bold">{(feedback?.averageRating ?? 0).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">from {total} reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Smile className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold">Positive</h3>
              <p className="text-2xl font-bold text-green-600">{posPct}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Meh className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold">Neutral</h3>
              <p className="text-2xl font-bold text-yellow-600">{neuPct}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Frown className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold">Negative</h3>
              <p className="text-2xl font-bold text-red-600">{negPct}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" /> AI Insights
            </CardTitle>
            <CardDescription>Summarized by AI from recent feedback</CardDescription>
          </div>
          <Button onClick={generateInsights} disabled={aiLoading || aiCooldown > 0 || total === 0}>
            {aiLoading
              ? 'Analyzing…'
              : aiCooldown > 0
              ? `Please wait ${aiCooldown}s`
              : 'Generate AI Insights'}
          </Button>
        </CardHeader>
        <CardContent>
          {aiCooldown > 0 && (
            <p className="text-xs text-muted-foreground mb-2">
              You have reached the request limit. Please wait {aiCooldown}s before trying again.
            </p>
          )}
          {aiError && (
            <p className="text-sm text-red-600 mb-2">{aiError}</p>
          )}
          {aiLoading ? (
            <LoadingSkeleton lines={4} />
          ) : aiData ? (
            <div className="space-y-4 text-sm">
              {/* Sentiment Badge */}
              {aiData.overallSentiment && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Overall Sentiment:</span>
                  <Badge
                    className={
                      aiData.overallSentiment === 'Positive'
                        ? 'bg-green-100 text-green-700'
                        : aiData.overallSentiment === 'Negative'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }
                  >
                    {aiData.overallSentiment}
                  </Badge>
                </div>
              )}

              {/* Highlights */}
              {aiData.highlights && aiData.highlights.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-1">Highlights</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {aiData.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Complaints */}
              {aiData.keyComplaints && aiData.keyComplaints.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-1">Key Complaints</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {aiData.keyComplaints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {aiData.recommendations && aiData.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-1">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {aiData.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary */}
              {aiData.summary && (
                <div>
                  <h4 className="font-semibold mb-1">Summary</h4>
                  <p className="text-muted-foreground">{aiData.summary}</p>
                </div>
              )}
            </div>
          ) : aiSummary ? (
            <div className="prose whitespace-pre-line text-sm">{aiSummary}</div>
          ) : (
            <p className="text-sm text-muted-foreground">Click "Generate AI Insights" to get a concise summary of what customers are saying.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>Latest comments from your customers</CardDescription>
        </CardHeader>
        <CardContent>
          {feedback && feedback.recentFeedback && feedback.recentFeedback.length > 0 ? (
            <div className="space-y-4">
              {feedback.recentFeedback.map((f) => (
                <div key={f.id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{f.rating} / 5</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(f.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{f.comment}</p>
                  <p className="text-xs">— {f.customerName || 'Anonymous'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No feedback yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
