import { FluencySession } from '@/types/fluency';

export async function sendToMakeWebhook(
  userMessages: string[],
  user: string,
  sessionId: string,
  fluencySession?: FluencySession
) {
  try {
    const response = await fetch("https://hook.eu2.make.com/s0w602blkyce03d6hnmcv8ebr9qvyf6f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user,
        sessionId,
        userMessages,
        fluencySession,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log("✅ Webhook triggered successfully");
  } catch (error) {
    console.error("❌ Failed to trigger webhook:", error);
  }
}
