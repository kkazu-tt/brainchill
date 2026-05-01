import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";
import type { ChatMessage, InferenceFeedback } from "@/types";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

function StreamingCursor() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.Text style={{ opacity }}>▍</Animated.Text>;
}

interface FeedbackButtonsProps {
  inferenceId: string;
}

function FeedbackButtons({ inferenceId }: FeedbackButtonsProps) {
  const current = useAppStore((s) => s.inferenceFeedback[inferenceId]?.value);
  const setInferenceFeedback = useAppStore((s) => s.setInferenceFeedback);

  const renderButton = (value: InferenceFeedback, icon: keyof typeof Ionicons.glyphMap, label: string) => {
    const active = current === value;
    return (
      <Pressable
        onPress={() => setInferenceFeedback(inferenceId, value)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
        className={`flex-row items-center gap-1 px-2.5 py-1 rounded-pill border ${
          active ? "bg-sauna border-sauna" : "bg-surface border-border"
        }`}
      >
        <Ionicons
          name={icon}
          size={12}
          color={active ? colors.base : colors.textMuted}
        />
        <Text
          className={`text-[11px] font-semibold ${active ? "text-base" : "text-text-muted"}`}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="flex-row items-center gap-1.5 mt-1.5 px-1">
      {renderButton("helpful", "thumbs-up-outline", "役立った")}
      {renderButton("off", "thumbs-down-outline", "ズレてた")}
    </View>
  );
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const showCursor = message.isStreaming;
  const showFeedback =
    !isUser && !message.isStreaming && Boolean(message.inferenceId);

  return (
    <View className={`w-full mb-3 ${isUser ? "items-end" : "items-start"}`}>
      <View
        className={`px-4 py-3 rounded-card max-w-[85%] ${
          isUser
            ? "bg-sauna rounded-br-md"
            : "bg-surface border border-border rounded-bl-md"
        }`}
      >
        <Text
          className={`text-[15px] leading-[22px] ${
            isUser ? "text-base" : "text-text-primary"
          }`}
        >
          {message.content}
          {showCursor ? <StreamingCursor /> : null}
        </Text>
      </View>
      <Text className="text-text-muted text-[10px] mt-1 px-1">
        {formatTime(message.createdAt)}
      </Text>
      {showFeedback && message.inferenceId ? (
        <FeedbackButtons inferenceId={message.inferenceId} />
      ) : null}
    </View>
  );
}
