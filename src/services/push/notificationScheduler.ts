import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { FATIGUE_CHECK_CATEGORY } from "./notificationCategories";

/**
 * Daily fatigue check-in scheduler.
 *
 * One stable identifier so re-arming on app launch (or when the user
 * changes the time) replaces the previous schedule instead of
 * stacking duplicates.
 */

export const DAILY_FATIGUE_CHECK_ID = "daily-fatigue-check";

const NOTIFICATION_TITLE = "脳疲労セルフチェック";
const NOTIFICATION_BODY = "今のコンディションを一言で教えてください。";

export type SchedulingPlatform = "native" | "web";

export const schedulingPlatform = (): SchedulingPlatform =>
  Platform.OS === "web" ? "web" : "native";

/**
 * Ensures we have permission to fire local notifications. Idempotent:
 * the first call may prompt, subsequent calls just read the existing
 * grant.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (schedulingPlatform() === "web") return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const next = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return next.granted;
}

export async function cancelDailyFatigueCheck(): Promise<void> {
  if (schedulingPlatform() === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(
      DAILY_FATIGUE_CHECK_ID,
    );
  } catch {
    // already cancelled or never scheduled — nothing to do
  }
}

/**
 * Schedule (or reschedule) the daily fatigue check at the given local time.
 * Returns true if the schedule was placed, false if the platform or
 * permissions blocked it.
 */
export async function scheduleDailyFatigueCheck(
  hour: number,
  minute: number,
): Promise<boolean> {
  if (schedulingPlatform() === "web") return false;

  const granted = await ensureNotificationPermission();
  if (!granted) return false;

  await cancelDailyFatigueCheck();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_FATIGUE_CHECK_ID,
    content: {
      title: NOTIFICATION_TITLE,
      body: NOTIFICATION_BODY,
      categoryIdentifier: FATIGUE_CHECK_CATEGORY,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return true;
}
