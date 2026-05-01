import "../global.css";

import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";
import {
  initPushNotifications,
  teardownPushNotifications,
} from "@/services/push/notificationHandlers";

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.base,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.sauna,
  },
};

export default function RootLayout() {
  useEffect(() => {
    void initPushNotifications();
    return teardownPushNotifications;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.base }}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
