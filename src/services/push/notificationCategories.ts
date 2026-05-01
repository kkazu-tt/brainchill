import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { MoodTag } from "@/types";

/**
 * Single source of truth for the interactive notification surface.
 *
 * iOS: registered via Notifications.setNotificationCategoryAsync.
 * Android: identical action ids are emitted from the local notification
 * payload so the same handler covers both platforms.
 */

export const FATIGUE_CHECK_CATEGORY = "fatigue_check";

export interface FatigueQuickReply {
  /** identifier sent back when the user taps the action */
  id: string;
  /** UI label shown on the notification button */
  title: string;
  /** structured tag we persist into the unified user log */
  tag: MoodTag;
  /** subjective fatigue score this tap implies (0..100) */
  impliedFatigue: number;
  /** confidence we attach to that reading */
  confidence: number;
}

export const FATIGUE_QUICK_REPLIES: readonly FatigueQuickReply[] = [
  {
    id: "fresh",
    title: "スッキリ",
    tag: "fresh",
    impliedFatigue: 22,
    confidence: 0.6,
  },
  {
    id: "slightly_heavy",
    title: "少し重い",
    tag: "slightly_heavy",
    impliedFatigue: 55,
    confidence: 0.6,
  },
  {
    id: "very_tired",
    title: "かなり疲れた",
    tag: "very_tired",
    impliedFatigue: 82,
    confidence: 0.65,
  },
] as const;

export async function registerNotificationCategories(): Promise<void> {
  // Web has no native notification categories.
  if (Platform.OS === "web") return;

  await Notifications.setNotificationCategoryAsync(
    FATIGUE_CHECK_CATEGORY,
    FATIGUE_QUICK_REPLIES.map((reply) => ({
      identifier: reply.id,
      buttonTitle: reply.title,
      options: {
        opensAppToForeground: false,
      },
    })),
  );
}

/** lookup helper for the response handler */
export const findQuickReply = (
  id: string,
): FatigueQuickReply | undefined =>
  FATIGUE_QUICK_REPLIES.find((r) => r.id === id);
