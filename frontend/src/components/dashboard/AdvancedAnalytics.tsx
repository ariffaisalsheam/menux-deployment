import React, { useMemo, useState } from 'react';
import { Crown, TrendingUp, BarChart3, PieChart, LineChart, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { analyticsAPI, aiAPI } from '../../services/api';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export const AdvancedAnalytics: React.FC = () => {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO';

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              Advanced Analytics
            </h1>
            <p className="text-muted-foreground">
              Detailed insights and predictive analytics
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Pro Feature
          </Badge>
        </div>

        <Card className="border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-yellow-500" />
              Upgrade to Pro for Advanced Analytics
            </CardTitle>
            <CardDescription className="text-base">
              Get detailed insights, custom reports, and predictive analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-dashed border-2 border-purple-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Custom Reports</h3>
                    <p className="text-sm text-muted-foreground">Detailed analytics</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-purple-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <PieChart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Customer Insights</h3>
                    <p className="text-sm text-muted-foreground">Behavior analysis</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-purple-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <LineChart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Predictions</h3>
                    <p className="text-sm text-muted-foreground">AI forecasting</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4 border-t">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro - ৳1,500/month
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Owner-scoped analytics using existing endpoints
  type RestaurantAnalytics = {
    revenue: { current: number; previous: number; change: number };
    orders: { current: number; previous: number; change: number };
    customers: { current: number; previous: number; change: number };
    rating: { current: number; previous: number; change: number };
    liveOrders: number;
    topSellingItems: Array<{ name: string; orders: number; revenue: number }>;
    weeklyTrends: Array<{ period: string; revenue: number; orders: number; change: number }>;
    dailyRevenueTrend?: Array<{ date: string; revenue: number }>;
  };

  // Build AI Forecast input
  const buildForecastInput = (): string => {
    const lines: string[] = [];
    lines.push('You are a forecasting assistant for a restaurant.');
    lines.push('Using the provided time series, produce a 7-day forecast and notes.');
    lines.push('Return STRICT JSON: { "days": Array<{ date: string, revenue: number, orders: number }>, "notes": string[] }');
    lines.push('Dates must be ISO yyyy-mm-dd; days length must be 7; provide realistic values.');
    lines.push('---');
    if (analytics) {
      lines.push('# DailyRevenue7d');
      for (const d of analytics.dailyRevenueTrend || []) {
        lines.push(`- ${d.date}: revenue=${d.revenue}`);
      }
      lines.push('# WeeklyTrends');
      for (const w of analytics.weeklyTrends || []) {
        lines.push(`- ${w.period}: revenue=${w.revenue}, orders=${w.orders}`);
      }
      lines.push(`# Current liveOrders=${analytics.liveOrders}`);
    }
    return lines.join('\n');
  };

  const generateForecast = async () => {
    try {
      setAiForecastLoading(true);
      setAiForecastError(null);
      setAiForecastJson(null);
      const input = buildForecastInput();
      if (!input) {
        setAiForecastError('Not enough data to forecast yet.');
        setAiForecastLoading(false);
        return;
      }
      const res = await aiAPI.analyzeFeedback(input);
      const raw: string = res?.result || res?.description || '';
      if (!raw) {
        setAiForecastError('No forecast generated.');
      } else {
        let jsonStr = raw.trim();
        if (jsonStr.startsWith('```')) {
          const idx = jsonStr.indexOf('\n');
          jsonStr = jsonStr.slice(idx + 1).replace(/```\s*$/,'').trim();
        }
        const start = jsonStr.indexOf('{');
        const end = jsonStr.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const slice = jsonStr.slice(start, end + 1);
          try {
            const parsed = JSON.parse(slice);
            setAiForecastJson(parsed);
          } catch {
            setAiForecastError('Could not parse forecast JSON.');
          }
        } else {
          setAiForecastError('Could not parse forecast JSON.');
        }
      }
    } catch (e: any) {
      setAiForecastError(e?.message || 'Failed to generate forecast.');
    } finally {
      setAiForecastLoading(false);
    }
  };

  type FeedbackAnalytics = {
    averageRating: number;
    totalFeedback: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
    ratingDistribution: Record<number, number>;
    recentFeedback: Array<{ id: number; rating: number; comment: string; customerName?: string; createdAt: string }>;
  };

  type RecentActivity = { type: 'ORDER' | 'MENU' | 'FEEDBACK'; title: string; description: string; createdAt: string };

  const { data: analytics, loading, error, refetch } = useApi<RestaurantAnalytics>(() => analyticsAPI.getRestaurantAnalytics());
  const { data: feedback } = useApi<FeedbackAnalytics>(() => analyticsAPI.getFeedbackAnalytics());
  const { data: recentActivity } = useApi<RecentActivity[]>(() => analyticsAPI.getRecentActivity());

  // AI Strategy Brief (separate from feedback insights)
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiPlanError, setAiPlanError] = useState<string | null>(null);
  const [aiPlanJson, setAiPlanJson] = useState<any | null>(null);
  const [aiPlanText, setAiPlanText] = useState<string | null>(null);
  const [aiPlanUpdatedAt, setAiPlanUpdatedAt] = useState<string | null>(null);

  // AI Forecast
  const [aiForecastLoading, setAiForecastLoading] = useState(false);
  const [aiForecastError, setAiForecastError] = useState<string | null>(null);
  const [aiForecastJson, setAiForecastJson] = useState<any | null>(null);

  

  const weeklyData = useMemo(() => {
    return (analytics?.weeklyTrends || []).map((w) => ({
      period: w.period,
      revenue: w.revenue,
      orders: w.orders
    }));
  }, [analytics]);

  const dailyRevenueData = useMemo(() => {
    return (analytics?.dailyRevenueTrend || []).map((d) => ({
      date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      revenue: d.revenue
    }));
  }, [analytics]);

  // Build structured AI Strategy input using analytics + feedback
  const buildStrategyInput = (): string => {
    const lines: string[] = [];
    lines.push('You are an expert restaurant analyst. Create a detailed, actionable strategy brief.');
    lines.push('Return STRICT JSON with keys:');
    lines.push('{ "salesDrivers": string[], "riskAlerts": string[], "forecast": { "next7DaysRevenueRange": [number, number], "expectedOrderRange": [number, number] }, "menuSuggestions": string[], "staffingTips": string[], "marketingIdeas": string[], "summary": string }');
    lines.push('Guidelines: lists must have 5-7 concise bullets each; summary 200-300 words; be specific and avoid generic advice.');
    lines.push('---');
    if (analytics) {
      lines.push('# WeeklyTrends');
      for (const w of analytics.weeklyTrends || []) {
        lines.push(`- ${w.period}: revenue=${w.revenue}, orders=${w.orders}`);
      }
      lines.push('# DailyRevenue7d');
      for (const d of analytics.dailyRevenueTrend || []) {
        lines.push(`- ${d.date}: revenue=${d.revenue}`);
      }
      lines.push('# TopItems');
      for (const t of (analytics.topSellingItems || []).slice(0, 5)) {
        lines.push(`- ${t.name}: orders=${t.orders}, revenue=${t.revenue}`);
      }
      lines.push(`# KPIs: revenueNow=${analytics.revenue.current}, revenueChange=${analytics.revenue.change}, ordersNow=${analytics.orders.current}, ordersChange=${analytics.orders.change}`);
    }
    if (feedback) {
      lines.push('---');
      lines.push('# FeedbackSummary');
      lines.push(`- total=${feedback.totalFeedback}, avgRating=${feedback.averageRating}`);
      lines.push(`- distribution: 1*=${feedback.ratingDistribution?.[1] ?? 0}, 2*=${feedback.ratingDistribution?.[2] ?? 0}, 3*=${feedback.ratingDistribution?.[3] ?? 0}, 4*=${feedback.ratingDistribution?.[4] ?? 0}, 5*=${feedback.ratingDistribution?.[5] ?? 0}`);
      for (const f of (feedback.recentFeedback || []).slice(0, 8)) {
        const ts = new Date(f.createdAt).toISOString().split('T')[0];
        lines.push(`- [${ts}] ${f.rating}/5 ${f.customerName ? '(' + f.customerName + ')' : ''}: ${f.comment || '(no comment)'}`);
      }
    }
    return lines.join('\n');
  };

  const generateStrategy = async () => {
    try {
      setAiPlanLoading(true);
      setAiPlanError(null);
      setAiPlanJson(null);
      setAiPlanText(null);
      const input = buildStrategyInput();
      if (!input) {
        setAiPlanError('Not enough data to generate a strategy yet.');
        setAiPlanLoading(false);
        return;
      }
      const res = await aiAPI.analyzeFeedback(input);
      const raw: string = res?.result || res?.description || '';
      if (!raw) {
        setAiPlanText('No strategy generated.');
      } else {
        // Try to extract JSON from the response
        let jsonStr = raw.trim();
        // Remove leading markdown fences if present
        if (jsonStr.startsWith('```')) {
          const idx = jsonStr.indexOf('\n');
          jsonStr = jsonStr.slice(idx + 1).replace(/```\s*$/,'').trim();
        }
        // Find first { and last }
        const start = jsonStr.indexOf('{');
        const end = jsonStr.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const slice = jsonStr.slice(start, end + 1);
          try {
            const parsed = JSON.parse(slice);
            setAiPlanJson(parsed);
          } catch {
            setAiPlanText(raw);
          }
        } else {
          setAiPlanText(raw);
        }
      }
      setAiPlanUpdatedAt(new Date().toLocaleString());
    } catch (e: any) {
      setAiPlanError(e?.message || 'Failed to generate strategy.');
    } finally {
      setAiPlanLoading(false);
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
        <LoadingSkeleton lines={8} />
        <div className="grid gap-4 md:grid-cols-2">
          <LoadingSkeleton lines={6} />
          <LoadingSkeleton lines={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!analytics) {
    return <ErrorDisplay error="Analytics data not available" onRetry={refetch} />;
  }

  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground">
            Actionable insights using your real data
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1 bg-yellow-500">
          <Crown className="w-3 h-3" />
          Pro Active
        </Badge>
      </div>

      {/* Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue & Orders</CardTitle>
            <CardDescription>Last weeks performance</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyData.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RLineChart data={weeklyData} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" yAxisId="left" dataKey="revenue" name="Revenue" stroke="#7c3aed" strokeWidth={2} />
                    <Line type="monotone" yAxisId="right" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={2} />
                  </RLineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-sm text-muted-foreground">No weekly data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue (7 days)</CardTitle>
            <CardDescription>Recent daily revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyRevenueData.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyRevenueData} margin={{ left: 12, right: 12 }}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => [`৳${Number(v).toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-sm text-muted-foreground">No daily revenue yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Strategy Brief + AI Forecast */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-600" /> AI Strategy Brief</CardTitle>
              <CardDescription>Data-informed, actionable plan</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {aiPlanUpdatedAt && <span className="text-xs text-muted-foreground">Updated {aiPlanUpdatedAt}</span>}
              <Button onClick={generateStrategy} disabled={aiPlanLoading}>
                {aiPlanLoading ? 'Generating…' : 'Generate Strategy'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {aiPlanError && <p className="text-sm text-red-600 mb-2">{aiPlanError}</p>}
            {aiPlanJson ? (
              <div className="space-y-4">
                {Array.isArray(aiPlanJson.salesDrivers) && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-1">Sales Drivers</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {aiPlanJson.salesDrivers.map((x: string, i: number) => (<li key={i}>{x}</li>))}
                    </ul>
                  </div>
                )}
                {Array.isArray(aiPlanJson.riskAlerts) && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-1">Risk Alerts</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {aiPlanJson.riskAlerts.map((x: string, i: number) => (<li key={i}>{x}</li>))}
                    </ul>
                  </div>
                )}
                {aiPlanJson.forecast && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-md bg-gray-50">
                      <p className="text-xs text-muted-foreground">Next 7 days revenue</p>
                      <p className="font-semibold">
                        {Array.isArray(aiPlanJson.forecast.next7DaysRevenueRange) ? `৳${aiPlanJson.forecast.next7DaysRevenueRange[0]?.toLocaleString?.() || aiPlanJson.forecast.next7DaysRevenueRange[0]} - ৳${aiPlanJson.forecast.next7DaysRevenueRange[1]?.toLocaleString?.() || aiPlanJson.forecast.next7DaysRevenueRange[1]}` : '—'}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-gray-50">
                      <p className="text-xs text-muted-foreground">Expected orders</p>
                      <p className="font-semibold">
                        {Array.isArray(aiPlanJson.forecast.expectedOrderRange) ? `${aiPlanJson.forecast.expectedOrderRange[0]} - ${aiPlanJson.forecast.expectedOrderRange[1]}` : '—'}
                      </p>
                    </div>
                  </div>
                )}
                {Array.isArray(aiPlanJson.menuSuggestions) && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-1">Menu Suggestions</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {aiPlanJson.menuSuggestions.map((x: string, i: number) => (<li key={i}>{x}</li>))}
                    </ul>
                  </div>
                )}
                {Array.isArray(aiPlanJson.staffingTips) && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-1">Staffing Tips</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {aiPlanJson.staffingTips.map((x: string, i: number) => (<li key={i}>{x}</li>))}
                    </ul>
                  </div>
                )}
                {Array.isArray(aiPlanJson.marketingIdeas) && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-1">Marketing Ideas</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {aiPlanJson.marketingIdeas.map((x: string, i: number) => (<li key={i}>{x}</li>))}
                    </ul>
                  </div>
                )}
                {aiPlanJson.summary && (
                  <div className="p-3 rounded-md bg-gray-100 text-sm">
                    {aiPlanJson.summary}
                  </div>
                )}
              </div>
            ) : aiPlanText ? (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                  <h3 className="font-bold text-lg mb-3 text-blue-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI Strategy Brief
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    {aiPlanText.split(/\n\s*\n|\n(?=\s*[#*-]|\s*\d+\.)/g).map((section, index) => {
                      const lines = section.split('\n').filter(line => line.trim());

                      return lines.map((line, lineIndex) => {
                        const key = `${index}-${lineIndex}`;
                        const trimmedLine = line.trim();

                        if (!trimmedLine) return null;

                        // Check for headings (various patterns)
                        const isHeading = trimmedLine.match(/^(#{1,6}\s+|^\*\*.*\*\*$|^[A-Z][A-Z\s]{2,}:?\s*$|^[A-Z][a-z\s]+:$)/);
                        // Check for bullet points (various patterns)
                        const isBulletPoint = trimmedLine.match(/^[-•*]\s+|^\s*[-•*]\s+/);
                        // Check for numbered points
                        const isNumberedPoint = trimmedLine.match(/^\d+\.\s+/);
                        // Check for sub-bullets (indented)
                        const isSubBullet = trimmedLine.match(/^\s{2,}[-•*]\s+/);

                        if (isHeading) {
                          const cleanHeading = trimmedLine.replace(/^#{1,6}\s+|\*\*|\s*:?\s*$/g, '').trim();
                          return (
                            <h4 key={key} className="font-semibold text-base mt-4 mb-2 text-blue-800 border-b border-blue-200 pb-1">
                              {cleanHeading}
                            </h4>
                          );
                        } else if (isSubBullet) {
                          const cleanText = trimmedLine.replace(/^\s*[-•*]\s+/, '').trim();
                          return (
                            <div key={key} className="ml-8 mb-1">
                              <span className="text-blue-400 font-medium mr-2">◦</span>
                              <span className="text-gray-600 text-sm">{cleanText}</span>
                            </div>
                          );
                        } else if (isBulletPoint) {
                          const cleanText = trimmedLine.replace(/^\s*[-•*]\s+/, '').trim();
                          return (
                            <div key={key} className="ml-4 mb-2">
                              <span className="text-blue-600 font-medium mr-2">•</span>
                              <span className="text-gray-700">{cleanText}</span>
                            </div>
                          );
                        } else if (isNumberedPoint) {
                          const cleanText = trimmedLine.replace(/^\d+\.\s+/, '').trim();
                          const number = trimmedLine.match(/^(\d+)\./)?.[1] || '';
                          return (
                            <div key={key} className="ml-4 mb-2">
                              <span className="text-blue-600 font-medium mr-2">{number}.</span>
                              <span className="text-gray-700">{cleanText}</span>
                            </div>
                          );
                        } else if (trimmedLine) {
                          return (
                            <p key={key} className="text-gray-700 leading-relaxed mb-3">
                              {trimmedLine}
                            </p>
                          );
                        }
                        return null;
                      }).filter(Boolean);
                    }).flat()}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click "Generate Strategy" to get a tailored plan based on your sales, trends, and feedback.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><LineChart className="w-5 h-5 text-indigo-600" /> 7‑Day AI Forecast</CardTitle>
              <CardDescription>Projected revenue & orders</CardDescription>
            </div>
            <Button onClick={generateForecast} disabled={aiForecastLoading}>
              {aiForecastLoading ? 'Generating…' : 'Generate Forecast'}
            </Button>
          </CardHeader>
          <CardContent>
            {aiForecastError && <p className="text-sm text-red-600 mb-2">{aiForecastError}</p>}
            {aiForecastJson?.days?.length ? (
              <div className="space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={aiForecastJson.days.map((d: any) => ({ date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), revenue: d.revenue, orders: d.orders }))} margin={{ left: 12, right: 12 }}>
                      <defs>
                        <linearGradient id="fcRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number, k: string) => (k === 'revenue' ? [`৳${Number(v).toLocaleString()}`, 'Revenue'] : [v, 'Orders'])} />
                      <Legend />
                      <Area type="monotone" yAxisId="left" dataKey="revenue" stroke="#10b981" fill="url(#fcRev)" strokeWidth={2} name="Revenue" />
                      <Line type="monotone" yAxisId="right" dataKey="orders" stroke="#6366f1" strokeWidth={2} name="Orders" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {Array.isArray(aiForecastJson.notes) && aiForecastJson.notes.length > 0 && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-1">Notes</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {aiForecastJson.notes.map((x: string, i: number) => (<li key={i}>{x}</li>))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click "Generate Forecast" to project the next 7 days using your recent sales patterns.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your restaurant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(recentActivity || []).slice(0, 10).map((a, i) => {
              const color = a.type === 'ORDER' ? 'bg-green-500' : a.type === 'MENU' ? 'bg-blue-500' : 'bg-purple-500';
              return (
                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${color}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-[70ch]">{a.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(() => {
                      const d = new Date(a.createdAt);
                      const diff = Math.max(0, Date.now() - d.getTime());
                      const mins = Math.floor(diff / 60000);
                      if (mins < 1) return 'just now';
                      if (mins < 60) return `${mins} min ago`;
                      const hrs = Math.floor(mins / 60);
                      if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
                      const days = Math.floor(hrs / 24);
                      return `${days} day${days === 1 ? '' : 's'} ago`;
                    })()}
                  </span>
                </div>
              );
            })}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-sm text-muted-foreground">No activity yet. New orders, menu changes, and feedback will appear here.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
