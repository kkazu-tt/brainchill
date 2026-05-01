import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  mockRecommendation,
  mockScore,
  mockSnapshot,
  mockTrend,
} from "@/features/dashboard/data/mockData";
import { streamGeminiInference } from "@/services/ai/geminiStreamClient";
import { runInference, type InferenceProvider } from "@/services/ai/inference";
import { parseSaunaLog } from "@/services/ai/saunaLogParser";
import {
  fetchSnapshot as fetchHealthSnapshot,
  type HealthSource,
} from "@/services/health/healthService";
import {
  generateWeeklySummary,
  type WeeklySummary,
} from "@/services/ai/weeklySummary";
import {
  cancelDailyFatigueCheck,
  scheduleDailyFatigueCheck,
} from "@/services/push/notificationScheduler";
import {
  findQuickReply,
  type FatigueQuickReply,
} from "@/services/push/notificationCategories";
import type {
  AIRecommendation,
  BrainFatigueScore,
  ChatMessage,
  InferenceFeedback,
  InferenceFeedbackEntry,
  LLMInferenceResult,
  MoodTag,
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
  /**
   * 👍/👎 labels keyed by inferenceId. Drives the training-signal
   * export so the user can later fine-tune accuracy on their own data.
   */
  inferenceFeedback: Record<string, InferenceFeedbackEntry>;
  /** typing indicator while the LLM is "thinking" */
  isAssistantTyping: boolean;
  /** Gemini API key, BYOK — null until the user enters one */
  geminiApiKey: string | null;
  /** which provider produced the last inference, drives the chat badge */
  lastInferenceProvider: InferenceProvider | null;
  /** cached weekly recap shown on the History screen — null until generated */
  weeklySummary: WeeklySummary | null;
  /** in-flight indicator for the weekly recap call */
  isGeneratingWeeklySummary: boolean;
  /** which provider supplied the most recent wearable snapshot */
  lastHealthSource: HealthSource;
  /** in-flight indicator for the wearable refresh */
  isRefreshingSnapshot: boolean;
  /** daily fatigue check-in: enabled toggle + local time of day */
  notifications: {
    dailyEnabled: boolean;
    hour: number;
    minute: number;
    /** false when the OS denied permission; UI shows guidance */
    permissionDenied: boolean;
  };

  // ---- actions ----
  completeRecommendation: (id: string) => void;
  /** push a user message and trigger an LLM inference */
  sendUserMessage: (text: string) => Promise<void>;
  /** record an interactive notification quick-reply tap */
  recordPushReply: (reply: FatigueQuickReply) => void;
  /** add a manually-entered log (mood chip, free text, or both) */
  addManualLog: (input: { text?: string | null; moodTag?: MoodTag | null }) => void;
  /** apply a fresh LLM inference: blends into the score and refreshes the recommendation */
  applyLLMInference: (result: LLMInferenceResult) => void;
  /** label a past inference 👍/👎 (toggles off when the same value is tapped again) */
  setInferenceFeedback: (inferenceId: string, value: InferenceFeedback) => void;
  /** persist (or clear) the user's Gemini API key */
  setGeminiApiKey: (key: string | null) => void;
  /** generate (or refresh) the weekly recap card on the History screen */
  refreshWeeklySummary: () => Promise<void>;
  /** pull a fresh wearable snapshot (HealthKit / Health Connect / mock) */
  refreshWearableSnapshot: () => Promise<void>;
  /** toggle the daily fatigue check-in; schedules or cancels the OS notification */
  setDailyNotificationEnabled: (enabled: boolean) => Promise<void>;
  /** change the time of day for the daily fatigue check-in */
  setDailyNotificationTime: (hour: number, minute: number) => Promise<void>;
  /** re-arm the OS schedule on app launch from persisted settings */
  rehydrateNotifications: () => Promise<void>;
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
  | "addManualLog"
  | "applyLLMInference"
  | "setInferenceFeedback"
  | "setGeminiApiKey"
  | "refreshWeeklySummary"
  | "refreshWearableSnapshot"
  | "setDailyNotificationEnabled"
  | "setDailyNotificationTime"
  | "rehydrateNotifications"
  | "reset"
> => ({
  score: mockScore,
  snapshot: mockSnapshot,
  trend: mockTrend,
  recommendation: mockRecommendation,
  chat: [seedAssistantMessage()],
  userLogs: [],
  inferenceFeedback: {},
  isAssistantTyping: false,
  geminiApiKey: null,
  lastInferenceProvider: null,
  weeklySummary: null,
  isGeneratingWeeklySummary: false,
  lastHealthSource: "mock",
  isRefreshingSnapshot: false,
  notifications: {
    dailyEnabled: false,
    hour: 9,
    minute: 0,
    permissionDenied: false,
  },
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      completeRecommendation: (id) => {
        const state = get();
        const rec = state.recommendation;
        if (rec.id !== id || rec.completed) return;

        const now = new Date().toISOString();
        const log: UserLog = {
          id: uid("log"),
          source: "manual",
          createdAt: now,
          text: completionLogText(rec.category, rec.message),
          moodTag: null,
          parsedSaunaReport: null,
        };

        set((s) => ({
          recommendation: { ...s.recommendation, completed: true },
          userLogs: [...s.userLogs, log],
          trend:
            rec.category === "sauna"
              ? incrementTodaySaunaVisit(s.trend)
              : s.trend,
        }));
      },

      setInferenceFeedback: (inferenceId, value) => {
        set((state) => {
          const existing = state.inferenceFeedback[inferenceId];
          // Tapping the same button twice clears the label.
          if (existing?.value === value) {
            const { [inferenceId]: _removed, ...rest } = state.inferenceFeedback;
            return { inferenceFeedback: rest };
          }
          return {
            inferenceFeedback: {
              ...state.inferenceFeedback,
              [inferenceId]: { value, setAt: new Date().toISOString() },
            },
          };
        });
      },

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

        const apiKey = get().geminiApiKey;
        const adjustFatigue = (raw: number): number =>
          sauna.isSaunaReport
            ? Math.max(0, raw - sauna.inferredFatigueRecovery)
            : raw;

        if (apiKey) {
          const placeholderId = uid("msg");
          let placeholderInserted = false;
          const ensurePlaceholder = () => {
            if (placeholderInserted) return;
            placeholderInserted = true;
            const placeholder: ChatMessage = {
              id: placeholderId,
              role: "assistant",
              content: "",
              createdAt: new Date().toISOString(),
              isStreaming: true,
            };
            set((state) => ({
              chat: [...state.chat, placeholder],
              isAssistantTyping: false,
            }));
          };

          try {
            for await (const event of streamGeminiInference({
              userMessage: trimmed,
              history: get().chat,
              wearable: get().snapshot,
              apiKey,
            })) {
              if (event.type === "delta") {
                ensurePlaceholder();
                set((state) => ({
                  chat: state.chat.map((m) =>
                    m.id === placeholderId
                      ? { ...m, content: event.recommendation }
                      : m,
                  ),
                }));
              } else {
                ensurePlaceholder();
                const adjusted: LLMInferenceResult = {
                  ...event.result,
                  fatigueScore: adjustFatigue(event.result.fatigueScore),
                };
                get().applyLLMInference(adjusted);
                set((state) => ({
                  chat: state.chat.map((m) =>
                    m.id === placeholderId
                      ? {
                          ...m,
                          content: adjusted.recommendation,
                          inferenceId: adjusted.id,
                          isStreaming: false,
                        }
                      : m,
                  ),
                  lastInferenceProvider: "gemini",
                }));
              }
            }
          } catch (err) {
            console.warn("[chat] Gemini stream failed, falling back:", err);
            set((state) => ({
              chat: state.chat.filter((m) => m.id !== placeholderId),
              isAssistantTyping: true,
            }));
            // fall through to mock path below
          }

          if (placeholderInserted && get().chat.some((m) => m.id === placeholderId)) {
            return;
          }
        }

        try {
          const { result, provider } = await runInference({
            userMessage: trimmed,
            history: get().chat,
            wearable: get().snapshot,
            apiKey: null,
          });
          const adjusted: LLMInferenceResult = {
            ...result,
            fatigueScore: adjustFatigue(result.fatigueScore),
          };
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

      refreshWeeklySummary: async () => {
        if (get().isGeneratingWeeklySummary) return;
        set({ isGeneratingWeeklySummary: true });
        try {
          const summary = await generateWeeklySummary({
            trend: get().trend,
            logs: get().userLogs,
            apiKey: get().geminiApiKey,
          });
          set({ weeklySummary: summary, isGeneratingWeeklySummary: false });
        } catch (err) {
          console.warn("[weeklySummary] generation failed:", err);
          set({ isGeneratingWeeklySummary: false });
        }
      },

      refreshWearableSnapshot: async () => {
        if (get().isRefreshingSnapshot) return;
        set({ isRefreshingSnapshot: true });
        try {
          const { snapshot, source } = await fetchHealthSnapshot();
          set({
            snapshot,
            lastHealthSource: source,
            isRefreshingSnapshot: false,
          });
        } catch (err) {
          console.warn("[health] snapshot refresh failed:", err);
          set({ isRefreshingSnapshot: false });
        }
      },

      setDailyNotificationEnabled: async (enabled) => {
        const { hour, minute } = get().notifications;
        if (enabled) {
          const ok = await scheduleDailyFatigueCheck(hour, minute);
          set((state) => ({
            notifications: {
              ...state.notifications,
              dailyEnabled: ok,
              permissionDenied: !ok,
            },
          }));
        } else {
          await cancelDailyFatigueCheck();
          set((state) => ({
            notifications: {
              ...state.notifications,
              dailyEnabled: false,
              permissionDenied: false,
            },
          }));
        }
      },

      setDailyNotificationTime: async (hour, minute) => {
        const wasEnabled = get().notifications.dailyEnabled;
        set((state) => ({
          notifications: { ...state.notifications, hour, minute },
        }));
        if (wasEnabled) {
          const ok = await scheduleDailyFatigueCheck(hour, minute);
          set((state) => ({
            notifications: {
              ...state.notifications,
              dailyEnabled: ok,
              permissionDenied: !ok,
            },
          }));
        }
      },

      rehydrateNotifications: async () => {
        const { dailyEnabled, hour, minute } = get().notifications;
        if (!dailyEnabled) return;
        const ok = await scheduleDailyFatigueCheck(hour, minute);
        if (!ok) {
          set((state) => ({
            notifications: {
              ...state.notifications,
              dailyEnabled: false,
              permissionDenied: true,
            },
          }));
        }
      },

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

      addManualLog: ({ text, moodTag }) => {
        const trimmed = text?.trim() || null;
        const tag = moodTag ?? null;
        if (!trimmed && !tag) return;

        const now = new Date().toISOString();
        const sauna = trimmed ? parseSaunaLog(trimmed) : null;

        const log: UserLog = {
          id: uid("log"),
          source: "manual",
          createdAt: now,
          text: trimmed,
          moodTag: tag,
          parsedSaunaReport: sauna?.isSaunaReport ? sauna : null,
        };

        set((state) => ({
          userLogs: [...state.userLogs, log],
          trend: sauna?.isSaunaReport
            ? incrementTodaySaunaVisit(state.trend)
            : state.trend,
        }));

        // Mood tag carries an implied fatigue reading — reuse the same
        // mapping the push quick replies do.
        if (tag) {
          const reply = findQuickReply(tag);
          if (reply) {
            const adjusted = sauna?.isSaunaReport
              ? Math.max(0, reply.impliedFatigue - sauna.inferredFatigueRecovery)
              : reply.impliedFatigue;
            get().applyLLMInference({
              id: uid("llm"),
              fatigueScore: adjusted,
              confidence: reply.confidence,
              recommendation: recommendationForPushReply(reply.tag),
              createdAt: now,
            });
          }
        }
      },

      reset: () => {
        void cancelDailyFatigueCheck();
        set(initialState());
      },
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
        chat: state.chat.map(({ isStreaming: _ignored, ...rest }) => rest),
        userLogs: state.userLogs,
        inferenceFeedback: state.inferenceFeedback,
        geminiApiKey: state.geminiApiKey,
        notifications: state.notifications,
        weeklySummary: state.weeklySummary,
        lastHealthSource: state.lastHealthSource,
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

function completionLogText(
  category: AIRecommendation["category"],
  message: string,
): string {
  switch (category) {
    case "sauna":
      return `サウナを完了 — ${message}`;
    case "meditation":
      return `瞑想を実施 — ${message}`;
    case "rest":
      return `休息を実施 — ${message}`;
    case "movement":
      return `軽い運動を実施 — ${message}`;
    case "hydration":
      return `水分補給 — ${message}`;
  }
}

function incrementTodaySaunaVisit(trend: TrendPoint[]): TrendPoint[] {
  if (trend.length === 0) return trend;
  const last = trend[trend.length - 1]!;
  return [
    ...trend.slice(0, -1),
    { ...last, saunaVisits: last.saunaVisits + 1 },
  ];
}
