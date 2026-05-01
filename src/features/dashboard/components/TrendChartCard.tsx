import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { LineChart, type LineChartPoint } from "@/components/ui/LineChart";
import type { TrendPoint } from "@/types";

interface TrendChartCardProps {
  trend: TrendPoint[];
}

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  // single-letter weekday so 7 fits comfortably
  return ["S", "M", "T", "W", "T", "F", "S"][d.getDay()] ?? "";
};

export function TrendChartCard({ trend }: TrendChartCardProps) {
  const chartData: LineChartPoint[] = trend.map((p) => ({
    label: dayLabel(p.date),
    primary: p.fatigue,
    secondary: p.saunaVisits,
  }));

  return (
    <Card className="px-5 py-5">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-text-secondary text-xs uppercase tracking-wider">
            Past 7 days
          </Text>
          <Text className="text-text-primary text-base font-semibold mt-0.5">
            脳疲労 × サウナ訪問
          </Text>
        </View>
      </View>
      <LineChart data={chartData} />
    </Card>
  );
}
