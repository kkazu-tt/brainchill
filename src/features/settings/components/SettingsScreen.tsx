import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";

const GEMINI_KEY_URL = "https://aistudio.google.com/app/apikey";

const TIME_PRESETS: ReadonlyArray<{ hour: number; minute: number; label: string }> = [
  { hour: 7, minute: 0, label: "07:00" },
  { hour: 9, minute: 0, label: "09:00" },
  { hour: 12, minute: 0, label: "12:00" },
  { hour: 15, minute: 0, label: "15:00" },
  { hour: 18, minute: 0, label: "18:00" },
  { hour: 21, minute: 0, label: "21:00" },
];

const formatTime = (h: number, m: number): string =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

export function SettingsScreen() {
  const router = useRouter();
  const storedKey = useAppStore((s) => s.geminiApiKey);
  const setGeminiApiKey = useAppStore((s) => s.setGeminiApiKey);
  const provider = useAppStore((s) => s.lastInferenceProvider);

  const notifications = useAppStore((s) => s.notifications);
  const setDailyNotificationEnabled = useAppStore(
    (s) => s.setDailyNotificationEnabled,
  );
  const setDailyNotificationTime = useAppStore(
    (s) => s.setDailyNotificationTime,
  );

  const [draft, setDraft] = useState(storedKey ?? "");
  const [revealed, setRevealed] = useState(false);

  const isWeb = Platform.OS === "web";

  const dirty = (draft.trim() || null) !== (storedKey ?? null);

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  const save = () => {
    setGeminiApiKey(draft);
    close();
  };

  const clear = () => {
    const wipe = () => {
      setGeminiApiKey(null);
      setDraft("");
    };
    if (Platform.OS === "web") {
      // RN's Alert.alert no-ops on web; use native confirm there.
      if (window.confirm("APIキーを削除しますか？")) wipe();
    } else {
      Alert.alert(
        "APIキーを削除",
        "保存済みのGemini APIキーを削除します。",
        [
          { text: "キャンセル", style: "cancel" },
          { text: "削除", style: "destructive", onPress: wipe },
        ],
      );
    }
  };

  const openKeyConsole = () => {
    void Linking.openURL(GEMINI_KEY_URL);
  };

  return (
    <SafeAreaView className="flex-1 bg-base" edges={["top", "left", "right"]}>
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text className="text-text-primary text-lg font-bold">設定</Text>
        <Pressable
          onPress={save}
          disabled={!dirty}
          accessibilityRole="button"
          className={`px-3 py-1.5 rounded-pill ${dirty ? "bg-sauna" : "bg-surface border border-border"}`}
        >
          <Text
            className={`text-sm font-semibold ${dirty ? "text-base" : "text-text-muted"}`}
          >
            保存
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 py-6 gap-6">
        <View className="gap-2">
          <Text className="text-text-secondary text-xs uppercase tracking-widest">
            AI プロバイダー
          </Text>
          <View className="bg-surface rounded-card border border-border p-4 flex-row items-center gap-3">
            <View
              className={`w-2.5 h-2.5 rounded-pill ${storedKey ? "bg-success" : "bg-warning"}`}
            />
            <View className="flex-1">
              <Text className="text-text-primary font-semibold">
                {storedKey ? "Gemini 2.0 Flash" : "モック (オフライン)"}
              </Text>
              <Text className="text-text-muted text-xs mt-0.5">
                {storedKey
                  ? "メッセージ送信時に Gemini API を呼び出します"
                  : "APIキー未設定のため、ローカル擬似推論を使用中"}
              </Text>
            </View>
            {provider && (
              <Text className="text-text-muted text-[10px] uppercase tracking-widest">
                last: {provider}
              </Text>
            )}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-text-secondary text-xs uppercase tracking-widest">
            Gemini API キー
          </Text>
          <View className="bg-surface rounded-card border border-border p-4 gap-3">
            <View className="flex-row items-center gap-2">
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="AIza..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!revealed}
                spellCheck={false}
                className="flex-1 text-text-primary text-base bg-base rounded-md px-3 py-2 border border-border"
              />
              <Pressable
                onPress={() => setRevealed((v) => !v)}
                accessibilityLabel={revealed ? "キーを隠す" : "キーを表示"}
                className="w-10 h-10 items-center justify-center rounded-pill bg-base border border-border"
              >
                <Ionicons
                  name={revealed ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <Text className="text-text-muted text-xs leading-5">
              キーは端末のローカルストレージにのみ保存され、サーバーには送信されません。
              ブラウザで開いている場合は localStorage に保存されます。
            </Text>

            <View className="flex-row gap-2">
              <Pressable
                onPress={openKeyConsole}
                className="flex-row items-center gap-1.5 px-3 py-2 rounded-pill bg-base border border-border"
              >
                <Ionicons
                  name="open-outline"
                  size={14}
                  color={colors.teal}
                />
                <Text className="text-teal text-xs font-semibold">
                  Google AI Studio で発行
                </Text>
              </Pressable>
              {storedKey && (
                <Pressable
                  onPress={clear}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-pill bg-base border border-border"
                >
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color={colors.danger}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: colors.danger }}
                  >
                    削除
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-text-secondary text-xs uppercase tracking-widest">
            毎日のセルフチェック
          </Text>
          <View className="bg-surface rounded-card border border-border p-4 gap-4">
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-text-primary font-semibold">
                  日次のリマインダー
                </Text>
                <Text className="text-text-muted text-xs mt-0.5">
                  {isWeb
                    ? "Web版ではOS通知をスケジュールできません。ネイティブ版（iOS / Android）でご利用ください。"
                    : notifications.dailyEnabled
                      ? `毎日 ${formatTime(notifications.hour, notifications.minute)} に通知してクイック返信で記録`
                      : "通知をオンにすると、選んだ時刻に脳疲労チェックを送ります"}
                </Text>
              </View>
              <Switch
                value={notifications.dailyEnabled}
                onValueChange={(v) => {
                  void setDailyNotificationEnabled(v);
                }}
                disabled={isWeb}
                trackColor={{ false: colors.border, true: colors.sauna }}
                thumbColor={notifications.dailyEnabled ? colors.saunaSoft : colors.textMuted}
              />
            </View>

            {notifications.permissionDenied && !isWeb && (
              <View className="flex-row items-start gap-2 px-3 py-2 rounded-md bg-base border border-border">
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.warning}
                />
                <Text className="text-text-muted text-xs flex-1 leading-5">
                  通知の権限が許可されていません。端末の設定アプリから「通知」を有効にしてください。
                </Text>
              </View>
            )}

            <View className="gap-2">
              <Text className="text-text-secondary text-xs">通知時刻</Text>
              <View className="flex-row flex-wrap gap-2">
                {TIME_PRESETS.map((preset) => {
                  const selected =
                    preset.hour === notifications.hour &&
                    preset.minute === notifications.minute;
                  return (
                    <Pressable
                      key={preset.label}
                      disabled={isWeb}
                      onPress={() => {
                        void setDailyNotificationTime(preset.hour, preset.minute);
                      }}
                      className={`px-3 py-1.5 rounded-pill border ${
                        selected
                          ? "bg-sauna border-sauna"
                          : "bg-base border-border"
                      } ${isWeb ? "opacity-50" : ""}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          selected ? "text-base" : "text-text-secondary"
                        }`}
                      >
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-text-secondary text-xs uppercase tracking-widest">
            プライバシー
          </Text>
          <View className="bg-surface rounded-card border border-border p-4">
            <Text className="text-text-muted text-xs leading-5">
              チャット入力は Gemini API へ直接送信されます。Google の利用規約に従って処理される点に留意してください。
              モックモードではすべての推論が端末内で完結します。
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
