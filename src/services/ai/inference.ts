import type {
  ChatMessage,
  LLMInferenceResult,
  WearableSnapshot,
} from "@/types";

import { inferFatigueWithGemini } from "./geminiClient";
import { inferFatigueFromText } from "./llmInferenceMock";

export type InferenceProvider = "gemini" | "mock";

export interface InferenceInput {
  userMessage: string;
  history?: ChatMessage[];
  wearable?: WearableSnapshot | null;
  apiKey?: string | null;
}

/**
 * Single entry-point the store calls. Falls back to the mock when no
 * key is configured (so the public web build keeps working) or when
 * the real provider throws — fatigue tracking should never be a hard
 * dependency on the network.
 */
export async function runInference(
  input: InferenceInput,
): Promise<{ result: LLMInferenceResult; provider: InferenceProvider }> {
  if (input.apiKey) {
    try {
      const result = await inferFatigueWithGemini({
        userMessage: input.userMessage,
        history: input.history,
        wearable: input.wearable,
        apiKey: input.apiKey,
      });
      return { result, provider: "gemini" };
    } catch (err) {
      console.warn("[inference] Gemini failed, falling back to mock:", err);
    }
  }

  const result = await inferFatigueFromText({
    userMessage: input.userMessage,
    history: input.history,
    wearable: input.wearable,
  });
  return { result, provider: "mock" };
}
