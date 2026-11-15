import { session } from "@/features/auth/services/session";
export const aiApi = {
  getUsage: (signal?: AbortSignal) =>
    session.request<unknown>("/api/quotes/ai-usage", { signal }),
  generate: (content: string, signal?: AbortSignal) =>
    session.request<unknown>("/api/quotes/summarize", {
      method: "POST",
      body: { content },
      signal,
    }),
};
