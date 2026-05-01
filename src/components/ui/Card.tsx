import { type ReactNode } from "react";
import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: ReactNode;
  /** extra Tailwind classes appended to the base styling */
  className?: string;
}

/**
 * Base surface used across the dashboard. Soft charcoal with rounded
 * corners; consumers compose padding via the className prop.
 */
export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <View
      className={`bg-surface rounded-card border border-border ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
