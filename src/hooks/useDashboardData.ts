import { useCallback, useState } from "react";

import {
  mockRecommendation,
  mockScore,
  mockSnapshot,
  mockTrend,
} from "@/features/dashboard/data/mockData";
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
 * Single source for dashboard data. Backed by hard-coded mocks today;
 * in Phase 2+ this will compose:
 *   - HealthKit / Google Fit (snapshot, trend)
 *   - LLM inference service (score.llm, recommendation)
 *   - Zustand store (read-side, blended score)
 *
 * Keeping this seam in place lets the screen and feature components
 * stay agnostic of where the data actually comes from.
 */
export function useDashboardData(): DashboardData {
  const [recommendation, setRecommendation] =
    useState<AIRecommendation>(mockRecommendation);

  const completeRecommendation = useCallback((id: string) => {
    setRecommendation((prev) =>
      prev.id === id ? { ...prev, completed: true } : prev,
    );
  }, []);

  return {
    score: mockScore,
    snapshot: mockSnapshot,
    recommendation,
    trend: mockTrend,
    completeRecommendation,
    isLoading: false,
  };
}
