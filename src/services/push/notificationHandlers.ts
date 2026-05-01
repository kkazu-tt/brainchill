import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { useAppStore } from "@/store/useAppStore";

import {
  FATIGUE_CHECK_CATEGORY,
  findQuickReply,
  registerNotificationCategories,
} from "./notificationCategories";

/**
 * Boot the push notification surface.
 *
 * For Phase 1 we register categories and wire the response listener;
 * actual FCM token registration / scheduled delivery is deferred until
 * the backend exists. Keeping the handler in place now means swapping
 * in a real provider later does not require touching the store.
 */

let unsubscribe: (() => void) | null = null;

export async function initPushNotifications(): Promise<void> {
  if (Platform.OS === "web") return;

  await registerNotificationCategories();

  // make foreground deliveries visible while the app is open
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // tear down a previous listener if hot-reloaded
  unsubscribe?.();
  const sub = Notifications.addNotificationResponseReceivedListener((event) => {
    const category = event.notification.request.content.categoryIdentifier;
    if (category !== FATIGUE_CHECK_CATEGORY) return;

    const reply = findQuickReply(event.actionIdentifier);
    if (!reply) return;

    useAppStore.getState().recordPushReply(reply);
  });
  unsubscribe = () => sub.remove();
}

export function teardownPushNotifications(): void {
  unsubscribe?.();
  unsubscribe = null;
}
