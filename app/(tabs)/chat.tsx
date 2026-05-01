import { SafeAreaView, Text, View } from "react-native";

export default function ChatScreen() {
  return (
    <SafeAreaView className="flex-1 bg-base">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-text-primary text-2xl font-bold">Chat</Text>
        <Text className="text-text-secondary mt-2">
          AI Assistant placeholder — Step 3 で実装
        </Text>
      </View>
    </SafeAreaView>
  );
}
