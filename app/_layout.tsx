import "../global.css";

import { Ionicons } from "@expo/vector-icons";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";
import {
  initPushNotifications,
  teardownPushNotifications,
} from "@/services/push/notificationHandlers";

const SITE_URL = "https://kkazu-tt.github.io/brainchill";
const SITE_TITLE = "BrainChill — 脳疲労を整えるアプリ";
const SITE_DESCRIPTION =
  "脳疲労を見える化して、整える習慣を続けるためのアプリ。サウナ・睡眠・運動を記録し、AIチャットで日々のリカバリーをサポートします。";
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const APPLE_TOUCH_ICON = "/brainchill/apple-touch-icon.png";

function SiteHead() {
  return (
    <Head>
      <title>{SITE_TITLE}</title>
      <meta name="description" content={SITE_DESCRIPTION} />
      <meta name="theme-color" content="#1A1D21" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="BrainChill" />
      <link rel="apple-touch-icon" sizes="180x180" href={APPLE_TOUCH_ICON} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="BrainChill" />
      <meta property="og:title" content={SITE_TITLE} />
      <meta property="og:description" content={SITE_DESCRIPTION} />
      <meta property="og:url" content={SITE_URL} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="ja_JP" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={SITE_TITLE} />
      <meta name="twitter:description" content={SITE_DESCRIPTION} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Head>
  );
}

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
      {Platform.OS === "web" ? <SiteHead /> : null}
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
