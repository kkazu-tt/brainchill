import type { BrainFatigueScore, ScoreComponent } from "@/types";

/**
 * Confidence-weighted blend of wearable and LLM components.
 *
 * Why a confidence weight: the wearable signal is steady but blind to
 * subjective state, while the LLM signal is rich but noisier and only
 * available after the user speaks. Weighting by confidence lets the
 * stronger signal of the moment dominate without the other one being
 * silently discarded.
 */
export function blendComponents(
  wearable: ScoreComponent | null,
  llm: ScoreComponent | null,
): number {
  if (!wearable && !llm) return 50;
  if (!wearable) return clampScore(llm!.value);
  if (!llm) return clampScore(wearable.value);

  const sum = wearable.confidence + llm.confidence;
  if (sum === 0) return clampScore((wearable.value + llm.value) / 2);

  const blended =
    (wearable.value * wearable.confidence + llm.value * llm.confidence) / sum;
  return clampScore(blended);
}

export function buildScore(
  wearable: ScoreComponent | null,
  llm: ScoreComponent | null,
): BrainFatigueScore {
  return {
    total: Math.round(blendComponents(wearable, llm)),
    wearable,
    llm,
    updatedAt: new Date().toISOString(),
  };
}

const clampScore = (n: number) => Math.max(0, Math.min(100, n));
