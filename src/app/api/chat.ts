import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: Request) {
  try {
    const { message } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ reply: text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ reply: "AI error." }), {
      status: 500,
    });
  }
}
