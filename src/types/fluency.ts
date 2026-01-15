export interface FluencyMetrics {
  wordsPerMinute: number;
  averagePauseDuration: number;
  pauseCount: number;
  fillerWordCount: number;
  speechDuration: number;
  totalDuration: number;
  fluencyScore: number;
  confidence: number;
}

export interface SpeechSegment {
  text: string;
  timestamp: number;
  duration: number;
  isPause: boolean;
  words: string[];
}

export interface FluencySession {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  segments: SpeechSegment[];
  metrics?: FluencyMetrics;
  overallScore: number;
}

export interface FluencyAnalytics {
  sessionCount: number;
  averageFluencyScore: number;
  averageWordsPerMinute: number;
  improvement: number;
  topMetrics: {
    bestWPM: number;
    bestFluencyScore: number;
    longestSpeech: number;
  };
  weaknesses: string[];
  strengths: string[];
}

export interface RealtimeFluencyData {
  currentWPM: number;
  currentScore: number;
  pauseIndicator: boolean;
  fillerDetected: boolean;
  speakingTime: number;
}
