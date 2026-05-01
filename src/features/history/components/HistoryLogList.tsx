import { Ionicons } from "@expo/vector-icons";
import { Fragment } from "react";
import { Text, View } from "react-native";

import { colors } from "@/constants/theme";
import type { MoodTag, UserLog, UserLogSource } from "@/types";

import type { LogGroup } from "../data/historySelectors";

interface HistoryLogListProps {
  groups: LogGroup[];
}

export function HistoryLogList({ groups }: HistoryLogListProps) {
  if (groups.length === 0) {
    return (
      <View className="bg-surface rounded-card border border-border px-5 py-8 items-center">
        <Ionicons name="leaf-outline" size={28} color={colors.textMuted} />
        <Text className="text-text-secondary text-sm mt-3 text-center">
          まだ記録がありません
        </Text>
        <Text className="text-text-muted text-xs mt-1 text-center">
          チャットや通知のクイック返信から最初の一言を残してみましょう
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {groups.map((group) => (
        <View key={group.date} className="gap-2">
          <Text className="text-text-secondary text-xs uppercase tracking-widest">
            {formatDateHeading(group.date)}
          </Text>
          <View className="bg-surface rounded-card border border-border overflow-hidden">
            {group.logs.map((log, idx) => (
              <Fragment key={log.id}>
                {idx > 0 && (
                  <View className="h-px bg-border ml-12" />
                )}
                <LogRow log={log} />
              </Fragment>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function LogRow({ log }: { log: UserLog }) {
  const meta = sourceMeta(log.source);
  const time = formatTime(log.createdAt);

  const body = log.text
    ? log.text
    : log.moodTag
      ? moodTagLabel(log.moodTag)
      : "(no content)";

  return (
    <View className="flex-row gap-3 px-4 py-3 items-start">
      <View
        className="w-8 h-8 rounded-pill items-center justify-center"
        style={{ backgroundColor: meta.bg }}
      >
        <Ionicons name={meta.icon} size={14} color={meta.color} />
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-text-secondary text-[10px] uppercase tracking-widest">
            {meta.label}
          </Text>
          <Text className="text-text-muted text-[10px]">{time}</Text>
        </View>
        <Text className="text-text-primary text-sm leading-5" numberOfLines={4}>
          {body}
        </Text>
        {log.parsedSaunaReport?.isSaunaReport && (
          <View className="flex-row gap-2 mt-1 flex-wrap">
            {log.parsedSaunaReport.saunaMinutes != null && (
              <Chip text={`サウナ ${log.parsedSaunaReport.saunaMinutes}分`} />
            )}
            {log.parsedSaunaReport.coldBathMinutes != null && (
              <Chip text={`水風呂 ${log.parsedSaunaReport.coldBathMinutes}分`} />
            )}
            {log.parsedSaunaReport.sets != null && (
              <Chip text={`${log.parsedSaunaReport.sets}セット`} />
            )}
            <Chip text={`回復 +${log.parsedSaunaReport.inferredFatigueRecovery}`} />
          </View>
        )}
      </View>
    </View>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View className="px-2 py-0.5 rounded-pill bg-base border border-border">
      <Text className="text-text-secondary text-[10px] font-semibold">
        {text}
      </Text>
    </View>
  );
}

const sourceMeta = (
  source: UserLogSource,
): {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
} => {
  switch (source) {
    case "chat":
      return {
        icon: "chatbubble-ellipses-outline",
        label: "Chat",
        color: colors.teal,
        bg: "rgba(42,183,202,0.16)",
      };
    case "push":
      return {
        icon: "notifications-outline",
        label: "Push",
        color: colors.sauna,
        bg: "rgba(255,140,66,0.18)",
      };
    case "manual":
      return {
        icon: "create-outline",
        label: "Manual",
        color: colors.textSecondary,
        bg: "rgba(166,173,180,0.18)",
      };
  }
};

const moodTagLabel = (tag: MoodTag): string => {
  switch (tag) {
    case "fresh":
      return "スッキリしている";
    case "slightly_heavy":
      return "少し重い";
    case "very_tired":
      return "かなり疲れている";
  }
};

const formatDateHeading = (iso: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  const diff = Math.round((today.getTime() - target.getTime()) / 86_400_000);
  if (diff === 0) return `今日 · ${iso}`;
  if (diff === 1) return `昨日 · ${iso}`;
  if (diff > 0 && diff < 7) return `${diff}日前 · ${iso}`;
  return iso;
};

const formatTime = (isoTs: string): string => {
  const d = new Date(isoTs);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
