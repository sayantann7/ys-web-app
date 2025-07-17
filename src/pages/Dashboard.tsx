
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Clock, Activity } from 'lucide-react';
import { apiService } from '@/services/api';
import { WeeklyMetrics } from '@/types';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<{
    currentWeek: WeeklyMetrics;
    previousWeek: WeeklyMetrics;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await apiService.getBiweeklyMetrics();
        setMetrics({
          currentWeek: response.currentWeek,
          previousWeek: response.previousWeek,
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of system activity and metrics</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of system activity and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Total Sign-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.currentWeek?.signIns || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics && (
                <>
                  {calculateChange(metrics.currentWeek.signIns, metrics.previousWeek.signIns) > 0 ? '+' : ''}
                  {calculateChange(metrics.currentWeek.signIns, metrics.previousWeek.signIns)}% from last week
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Documents Viewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.currentWeek?.documentsViewed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics && (
                <>
                  {calculateChange(metrics.currentWeek.documentsViewed, metrics.previousWeek.documentsViewed) > 0 ? '+' : ''}
                  {calculateChange(metrics.currentWeek.documentsViewed, metrics.previousWeek.documentsViewed)}% from last week
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatTime(metrics?.currentWeek?.timeSpent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics && (
                <>
                  {calculateChange(metrics.currentWeek.timeSpent, metrics.previousWeek.timeSpent) > 0 ? '+' : ''}
                  {calculateChange(metrics.currentWeek.timeSpent, metrics.previousWeek.timeSpent)}% from last week
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.currentWeek?.signIns ? Math.max(1, Math.floor(metrics.currentWeek.signIns / 2)) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated based on sign-ins
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Week Overview</CardTitle>
            <CardDescription>
              {metrics?.currentWeek && new Date(metrics.currentWeek.startDate).toLocaleDateString()} - {metrics?.currentWeek && new Date(metrics.currentWeek.endDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sign-ins</span>
              <span className="font-medium">{metrics?.currentWeek?.signIns || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Documents Viewed</span>
              <span className="font-medium">{metrics?.currentWeek?.documentsViewed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Time</span>
              <span className="font-medium">{formatTime(metrics?.currentWeek?.timeSpent || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Previous Week Comparison</CardTitle>
            <CardDescription>
              {metrics?.previousWeek && new Date(metrics.previousWeek.startDate).toLocaleDateString()} - {metrics?.previousWeek && new Date(metrics.previousWeek.endDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sign-ins</span>
              <span className="font-medium">{metrics?.previousWeek?.signIns || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Documents Viewed</span>
              <span className="font-medium">{metrics?.previousWeek?.documentsViewed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Time</span>
              <span className="font-medium">{formatTime(metrics?.previousWeek?.timeSpent || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
