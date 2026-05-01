import type { ChatMessage, WearableSnapshot } from "@/types";

/**
 * Centralised prompt scaffolding. The mock inference engine does not
 * actually consume these strings, but keeping them next to the mock
 * means the eventual real LLM client only has to swap implementations
 * — the call-sites stay identical.
 */

export const SYSTEM_PROMPT = `あなたは脳疲労解析の専門家です。
ユーザーの自然言語の発言と、可能であればウェアラブルデバイスのバイオシグナル
(HRV / RHR / 睡眠) を踏まえて、現在の脳疲労度を 0..100 のスコアで推定し、
JSON で返してください。

返答は次のスキーマに厳密に従ってください:
{
  "fatigueScore": number,        // 0 = 完全に整っている, 100 = 強い脳疲労
  "confidence": number,          // 0..1
  "recommendation": string       // 100 文字以内の行動提案
}

スコアを過大評価せず、サウナ・睡眠・運動などの回復行動が報告されている場合は
スコアを引き下げてください。`;

export interface InferenceContext {
  userMessage: string;
  history: ChatMessage[];
  wearable: WearableSnapshot | null;
}

/**
 * Build the full prompt payload that would be shipped to the LLM.
 * Returned shape matches the OpenAI / Anthropic chat-style messages
 * envelope so adapters can pass it straight through.
 */
export function buildInferencePrompt(ctx: InferenceContext) {
  const wearableSummary = ctx.wearable
    ? `HRV ${ctx.wearable.hrvMs}ms, RHR ${ctx.wearable.restingHeartRateBpm}bpm, ` +
      `Sleep ${ctx.wearable.sleep.score}/100 (deep ${Math.round(ctx.wearable.sleep.deepRatio * 100)}%)`
    : "ウェアラブルデータなし";

  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    {
      role: "system" as const,
      content: `[現在のバイオシグナル] ${wearableSummary}`,
    },
    ...ctx.history.map((m) => ({
      role: m.role === "system" ? ("system" as const) : (m.role as "user" | "assistant"),
      content: m.content,
    })),
    { role: "user" as const, content: ctx.userMessage },
  ];
}
