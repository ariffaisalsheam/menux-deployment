import React, { useMemo, useState, useEffect } from 'react';
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
  Legend,
  BarChart,
  Bar
} from 'recharts';


// Structured AI Strategy Brief schema
interface AIStrategyBrief {
  salesDrivers?: string[];
  riskAlerts?: string[];
  forecast?: {
    next7DaysRevenueRange?: [number, number];
    expectedOrderRange?: [number, number];
  };
  menuSuggestions?: string[];
  staffingTips?: string[];
  marketingIdeas?: string[];
  summary?: string;
}

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
            try {
              localStorage.setItem(`${storagePrefix}forecastJson`, JSON.stringify(parsed));
            } catch {}
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

  // Basic analytics for view distribution (hourly)
  type BasicAnalytics = {
    viewDistribution?: {
      hourlyViews?: Array<{ hour: number; views: number }>;
      hourlyData?: Array<{ hour: number; views: number }>;
      peakHour: string;
      peakViews: number;
    };
  };

  const { data: analytics, loading, error, refetch } = useApi<RestaurantAnalytics>(() => analyticsAPI.getRestaurantAnalytics());
  const { data: feedback } = useApi<FeedbackAnalytics>(() => analyticsAPI.getFeedbackAnalytics());
  const { data: recentActivity } = useApi<RecentActivity[]>(() => analyticsAPI.getRecentActivity());
  const { data: basic } = useApi<BasicAnalytics>(() => analyticsAPI.getBasicAnalytics());

  // AI Strategy Brief (separate from feedback insights)
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiPlanError, setAiPlanError] = useState<string | null>(null);
  const [aiPlanData, setAiPlanData] = useState<AIStrategyBrief | null>(null);
  const [aiPlanText, setAiPlanText] = useState<string | null>(null);
  const [aiPlanUpdatedAt, setAiPlanUpdatedAt] = useState<string | null>(null);

  // AI Forecast
  const [aiForecastLoading, setAiForecastLoading] = useState(false);
  const [aiForecastError, setAiForecastError] = useState<string | null>(null);
  const [aiForecastJson, setAiForecastJson] = useState<any | null>(null);

  // Persistence namespace per restaurant/user
  const storagePrefix = useMemo(() => {
    const rid = user?.restaurantId ?? user?.id ?? 'global';
    return `aa:${rid}:`;
  }, [user?.restaurantId, user?.id]);

  // Load persisted AI results on mount / user switch
  useEffect(() => {
    try {
      const planDataStr = localStorage.getItem(`${storagePrefix}planData`);
      if (planDataStr) {
        const parsed = JSON.parse(planDataStr);
        setAiPlanData(parsed);
      }
      const planTextStr = localStorage.getItem(`${storagePrefix}planText`);
      if (planTextStr) setAiPlanText(planTextStr);
      const planAt = localStorage.getItem(`${storagePrefix}planUpdatedAt`);
      if (planAt) setAiPlanUpdatedAt(planAt);
    } catch (e) {
      console.warn('Failed to load persisted strategy', e);
    }
    try {
      const forecastStr = localStorage.getItem(`${storagePrefix}forecastJson`);
      if (forecastStr) {
        const parsed = JSON.parse(forecastStr);
        setAiForecastJson(parsed);
      }
    } catch (e) {
      console.warn('Failed to load persisted forecast', e);
    }
  }, [storagePrefix]);

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

  // Rating distribution (1..5)
  const ratingDistData = useMemo(() => {
    const dist = feedback?.ratingDistribution || {};
    return [1,2,3,4,5].map((r) => ({ rating: `${r}★`, count: Number(dist[r] || 0) }));
  }, [feedback]);

  // Hourly view distribution (0..23)
  const hourlyViewData = useMemo(() => {
    const hours: Array<{ hour: number; views: number }> = (
      (basic?.viewDistribution as any)?.hourlyViews ||
      (basic?.viewDistribution as any)?.hourlyData ||
      []
    ) as Array<{ hour: number; views: number }>;
    // Ensure 0..23 present
    const map = new Map<number, number>();
    hours.forEach((h) => map.set(h.hour, Number(h.views || 0)));
    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2,'0')}:00`,
      views: map.get(h) || 0
    }));
  }, [basic]);

  // Helpers: CSV export and print
  const toCSV = (headers: string[], rows: (string | number)[][]) => {
    const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))];
    return '\uFEFF' + lines.join('\n');
  };

  const downloadFile = (filename: string, content: string, mime = 'text/csv;charset=utf-8;') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportWeeklyDaily = () => {
    if (!analytics) return;
    // Weekly
    const weekly = toCSV(
      ['period','revenue','orders','change_pct'],
      (analytics.weeklyTrends || []).map(w => [w.period, w.revenue, w.orders, w.change])
    );
    downloadFile('weekly_trends.csv', weekly);
    // Daily revenue
    const daily = toCSV(
      ['date','revenue'],
      (analytics.dailyRevenueTrend || []).map(d => [d.date, d.revenue])
    );
    downloadFile('daily_revenue_7d.csv', daily);
  };

  const exportTopItems = () => {
    if (!analytics) return;
    const csv = toCSV(
      ['item','orders','revenue'],
      (analytics.topSellingItems || []).map(t => [t.name, t.orders, t.revenue])
    );
    downloadFile('top_items.csv', csv);
  };

  const exportFeedbackDist = () => {
    const csv = toCSV(
      ['rating','count'],
      [1,2,3,4,5].map(r => [r, Number(feedback?.ratingDistribution?.[r] || 0)])
    );
    downloadFile('feedback_distribution.csv', csv);
  };

  const exportHourlyViews = () => {
    const csv = toCSV(
      ['hour','views'],
      hourlyViewData.map(h => [h.hour, h.views])
    );
    downloadFile('hourly_views.csv', csv);
  };

  const printSummary = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const now = new Date().toLocaleString();
    const kpi = analytics ? `
      <ul>
        <li>Revenue: ৳${Number(analytics.revenue.current).toLocaleString()} (${analytics.revenue.change.toFixed(1)}%)</li>
        <li>Orders: ${Number(analytics.orders.current).toLocaleString()} (${analytics.orders.change.toFixed(1)}%)</li>
        <li>Customers: ${Number(analytics.customers.current).toLocaleString()} (${analytics.customers.change.toFixed(1)}%)</li>
        <li>Avg Rating: ${Number(analytics.rating.current).toFixed(2)}</li>
      </ul>` : '';
    const html = `<!doctype html><html><head><title>Analytics Summary</title>
      <style>body{font-family:system-ui,Arial;padding:24px} h1{margin:0 0 8px} h2{margin:16px 0 8px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ddd;padding:6px;text-align:left} small{color:#555}</style>
    </head><body>
      <h1>Advanced Analytics Summary</h1>
      <small>Generated ${now}</small>
      <h2>Key Metrics</h2>
      ${kpi}
      <h2>Weekly Trends</h2>
      <table><thead><tr><th>Period</th><th>Revenue</th><th>Orders</th><th>Change %</th></tr></thead><tbody>
      ${(analytics?.weeklyTrends || []).map(w => `<tr><td>${w.period}</td><td>${w.revenue}</td><td>${w.orders}</td><td>${w.change}</td></tr>`).join('')}
      </tbody></table>
      <h2>Top Items</h2>
      <table><thead><tr><th>Item</th><th>Orders</th><th>Revenue</th></tr></thead><tbody>
      ${(analytics?.topSellingItems || []).map(t => `<tr><td>${t.name}</td><td>${t.orders}</td><td>${t.revenue}</td></tr>`).join('')}
      </tbody></table>
      <h2>Feedback Distribution</h2>
      <table><thead><tr><th>Rating</th><th>Count</th></tr></thead><tbody>
      ${[1,2,3,4,5].map(r => `<tr><td>${r}</td><td>${Number(feedback?.ratingDistribution?.[r] || 0)}</td></tr>`).join('')}
      </tbody></table>
    </body></html>`;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

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
            setAiPlanData(parsed as AIStrategyBrief);
            // Also set the summary text if it exists in the parsed data
            if (parsed.summary) {
              setAiPlanText(parsed.summary);
            }
            const ts = new Date().toLocaleString();
            setAiPlanUpdatedAt(ts);
            try {
              localStorage.setItem(`${storagePrefix}planData`, JSON.stringify(parsed));
              if (parsed.summary) localStorage.setItem(`${storagePrefix}planText`, parsed.summary);
              localStorage.setItem(`${storagePrefix}planUpdatedAt`, ts);
            } catch {}
          } catch {
            setAiPlanText(raw);
            const ts = new Date().toLocaleString();
            setAiPlanUpdatedAt(ts);
            try {
              localStorage.removeItem(`${storagePrefix}planData`);
              localStorage.setItem(`${storagePrefix}planText`, raw);
              localStorage.setItem(`${storagePrefix}planUpdatedAt`, ts);
            } catch {}
          }
        } else {
          setAiPlanText(raw);
          const ts = new Date().toLocaleString();
          setAiPlanUpdatedAt(ts);
          try {
            localStorage.removeItem(`${storagePrefix}planData`);
            localStorage.setItem(`${storagePrefix}planText`, raw);
            localStorage.setItem(`${storagePrefix}planUpdatedAt`, ts);
          } catch {}
        }
      }
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

      {/* Customer Behavior Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Customer satisfaction breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {ratingDistData?.some(d => d.count > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingDistData} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-sm text-muted-foreground">No feedback yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Distribution by Hour</CardTitle>
            <CardDescription>
              Peak: {basic?.viewDistribution?.peakHour || '—'} ({basic?.viewDistribution?.peakViews ?? 0} views)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hourlyViewData?.some(d => d.views > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyViewData} margin={{ left: 12, right: 12 }}>
                    <defs>
                      <linearGradient id="viewFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stroke="#16a34a" fill="url(#viewFill)" strokeWidth={2} name="Views" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-sm text-muted-foreground">No view data yet</div>
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
            {aiPlanData ? (
              <div className="space-y-4">
                {aiPlanData?.salesDrivers && aiPlanData.salesDrivers.length > 0 && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-1">Sales Drivers</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {aiPlanData.salesDrivers.map((driver: string, i: number) => (
                        <li key={i}>{driver}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiPlanData?.riskAlerts && aiPlanData.riskAlerts.length > 0 && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-1">Risk Alerts</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {aiPlanData.riskAlerts.map((alert: string, i: number) => (
                        <li key={i}>{alert}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiPlanData?.forecast && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-md bg-gray-50">
                      <p className="text-xs text-muted-foreground">Next 7 days revenue</p>
                      <p className="font-semibold">
                        {Array.isArray(aiPlanData.forecast.next7DaysRevenueRange) ? `৳${aiPlanData.forecast.next7DaysRevenueRange[0]?.toLocaleString?.() || aiPlanData.forecast.next7DaysRevenueRange[0]} - ৳${aiPlanData.forecast.next7DaysRevenueRange[1]?.toLocaleString?.() || aiPlanData.forecast.next7DaysRevenueRange[1]}` : '—'}
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-gray-50">
                      <p className="text-xs text-muted-foreground">Expected orders</p>
                      <p className="font-semibold">
                        {Array.isArray(aiPlanData.forecast.expectedOrderRange) ? `${aiPlanData.forecast.expectedOrderRange[0]} - ${aiPlanData.forecast.expectedOrderRange[1]}` : '—'}
                      </p>
                    </div>
                  </div>
                )}
                {aiPlanData.menuSuggestions && aiPlanData.menuSuggestions.length > 0 && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-1">Menu Suggestions</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {aiPlanData.menuSuggestions.map((suggestion: string, i: number) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiPlanData.staffingTips && aiPlanData.staffingTips.length > 0 && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-1">Staffing Tips</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {aiPlanData.staffingTips.map((tip: string, i: number) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiPlanData.marketingIdeas && aiPlanData.marketingIdeas.length > 0 && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-1">Marketing Ideas</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {aiPlanData.marketingIdeas.map((idea: string, i: number) => (
                        <li key={i}>{idea}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiPlanData.summary && (
                  <div className="p-3 rounded-md bg-gray-100 text-sm">
                    {aiPlanData.summary}
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
                        if (!line || !line.trim()) return null;

                        // Determine indentation from original line (before trimming)
                        const leadingSpaces = (line.match(/^\s*/) || [''])[0].length;
                        const indentLevel = Math.floor(leadingSpaces / 2); // 2 spaces per level
                        const marginLeft = Math.min(indentLevel * 12, 48); // px

                        const trimmedLine = line.trim();

                        // Utility: auto-link URLs
                        const linkify = (text: string) => {
                          const splitRegex = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/g;
                          const isUrl = /^(https?:\/\/[^\s)]+|www\.[^\s)]+)$/i;
                          const parts = text.split(splitRegex);
                          return parts.map((part, i) => {
                            if (isUrl.test(part)) {
                              const href = part.startsWith('http') ? part : `https://${part}`;
                              return <a key={`lnk-${i}`} href={href} target="_blank" rel="noreferrer" className="text-blue-600 underline">{part}</a>;
                            }
                            return <span key={`txt-${i}`}>{part}</span>;
                          });
                        };

                        // Headings
                        const isHeading = /^(#{1,6}\s+|^\*\*.*\*\*$|^[A-Z][A-Z\s]{2,}:?\s*$|^[A-Z][a-z\s]+:)$/.
                          test(trimmedLine);
                        if (isHeading) {
                          const cleanHeading = trimmedLine.replace(/^#{1,6}\s+|\*\*|\s*:?\s*$/g, '').trim();
                          return (
                            <h4 key={key} className="font-semibold text-base mt-4 mb-2 text-blue-800 border-b border-blue-200 pb-1">
                              {cleanHeading}
                            </h4>
                          );
                        }

                        // Callouts: Note/Tip/Warning
                        const calloutMatch = trimmedLine.match(/^(Note|Tip|Warning):\s*(.*)$/i);
                        if (calloutMatch) {
                          const type = calloutMatch[1].toLowerCase();
                          const content = calloutMatch[2];
                          const color = type === 'warning' ? 'border-yellow-400 bg-yellow-50' : type === 'tip' ? 'border-emerald-400 bg-emerald-50' : 'border-blue-400 bg-blue-50';
                          const label = type.charAt(0).toUpperCase() + type.slice(1);
                          return (
                            <div key={key} className={`my-2 p-3 border-l-4 ${color} rounded-sm`}
                                 style={{ marginLeft }}>
                              <p className="text-xs font-semibold uppercase text-gray-700 mb-1">{label}</p>
                              <p className="text-gray-700 text-sm">{linkify(content)}</p>
                            </div>
                          );
                        }

                        // Checklist: - [ ] item / - [x] item
                        const checklistMatch = trimmedLine.match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/);
                        if (checklistMatch) {
                          const checked = checklistMatch[1].toLowerCase() === 'x';
                          const text = checklistMatch[2].trim();
                          return (
                            <div key={key} className="flex items-start gap-2 mb-2" style={{ marginLeft }}>
                              <input type="checkbox" checked={checked} readOnly className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600" />
                              <span className="text-gray-700">{linkify(text)}</span>
                            </div>
                          );
                        }

                        // Bullets
                        const isBulletPoint = /^[-•*]\s+/.test(trimmedLine);
                        if (isBulletPoint) {
                          const cleanText = trimmedLine.replace(/^[-•*]\s+/, '').trim();
                          return (
                            <div key={key} className="mb-2 flex" style={{ marginLeft }}>
                              <span className="text-blue-600 font-medium mr-2">•</span>
                              <span className="text-gray-700">{linkify(cleanText)}</span>
                            </div>
                          );
                        }

                        // Numbered list
                        const numMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
                        if (numMatch) {
                          const number = numMatch[1];
                          const text = numMatch[2];
                          return (
                            <div key={key} className="mb-2 flex" style={{ marginLeft }}>
                              <span className="text-blue-600 font-medium mr-2">{number}.</span>
                              <span className="text-gray-700">{linkify(text)}</span>
                            </div>
                          );
                        }

                        // Key-Value lines like "Metric: value"
                        const kv = trimmedLine.match(/^([^:]{2,}):\s*(.+)$/);
                        if (kv) {
                          return (
                            <div key={key} className="mb-2" style={{ marginLeft }}>
                              <span className="text-gray-500 text-xs uppercase tracking-wide mr-2">{kv[1]}</span>
                              <span className="inline-block px-2 py-0.5 text-xs rounded bg-white border border-gray-200 text-gray-800">{linkify(kv[2])}</span>
                            </div>
                          );
                        }

                        // Paragraph fallback
                        return (
                          <p key={key} className="text-gray-700 leading-relaxed mb-3" style={{ marginLeft }}>
                            {linkify(trimmedLine)}
                          </p>
                        );
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

      {/* Custom Reports */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-600" /> Custom Reports</CardTitle>
            <CardDescription>Export CSVs or print a summary report</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportWeeklyDaily}>Export Weekly & Daily CSV</Button>
            <Button variant="secondary" onClick={exportTopItems}>Export Top Items CSV</Button>
            <Button variant="secondary" onClick={exportFeedbackDist}>Export Feedback CSV</Button>
            <Button variant="secondary" onClick={exportHourlyViews}>Export Hourly Views CSV</Button>
            <Button onClick={printSummary}>Print Summary</Button>
          </div>
        </CardHeader>
      </Card>

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
