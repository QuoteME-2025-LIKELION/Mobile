import { session } from "@/features/auth/services/session";
import type { QuotePayload } from "../types/writeTypes";
export const writeApi = {
  getFriends: (signal?: AbortSignal) =>
    session.request<unknown>("/api/settings/friends-list", { signal }),
  createQuote: (body: QuotePayload, signal?: AbortSignal) =>
    session.request("/api/quotes", { method: "POST", body, signal }),
};
