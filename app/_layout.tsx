import "../global.css";

import { Ionicons } from "@expo/vector-icons";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
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
  // Preload @expo/vector-icons fonts so tab-bar glyphs render on web
  // before the static export reaches the browser. Without this, the
  // Pages build can paint blank tabs on first load while the font is
  // still streaming.
  const [fontsLoaded] = useFonts(Ionicons.font);

  useEffect(() => {
    void initPushNotifications();
    return teardownPushNotifications;
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.base }}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="settings"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="log"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
