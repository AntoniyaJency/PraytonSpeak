"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import FluencyDashboard from "@/components/FluencyDashboard";
import D3FluencyCharts from "@/components/D3FluencyCharts";
import { FluencyAnalytics, FluencySession } from "@/types/fluency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

// Mock data for demonstration
const generateMockAnalytics = (): FluencyAnalytics => ({
  sessionCount: 12,
  averageFluencyScore: 75,
  averageWordsPerMinute: 135,
  improvement: 8.5,
  topMetrics: {
    bestWPM: 168,
    bestFluencyScore: 92,
    longestSpeech: 45000
  },
  weaknesses: ["Filler words", "Long pauses", "Inconsistent pace"],
  strengths: ["Clear pronunciation", "Good vocabulary", "Confident delivery"]
});

const generateMockSessions = (): FluencySession[] => {
  const sessions: FluencySession[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 12; i++) {
    const sessionStartTime = now - (i * 24 * 60 * 60 * 1000); // Each session 1 day apart
    const score = Math.floor(Math.random() * 30) + 70; // Scores between 70-100
    
    sessions.push({
      sessionId: `session_${i}`,
      userId: "demo_user",
      startTime: sessionStartTime,
      endTime: sessionStartTime + (Math.random() * 300000 + 60000), // 1-6 minutes
      segments: [],
      metrics: {
        wordsPerMinute: Math.floor(Math.random() * 50) + 120,
        averagePauseDuration: Math.random() * 2000 + 500,
        pauseCount: Math.floor(Math.random() * 10) + 3,
        fillerWordCount: Math.floor(Math.random() * 8),
        speechDuration: Math.random() * 200000 + 40000,
        totalDuration: Math.random() * 300000 + 60000,
        fluencyScore: score,
        confidence: score / 100
      },
      overallScore: score
    });
  }
  
  return sessions;
};

export default function AnalyticsPage() {
  const { user, isSignedIn } = useUser();
  const [analytics, setAnalytics] = useState<FluencyAnalytics | null>(null);
  const [sessions, setSessions] = useState<FluencySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading analytics data
    const loadAnalytics = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAnalytics(generateMockAnalytics());
      setSessions(generateMockSessions());
      setLoading(false);
    };

    loadAnalytics();
  }, []);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Please sign in to view your fluency analytics and track your progress.
            </p>
            <Link href="/">
              <Button className="w-full">
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No Data Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Start a conversation to generate your fluency analytics.
            </p>
            <Link href="/">
              <Button className="w-full">
                Start Conversation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
        </div>
        
        <FluencyDashboard
          analytics={analytics}
          recentSessions={sessions}
          userName={user?.fullName || user?.username || "User"}
        />
        
        {/* D3 Visualizations */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Visual Analytics</h2>
          <D3FluencyCharts
            sessions={sessions}
            analytics={analytics}
            isPremium={false} // Mock premium status - in real app, this would come from user subscription
          />
        </div>
      </div>
    </div>
  );
}
