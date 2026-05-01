/**
 * Chat domain types. Conversation history is preserved so the LLM
 * can condition on prior turns.
 */

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  /** when the assistant response was derived from a fatigue inference */
  inferenceId?: string;
  /** true while tokens are still streaming in from the LLM */
  isStreaming?: boolean;
}

export interface LLMInferenceResult {
  id: string;
  fatigueScore: number;
  confidence: number;
  recommendation: string;
  createdAt: string;
}
