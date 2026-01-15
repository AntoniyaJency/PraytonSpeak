import { FluencyMetrics, SpeechSegment, FluencySession } from '@/types/fluency';

const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'basically', 
  'actually', 'literally', 'sort of', 'kind of', 'I mean',
  'well', 'so', 'anyway', 'right', 'you know what I mean'
];

export class FluencyAnalyzer {
  private segments: SpeechSegment[] = [];
  private sessionStartTime: number = 0;
  private lastSpeechTime: number = 0;

  startSession(): void {
    this.sessionStartTime = Date.now();
    this.lastSpeechTime = this.sessionStartTime;
    this.segments = [];
  }

  addSpeechSegment(text: string, timestamp: number): void {
    const words = this.extractWords(text);
    const duration = this.lastSpeechTime ? timestamp - this.lastSpeechTime : 0;
    
    const segment: SpeechSegment = {
      text,
      timestamp,
      duration,
      isPause: false,
      words
    };

    this.segments.push(segment);
    this.lastSpeechTime = timestamp;
  }

  addPause(timestamp: number): void {
    const duration = this.lastSpeechTime ? timestamp - this.lastSpeechTime : 0;
    
    if (duration > 500) { // Only count pauses longer than 500ms
      const segment: SpeechSegment = {
        text: '',
        timestamp,
        duration,
        isPause: true,
        words: []
      };

      this.segments.push(segment);
    }
  }

  calculateMetrics(): FluencyMetrics {
    const speechSegments = this.segments.filter(s => !s.isPause);
    const pauseSegments = this.segments.filter(s => s.isPause);
    
    const totalWords = speechSegments.reduce((sum, seg) => sum + seg.words.length, 0);
    const speechDuration = speechSegments.reduce((sum, seg) => sum + seg.duration, 0);
    const totalDuration = Date.now() - this.sessionStartTime;
    
    const wordsPerMinute = speechDuration > 0 ? (totalWords / speechDuration) * 60000 : 0;
    const averagePauseDuration = pauseSegments.length > 0 
      ? pauseSegments.reduce((sum, seg) => sum + seg.duration, 0) / pauseSegments.length 
      : 0;
    
    const fillerWordCount = speechSegments.reduce((sum, seg) => 
      sum + this.countFillerWords(seg.words), 0);

    const fluencyScore = this.calculateFluencyScore({
      wordsPerMinute,
      averagePauseDuration,
      pauseCount: pauseSegments.length,
      fillerWordCount,
      speechDuration,
      totalDuration
    });

    return {
      wordsPerMinute,
      averagePauseDuration,
      pauseCount: pauseSegments.length,
      fillerWordCount,
      speechDuration,
      totalDuration,
      fluencyScore,
      confidence: this.calculateConfidence(fluencyScore)
    };
  }

  getSession(sessionId: string, userId: string): FluencySession {
    return {
      sessionId,
      userId,
      startTime: this.sessionStartTime,
      segments: this.segments,
      metrics: this.calculateMetrics(),
      overallScore: this.calculateMetrics().fluencyScore
    };
  }

  private extractWords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private countFillerWords(words: string[]): number {
    return words.filter(word => FILLER_WORDS.includes(word)).length;
  }

  private calculateFluencyScore(metrics: Partial<FluencyMetrics>): number {
    let score = 100;
    
    // WPM scoring (ideal: 120-150 WPM)
    const wpm = metrics.wordsPerMinute || 0;
    if (wpm < 80) score -= (80 - wpm) * 0.5;
    else if (wpm > 180) score -= (wpm - 180) * 0.3;
    
    // Pause scoring (ideal: 0.5-2 seconds)
    const avgPause = metrics.averagePauseDuration || 0;
    if (avgPause > 3000) score -= (avgPause - 3000) * 0.01;
    else if (avgPause < 500) score -= (500 - avgPause) * 0.02;
    
    // Filler word penalty
    const fillerCount = metrics.fillerWordCount || 0;
    score -= fillerCount * 2;
    
    // Speech ratio (should be at least 60% of total time)
    const speechRatio = (metrics.speechDuration || 0) / (metrics.totalDuration || 1);
    if (speechRatio < 0.6) score -= (0.6 - speechRatio) * 50;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateConfidence(fluencyScore: number): number {
    if (fluencyScore >= 80) return 0.9;
    if (fluencyScore >= 60) return 0.7;
    if (fluencyScore >= 40) return 0.5;
    return 0.3;
  }

  getRealtimeData(): {
    currentWPM: number;
    currentScore: number;
    pauseIndicator: boolean;
    fillerDetected: boolean;
    speakingTime: number;
  } {
    const recentSegments = this.segments.slice(-5);
    const speechSegments = recentSegments.filter(s => !s.isPause);
    
    const totalWords = speechSegments.reduce((sum, seg) => sum + seg.words.length, 0);
    const speechDuration = speechSegments.reduce((sum, seg) => sum + seg.duration, 0);
    const currentWPM = speechDuration > 0 ? (totalWords / speechDuration) * 60000 : 0;
    
    const metrics = this.calculateMetrics();
    const fillerDetected = speechSegments.some(seg => this.countFillerWords(seg.words) > 0);
    const pauseIndicator = recentSegments.some(seg => seg.isPause);
    const speakingTime = speechDuration;

    return {
      currentWPM: Math.round(currentWPM),
      currentScore: metrics.fluencyScore,
      pauseIndicator,
      fillerDetected,
      speakingTime
    };
  }
}
