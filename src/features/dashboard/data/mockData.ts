import type {
  AIRecommendation,
  BrainFatigueScore,
  TrendPoint,
  WearableSnapshot,
} from "@/types";

const isoDaysAgo = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export const mockSnapshot: WearableSnapshot = {
  capturedAt: new Date().toISOString(),
  hrvMs: 65,
  restingHeartRateBpm: 58,
  sleep: {
    totalMinutes: 7 * 60 + 12,
    deepRatio: 0.22,
    score: 82,
  },
};

export const mockScore: BrainFatigueScore = {
  total: 64,
  wearable: {
    value: 60,
    confidence: 0.7,
    computedAt: new Date().toISOString(),
  },
  llm: {
    value: 70,
    confidence: 0.55,
    computedAt: new Date().toISOString(),
  },
  updatedAt: new Date().toISOString(),
};

export const mockRecommendation: AIRecommendation = {
  id: "rec-1",
  message:
    "18:00に瞑想サウナへの訪問をご提案します。自律神経のリセットに効果的です。",
  suggestedTime: "18:00",
  category: "sauna",
  completed: false,
  createdAt: new Date().toISOString(),
};

// past 6 days + today, oldest first
export const mockTrend: TrendPoint[] = [
  { date: isoDaysAgo(6), fatigue: 72, saunaVisits: 0 },
  { date: isoDaysAgo(5), fatigue: 78, saunaVisits: 0 },
  { date: isoDaysAgo(4), fatigue: 55, saunaVisits: 1 },
  { date: isoDaysAgo(3), fatigue: 62, saunaVisits: 0 },
  { date: isoDaysAgo(2), fatigue: 48, saunaVisits: 1 },
  { date: isoDaysAgo(1), fatigue: 70, saunaVisits: 0 },
  { date: isoDaysAgo(0), fatigue: 64, saunaVisits: 0 },
];
