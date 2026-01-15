"use client";

import React, { useEffect, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, TrendingUp, Clock, AlertCircle } from "lucide-react";

import { sendToMakeWebhook } from "@/lib/sendToMakeWebhook";
import { FluencyAnalyzer } from "@/lib/fluencyAnalyzer";
import { VoiceActivityDetector, VoiceActivityEvent } from "@/lib/voiceActivityDetector";
import { RealtimeFluencyData, FluencySession } from "@/types/fluency";

type VoiceMessage = {
  source: "user" | "ai";
  message: string;
};

const VoiceChat = () => {
  const { user } = useUser();
  const isLoggedIn = !!user;
  const username = isLoggedIn
    ? user.fullName || user.username || "Anonymous"
    : "Anonymous";

  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userMessages, setUserMessages] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fluencyData, setFluencyData] = useState<RealtimeFluencyData | null>(null);
  const [showFluencyMetrics, setShowFluencyMetrics] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  
  const fluencyAnalyzer = new FluencyAnalyzer();
  const voiceDetector = new VoiceActivityDetector();

  const conversation = useConversation({
    onConnect: () => console.log("✅ Connected to ElevenLabs"),
    onDisconnect: () => console.log("❌ Disconnected"),
    onMessage: (message: VoiceMessage) => {
      console.log("Received message:", message);
      // Only track user messages when user is actually speaking
      if (message.source === "user" && isUserSpeaking) {
        setUserMessages((prev) => [...prev, message.message]);
        
        // Track fluency for user messages only during actual speech
        const timestamp = Date.now();
        fluencyAnalyzer.addSpeechSegment(message.message, timestamp);
        
        // Update real-time fluency data
        const realtimeData = fluencyAnalyzer.getRealtimeData();
        setFluencyData(realtimeData);
      }
    },
    onError: (error: string | Error) => {
      const err = typeof error === "string" ? error : error.message;
      setErrorMessage(err);
      console.error("Error:", error);
    }
  });

  const { status, isSpeaking } = conversation;

  // Safe session ID for guests
  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("temp_session_id");
      if (!id) {
        id = Date.now().toString();
        localStorage.setItem("temp_session_id", id);
      }
      setSessionId(id);
    }
  }, []);

  // Warn guests if they refresh
  useEffect(() => {
    if (!isLoggedIn) {
      const warnUser = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue =
          "Your progress will be lost if you leave or refresh this page.";
      };
      window.addEventListener("beforeunload", warnUser);
      return () => window.removeEventListener("beforeunload", warnUser);
    }
  }, [isLoggedIn]);

  const handleStartConversation = async () => {
    // Clear any previous errors
    setErrorMessage("");
    
    // Check if environment variable is set
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    if (!agentId) {
      setErrorMessage("Missing ElevenLabs Agent ID. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in your environment variables.");
      console.error("❌ NEXT_PUBLIC_ELEVENLABS_AGENT_ID is not set");
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      
      // Start the conversation session
      fluencyAnalyzer.startSession();
      
      // Start voice activity detection
      await voiceDetector.startDetection(
        (event: VoiceActivityEvent) => {
          setCurrentVolume(event.volume);
          if (event.isSpeaking) {
            setIsUserSpeaking(true);
            // Add pause detection when speech continues
            fluencyAnalyzer.addSpeechSegment('', event.timestamp);
          }
        },
        () => {
          console.log("User started speaking");
          setIsUserSpeaking(true);
        },
        () => {
          console.log("User stopped speaking");
          setIsUserSpeaking(false);
          // Update fluency data when speech ends
          const realtimeData = fluencyAnalyzer.getRealtimeData();
          setFluencyData(realtimeData);
        }
      );
      
      await conversation.startSession({
        agentId: agentId
      });
      
      setShowFluencyMetrics(true);
    } catch (error) {
      // Provide more specific error messages
      let errorMsg = "Failed to start conversation";
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMsg = "Microphone access denied. Please allow microphone access in your browser settings.";
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          errorMsg = "No microphone found. Please connect a microphone and try again.";
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          errorMsg = "Microphone is already in use by another application.";
        } else {
          errorMsg = `Error: ${error.message || error.name}`;
        }
      } else if (typeof error === "string") {
        errorMsg = error;
      }
      
      setErrorMessage(errorMsg);
      console.error("Start error:", error);
    }
  };

  const handleEndConversation = async () => {
    try {
      await conversation.endSession();
      
      // Stop voice detection
      voiceDetector.stopDetection();
      setIsUserSpeaking(false);
      setCurrentVolume(0);

      if (sessionId) {
        // Get fluency session data only if user actually spoke
        const fluencySession = fluencyAnalyzer.getSession(sessionId, username);
        
        await sendToMakeWebhook(userMessages, username, sessionId, fluencySession);
        setUserMessages([]);
        setFluencyData(null);
        setShowFluencyMetrics(false);
        if (!isLoggedIn) localStorage.removeItem("temp_session_id");
      } else {
        console.error("❌ Session ID missing");
      }
    } catch (error) {
      setErrorMessage("Failed to end conversation");
      console.error("End error:", error);
    }
  };

  const toggleMute = async () => {
    try {
      await conversation.setVolume({ volume: isMuted ? 1 : 0 });
      setIsMuted(!isMuted);
    } catch {
      setErrorMessage("Failed to change volume");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatSpeakingTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Voice Chat
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            disabled={status !== "connected"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isLoggedIn && (
          <div className="bg-yellow-100 text-yellow-800 p-3 text-sm rounded mb-4 text-center">
            ⚠️ You are not logged in. If you refresh or leave, your progress will be lost.
            <br />
            <strong>Please sign in to save your session.</strong>
          </div>
        )}
        {/* Fluency Metrics Display - Only show when user is actually speaking */}
        {showFluencyMetrics && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">Voice Activity</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isUserSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-gray-600">
                  {isUserSpeaking ? 'Speaking' : 'Not Speaking'}
                </span>
              </div>
            </div>
            
            {/* Volume Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Volume Level</span>
                <span className="text-gray-700">{Math.round(currentVolume * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${currentVolume * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Fluency Metrics - Only show when we have actual data */}
            {fluencyData && fluencyData.speakingTime > 1000 && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Fluency Analytics</h4>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(fluencyData.currentScore)}`}>
                      {fluencyData.currentScore}
                    </div>
                    <div className="text-xs text-gray-600">Fluency Score</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {fluencyData.currentWPM}
                    </div>
                    <div className="text-xs text-gray-600">Words/Min</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">
                      {formatSpeakingTime(fluencyData.speakingTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {fluencyData.pauseIndicator && (
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">Pause</span>
                      </div>
                    )}
                    {fluencyData.fillerDetected && (
                      <div className="flex items-center space-x-1 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">Filler</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!fluencyData && (
              <div className="text-center text-sm text-gray-500 py-2">
                Start speaking to see fluency metrics...
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {status === "connected" ? (
              <Button
                variant="destructive"
                onClick={handleEndConversation}
                className="w-full"
              >
                <MicOff className="mr-2 h-4 w-4" />
                End Conversation
              </Button>
            ) : (
              <Button
                onClick={handleStartConversation}
                className="w-full"
                disabled={false}
              >
                <Mic className="mr-2 h-4 w-4" />
                Start Conversation
              </Button>
            )}
          </div>
          <div className="text-center text-sm">
            {status === "connected" && (
              <p className="text-green-600">
                {isSpeaking ? "Agent is speaking..." : "Listening..."}
              </p>
            )}
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
            {!hasPermission && (
              <p className="text-yellow-600">
                Please allow microphone access to use voice chat
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceChat;
