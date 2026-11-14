export type AiUsage = { used: number; remaining: number; limit: number };
export type RecommendationStatus =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "error"
  | "exhausted";
