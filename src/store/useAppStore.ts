import { create } from "zustand";

import {
  mockRecommendation,
  mockScore,
  mockSnapshot,
  mockTrend,
} from "@/features/dashboard/data/mockData";
import { inferFatigueFromText } from "@/services/ai/llmInferenceMock";
import type {
  AIRecommendation,
  BrainFatigueScore,
  ChatMessage,
  LLMInferenceResult,
  TrendPoint,
  WearableSnapshot,
} from "@/types";
import { uid } from "@/utils/id";
import { buildScore } from "@/utils/scoreBlender";

interface AppState {
  /** blended fatigue score */
  score: BrainFatigueScore;
  /** latest wearable snapshot (mock today, HealthKit later) */
  snapshot: WearableSnapshot;
  /** rolling 7-day trend used by the dashboard chart */
  trend: TrendPoint[];
  /** current AI recommendation surfaced on the dashboard */
  recommendation: AIRecommendation;
  /** chat history with the AI assistant */
  chat: ChatMessage[];
  /** typing indicator while the LLM is "thinking" */
  isAssistantTyping: boolean;

  // ---- actions ----
  completeRecommendation: (id: string) => void;
  /** push a user message and trigger an LLM inference */
  sendUserMessage: (text: string) => Promise<void>;
  /** apply a fresh LLM inference: blends into the score and refreshes the recommendation */
  applyLLMInference: (result: LLMInferenceResult) => void;
}

const seedAssistantMessage: ChatMessage = {
  id: uid("msg"),
  role: "assistant",
  content:
    "こんにちは。今日のコンディションを教えてください。眠気・集中・気分など、どんな短い言葉でも構いません。",
  createdAt: new Date().toISOString(),
};

export const useAppStore = create<AppState>((set, get) => ({
  score: mockScore,
  snapshot: mockSnapshot,
  trend: mockTrend,
  recommendation: mockRecommendation,
  chat: [seedAssistantMessage],
  isAssistantTyping: false,

  completeRecommendation: (id) =>
    set((state) =>
      state.recommendation.id === id
        ? { recommendation: { ...state.recommendation, completed: true } }
        : state,
    ),

  applyLLMInference: (result) => {
    const prev = get().score;
    const nextScore = buildScore(prev.wearable, {
      value: result.fatigueScore,
      confidence: result.confidence,
      computedAt: result.createdAt,
    });

    set({
      score: nextScore,
      recommendation: {
        id: uid("rec"),
        message: result.recommendation,
        category: pickCategory(result.fatigueScore),
        completed: false,
        createdAt: result.createdAt,
      },
      // reflect today's blended score in the trend so the chart updates live
      trend: updateTodayInTrend(get().trend, nextScore.total),
    });
  },

  sendUserMessage: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      chat: [...state.chat, userMsg],
      isAssistantTyping: true,
    }));

    try {
      const result = await inferFatigueFromText({
        userMessage: trimmed,
        history: get().chat,
        wearable: get().snapshot,
      });

      get().applyLLMInference(result);

      const assistantMsg: ChatMessage = {
        id: uid("msg"),
        role: "assistant",
        content: result.recommendation,
        createdAt: new Date().toISOString(),
        inferenceId: result.id,
      };
      set((state) => ({
        chat: [...state.chat, assistantMsg],
        isAssistantTyping: false,
      }));
    } catch {
      set({ isAssistantTyping: false });
    }
  },
}));

function pickCategory(score: number): AIRecommendation["category"] {
  if (score >= 70) return "sauna";
  if (score >= 50) return "meditation";
  if (score >= 30) return "movement";
  return "rest";
}

function updateTodayInTrend(trend: TrendPoint[], fatigue: number): TrendPoint[] {
  if (trend.length === 0) return trend;
  const last = trend[trend.length - 1]!;
  const updated: TrendPoint = { ...last, fatigue };
  return [...trend.slice(0, -1), updated];
}
