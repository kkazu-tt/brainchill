import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  mockRecommendation,
  mockScore,
  mockSnapshot,
  mockTrend,
} from "@/features/dashboard/data/mockData";
import { runInference, type InferenceProvider } from "@/services/ai/inference";
import { parseSaunaLog } from "@/services/ai/saunaLogParser";
import type { FatigueQuickReply } from "@/services/push/notificationCategories";
import type {
  AIRecommendation,
  BrainFatigueScore,
  ChatMessage,
  LLMInferenceResult,
  TrendPoint,
  UserLog,
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
  /** unified log of every user signal (chat + push + manual) */
  userLogs: UserLog[];
  /** typing indicator while the LLM is "thinking" */
  isAssistantTyping: boolean;
  /** Gemini API key, BYOK — null until the user enters one */
  geminiApiKey: string | null;
  /** which provider produced the last inference, drives the chat badge */
  lastInferenceProvider: InferenceProvider | null;

  // ---- actions ----
  completeRecommendation: (id: string) => void;
  /** push a user message and trigger an LLM inference */
  sendUserMessage: (text: string) => Promise<void>;
  /** record an interactive notification quick-reply tap */
  recordPushReply: (reply: FatigueQuickReply) => void;
  /** apply a fresh LLM inference: blends into the score and refreshes the recommendation */
  applyLLMInference: (result: LLMInferenceResult) => void;
  /** persist (or clear) the user's Gemini API key */
  setGeminiApiKey: (key: string | null) => void;
  /** test helper to clear persisted state */
  reset: () => void;
}

const seedAssistantMessage = (): ChatMessage => ({
  id: uid("msg"),
  role: "assistant",
  content:
    "こんにちは。今日のコンディションを教えてください。眠気・集中・気分など、どんな短い言葉でも構いません。",
  createdAt: new Date().toISOString(),
});

const initialState = (): Omit<
  AppState,
  | "completeRecommendation"
  | "sendUserMessage"
  | "recordPushReply"
  | "applyLLMInference"
  | "setGeminiApiKey"
  | "reset"
> => ({
  score: mockScore,
  snapshot: mockSnapshot,
  trend: mockTrend,
  recommendation: mockRecommendation,
  chat: [seedAssistantMessage()],
  userLogs: [],
  isAssistantTyping: false,
  geminiApiKey: null,
  lastInferenceProvider: null,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState(),

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

        // Try to lift a structured sauna report out of the message —
        // boosts the trend even if the LLM doesn't pick it up explicitly.
        const sauna = parseSaunaLog(trimmed);

        const log: UserLog = {
          id: uid("log"),
          source: "chat",
          createdAt: userMsg.createdAt,
          text: trimmed,
          moodTag: null,
          parsedSaunaReport: sauna.isSaunaReport ? sauna : null,
        };

        set((state) => ({
          chat: [...state.chat, userMsg],
          userLogs: [...state.userLogs, log],
          isAssistantTyping: true,
          trend: sauna.isSaunaReport
            ? incrementTodaySaunaVisit(state.trend)
            : state.trend,
        }));

        try {
          const { result, provider } = await runInference({
            userMessage: trimmed,
            history: get().chat,
            wearable: get().snapshot,
            apiKey: get().geminiApiKey,
          });

          // sauna report: pull the score down by the inferred recovery
          const adjustedFatigue = sauna.isSaunaReport
            ? Math.max(0, result.fatigueScore - sauna.inferredFatigueRecovery)
            : result.fatigueScore;
          const adjusted: LLMInferenceResult = sauna.isSaunaReport
            ? { ...result, fatigueScore: adjustedFatigue }
            : result;

          get().applyLLMInference(adjusted);

          const assistantMsg: ChatMessage = {
            id: uid("msg"),
            role: "assistant",
            content: adjusted.recommendation,
            createdAt: new Date().toISOString(),
            inferenceId: adjusted.id,
          };
          set((state) => ({
            chat: [...state.chat, assistantMsg],
            isAssistantTyping: false,
            lastInferenceProvider: provider,
          }));
        } catch {
          set({ isAssistantTyping: false });
        }
      },

      setGeminiApiKey: (key) =>
        set({ geminiApiKey: key && key.trim() ? key.trim() : null }),

      recordPushReply: (reply) => {
        const now = new Date().toISOString();
        const log: UserLog = {
          id: uid("log"),
          source: "push",
          createdAt: now,
          text: null,
          moodTag: reply.tag,
          parsedSaunaReport: null,
        };

        const result: LLMInferenceResult = {
          id: uid("llm"),
          fatigueScore: reply.impliedFatigue,
          confidence: reply.confidence,
          recommendation: recommendationForPushReply(reply.tag),
          createdAt: now,
        };

        set((state) => ({ userLogs: [...state.userLogs, log] }));
        get().applyLLMInference(result);
      },

      reset: () => set(initialState()),
    }),
    {
      name: "brainchill_store_v1",
      storage: createJSONStorage(() => AsyncStorage),
      // transient UI state should never be hydrated
      partialize: (state) => ({
        score: state.score,
        snapshot: state.snapshot,
        trend: state.trend,
        recommendation: state.recommendation,
        chat: state.chat,
        userLogs: state.userLogs,
        geminiApiKey: state.geminiApiKey,
      }),
      version: 1,
    },
  ),
);

function pickCategory(score: number): AIRecommendation["category"] {
  if (score >= 70) return "sauna";
  if (score >= 50) return "meditation";
  if (score >= 30) return "movement";
  return "rest";
}

function recommendationForPushReply(tag: FatigueQuickReply["tag"]): string {
  switch (tag) {
    case "fresh":
      return "良い状態です。深い集中作業や運動に向いています。";
    case "slightly_heavy":
      return "短い休憩か 5 分の呼吸法でリセットしましょう。";
    case "very_tired":
      return "夕方の短時間サウナで自律神経を整えるのが効果的です。";
  }
}

function updateTodayInTrend(trend: TrendPoint[], fatigue: number): TrendPoint[] {
  if (trend.length === 0) return trend;
  const last = trend[trend.length - 1]!;
  return [...trend.slice(0, -1), { ...last, fatigue }];
}

function incrementTodaySaunaVisit(trend: TrendPoint[]): TrendPoint[] {
  if (trend.length === 0) return trend;
  const last = trend[trend.length - 1]!;
  return [
    ...trend.slice(0, -1),
    { ...last, saunaVisits: last.saunaVisits + 1 },
  ];
}
