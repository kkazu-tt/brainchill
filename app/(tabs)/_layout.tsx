import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Text } from "react-native";

import { colors } from "@/constants/theme";

function TabLabel({ children, color }: { children: string; color: string }) {
  // No `numberOfLines` / explicit `lineHeight`: those combined with
  // `overflow: hidden` on web were clipping the descenders of "y" in
  // History/Chat. Labels here are static one-word strings, so wrap risk
  // is zero.
  return (
    <Text
      style={{
        color,
        fontSize: 11,
        fontWeight: "600",
        textAlign: "center",
      }}
    >
      {children}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.sauna,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse" size={size} color={color} />
          ),
          tabBarLabel: ({ color }) => <TabLabel color={color}>Home</TabLabel>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
          tabBarLabel: ({ color }) => (
            <TabLabel color={color}>History</TabLabel>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
          tabBarLabel: ({ color }) => <TabLabel color={color}>Chat</TabLabel>,
        }}
      />
    </Tabs>
  );
}
