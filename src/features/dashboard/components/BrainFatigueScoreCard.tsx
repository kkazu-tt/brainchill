import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { CircularProgress } from "@/components/ui/CircularProgress";
import type { BrainFatigueScore } from "@/types";

interface BrainFatigueScoreCardProps {
  score: BrainFatigueScore;
}

const interpretation = (value: number) => {
  if (value < 30) return { label: "とても良い", tone: "text-teal" };
  if (value < 55) return { label: "良好", tone: "text-teal-soft" };
  if (value < 75) return { label: "やや疲労", tone: "text-sauna-soft" };
  return { label: "強い疲労", tone: "text-sauna" };
};

export function BrainFatigueScoreCard({ score }: BrainFatigueScoreCardProps) {
  const meta = interpretation(score.total);

  return (
    <Card className="px-5 py-6 items-center">
      <View className="flex-row items-center gap-2 self-start mb-4">
        <View className="w-1.5 h-4 bg-sauna rounded-pill" />
        <Text className="text-text-secondary text-sm tracking-wider uppercase">
          Brain Fatigue Score
        </Text>
      </View>

      <CircularProgress value={score.total} caption="今日の脳疲労度" />

      <View className="flex-row items-center gap-2 mt-5">
        <Text className={`text-base font-semibold ${meta.tone}`}>
          {meta.label}
        </Text>
        <Text className="text-text-muted text-xs">
          ・更新 {new Date(score.updatedAt).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </Card>
  );
}
