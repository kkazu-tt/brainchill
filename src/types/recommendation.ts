export interface AIRecommendation {
  id: string;
  /** main user-facing copy */
  message: string;
  /** suggested time of day (e.g. "18:00") if applicable */
  suggestedTime?: string;
  /** "sauna" | "meditation" | "rest" | etc. drives icon choice */
  category: "sauna" | "meditation" | "rest" | "movement" | "hydration";
  /** has the user marked it done? */
  completed: boolean;
  createdAt: string;
}
