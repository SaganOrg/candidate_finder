import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function embedText(text) {
  const input = text?.trim() || "general";

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input
  });

  return response.data[0].embedding;
}