import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/constants/theme";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_ICON = require("../../../../assets/images/icon-mark.png") as number;

interface HeaderProps {
  greeting?: string;
  onProfilePress?: () => void;
}

export function Header({ greeting = "Welcome back", onProfilePress }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between pt-3">
      <View className="flex-row items-center gap-3">
        <Image
          source={APP_ICON}
          style={{ width: 40, height: 40 }}
          contentFit="contain"
          accessibilityLabel="BrainChill"
        />
        <View>
          <Text className="text-text-secondary text-xs tracking-widest uppercase">
            {greeting}
          </Text>
          <View className="flex-row items-baseline gap-1 mt-0.5">
            <Text className="text-text-primary text-3xl font-bold tracking-tight">
              BrainChill
            </Text>
            <View className="w-1.5 h-1.5 bg-sauna rounded-pill mb-2" />
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="プロフィール"
        onPress={onProfilePress}
        className="w-11 h-11 rounded-pill bg-surface border border-border items-center justify-center"
      >
        <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}
