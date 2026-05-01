/**
 * Unified user log schema.
 *
 * Both interactive push notification replies and chat messages flow
 * through this shape so downstream consumers (LLM, score blender,
 * persistence) only need to handle one type.
 */

export type UserLogSource = "push" | "chat" | "manual";

export type MoodTag = "fresh" | "slightly_heavy" | "very_tired";

export interface UserLog {
  id: string;
  source: UserLogSource;
  createdAt: string;
  /** raw natural-language text (chat) or null for tap-only inputs */
  text: string | null;
  /** structured tag (push notification quick reply) */
  moodTag: MoodTag | null;
  /** if the LLM extracted a sauna report from this log */
  parsedSaunaReport: ParsedSaunaLog | null;
}

export interface ParsedSaunaLog {
  isSaunaReport: boolean;
  saunaMinutes?: number;
  coldBathMinutes?: number;
  sets?: number;
  /** estimated 0..100 fatigue recovery from this session */
  inferredFatigueRecovery: number;
}
