"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  MessageSquare, 
  Target,
  Award,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
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
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {userName}'s Fluency Analytics
        </h2>
        <p className="text-gray-600">Track your speaking progress over time</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(analytics.averageFluencyScore)}`}>
                  {analytics.averageFluencyScore}
                </p>
              </div>
              <Award className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg WPM</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(analytics.averageWordsPerMinute)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.sessionCount}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Improvement</p>
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
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Performance Metrics</span>
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
                  <span className="text-gray-600">Best WPM</span>
                  <span className="font-medium">{analytics.topMetrics.bestWPM}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Best Score</span>
                  <span className={`font-medium ${getScoreColor(analytics.topMetrics.bestFluencyScore)}`}>
                    {analytics.topMetrics.bestFluencyScore}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Longest Speech</span>
                  <span className="font-medium">{Math.round(analytics.topMetrics.longestSpeech / 1000)}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Strengths</span>
              </h4>
              <div className="flex flex-wrap gap-1">
                {analytics.strengths.map((strength, index) => (
                  <Badge key={index} variant="default" className="text-xs">
                    {strength}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>Areas for Improvement</span>
              </h4>
              <div className="flex flex-wrap gap-1">
                {analytics.weaknesses.map((weakness, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {weakness}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSessions.slice(0, 5).map((session, index) => (
              <div key={session.sessionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-600">
                    Session #{recentSessions.length - index}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(session.startTime)}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className={`font-bold ${getScoreColor(session.overallScore)}`}>
                      {session.overallScore}
                    </span>
                    <span className="text-gray-500 ml-1">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FluencyDashboard;
