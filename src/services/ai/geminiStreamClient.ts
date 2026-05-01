import type {
  ChatMessage,
  LLMInferenceResult,
  WearableSnapshot,
} from "@/types";
import { uid } from "@/utils/id";

import { SYSTEM_PROMPT } from "./promptTemplates";

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent";

interface StreamInput {
  userMessage: string;
  history?: ChatMessage[];
  wearable?: WearableSnapshot | null;
  apiKey: string;
}

export type StreamEvent =
  | { type: "delta"; recommendation: string }
  | { type: "final"; result: LLMInferenceResult };

const wearableSummary = (w: WearableSnapshot | null | undefined): string => {
  if (!w) return "ウェアラブルデータなし";
  return (
    `HRV ${w.hrvMs}ms, RHR ${w.restingHeartRateBpm}bpm, ` +
    `Sleep ${w.sleep.score}/100 (deep ${Math.round(w.sleep.deepRatio * 100)}%)`
  );
};

const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));

const extractRecommendation = (acc: string): string | null => {
  const keyIdx = acc.indexOf('"recommendation"');
  if (keyIdx === -1) return null;
  const colonIdx = acc.indexOf(":", keyIdx);
  if (colonIdx === -1) return null;
  let i = colonIdx + 1;
  while (i < acc.length && /\s/.test(acc[i] ?? "")) i++;
  if (acc[i] !== '"') return null;
  i++;
  let out = "";
  while (i < acc.length) {
    const ch = acc[i]!;
    if (ch === "\\") {
      const next = acc[i + 1];
      if (next === undefined) break;
      switch (next) {
        case "n":
          out += "\n";
          break;
        case "t":
          out += "\t";
          break;
        case "r":
          out += "\r";
          break;
        case '"':
          out += '"';
          break;
        case "\\":
          out += "\\";
          break;
        case "/":
          out += "/";
          break;
        case "u": {
          const hex = acc.slice(i + 2, i + 6);
          if (hex.length < 4) return out;
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
          continue;
        }
        default:
          out += next;
      }
      i += 2;
    } else if (ch === '"') {
      return out;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
};

interface GeminiStreamChunk {
  candidates?: {
    content?: { parts?: { text?: string }[] };
  }[];
  error?: { message?: string };
}

export async function* streamGeminiInference(
  input: StreamInput,
): AsyncGenerator<StreamEvent> {
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
          recommendation: { type: "STRING" },
          fatigueScore: { type: "NUMBER" },
          confidence: { type: "NUMBER" },
        },
        required: ["recommendation", "fatigueScore", "confidence"],
      },
    },
  };

  const url = `${ENDPOINT}?alt=sse&key=${encodeURIComponent(input.apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini stream failed (${res.status}): ${errText}`);
  }

  const reader = res.body?.getReader?.();
  if (!reader) {
    throw new Error("Gemini stream: response body reader unavailable");
  }

  const decoder = new TextDecoder("utf-8");
  let sseBuf = "";
  let jsonAcc = "";
  let lastEmitted = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    sseBuf += decoder.decode(value, { stream: true });

    let lineEnd: number;
    while ((lineEnd = sseBuf.indexOf("\n")) !== -1) {
      const line = sseBuf.slice(0, lineEnd).trim();
      sseBuf = sseBuf.slice(lineEnd + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data) continue;
      try {
        const chunk = JSON.parse(data) as GeminiStreamChunk;
        if (chunk.error) {
          throw new Error(chunk.error.message ?? "Gemini stream error");
        }
        const part = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof part === "string") {
          jsonAcc += part;
          const rec = extractRecommendation(jsonAcc);
          if (rec !== null && rec !== lastEmitted) {
            lastEmitted = rec;
            yield { type: "delta", recommendation: rec };
          }
        }
      } catch (err) {
        // Skip malformed SSE rows; surface chunk-level errors.
        if (err instanceof Error && err.message.includes("Gemini stream")) {
          throw err;
        }
      }
    }
  }

  let parsed: {
    recommendation?: string;
    fatigueScore?: number;
    confidence?: number;
  } = {};
  try {
    parsed = JSON.parse(jsonAcc);
  } catch {
    parsed = { recommendation: lastEmitted };
  }

  const fatigueScore = clamp(Math.round(Number(parsed.fatigueScore ?? 50)), 0, 100);
  const confidence = Number(
    clamp(Number(parsed.confidence ?? 0.5), 0, 1).toFixed(2),
  );
  const recommendation = (parsed.recommendation ?? lastEmitted).trim();

  yield {
    type: "final",
    result: {
      id: uid("llm"),
      fatigueScore,
      confidence,
      recommendation,
      createdAt: new Date().toISOString(),
    },
  };
}
