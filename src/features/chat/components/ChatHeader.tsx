import { Text, View } from "react-native";

import { useAppStore } from "@/store/useAppStore";

export function ChatHeader() {
  const score = useAppStore((s) => s.score.total);

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
    </View>
  );
}
