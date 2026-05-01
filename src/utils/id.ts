/**
 * Cross-platform random id. crypto.randomUUID is available on Hermes,
 * modern web, and recent React Native; the fallback covers older runtimes.
 */
export function uid(prefix?: string): string {
  const raw =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${raw}` : raw;
}
