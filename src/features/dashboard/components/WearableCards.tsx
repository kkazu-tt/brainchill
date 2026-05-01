import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { colors } from "@/constants/theme";
import type { WearableSnapshot } from "@/types";

interface WearableCardsProps {
  snapshot: WearableSnapshot;
}

interface MetricProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}

function Metric({ icon, iconColor, label, value, unit, hint }: MetricProps) {
  return (
    <Card className="flex-1 px-4 py-4">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-7 h-7 rounded-pill bg-base items-center justify-center">
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
        <Text className="text-text-secondary text-xs uppercase tracking-wider">
          {label}
        </Text>
      </View>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-text-primary text-2xl font-bold">{value}</Text>
        {unit ? (
          <Text className="text-text-muted text-sm">{unit}</Text>
        ) : null}
      </View>
      {hint ? (
        <Text className="text-text-muted text-xs mt-1">{hint}</Text>
      ) : null}
    </Card>
  );
}

export function WearableCards({ snapshot }: WearableCardsProps) {
  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <Metric
          icon="moon-outline"
          iconColor={colors.teal}
          label="Sleep Score"
          value={`${snapshot.sleep.score}`}
          unit="%"
          hint={`${Math.round(snapshot.sleep.totalMinutes / 60)}h ${snapshot.sleep.totalMinutes % 60}m`}
        />
        <Metric
          icon="pulse-outline"
          iconColor={colors.sauna}
          label="HRV"
          value={`${snapshot.hrvMs}`}
          unit="ms"
          hint="自律神経バランス"
        />
      </View>
      <View className="flex-row gap-3">
        <Metric
          icon="heart-outline"
          iconColor={colors.tealSoft}
          label="Resting HR"
          value={`${snapshot.restingHeartRateBpm}`}
          unit="bpm"
        />
        <Metric
          icon="bed-outline"
          iconColor={colors.saunaSoft}
          label="Deep Sleep"
          value={`${Math.round(snapshot.sleep.deepRatio * 100)}`}
          unit="%"
          hint="深睡眠の割合"
        />
      </View>
    </View>
  );
}
