import { useAppStore } from "@/store/useAppStore";
import type {
  AIRecommendation,
  BrainFatigueScore,
  TrendPoint,
  WearableSnapshot,
} from "@/types";

export interface DashboardData {
  score: BrainFatigueScore;
  snapshot: WearableSnapshot;
  recommendation: AIRecommendation;
  trend: TrendPoint[];
  completeRecommendation: (id: string) => void;
  isLoading: boolean;
}

/**
 * Read-side façade for the dashboard. All state lives in the global
 * Zustand store; this hook shapes it for the screen and keeps the
 * components reactive to changes from the chat / push notification
 * pipelines without them needing to know the store exists.
 */
export function useDashboardData(): DashboardData {
  const score = useAppStore((s) => s.score);
  const snapshot = useAppStore((s) => s.snapshot);
  const recommendation = useAppStore((s) => s.recommendation);
  const trend = useAppStore((s) => s.trend);
  const completeRecommendation = useAppStore((s) => s.completeRecommendation);

  return {
    score,
    snapshot,
    recommendation,
    trend,
    completeRecommendation,
    isLoading: false,
  };
}
