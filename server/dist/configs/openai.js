import OpenAI from "openai";
const openaiPrimary = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const openaiFallback = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});
function shouldFallbackToOpenRouter(error) {
    const status = error?.status ??
        error?.response?.status ??
        error?.code;
    if (typeof status === "number") {
        if (status === 429)
            return true;
        if (status >= 500 && status < 600)
            return true;
    }
    return false;
}
export async function createChatCompletionWithFallback(messages) {
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
    }
    catch (error) {
        if (!shouldFallbackToOpenRouter(error)) {
            throw error;
        }
        const status = error?.status ?? error?.code;
        console.warn("[AI] Falling back to OpenRouter due to OpenAI error:", status ?? error?.message);
        return await openaiFallback.chat.completions.create({
            model: fallbackModel,
            messages,
        });
    }
}
