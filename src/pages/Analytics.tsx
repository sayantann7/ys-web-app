import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { WeeklyMetrics, User } from '@/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  FileText, 
  Clock, 
  Activity,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

const Analytics = () => {
  const [metrics, setMetrics] = useState<{
    currentWeek: WeeklyMetrics | null;
    previousWeek: WeeklyMetrics | null;
  }>({ currentWeek: null, previousWeek: null });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBiweeklyMetrics();
      setMetrics({
        currentWeek: response.currentWeek,
        previousWeek: response.previousWeek
      });
    } catch (error) {
      toast({
        title: "Error loading analytics",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { currentWeek, previousWeek } = metrics;

  if (!currentWeek) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No analytics data available
            </h3>
            <p className="text-muted-foreground">
              Analytics data will appear once users start using the system
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const signInsChange = previousWeek ? calculatePercentageChange(currentWeek.signIns, previousWeek.signIns) : 0;
  const documentsChange = previousWeek ? calculatePercentageChange(currentWeek.documentsViewed, previousWeek.documentsViewed) : 0;
  const timeChange = previousWeek ? calculatePercentageChange(currentWeek.timeSpent, previousWeek.timeSpent) : 0;

  // Chart data
  const weeklyComparisonData = [
    {
      period: 'Previous Week',
      signIns: previousWeek?.signIns || 0,
      documentsViewed: previousWeek?.documentsViewed || 0,
      timeSpent: Math.round((previousWeek?.timeSpent || 0) / 3600), // Convert to hours
    },
    {
      period: 'Current Week',
      signIns: currentWeek.signIns,
      documentsViewed: currentWeek.documentsViewed,
      timeSpent: Math.round(currentWeek.timeSpent / 3600), // Convert to hours
    },
  ];

  const activityData = [
    { name: 'Sign-ins', value: currentWeek.signIns, color: '#3b82f6' },
    { name: 'Documents Viewed', value: currentWeek.documentsViewed, color: '#10b981' },
    { name: 'Hours Spent', value: Math.round(currentWeek.timeSpent / 3600), color: '#f59e0b' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          User activity and engagement metrics
        </p>
      </div>

      {/* Current Week Period */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Current Week</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(currentWeek.startDate).toLocaleDateString()} - {new Date(currentWeek.endDate).toLocaleDateString()}
              </p>
            </div>
            <Button onClick={loadMetrics} variant="outline" size="sm">
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Sign-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl font-bold text-foreground">
                {currentWeek.signIns}
              </span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(signInsChange)}
                <span className={`text-sm font-medium ${getTrendColor(signInsChange)}`}>
                  {Math.abs(signInsChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. previous week: {previousWeek?.signIns || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Documents Viewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl font-bold text-foreground">
                {currentWeek.documentsViewed}
              </span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(documentsChange)}
                <span className={`text-sm font-medium ${getTrendColor(documentsChange)}`}>
                  {Math.abs(documentsChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. previous week: {previousWeek?.documentsViewed || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl font-bold text-foreground">
                {formatTime(currentWeek.timeSpent)}
              </span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(timeChange)}
                <span className={`text-sm font-medium ${getTrendColor(timeChange)}`}>
                  {Math.abs(timeChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. previous week: {formatTime(previousWeek?.timeSpent || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Comparison</CardTitle>
            <CardDescription>
              Comparing current week vs previous week performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="signIns" fill="#3b82f6" name="Sign-ins" />
                <Bar dataKey="documentsViewed" fill="#10b981" name="Documents" />
                <Bar dataKey="timeSpent" fill="#f59e0b" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Current Week Activity</CardTitle>
            <CardDescription>
              Distribution of user activity this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Rate</CardTitle>
            <CardDescription>Average documents per sign-in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {currentWeek.signIns > 0 
                ? (currentWeek.documentsViewed / currentWeek.signIns).toFixed(1)
                : '0'
              }
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              documents per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Session Time</CardTitle>
            <CardDescription>Time spent per sign-in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {currentWeek.signIns > 0 
                ? formatTime(Math.round(currentWeek.timeSpent / currentWeek.signIns))
                : '0h 0m'
              }
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              per session
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;