import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

import { normalizeShapedAsk, type ShapedAsk } from "./ask-shaper.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const shapedAskSchema = z.object({
  title: z.string(),
  category: z.string(),
  minutes: z.number(),
});

function parseFallback(text: string): ShapedAsk | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const normalized = normalizeShapedAsk(parsed);
    return normalized.title ? normalized : null;
  } catch {
    return null;
  }
}

export async function shapeAskWithAi(description: string): Promise<ShapedAsk> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Lovable AI is not configured for this project.");

  const openai = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

  const result = streamText({
    model: openai.responses(MODEL),
    output: Output.object({ schema: shapedAskSchema }),
    system:
      "You shape neighbour-to-neighbour help requests for Kindred. Preserve the resident's meaning. Return a clear, friendly, action-led title; one category from carry, collect, checkin, company, pets; and a realistic duration of 10, 15, 20, or 30 minutes. Never invent a person, flat number, access instruction, contact detail, deadline, or location. Keep the title under 120 characters. If the request cannot be safely completed in 30 minutes, describe only one useful first step that can.",
    prompt: `Resident's description:\n${description}`,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  try {
    const output = await result.output;
    const normalized = normalizeShapedAsk(output);
    if (!normalized.title) throw new Error("Lovable AI did not return a usable request.");
    return normalized;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      const fallback = parseFallback(error.text);
      if (fallback) return fallback;
    }
    throw error;
  }
}
