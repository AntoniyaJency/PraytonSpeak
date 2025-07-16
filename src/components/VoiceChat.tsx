"use client";

import React, { useEffect, useState } from "react";
import { useConversation } from "@11labs/react";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

import { sendToMakeWebhook } from "@/lib/sendToMakeWebhook";

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

  const conversation = useConversation({
    onConnect: () => console.log("✅ Connected to ElevenLabs"),
    onDisconnect: () => console.log("❌ Disconnected"),
    onMessage: (message: VoiceMessage) => {
      console.log("Received message:", message);
      if (message.source === "user") {
        setUserMessages((prev) => [...prev, message.message]);
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
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!
      });
    } catch (error) {
      setErrorMessage("Failed to start conversation or get mic access");
      console.error("Start error:", error);
    }
  };

  const handleEndConversation = async () => {
    try {
      await conversation.endSession();

      if (sessionId) {
        await sendToMakeWebhook(userMessages, username, sessionId);
        setUserMessages([]);
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
