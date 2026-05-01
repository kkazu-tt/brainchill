import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { colors } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";

import {
  buildSaunaSummary,
  buildWeekStats,
  groupLogsByDay,
} from "../data/historySelectors";
import { HistoryLogList } from "./HistoryLogList";
import { HistoryStatsCards } from "./HistoryStatsCards";

export function HistoryScreen() {
  const router = useRouter();
  const trend = useAppStore((s) => s.trend);
  const userLogs = useAppStore((s) => s.userLogs);

  const { weekStats, saunaSummary, groups } = useMemo(
    () => ({
      weekStats: buildWeekStats(trend, userLogs),
      saunaSummary: buildSaunaSummary(userLogs),
      groups: groupLogsByDay(userLogs),
    }),
    [trend, userLogs],
  );

  const bestDay = weekStats.bestDay;

  return (
    <ScreenContainer>
      <View className="pt-3 flex-row items-end justify-between">
        <View>
          <Text className="text-text-secondary text-xs tracking-widest uppercase">
            History
          </Text>
          <Text className="text-text-primary text-3xl font-bold tracking-tight mt-0.5">
            記録ハイライト
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/log" as Href)}
          accessibilityRole="button"
          accessibilityLabel="記録を追加"
          className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-pill bg-sauna"
        >
          <Ionicons name="add" size={16} color={colors.base} />
          <Text className="text-base text-xs font-semibold">記録</Text>
        </Pressable>
      </View>

      <HistoryStatsCards
        weekStats={weekStats}
        saunaSummary={saunaSummary}
      />

      {bestDay && (
        <View className="bg-surface rounded-card border border-border p-4 gap-1">
          <Text className="text-text-secondary text-xs uppercase tracking-widest">
            ベストコンディション
          </Text>
          <View className="flex-row items-baseline gap-2 mt-1">
            <Text className="text-teal text-2xl font-bold tracking-tight">
              {bestDay.fatigue}
            </Text>
            <Text className="text-text-muted text-xs">
              / 100 — {bestDay.date}
            </Text>
          </View>
          <Text className="text-text-muted text-xs leading-5">
            この週で最も整っていた日です。直前の生活パターンを振り返ると再現しやすくなります。
          </Text>
        </View>
      )}

      <View className="gap-2">
        <Text className="text-text-secondary text-xs uppercase tracking-widest">
          ログ
        </Text>
        <HistoryLogList groups={groups} />
      </View>
    </ScreenContainer>
  );
}
