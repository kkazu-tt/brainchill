import { Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

import { colors } from "@/constants/theme";

interface CircularProgressProps {
  /** 0..100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** centered numeric label override; defaults to the value */
  label?: string;
  /** small label rendered under the value */
  caption?: string;
}

/**
 * Big circular progress indicator with a teal→sauna-orange gradient.
 * Uses react-native-svg so it renders identically on iOS / Android / Web.
 */
export function CircularProgress({
  value,
  size = 220,
  strokeWidth = 16,
  label,
  caption,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="bcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.teal} />
            <Stop offset="100%" stopColor={colors.sauna} />
          </LinearGradient>
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#bcGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          // Rotate so the arc starts at 12 o'clock and grows clockwise.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View className="absolute items-center">
        <Text className="text-text-primary text-6xl font-bold tracking-tight">
          {label ?? Math.round(clamped)}
        </Text>
        {caption ? (
          <Text className="text-text-secondary text-sm mt-1">{caption}</Text>
        ) : null}
      </View>
    </View>
  );
}
