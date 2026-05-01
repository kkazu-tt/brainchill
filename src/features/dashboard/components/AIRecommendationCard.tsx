import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { colors } from "@/constants/theme";
import type { AIRecommendation } from "@/types";

interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  onComplete?: (id: string) => void;
}

const iconFor = (
  category: AIRecommendation["category"],
): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case "sauna":
      return "flame-outline";
    case "meditation":
      return "leaf-outline";
    case "rest":
      return "moon-outline";
    case "movement":
      return "walk-outline";
    case "hydration":
      return "water-outline";
  }
};

export function AIRecommendationCard({
  recommendation,
  onComplete,
}: AIRecommendationCardProps) {
  const isDone = recommendation.completed;
  return (
    <Card className="px-5 py-5">
      <View className="flex-row items-start gap-4">
        <View className="w-12 h-12 rounded-pill bg-base items-center justify-center border border-border">
          <Ionicons
            name={iconFor(recommendation.category)}
            size={22}
            color={colors.sauna}
          />
        </View>

        <View className="flex-1">
          <Text className="text-text-secondary text-xs uppercase tracking-wider">
            AI レコメンド
          </Text>
          <Text className="text-text-primary text-base leading-6 mt-1">
            {recommendation.message}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="完了としてマーク"
        onPress={() => onComplete?.(recommendation.id)}
        disabled={isDone}
        className={`mt-4 self-stretch rounded-pill py-3 items-center ${
          isDone ? "bg-border" : "bg-sauna active:opacity-80"
        }`}
      >
        <Text
          className={`text-sm font-semibold ${
            isDone ? "text-text-muted" : "text-base"
          }`}
        >
          {isDone ? "完了済み" : "完了 (Done)"}
        </Text>
      </Pressable>

      {isDone && (
        <Text className="mt-2 text-text-muted text-[11px] text-center">
          履歴に追加しました
        </Text>
      )}
    </Card>
  );
}
