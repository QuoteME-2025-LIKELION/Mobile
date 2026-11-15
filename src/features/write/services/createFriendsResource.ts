import type { WriteFriend } from "../types/writeTypes";
export function parseFriends(value: unknown): WriteFriend[] {
  if (
    !Array.isArray(value) ||
    value.some(
      (item) =>
        !item ||
        !Number.isSafeInteger(item.id) ||
        item.id <= 0 ||
        typeof item.nickname !== "string"
    )
  )
    throw new Error("Invalid friends response");
  return value.map((item) => ({
    id: item.id,
    nickname: item.nickname,
    introduction:
      typeof item.introduction === "string" ? item.introduction : undefined,
    profileImage:
      typeof item.profileImage === "string" ? item.profileImage : undefined,
  }));
}
export function createFriendsResource(
  getFriends: (signal?: AbortSignal) => Promise<unknown>
) {
  let snapshot: {
    status: "idle" | "loading" | "success" | "error";
    items: WriteFriend[];
  } = { status: "idle", items: [] };
  let sequence = 0,
    controller: AbortController | null = null;
  const listeners = new Set<() => void>();
  const emit = (next: typeof snapshot) => {
    snapshot = next;
    listeners.forEach((fn) => fn());
  };
  async function load(): Promise<WriteFriend[] | null> {
    const version = ++sequence;
    controller?.abort();
    const active = new AbortController();
    controller = active;
    emit({ ...snapshot, status: "loading" });
    try {
      const items = parseFriends(await getFriends(active.signal));
      if (version !== sequence) return null;
      emit({ status: "success", items });
      return items;
    } catch {
      if (version === sequence && !active.signal.aborted)
        emit({ status: "error", items: [] });
      return null;
    }
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
    dispose() {
      sequence++;
      controller?.abort();
    },
  };
}
