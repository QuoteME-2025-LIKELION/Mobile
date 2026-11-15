import type {
  HomeData,
  MyProfile,
  FeedGroup,
  MyQuote,
  FeedItem,
} from "../types/homeTypes";
import type { RequestOptions } from "@/api/createApiClient";
type Request = <T>(
  path: string,
  options?: Omit<RequestOptions, "token">
) => Promise<T>;
type QuoteList = {
  myQuotes: {
    id: number;
    content: string;
    authorNickname: string;
    birthYear: string | null;
    taggedNicknames?: string[] | null;
  }[];
  otherQuotes: {
    id: number;
    content: string;
    authorNickname: string;
    authorIntroduction?: string | null;
    authorProfileImage?: string | null;
    timeAgo?: string;
    taggedNicknames?: string[] | null;
    isAiGenerated?: boolean;
  }[];
  unwrittenMembers: {
    memberId: number;
    nickname: string;
    profileImage?: string | null;
  }[];
};
export type HomeSnapshot = {
  status: "idle" | "loading" | "success" | "error";
  data: HomeData | null;
  groupId: number | null;
  date: string;
};
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function parseProfile(value: MyProfile): MyProfile {
  if (
    !value ||
    !Number.isSafeInteger(value.id) ||
    value.id <= 0 ||
    typeof value.nickname !== "string" ||
    typeof value.profileCompleted !== "boolean"
  )
    throw new Error("Invalid profile");
  return {
    ...value,
    introduction: value.introduction ?? "",
    profileImage: value.profileImage ?? null,
  };
}
function parseTags(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string"))
    throw new Error("Invalid quote tags");
  return value;
}
export function mapQuoteList(
  value: QuoteList,
  myId: number
): { myQuote: MyQuote | null; items: FeedItem[] } {
  if (
    !value ||
    !Array.isArray(value.myQuotes) ||
    !Array.isArray(value.otherQuotes) ||
    !Array.isArray(value.unwrittenMembers)
  )
    throw new Error("Invalid quote list");
  const mine = value.myQuotes[0];
  if (
    mine &&
    (!Number.isSafeInteger(mine.id) ||
      typeof mine.content !== "string" ||
      typeof mine.authorNickname !== "string")
  )
    throw new Error("Invalid own quote");
  if (
    value.unwrittenMembers.some(
      (m) => !Number.isSafeInteger(m.memberId) || typeof m.nickname !== "string"
    )
  )
    throw new Error("Invalid unwritten member");
  const myQuote = mine
    ? {
        id: mine.id,
        content: mine.content,
        nickname: mine.authorNickname,
        birthYear: mine.birthYear,
        tags: parseTags(mine.taggedNicknames),
      }
    : null;
  const items: FeedItem[] = value.otherQuotes.map((quote) => ({
    id: quote.id,
    nickname: quote.authorNickname,
    introduction: quote.authorIntroduction ?? undefined,
    profileImage: quote.authorProfileImage ?? undefined,
    content: quote.content,
    tags: parseTags(quote.taggedNicknames),
    timeAgo: quote.timeAgo,
    isAiGenerated: quote.isAiGenerated === true,
  }));
  for (const item of items)
    if (
      !Number.isSafeInteger(item.id) ||
      typeof item.content !== "string" ||
      typeof item.nickname !== "string"
    )
      throw new Error("Invalid quote");
  items.push(
    ...value.unwrittenMembers
      .filter((m) => m.memberId !== myId)
      .map((m) => ({
        id: m.memberId,
        memberId: m.memberId,
        nickname: m.nickname,
        profileImage: m.profileImage ?? undefined,
        content: null,
        tags: [],
      }))
  );
  return { myQuote, items };
}
export function createHomeResource(request: Request) {
  let snapshot: HomeSnapshot = {
    status: "idle",
    data: null,
    groupId: null,
    date: localDateKey(),
  };
  let sequence = 0;
  let controller: AbortController | null = null;
  const listeners = new Set<() => void>();
  const emit = (next: HomeSnapshot) => {
    snapshot = next;
    listeners.forEach((fn) => fn());
  };
  async function load(groupId = snapshot.groupId) {
    const version = ++sequence;
    controller?.abort();
    const active = new AbortController();
    controller = active;
    const date = localDateKey();
    emit({ ...snapshot, status: "loading", groupId, date });
    const query = `?date=${date}${groupId === null ? "" : `&groupId=${groupId}`}`;
    try {
      const [profile, groups, quotes, unread] = await Promise.all([
        request<MyProfile>("/api/profile", { signal: active.signal }),
        request<FeedGroup[]>("/api/groups/me", { signal: active.signal }),
        request<QuoteList>(`/api/quotes${query}`, { signal: active.signal }),
        request<{ count: number }>("/api/notifications/unread-count", {
          signal: active.signal,
        }).catch(() => null),
      ]);
      if (version !== sequence) return;
      const currentProfile = parseProfile(profile);
      if (
        !Array.isArray(groups) ||
        groups.some(
          (g) => !Number.isSafeInteger(g.id) || typeof g.name !== "string"
        )
      )
        throw new Error("Invalid groups");
      const data = {
        profile: currentProfile,
        groups,
        ...mapQuoteList(quotes, currentProfile.id),
        unreadCount:
          unread && Number.isFinite(unread.count) ? unread.count : null,
      };
      emit({ status: "success", data, groupId, date });
    } catch {
      if (version === sequence && !active.signal.aborted)
        emit({ ...snapshot, status: "error" });
    }
  }
  function reset() {
    sequence++;
    controller?.abort();
    emit({ status: "idle", data: null, groupId: null, date: localDateKey() });
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    load,
    reset,
    invalidate() {
      sequence++;
      controller?.abort();
      emit({ ...snapshot, status: "idle", data: null });
    },
  };
}
