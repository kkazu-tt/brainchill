import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";

export function ChatHeader() {
  const router = useRouter();
  const score = useAppStore((s) => s.score.total);
  const hasKey = useAppStore((s) => Boolean(s.geminiApiKey));

  const badgeText = hasKey ? "Gemini" : "Mock";
  const badgeDot = hasKey ? "bg-success" : "bg-warning";

  return (
    <View className="px-5 py-4 border-b border-border bg-base">
      <Text className="text-text-secondary text-xs uppercase tracking-widest">
        AI Assistant
      </Text>
      <View className="flex-row items-baseline justify-between mt-1">
        <Text className="text-text-primary text-2xl font-bold tracking-tight">
          BrainChill Coach
        </Text>
        <View className="flex-row items-baseline gap-1.5">
          <Text className="text-text-secondary text-xs">現在のスコア</Text>
          <Text className="text-sauna text-lg font-bold">{score}</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between mt-2">
        <Pressable
          onPress={() => router.push("/settings" as Href)}
          accessibilityRole="button"
          accessibilityLabel="AIプロバイダー設定"
          className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface border border-border"
        >
          <View className={`w-1.5 h-1.5 rounded-pill ${badgeDot}`} />
          <Text className="text-text-secondary text-[10px] font-semibold uppercase tracking-widest">
            {badgeText}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={12}
            color={colors.textMuted}
          />
        </Pressable>
        {!hasKey && (
          <Text className="text-text-muted text-[10px]">
            APIキー未設定 — モック推論中
          </Text>
        )}
      </View>
    </View>
  );
}
