import type { TrendPoint, UserLog } from "@/types";
import { uid } from "@/utils/id";

import {
  buildSaunaSummary,
  buildWeekStats,
} from "@/features/history/data/historySelectors";

export type WeeklySummaryProvider = "gemini" | "fallback";

export interface WeeklySummary {
  id: string;
  text: string;
  provider: WeeklySummaryProvider;
  generatedAt: string;
}

interface GenerateInput {
  trend: TrendPoint[];
  logs: UserLog[];
  apiKey: string | null;
}

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `あなたは脳疲労トラッキングアプリの専属コーチです。
直近 7 日間のスコア推移、サウナ訪問、ユーザーの記録を踏まえて、
共感的で具体的な振り返りメッセージを日本語で書いてください。

出力ルール:
- 200 文字以内
- 1〜2 文の所感 + 来週へのアドバイス 1 文
- 数値は丸めて自然な日本語で
- 絵文字や Markdown 記法は使わない`;

const buildContextBlock = (
  trend: TrendPoint[],
  logs: UserLog[],
): string => {
  const stats = buildWeekStats(trend, logs);
  const sauna = buildSaunaSummary(logs);

  const trendLine = trend
    .map((p) => `${p.date} 疲労${p.fatigue} sauna${p.saunaVisits}`)
    .join(", ");

  const moodCounts = logs.reduce<Record<string, number>>((acc, l) => {
    if (l.moodTag) acc[l.moodTag] = (acc[l.moodTag] ?? 0) + 1;
    return acc;
  }, {});

  const moodLine =
    Object.entries(moodCounts)
      .map(([tag, n]) => `${tag}:${n}`)
      .join(" / ") || "気分タグの記録なし";

  const recentTexts = logs
    .filter((l) => l.text)
    .slice(-5)
    .map((l) => `- ${l.text}`)
    .join("\n");

  return [
    `平均疲労: ${stats.averageFatigue}/100`,
    `サウナ: ${sauna.sessionCount} セッション / 計 ${sauna.totalMinutes} 分`,
    `気分タグ: ${moodLine}`,
    `日次推移: ${trendLine}`,
    recentTexts ? `直近メモ:\n${recentTexts}` : "メモなし",
  ].join("\n");
};

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
}

const callGemini = async (
  apiKey: string,
  context: string,
): Promise<string> => {
  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: context }] }],
      generationConfig: { temperature: 0.6 },
    }),
  });

  const json = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    throw new Error(
      `Gemini summary failed (${res.status}): ${json.error?.message ?? "unknown"}`,
    );
  }
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no summary text");
  return text.trim();
};

const fallbackSummary = (trend: TrendPoint[], logs: UserLog[]): string => {
  const stats = buildWeekStats(trend, logs);
  const sauna = buildSaunaSummary(logs);

  const trendDirection = (() => {
    if (trend.length < 2) return "横ばい";
    const head = trend.slice(0, Math.ceil(trend.length / 2));
    const tail = trend.slice(Math.ceil(trend.length / 2));
    const avg = (xs: TrendPoint[]) =>
      xs.reduce((a, p) => a + p.fatigue, 0) / xs.length;
    const diff = avg(tail) - avg(head);
    if (diff <= -5) return "改善傾向";
    if (diff >= 5) return "悪化傾向";
    return "横ばい";
  })();

  const tone =
    stats.averageFatigue >= 65
      ? "やや疲れが溜まっています"
      : stats.averageFatigue >= 45
        ? "ほどよいバランスです"
        : "良いコンディションが続いています";

  const advice =
    sauna.sessionCount === 0
      ? "今週は短時間のサウナや散歩で自律神経をリセットしてみましょう。"
      : sauna.sessionCount >= 3
        ? "回復行動が習慣化できています。睡眠の質も合わせて整えるとさらに伸びます。"
        : "サウナのリズムができてきました。続けると効果が定着します。";

  return `平均疲労 ${stats.averageFatigue}/100、トレンドは${trendDirection}。${tone}。${advice}`;
};

export async function generateWeeklySummary(
  input: GenerateInput,
): Promise<WeeklySummary> {
  const context = buildContextBlock(input.trend, input.logs);

  if (input.apiKey) {
    try {
      const text = await callGemini(input.apiKey, context);
      return {
        id: uid("ws"),
        text,
        provider: "gemini",
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("[weeklySummary] Gemini failed, using fallback:", err);
    }
  }

  return {
    id: uid("ws"),
    text: fallbackSummary(input.trend, input.logs),
    provider: "fallback",
    generatedAt: new Date().toISOString(),
  };
}
