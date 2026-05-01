import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";
import { FATIGUE_QUICK_REPLIES } from "@/services/push/notificationCategories";
import { useAppStore } from "@/store/useAppStore";
import type { MoodTag } from "@/types";

const PROMPT_HINTS = [
  "10分サウナ入って2セット整った",
  "夜あまり眠れず頭が重い",
  "30分散歩してきた、すっきり",
];

export function ManualLogScreen() {
  const router = useRouter();
  const addManualLog = useAppStore((s) => s.addManualLog);

  const [text, setText] = useState("");
  const [moodTag, setMoodTag] = useState<MoodTag | null>(null);

  const trimmed = text.trim();
  const canSave = trimmed.length > 0 || moodTag !== null;

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  const save = () => {
    if (!canSave) return;
    addManualLog({ text: trimmed || null, moodTag });
    close();
  };

  return (
    <SafeAreaView className="flex-1 bg-base" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="閉じる"
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text className="text-text-primary text-lg font-bold">記録を追加</Text>
          <Pressable
            onPress={save}
            disabled={!canSave}
            accessibilityRole="button"
            className={`px-3 py-1.5 rounded-pill ${canSave ? "bg-sauna" : "bg-surface border border-border"}`}
          >
            <Text
              className={`text-sm font-semibold ${canSave ? "text-base" : "text-text-muted"}`}
            >
              保存
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="px-5 py-6 gap-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            <Text className="text-text-secondary text-xs uppercase tracking-widest">
              今の状態
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FATIGUE_QUICK_REPLIES.map((reply) => {
                const selected = moodTag === reply.tag;
                return (
                  <Pressable
                    key={reply.id}
                    onPress={() => setMoodTag(selected ? null : reply.tag)}
                    accessibilityRole="button"
                    className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-pill border ${
                      selected
                        ? "bg-sauna border-sauna"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selected ? "text-base" : "text-text-primary"
                      }`}
                    >
                      {reply.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-text-secondary text-xs uppercase tracking-widest">
              メモ (任意)
            </Text>
            <View className="bg-surface rounded-card border border-border p-4 gap-3">
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="例: 10分サウナ入って2セット、よく整った"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                style={{ minHeight: 96, textAlignVertical: "top" }}
                className="text-text-primary text-base bg-base rounded-md px-3 py-2 border border-border"
              />
              <Text className="text-text-muted text-xs leading-5">
                サウナ・水風呂・セット数を含むとトレンドのサウナ訪問数に反映されます。
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-text-secondary text-xs uppercase tracking-widest">
              ヒント
            </Text>
            <View className="bg-surface rounded-card border border-border overflow-hidden">
              {PROMPT_HINTS.map((hint, idx) => (
                <Pressable
                  key={hint}
                  onPress={() => setText(hint)}
                  className={`px-4 py-3 ${idx > 0 ? "border-t border-border" : ""}`}
                >
                  <Text className="text-text-secondary text-sm" numberOfLines={1}>
                    {hint}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
