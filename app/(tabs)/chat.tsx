import { KeyboardAvoidingView, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatHeader } from "@/features/chat/components/ChatHeader";
import { ChatInputBar } from "@/features/chat/components/ChatInputBar";
import { ChatList } from "@/features/chat/components/ChatList";
import { useAppStore } from "@/store/useAppStore";

export default function ChatScreen() {
  const messages = useAppStore((s) => s.chat);
  const isAssistantTyping = useAppStore((s) => s.isAssistantTyping);
  const sendUserMessage = useAppStore((s) => s.sendUserMessage);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-base">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ChatHeader />
        <View className="flex-1">
          <ChatList messages={messages} isAssistantTyping={isAssistantTyping} />
        </View>
        <ChatInputBar
          onSend={(text) => {
            void sendUserMessage(text);
          }}
          disabled={isAssistantTyping}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
