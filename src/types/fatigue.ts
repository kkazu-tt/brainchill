/**
 * Brain fatigue score domain.
 *
 * The final score is a weighted blend of:
 *   - wearable-derived component (HRV, RHR, sleep)
 *   - LLM inference component (chat / push notification replies)
 *
 * Confidence travels alongside each component so the blender can
 * down-weight noisy signals.
 */

export interface ScoreComponent {
  /** 0..100, higher = more fatigued */
  value: number;
  /** 0..1 */
  confidence: number;
  /** ISO timestamp */
  computedAt: string;
}

export interface BrainFatigueScore {
  /** blended 0..100 */
  total: number;
  wearable: ScoreComponent | null;
  llm: ScoreComponent | null;
  /** ISO timestamp of the blend */
  updatedAt: string;
}

export interface TrendPoint {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  fatigue: number;
  saunaVisits: number;
}
