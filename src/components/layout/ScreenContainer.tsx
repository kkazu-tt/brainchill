import { type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
}

/**
 * Standard dark-mode screen wrapper. Honors the device safe area and
 * gives every screen the same vertical rhythm.
 */
export function ScreenContainer({
  children,
  scrollable = true,
}: ScreenContainerProps) {
  const Body = (
    <View className="px-5 pb-8 pt-2 gap-5 web:w-full web:max-w-4xl web:self-center">
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-base">
      {scrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow"
          showsVerticalScrollIndicator={false}
        >
          {Body}
        </ScrollView>
      ) : (
        Body
      )}
    </SafeAreaView>
  );
}
