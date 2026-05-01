import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "@/constants/theme";

import type { SaunaSummary, WeekStats } from "../data/historySelectors";

interface HistoryStatsCardsProps {
  weekStats: WeekStats;
  saunaSummary: SaunaSummary;
}

export function HistoryStatsCards({
  weekStats,
  saunaSummary,
}: HistoryStatsCardsProps) {
  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <StatCard
          icon="pulse"
          color={colors.teal}
          label="平均スコア (7日)"
          value={`${weekStats.averageFatigue}`}
          unit="/100"
        />
        <StatCard
          icon="flame"
          color={colors.sauna}
          label="サウナ訪問"
          value={`${weekStats.totalSaunaVisits}`}
          unit={weekStats.totalSaunaVisits === 1 ? "回" : "回"}
        />
      </View>
      <View className="flex-row gap-3">
        <StatCard
          icon="time"
          color={colors.saunaSoft}
          label="サウナ時間"
          value={`${saunaSummary.totalMinutes}`}
          unit="分"
        />
        <StatCard
          icon="document-text-outline"
          color={colors.tealSoft}
          label="記録"
          value={`${weekStats.totalLogs}`}
          unit="件"
        />
      </View>
    </View>
  );
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: string;
  unit: string;
}

function StatCard({ icon, color, label, value, unit }: StatCardProps) {
  return (
    <View className="flex-1 bg-surface rounded-card border border-border p-4 gap-2">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name={icon} size={14} color={color} />
        <Text className="text-text-muted text-[10px] uppercase tracking-widest">
          {label}
        </Text>
      </View>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-text-primary text-2xl font-bold tracking-tight">
          {value}
        </Text>
        <Text className="text-text-muted text-xs">{unit}</Text>
      </View>
    </View>
  );
}
