import type { TrendPoint, UserLog } from "@/types";

export interface WeekStats {
  /** rolling 7-day average fatigue, rounded */
  averageFatigue: number;
  /** lowest fatigue day in the trend (best condition) */
  bestDay: TrendPoint | null;
  /** highest fatigue day */
  worstDay: TrendPoint | null;
  /** total sauna visits across the trend window */
  totalSaunaVisits: number;
  /** count of user logs in the trend window */
  totalLogs: number;
}

const isoDay = (iso: string): string => iso.slice(0, 10);

export const buildWeekStats = (
  trend: TrendPoint[],
  logs: UserLog[],
): WeekStats => {
  if (trend.length === 0) {
    return {
      averageFatigue: 0,
      bestDay: null,
      worstDay: null,
      totalSaunaVisits: 0,
      totalLogs: logs.length,
    };
  }

  const fatigueSum = trend.reduce((acc, p) => acc + p.fatigue, 0);
  const totalSaunaVisits = trend.reduce((acc, p) => acc + p.saunaVisits, 0);
  const sortedAsc = [...trend].sort((a, b) => a.fatigue - b.fatigue);

  const earliest = trend.reduce(
    (min, p) => (p.date < min ? p.date : min),
    trend[0]!.date,
  );

  const totalLogs = logs.filter((l) => isoDay(l.createdAt) >= earliest).length;

  return {
    averageFatigue: Math.round(fatigueSum / trend.length),
    bestDay: sortedAsc[0] ?? null,
    worstDay: sortedAsc[sortedAsc.length - 1] ?? null,
    totalSaunaVisits,
    totalLogs,
  };
};

export interface LogGroup {
  /** YYYY-MM-DD */
  date: string;
  logs: UserLog[];
}

/**
 * Group logs by local date, newest day first, newest log first within
 * a day. Pure function so the screen can keep its rendering trivial.
 */
export const groupLogsByDay = (logs: UserLog[]): LogGroup[] => {
  const buckets = new Map<string, UserLog[]>();
  for (const log of logs) {
    const key = isoDay(log.createdAt);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(log);
    } else {
      buckets.set(key, [log]);
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a > b ? -1 : a < b ? 1 : 0))
    .map(([date, dayLogs]) => ({
      date,
      logs: dayLogs.sort((a, b) =>
        a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0,
      ),
    }));
};

export interface SaunaSummary {
  sessionCount: number;
  totalMinutes: number;
}

export const buildSaunaSummary = (logs: UserLog[]): SaunaSummary => {
  const sessions = logs.filter((l) => l.parsedSaunaReport?.isSaunaReport);
  const totalMinutes = sessions.reduce((acc, l) => {
    const sauna = l.parsedSaunaReport?.saunaMinutes ?? 0;
    const cold = l.parsedSaunaReport?.coldBathMinutes ?? 0;
    return acc + sauna + cold;
  }, 0);
  return { sessionCount: sessions.length, totalMinutes };
};
