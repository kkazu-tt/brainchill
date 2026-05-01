import { uid } from "@/utils/id";
import type {
  ChatMessage,
  LLMInferenceResult,
  WearableSnapshot,
} from "@/types";

/**
 * Mock LLM that mimics what the eventual real inference endpoint will
 * produce. Keyword scoring is intentionally crude — the contract
 * (input shape + JSON-shaped result) is what we want to lock in here
 * so the swap to a real provider is mechanical.
 */

interface FatigueLexicon {
  pattern: RegExp;
  /** delta added to a baseline of 50 — positive = more fatigued */
  delta: number;
  confidenceBoost: number;
}

const LEXICON: FatigueLexicon[] = [
  // strong fatigue signals
  { pattern: /疲れた|しんどい|ぐったり|頭痛|だるい|重い/, delta: 22, confidenceBoost: 0.2 },
  { pattern: /ぼーっと|集中できない|頭が回らない|ミスが多い/, delta: 20, confidenceBoost: 0.18 },
  { pattern: /眠い|睡眠不足|寝不足|徹夜/, delta: 18, confidenceBoost: 0.15 },
  { pattern: /会議|打ち合わせ|連続|続き|タスク多い|忙し/, delta: 12, confidenceBoost: 0.1 },
  { pattern: /ストレス|プレッシャー|焦り|不安/, delta: 14, confidenceBoost: 0.12 },

  // recovery signals
  { pattern: /スッキリ|整った|軽い|快調|元気/, delta: -22, confidenceBoost: 0.2 },
  { pattern: /よく眠れた|ぐっすり|快眠/, delta: -18, confidenceBoost: 0.18 },
  { pattern: /サウナ|水風呂|ととのっ/, delta: -16, confidenceBoost: 0.18 },
  { pattern: /運動した|散歩|ストレッチ|ヨガ/, delta: -10, confidenceBoost: 0.12 },
];

interface InferenceInput {
  userMessage: string;
  history?: ChatMessage[];
  wearable?: WearableSnapshot | null;
}

const recommendationFor = (score: number): string => {
  if (score >= 80)
    return "深い休息が必要なサインです。今夜は早めに就寝し、明朝は静かなウォームアップから始めましょう。";
  if (score >= 65)
    return "夕方〜夜にかけて短時間のサウナ・水風呂のセッションが整いを促します。";
  if (score >= 45)
    return "5 分の呼吸法と軽いストレッチで自律神経をリセットしてみましょう。";
  if (score >= 25)
    return "コンディション良好。深い集中作業や創造的なタスクに向いています。";
  return "とても整っています。新しい挑戦やトレーニングに最適なタイミングです。";
};

/**
 * Resolve a fatigue score from natural language.
 *
 * Returns a Promise so the call-site can already await it the way the
 * real LLM client will be invoked.
 */
export async function inferFatigueFromText(
  input: InferenceInput,
): Promise<LLMInferenceResult> {
  // simulate network latency so the typing indicator has something to do
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));

  const text = input.userMessage;
  let score = 50;
  let confidence = 0.45;

  for (const item of LEXICON) {
    if (item.pattern.test(text)) {
      score += item.delta;
      confidence += item.confidenceBoost;
    }
  }

  // wearable context nudges the score toward its own reading
  if (input.wearable) {
    const wearableProxy =
      100 -
      Math.min(
        100,
        input.wearable.hrvMs * 0.6 +
          (input.wearable.sleep.score - 50) * 0.4,
      );
    score = score * 0.7 + wearableProxy * 0.3;
    confidence += 0.15;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  confidence = Math.max(0, Math.min(1, Number(confidence.toFixed(2))));

  return {
    id: uid("llm"),
    fatigueScore: score,
    confidence,
    recommendation: recommendationFor(score),
    createdAt: new Date().toISOString(),
  };
}
