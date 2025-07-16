// lib/scoreMessages.ts
export async function scoreMessage(text: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer YOUR_GROQ_API_KEY`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "system",
          content: "Score this English sentence on grammar, fluency, vocabulary. Return JSON only."
        },
        {
          role: "user",
          content: text
        }
      ]
    })
  });

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}
