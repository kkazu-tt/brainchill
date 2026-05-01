import type { ParsedSaunaLog } from "@/types";

/**
 * Regex-based extractor for Japanese sauna reports.
 *
 * The eventual real implementation will likely round-trip through the
 * LLM with a structured-output schema. For Phase 1 we keep the
 * contract identical and let pattern matching cover the common shapes
 * (e.g. "10分サウナ入って1分水風呂", "3セットととのった").
 */

const SAUNA_KEYWORDS =
  /サウナ|sauna|スチーム|蒸気|ロウリュ|ととのっ|整っ/i;
const COLD_KEYWORDS = /水風呂|cold ?bath|アイスバス/i;

const minutesNear = (text: string, keyword: RegExp): number | undefined => {
  // tolerate either order: "10分サウナ" or "サウナ10分"
  const before = new RegExp(`(\\d+)\\s*分[^。]{0,8}?(?=${keyword.source})`);
  const after = new RegExp(`${keyword.source}[^。]{0,12}?(\\d+)\\s*分`);
  const match = text.match(before) ?? text.match(after);
  if (!match || !match[1]) return undefined;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : undefined;
};

const setsFrom = (text: string): number | undefined => {
  const m = text.match(/(\d+)\s*セット/);
  if (!m || !m[1]) return undefined;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Conservative recovery estimate. The intent is to cap the LLM mock's
 * fatigue blend with a non-zero floor when a sauna session is reported,
 * not to emit a precise medical figure.
 */
const recoveryScore = (
  saunaMinutes?: number,
  coldMinutes?: number,
  sets?: number,
): number => {
  let base = 0;
  if (saunaMinutes) base += Math.min(40, saunaMinutes * 2.5);
  if (coldMinutes) base += Math.min(20, coldMinutes * 8);
  if (sets) base += Math.min(20, sets * 6);
  if (base === 0 && (saunaMinutes || coldMinutes || sets)) base = 25;
  return Math.round(Math.min(80, base));
};

export function parseSaunaLog(text: string): ParsedSaunaLog {
  const isSaunaReport = SAUNA_KEYWORDS.test(text) || COLD_KEYWORDS.test(text);
  if (!isSaunaReport) {
    return { isSaunaReport: false, inferredFatigueRecovery: 0 };
  }

  const saunaMinutes = minutesNear(text, SAUNA_KEYWORDS);
  const coldBathMinutes = minutesNear(text, COLD_KEYWORDS);
  const sets = setsFrom(text);

  return {
    isSaunaReport: true,
    saunaMinutes,
    coldBathMinutes,
    sets,
    inferredFatigueRecovery: recoveryScore(saunaMinutes, coldBathMinutes, sets),
  };
}
