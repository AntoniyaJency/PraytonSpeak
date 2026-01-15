"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Download, Lock, Star, TrendingUp, TrendingDown, Clock, MessageSquare, Target, Award, AlertTriangle, CheckCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { FluencyAnalytics, FluencySession } from "@/types/fluency";

interface FluencyDashboardProps {
  analytics: FluencyAnalytics;
  recentSessions: FluencySession[];
  userName: string;
}

const FluencyDashboard: React.FC<FluencyDashboardProps> = ({
  analytics,
  recentSessions,
  userName
}) => {
  const { theme } = useTheme();
  const [isPremium, setIsPremium] = React.useState(false); // Mock subscription status

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme === 'dark' ? "text-green-400" : "text-green-600";
    if (score >= 60) return theme === 'dark' ? "text-yellow-400" : "text-yellow-600";
    return theme === 'dark' ? "text-red-400" : "text-red-600";
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (improvement < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleDownloadReport = () => {
    // Premium feature - download analytics report
    const reportData = {
      userName,
      analytics,
      recentSessions,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluency-report-${userName}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with Premium Status */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {userName}'s Fluency Analytics
        </h2>
        <div className="flex items-center justify-center gap-2">
          <Badge variant={isPremium ? "default" : "secondary"} className="text-sm">
            {isPremium ? (
              <><Crown className="h-3 w-3 mr-1" />Premium</>
            ) : (
              <>Free Plan</>
            )}
          </Badge>
          {!isPremium && (
            <Button size="sm" className="ml-2">
              <Crown className="h-3 w-3 mr-1" />
              Upgrade to Premium
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">Track your speaking progress over time</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(analytics.averageFluencyScore)}`}>
                  {analytics.averageFluencyScore}
                </p>
              </div>
              <Award className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg WPM</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(analytics.averageWordsPerMinute)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.sessionCount}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Improvement</p>
                <div className="flex items-center space-x-2">
                  <p className={`text-2xl font-bold ${analytics.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.improvement > 0 ? '+' : ''}{analytics.improvement}%
                  </p>
                  {getImprovementIcon(analytics.improvement)}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Metrics
              </span>
              {!isPremium && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Fluency Score</span>
                <span className={`text-sm font-bold ${getScoreColor(analytics.averageFluencyScore)}`}>
                  {analytics.averageFluencyScore}/100
                </span>
              </div>
              <Progress value={analytics.averageFluencyScore} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Words Per Minute</span>
                <span className="text-sm font-bold text-blue-600">
                  {Math.round(analytics.averageWordsPerMinute)} WPM
                </span>
              </div>
              <Progress value={(analytics.averageWordsPerMinute / 150) * 100} className="h-2" />
            </div>

            <div className="pt-2">
              <h4 className="text-sm font-semibold mb-2">Personal Bests</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Best WPM</span>
                  <span className="font-medium">{analytics.topMetrics.bestWPM}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Best Score</span>
                  <span className={`font-medium ${getScoreColor(analytics.topMetrics.bestFluencyScore)}`}>
                    {analytics.topMetrics.bestFluencyScore}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Longest Speech</span>
                  <span className="font-medium">{Math.round(analytics.topMetrics.longestSpeech / 1000)}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Analysis
              </span>
              {!isPremium && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Strengths</span>
              </h4>
              <div className="flex flex-wrap gap-1">
                {analytics.strengths.slice(0, isPremium ? analytics.strengths.length : 2).map((strength, index) => (
                  <Badge key={index} variant="default" className="text-xs">
                    {strength}
                  </Badge>
                ))}
                {!isPremium && analytics.strengths.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{analytics.strengths.length - 2} more
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>Areas for Improvement</span>
              </h4>
              <div className="flex flex-wrap gap-1">
                {analytics.weaknesses.slice(0, isPremium ? analytics.weaknesses.length : 1).map((weakness, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {weakness}
                  </Badge>
                ))}
                {!isPremium && analytics.weaknesses.length > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    +{analytics.weaknesses.length - 1} more
                  </Badge>
                )}
              </div>
            </div>

            {!isPremium && (
              <div className="pt-2 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Unlock detailed analysis with Premium
                  </p>
                  <Button size="sm" className="w-full">
                    <Crown className="h-3 w-3 mr-1" />
                    Upgrade for Full Analysis
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Sessions
            </span>
            <div className="flex items-center gap-2">
              {isPremium && (
                <Button size="sm" variant="outline" onClick={handleDownloadReport}>
                  <Download className="h-3 w-3 mr-1" />
                  Download Report
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSessions.slice(0, isPremium ? 5 : 3).map((session, index) => (
              <div key={session.sessionId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    Session #{recentSessions.length - index}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(session.startTime)}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className={`font-bold ${getScoreColor(session.overallScore)}`}>
                      {session.overallScore}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {session.metrics?.wordsPerMinute ? 
                        `(${Math.round(session.metrics.wordsPerMinute)} WPM)` : 
                        ''
                      }
                    </span>
                  </div>
                  <Badge variant={getScoreVariant(session.overallScore)}>
                    {session.overallScore >= 80 ? 'Excellent' : 
                     session.overallScore >= 60 ? 'Good' : 'Needs Work'}
                  </Badge>
                </div>
              </div>
            ))}
            {!isPremium && recentSessions.length > 3 && (
              <div className="text-center p-4 border-2 border-dashed rounded-lg">
                <div className="space-y-2">
                  <Lock className="h-6 w-6 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {recentSessions.length - 3} more sessions available
                  </p>
                  <Button size="sm" className="w-full">
                    <Crown className="h-3 w-3 mr-1" />
                    Upgrade to View All Sessions
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Premium Upgrade CTA */}
      {!isPremium && (
        <Card className="border-2 border-dashed bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <CardContent className="text-center p-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
                  <Crown className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground">Upgrade to Premium</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Get detailed analytics, unlimited session history, downloadable reports, and advanced insights
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Unlimited Sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-green-600" />
                  <span>Download Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span>Advanced Insights</span>
                </div>
              </div>
              <Button size="lg" className="w-full sm:w-auto">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FluencyDashboard;
