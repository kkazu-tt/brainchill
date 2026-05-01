import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

import type { ChatMessage } from "@/types";

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

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const showCursor = message.isStreaming;

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
    </View>
  );
}
