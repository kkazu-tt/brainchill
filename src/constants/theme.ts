/**
 * BrainChill design system tokens.
 * Mirrors values in tailwind.config.js for non-Tailwind consumers
 * (e.g. SVG fills, react-native-svg gradients).
 */

export const colors = {
  base: "#1A1D21",
  surface: "#24282D",
  sauna: "#FF8C42",
  saunaSoft: "#FFA76A",
  teal: "#2AB7CA",
  tealSoft: "#5FCDDC",
  textPrimary: "#FFFFFF",
  textSecondary: "#A6ADB4",
  textMuted: "#6B7178",
  border: "#2F343A",
  success: "#4ADE80",
  warning: "#FACC15",
  danger: "#F87171",
} as const;

export const radii = {
  sm: 8,
  md: 12,
  card: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export type ColorToken = keyof typeof colors;
