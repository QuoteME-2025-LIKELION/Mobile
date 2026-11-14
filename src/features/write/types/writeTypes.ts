export type AiUsage = { used: number; remaining: number; limit: number };
export type RecommendationStatus =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "error"
  | "exhausted";

export type WriteFriend = {
  id: number;
  nickname: string;
  introduction?: string;
  profileImage?: string;
};
export type QuotePayload = {
  content: string;
  originalContent?: string;
  summary?: string;
  taggedMemberIds: number[];
};
