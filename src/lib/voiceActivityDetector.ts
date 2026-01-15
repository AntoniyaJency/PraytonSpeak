export interface VoiceActivityEvent {
  timestamp: number;
  isSpeaking: boolean;
  volume: number;
  duration: number;
}

export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isDetecting = false;
  private animationId: number | null = null;
  
  private onVoiceActivity?: (event: VoiceActivityEvent) => void;
  private onSpeechStart?: () => void;
  private onSpeechEnd?: () => void;
  
  private lastSpeakingTime = 0;
  private speechStartTime = 0;
  private isCurrentlySpeaking = false;
  private silenceThreshold = 0.02; // 2% of max volume
  private speechTimeout = 1000; // 1 second of silence before considering speech ended

  constructor() {
    this.setupAudioContext();
  }

  private async setupAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('AudioContext not supported:', error);
    }
  }

  async startDetection(
    onVoiceActivity?: (event: VoiceActivityEvent) => void,
    onSpeechStart?: () => void,
    onSpeechEnd?: () => void
  ) {
    if (this.isDetecting) return;

    this.onVoiceActivity = onVoiceActivity;
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!this.audioContext) {
        await this.setupAudioContext();
      }

      if (this.audioContext) {
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        
        this.microphone.connect(this.analyser);
        
        this.isDetecting = true;
        this.detectVoiceActivity();
      }
    } catch (error) {
      console.error('Failed to start voice detection:', error);
      throw error;
    }
  }

  stopDetection() {
    this.isDetecting = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    this.dataArray = null;
  }

  private detectVoiceActivity() {
    if (!this.isDetecting || !this.analyser || !this.dataArray) return;

    this.analyser.getByteTimeDomainData(this.dataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const value = Math.abs(this.dataArray[i] - 128); // Distance from center line
      sum += value;
    }
    const averageVolume = sum / this.dataArray.length / 128; // Normalize to 0-1
    
    const isSpeaking = averageVolume > this.silenceThreshold;
    const currentTime = Date.now();
    
    if (isSpeaking && !this.isCurrentlySpeaking) {
      // Speech started
      this.isCurrentlySpeaking = true;
      this.speechStartTime = currentTime;
      this.onSpeechStart?.();
    } else if (!isSpeaking && this.isCurrentlySpeaking) {
      // Check if speech has ended (silence for threshold duration)
      const silenceDuration = currentTime - this.lastSpeakingTime;
      if (silenceDuration > this.speechTimeout) {
        this.isCurrentlySpeaking = false;
        const speechDuration = this.lastSpeakingTime - this.speechStartTime;
        this.onSpeechEnd?.();
        
        // Emit voice activity event
        if (this.onVoiceActivity) {
          this.onVoiceActivity({
            timestamp: this.speechStartTime,
            isSpeaking: false,
            volume: 0,
            duration: speechDuration
          });
        }
      }
    }
    
    if (isSpeaking) {
      this.lastSpeakingTime = currentTime;
      
      // Emit real-time voice activity
      if (this.onVoiceActivity) {
        this.onVoiceActivity({
          timestamp: currentTime,
          isSpeaking: true,
          volume: averageVolume,
          duration: currentTime - this.speechStartTime
        });
      }
    }
    
    this.animationId = requestAnimationFrame(() => this.detectVoiceActivity());
  }

  isCurrentlyDetecting(): boolean {
    return this.isDetecting;
  }

  getCurrentVolume(): number {
    if (!this.analyser || !this.dataArray || !this.isDetecting) return 0;
    
    this.analyser.getByteTimeDomainData(this.dataArray);
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const value = Math.abs(this.dataArray[i] - 128);
      sum += value;
    }
    
    return sum / this.dataArray.length / 128;
  }
}
