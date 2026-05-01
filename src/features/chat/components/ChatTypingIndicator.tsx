import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

import { colors } from "@/constants/theme";

/**
 * Three pulsing dots used while the assistant is generating a reply.
 * Animation is driven by the native driver so it stays smooth even
 * while we're decoding the inference response.
 */
export function ChatTypingIndicator() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
    // dots refs are stable; safe to skip the dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="self-start bg-surface border border-border rounded-card rounded-bl-md px-4 py-3 mb-3 flex-row gap-1.5">
      {dots.map((opacity, i) => (
        <Animated.View
          key={i}
          style={{
            opacity,
            width: 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: colors.textSecondary,
          }}
        />
      ))}
    </View>
  );
}
