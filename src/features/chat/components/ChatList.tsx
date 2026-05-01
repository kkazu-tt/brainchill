import { useEffect, useRef } from "react";
import { FlatList, View } from "react-native";

import type { ChatMessage } from "@/types";

import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatTypingIndicator } from "./ChatTypingIndicator";

interface ChatListProps {
  messages: ChatMessage[];
  isAssistantTyping: boolean;
}

export function ChatList({ messages, isAssistantTyping }: ChatListProps) {
  const ref = useRef<FlatList<ChatMessage>>(null);

  const lastContentLength = messages[messages.length - 1]?.content.length ?? 0;
  useEffect(() => {
    // Scroll to bottom whenever a new message arrives, the typing
    // indicator toggles, or the streaming message grows.
    const t = setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length, isAssistantTyping, lastContentLength]);

  return (
    <FlatList
      ref={ref}
      data={messages}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => <ChatMessageBubble message={item} />}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      ListFooterComponent={isAssistantTyping ? <ChatTypingIndicator /> : <View />}
      showsVerticalScrollIndicator={false}
    />
  );
}
