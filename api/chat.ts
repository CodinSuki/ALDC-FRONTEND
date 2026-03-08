import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ reply: "Method not allowed." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ reply: "Please provide a valid message." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Chat API] GEMINI_API_KEY is not configured in environment variables');
      res.status(500).json({ reply: "Chat service is not configured. Please contact support." });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(message);
    const text = result.response.text();

    res.status(200).json({ reply: text });
  } catch (err: any) {
    console.error('[Chat API] Error generating response:', err);
    
    // Provide more specific error messages based on error type
    if (err?.message?.includes('API key')) {
      res.status(500).json({ reply: "Invalid API key. Please contact support." });
    } else if (err?.message?.includes('quota')) {
      res.status(429).json({ reply: "AI service is temporarily unavailable. Please try again later." });
    } else if (err?.message?.includes('safety')) {
      res.status(400).json({ reply: "Your message was blocked by content filters. Please rephrase your question." });
    } else {
      res.status(500).json({ 
        reply: "Unable to process your request. Please try again or contact support.",
        error: process.env.NODE_ENV === 'development' ? err?.message : undefined
      });
    }
  }
}
