import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { colors } from "@/constants/theme";

interface ChatInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend(value);
    setValue("");
  };

  return (
    <View className="flex-row items-end gap-2 px-4 py-3 bg-base border-t border-border">
      <View className="flex-1 bg-surface rounded-card border border-border px-4 py-2.5">
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="今日のコンディションを話す..."
          placeholderTextColor={colors.textMuted}
          multiline
          editable={!disabled}
          onSubmitEditing={handleSend}
          submitBehavior="blurAndSubmit"
          style={{
            color: colors.textPrimary,
            fontSize: 15,
            lineHeight: 20,
            maxHeight: 100,
            minHeight: 20,
          }}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="送信"
        onPress={handleSend}
        disabled={!canSend}
        className={`w-11 h-11 rounded-pill items-center justify-center ${
          canSend ? "bg-sauna active:opacity-80" : "bg-border"
        }`}
      >
        <Ionicons
          name="arrow-up"
          size={20}
          color={canSend ? colors.base : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}
