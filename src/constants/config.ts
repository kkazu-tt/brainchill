/**
 * Environment-driven configuration.
 * Real values will come from app.config.ts / EAS secrets later.
 */
export const APP_NAME = "BrainChill";
export const APP_TAGLINE = "脳疲労を整える";

export const FEATURES = {
  pushNotifications: false,
  healthKit: false,
  llmInference: false,
} as const;
