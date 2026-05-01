import type {
  ChatMessage,
  LLMInferenceResult,
  WearableSnapshot,
} from "@/types";
import { uid } from "@/utils/id";

import { SYSTEM_PROMPT } from "./promptTemplates";

/**
 * Direct REST client for Gemini 2.0 Flash.
 *
 * No SDK on purpose: avoids the Node-only deps that ship with the
 * official @google/generative-ai package, which break Expo's web
 * bundle. The contract here mirrors the mock so the inference router
 * can pick one transparently.
 */

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface GeminiInferenceInput {
  userMessage: string;
  history?: ChatMessage[];
  wearable?: WearableSnapshot | null;
  apiKey: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string; status?: string };
}

interface GeminiStructuredResult {
  fatigueScore: number;
  confidence: number;
  recommendation: string;
}

const wearableSummary = (w: WearableSnapshot | null | undefined): string => {
  if (!w) return "ウェアラブルデータなし";
  return (
    `HRV ${w.hrvMs}ms, RHR ${w.restingHeartRateBpm}bpm, ` +
    `Sleep ${w.sleep.score}/100 (deep ${Math.round(w.sleep.deepRatio * 100)}%)`
  );
};

export async function inferFatigueWithGemini(
  input: GeminiInferenceInput,
): Promise<LLMInferenceResult> {
  const history = (input.history ?? []).filter((m) => m.role !== "system");

  const body = {
    systemInstruction: {
      parts: [
        { text: SYSTEM_PROMPT },
        { text: `[現在のバイオシグナル] ${wearableSummary(input.wearable)}` },
      ],
    },
    contents: [
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: input.userMessage }] },
    ],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          fatigueScore: { type: "NUMBER" },
          confidence: { type: "NUMBER" },
          recommendation: { type: "STRING" },
        },
        required: ["fatigueScore", "confidence", "recommendation"],
      },
    },
  };

  const url = `${ENDPOINT}?key=${encodeURIComponent(input.apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    throw new Error(
      `Gemini request failed (${res.status}): ${json.error?.message ?? "unknown error"}`,
    );
  }

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no text content");
  }

  const parsed = JSON.parse(text) as GeminiStructuredResult;

  const fatigueScore = clamp(Math.round(Number(parsed.fatigueScore)), 0, 100);
  const confidence = Number(
    clamp(Number(parsed.confidence), 0, 1).toFixed(2),
  );

  return {
    id: uid("llm"),
    fatigueScore,
    confidence,
    recommendation: parsed.recommendation.trim(),
    createdAt: new Date().toISOString(),
  };
}

const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
