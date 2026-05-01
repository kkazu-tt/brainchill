/**
 * Wearable / biometric data shapes.
 *
 * These mirror the eventual HealthKit / Google Fit payloads so we can
 * swap the mock provider for a real one without touching consumers.
 */

export interface SleepData {
  /** total sleep in minutes */
  totalMinutes: number;
  /** ratio of deep sleep over total (0..1) */
  deepRatio: number;
  /** subjective 0..100 score derived from duration + deep ratio */
  score: number;
}

export interface WearableSnapshot {
  /** ISO timestamp of the snapshot */
  capturedAt: string;
  /** Heart Rate Variability in milliseconds */
  hrvMs: number;
  /** Resting Heart Rate in bpm */
  restingHeartRateBpm: number;
  sleep: SleepData;
}

export interface WearableProvider {
  getLatestSnapshot(): Promise<WearableSnapshot>;
  /** historical series for trend visualisation */
  getHistory(days: number): Promise<WearableSnapshot[]>;
}
