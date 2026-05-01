import type {
  AIRecommendation,
  BrainFatigueScore,
  ChatMessage,
  InferenceFeedbackEntry,
  TrendPoint,
  UserLog,
  WearableSnapshot,
} from "@/types";
import type { WeeklySummary } from "@/services/ai/weeklySummary";

export interface ExportPayload {
  /**
   * v2 added `inferenceFeedback`: a map of inferenceId → 👍/👎 label
   * collected from the chat UI. Older v1 exports lack this field.
   */
  schemaVersion: 2;
  exportedAt: string;
  score: BrainFatigueScore;
  snapshot: WearableSnapshot;
  trend: TrendPoint[];
  recommendation: AIRecommendation;
  chat: ChatMessage[];
  userLogs: UserLog[];
  inferenceFeedback: Record<string, InferenceFeedbackEntry>;
  weeklySummary: WeeklySummary | null;
}

interface SourceState {
  score: BrainFatigueScore;
  snapshot: WearableSnapshot;
  trend: TrendPoint[];
  recommendation: AIRecommendation;
  chat: ChatMessage[];
  userLogs: UserLog[];
  inferenceFeedback: Record<string, InferenceFeedbackEntry>;
  weeklySummary: WeeklySummary | null;
}

export const buildExportPayload = (state: SourceState): ExportPayload => ({
  schemaVersion: 2,
  exportedAt: new Date().toISOString(),
  score: state.score,
  snapshot: state.snapshot,
  trend: state.trend,
  recommendation: state.recommendation,
  chat: state.chat,
  userLogs: state.userLogs,
  inferenceFeedback: state.inferenceFeedback,
  weeklySummary: state.weeklySummary,
});

export const exportPayloadToJSON = (payload: ExportPayload): string =>
  JSON.stringify(payload, null, 2);

export const exportFileName = (date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `brainchill-${yyyy}${mm}${dd}-${hh}${mi}.json`;
};
