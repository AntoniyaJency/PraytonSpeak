"use client";

import VoiceChat from "@/components/VoiceChat";

export default function Home() {
  return (
    <main className="h-screen w-full flex flex-col items-center justify-center space-y-10">
      <h1 className="text-8xl font-bold ">Prayton Speak</h1>
      <p>Born to Speak with Purpose. Trained by Prayton to Speak with Precision</p>
      <VoiceChat />
    </main>
  );
}

