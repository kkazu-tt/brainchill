import { Platform } from "react-native";

import type { WearableSnapshot } from "@/types";

/**
 * Wearable data source.
 *
 * Today: a variance-injected mock that approximates real-world drift —
 * HRV/RHR random-walk around a baseline, sleep score follows a
 * morning-good / evening-tired curve. This keeps the dashboard
 * meaningful without a native build.
 *
 * Native swap path:
 *   - iOS:     `react-native-health` (HealthKit) — read HRV (SDNN),
 *              RestingHeartRate, SleepAnalysis. Add the config plugin
 *              to app.json and `NSHealthShareUsageDescription` to
 *              Info.plist via the plugin's options.
 *   - Android: `react-native-health-connect` — read HeartRateVariability,
 *              RestingHeartRate, SleepSession.
 *   - Both require `expo prebuild` + EAS Build (Expo Go does not bundle
 *              HealthKit / Health Connect). Once installed, replace
 *              `fetchSnapshot` with a Platform.OS branch that calls the
 *              respective lib; the public shape stays the same.
 */

export type HealthSource = "mock" | "healthkit" | "health-connect";

export interface HealthSnapshotResult {
  snapshot: WearableSnapshot;
  source: HealthSource;
}

const BASELINE = {
  hrvMs: 65,
  restingHeartRateBpm: 58,
  sleepTotalMinutes: 7 * 60 + 12,
  sleepDeepRatio: 0.22,
  sleepScoreMorning: 82,
};

const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, n));

const wobble = (amp: number): number => (Math.random() - 0.5) * 2 * amp;

const sleepScoreForHour = (hour: number): number => {
  // Best after waking, decays through the day, low in late evening.
  if (hour < 6) return BASELINE.sleepScoreMorning - 4;
  if (hour < 11) return BASELINE.sleepScoreMorning;
  if (hour < 16) return BASELINE.sleepScoreMorning - 6;
  if (hour < 20) return BASELINE.sleepScoreMorning - 12;
  return BASELINE.sleepScoreMorning - 18;
};

const fetchMockSnapshot = (): WearableSnapshot => {
  const now = new Date();
  const hour = now.getHours();
  const baseScore = sleepScoreForHour(hour);
  return {
    capturedAt: now.toISOString(),
    hrvMs: Math.round(clamp(BASELINE.hrvMs + wobble(8), 30, 120)),
    restingHeartRateBpm: Math.round(
      clamp(BASELINE.restingHeartRateBpm + wobble(4), 45, 90),
    ),
    sleep: {
      totalMinutes: BASELINE.sleepTotalMinutes,
      deepRatio: Number(
        clamp(BASELINE.sleepDeepRatio + wobble(0.05), 0.1, 0.4).toFixed(3),
      ),
      score: Math.round(clamp(baseScore + wobble(3), 0, 100)),
    },
  };
};

export async function fetchSnapshot(): Promise<HealthSnapshotResult> {
  // The native HealthKit / Health Connect implementations slot in here
  // when the libs are added; until then, every platform uses the mock.
  if (Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web") {
    return { snapshot: fetchMockSnapshot(), source: "mock" };
  }
  return { snapshot: fetchMockSnapshot(), source: "mock" };
}

export const healthSourceLabel = (source: HealthSource): string => {
  switch (source) {
    case "healthkit":
      return "HealthKit";
    case "health-connect":
      return "Health Connect";
    case "mock":
      return "モック (シミュレーション)";
  }
};
