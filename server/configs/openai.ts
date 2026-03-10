import OpenAI from "openai";

const openaiPrimary = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const openaiFallback = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

function shouldFallbackToOpenRouter(error: unknown): boolean {
  const status =
    (error as { status?: number })?.status ??
    (error as { response?: { status?: number } })?.response?.status ??
    (error as { code?: number })?.code;

  if (typeof status === "number") {
    if (status === 429) return true;
    if (status >= 500 && status < 600) return true;
  }

  return false;
}

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export async function createChatCompletionWithFallback(messages: ChatMessage[]) {
  const primaryModel = process.env.OPENAI_MODEL;
  const fallbackModel = process.env.OPENROUTER_MODEL;

  if (!primaryModel) {
    throw new Error("OPENAI_MODEL is not set");
  }
  if (!fallbackModel) {
    throw new Error("OPENROUTER_MODEL is not set");
  }

  try {
    return await openaiPrimary.chat.completions.create({
      model: primaryModel,
      messages,
    });
  } catch (error: unknown) {
    if (!shouldFallbackToOpenRouter(error)) {
      throw error;
    }

    const status = (error as { status?: number })?.status ?? (error as { code?: number })?.code;
    console.warn(
      "[AI] Falling back to OpenRouter due to OpenAI error:",
      status ?? (error as Error)?.message
    );

    return await openaiFallback.chat.completions.create({
      model: fallbackModel,
      messages,
    });
  }
}
