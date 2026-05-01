import { Text, View } from "react-native";

import type { ChatMessage } from "@/types";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

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
        </Text>
      </View>
      <Text className="text-text-muted text-[10px] mt-1 px-1">
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
}
