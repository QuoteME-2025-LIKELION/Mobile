import { ApiError } from "@/api/createApiClient";
import { getQuoteInputError } from "../utils/quoteInput";
import type { AiUsage, RecommendationStatus } from "../types/writeTypes";
type Api = {
  getUsage: (signal?: AbortSignal) => Promise<unknown>;
  generate: (content: string, signal?: AbortSignal) => Promise<unknown>;
};
type Snapshot = {
  status: RecommendationStatus;
  usageStatus: "loading" | "success" | "error";
  usage: AiUsage | null;
  recommendations: string[];
  content: string;
};
function parseUsage(value: unknown): AiUsage {
  const data = value as AiUsage;
  if (
    !data ||
    ![data.used, data.remaining, data.limit].every(
      (n) => Number.isSafeInteger(n) && n >= 0
    ) ||
    data.remaining !== Math.max(0, data.limit - data.used)
  )
    throw new Error("Invalid AI usage");
  return { used: data.used, remaining: data.remaining, limit: data.limit };
}
function parseRecommendations(value: unknown): string[] {
  const data = value as { summaries?: unknown };
  if (
    !Array.isArray(data?.summaries) ||
    data.summaries.some(
      (text) =>
        typeof text !== "string" || getQuoteInputError(text, "quote") !== null
    )
  )
    throw new Error("Invalid AI recommendations");
  return [...new Set(data.summaries as string[])];
}
export function createAiResource(api: Api) {
  let snapshot: Snapshot = {
    status: "idle",
    usageStatus: "loading",
    usage: null,
    recommendations: [],
    content: "",
  };
  let sequence = 0,
    usageSequence = 0,
    generating = false;
  let generateController: AbortController | null = null,
    usageController: AbortController | null = null;
  const listeners = new Set<() => void>();
  const emit = (next: Snapshot) => {
    snapshot = next;
    listeners.forEach((fn) => fn());
  };
  async function loadUsage() {
    const version = ++usageSequence;
    usageController?.abort();
    const controller = new AbortController();
    usageController = controller;
    emit({ ...snapshot, usageStatus: "loading" });
    try {
      const usage = parseUsage(await api.getUsage(controller.signal));
      if (version === usageSequence)
        emit({ ...snapshot, usageStatus: "success", usage });
    } catch {
      if (version === usageSequence && !controller.signal.aborted)
        emit({ ...snapshot, usageStatus: "error", usage: null });
    }
  }
  async function generate(
    content: string,
    refresh = false
  ): Promise<string | null> {
    const trimmed = content.trim();
    const error = getQuoteInputError(trimmed, "ai");
    if (error) return error;
    if (generating) return null;
    if (
      !refresh &&
      snapshot.status === "success" &&
      snapshot.content === trimmed
    )
      return null;
    if (snapshot.usageStatus !== "success")
      return "AI 사용량을 확인하지 못했어요.";
    if (!snapshot.usage || snapshot.usage.remaining === 0)
      return "오늘 AI 추천 횟수를 모두 사용했어요.";
    generating = true;
    const version = ++sequence;
    const controller = new AbortController();
    generateController = controller;
    emit({
      ...snapshot,
      status: "loading",
      content: trimmed,
      recommendations: [],
    });
    try {
      const recommendations = parseRecommendations(
        await api.generate(trimmed, controller.signal)
      );
      if (version === sequence)
        emit({
          ...snapshot,
          status: recommendations.length ? "success" : "empty",
          recommendations,
        });
    } catch (e) {
      if (version === sequence && !controller.signal.aborted)
        emit({
          ...snapshot,
          status:
            e instanceof ApiError && e.status === 429 ? "exhausted" : "error",
          recommendations: [],
        });
    } finally {
      if (version === sequence) {
        generating = false;
        await loadUsage();
      }
    }
    return null;
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    loadUsage,
    generate,
    dispose() {
      sequence++;
      usageSequence++;
      generating = false;
      generateController?.abort();
      usageController?.abort();
    },
  };
}
