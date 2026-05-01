import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";

export function WeeklySummaryCard() {
  const summary = useAppStore((s) => s.weeklySummary);
  const isLoading = useAppStore((s) => s.isGeneratingWeeklySummary);
  const hasKey = useAppStore((s) => Boolean(s.geminiApiKey));
  const refresh = useAppStore((s) => s.refreshWeeklySummary);

  const onPress = () => {
    void refresh();
  };

  return (
    <View className="bg-surface rounded-card border border-border p-4 gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="sparkles" size={14} color={colors.sauna} />
          <Text className="text-text-secondary text-xs uppercase tracking-widest">
            今週のハイライト
          </Text>
        </View>
        {summary && (
          <View
            className={`flex-row items-center gap-1 px-2 py-0.5 rounded-pill ${
              summary.provider === "gemini"
                ? "bg-base border border-border"
                : "bg-base border border-border"
            }`}
          >
            <View
              className={`w-1.5 h-1.5 rounded-pill ${
                summary.provider === "gemini" ? "bg-success" : "bg-warning"
              }`}
            />
            <Text className="text-text-muted text-[10px] font-semibold uppercase tracking-widest">
              {summary.provider === "gemini" ? "Gemini" : "Local"}
            </Text>
          </View>
        )}
      </View>

      {summary ? (
        <Text className="text-text-primary text-sm leading-6">
          {summary.text}
        </Text>
      ) : isLoading ? (
        <View className="py-2 flex-row items-center gap-2">
          <ActivityIndicator color={colors.sauna} />
          <Text className="text-text-muted text-xs">
            直近 7 日間のデータから振り返りを生成中…
          </Text>
        </View>
      ) : (
        <Text className="text-text-muted text-xs leading-5">
          {hasKey
            ? "Gemini が直近のスコア・サウナ記録・メモから振り返りを生成します。"
            : "APIキーが未設定の場合は端末内でテンプレートから振り返りを生成します。"}
        </Text>
      )}

      <View className="flex-row items-center justify-between">
        {summary ? (
          <Text className="text-text-muted text-[10px]">
            {formatRelative(summary.generatedAt)}
          </Text>
        ) : (
          <View />
        )}
        <Pressable
          onPress={onPress}
          disabled={isLoading}
          accessibilityRole="button"
          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-pill ${
            isLoading ? "bg-surface border border-border" : "bg-sauna"
          }`}
        >
          {!isLoading && (
            <Ionicons
              name={summary ? "refresh" : "sparkles-outline"}
              size={13}
              color={colors.base}
            />
          )}
          <Text
            className={`text-xs font-semibold ${
              isLoading ? "text-text-muted" : "text-base"
            }`}
          >
            {isLoading
              ? "生成中…"
              : summary
                ? "再生成"
                : "今週を振り返る"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const formatRelative = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMin = Math.round((Date.now() - d.getTime()) / 60_000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin} 分前`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 時間前`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} 日前`;
};
