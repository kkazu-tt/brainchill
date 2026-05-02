import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Platform,
  Pressable,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";

import { colors } from "@/constants/theme";

interface ChatInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

// Temporary build marker — lets us verify which build the browser is
// actually loading when the chat send appears unresponsive.
const BUILD_TAG = "chat-input-2026-05-02-b";

export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !disabled;

  if (typeof window !== "undefined" && !(window as { __bcLoggedTag?: boolean }).__bcLoggedTag) {
    (window as { __bcLoggedTag?: boolean }).__bcLoggedTag = true;
    console.log("[ChatInputBar] build", BUILD_TAG);
  }

  const handleSend = () => {
    console.log("[ChatInputBar] send tapped", { canSend, len: value.length, disabled });
    if (!canSend) return;
    onSend(value);
    setValue("");
  };

  // multiline TextInput on web is a <textarea> where Enter inserts a
  // newline by default — intercept it so plain Enter submits and
  // Shift+Enter still adds a newline (standard chat-app convention).
  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (Platform.OS !== "web") return;
    const native = e.nativeEvent as unknown as {
      key?: string;
      shiftKey?: boolean;
      preventDefault?: () => void;
    };
    if (native.key === "Enter" && !native.shiftKey) {
      native.preventDefault?.();
      handleSend();
    }
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
          onKeyPress={handleKeyPress}
          submitBehavior="blurAndSubmit"
          style={{
            color: colors.textPrimary,
            // 16px keeps iOS Safari from auto-zooming the page on focus.
            // Anything smaller triggers the zoom in PWA standalone mode.
            fontSize: 16,
            lineHeight: 22,
            maxHeight: 100,
            minHeight: 22,
          }}
        />
      </View>

      {Platform.OS === "web" ? (
        // Plain <button> sidesteps react-native-web Pressable quirks
        // (mousedown/blur ordering with the multiline textarea) that
        // were swallowing the click in PWA + desktop Safari.
        <button
          type="button"
          aria-label="送信"
          onClick={handleSend}
          disabled={!canSend}
          style={{
            width: 44,
            height: 44,
            borderRadius: 9999,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: canSend ? "pointer" : "default",
            touchAction: "manipulation",
            userSelect: "none",
            backgroundColor: canSend ? colors.sauna : colors.border,
            padding: 0,
          }}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={canSend ? colors.base : colors.textMuted}
          />
        </button>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="送信"
          onPress={handleSend}
          disabled={!canSend}
          hitSlop={12}
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
      )}
    </View>
  );
}
