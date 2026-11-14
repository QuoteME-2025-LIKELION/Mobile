import { ApiError, type RequestOptions } from "@/api/createApiClient";

export type SessionMember = {
  id: number;
  nickname: string;
  profileCompleted: boolean;
};
export type SessionSnapshot = {
  status: "loading" | "anonymous" | "authenticated" | "error";
  member: SessionMember | null;
  busy: boolean;
};
type AuthResponse = {
  data?: { accessToken?: unknown; refreshToken?: unknown; item?: unknown };
};
type Storage = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};
type Transport = <T>(path: string, options?: RequestOptions) => Promise<T>;
export class SessionChangedError extends Error {
  constructor() {
    super("Session changed");
    this.name = "SessionChangedError";
  }
}
function token(value: unknown): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error("Invalid token response");
  return value;
}
function member(value: unknown): SessionMember {
  const item = value as SessionMember | null;
  if (
    !item ||
    !Number.isSafeInteger(item.id) ||
    item.id <= 0 ||
    typeof item.nickname !== "string" ||
    typeof item.profileCompleted !== "boolean"
  ) {
    throw new Error("Invalid member response");
  }
  return {
    id: item.id,
    nickname: item.nickname,
    profileCompleted: item.profileCompleted,
  };
}

/** access는 메모리, refresh만 보안 저장. 모든 비동기 결과는 세션 세대로 검증한다. */
export function createSessionManager(
  transport: Transport,
  storage: Storage,
  resetSessionData: () => void = () => {}
) {
  let snapshot: SessionSnapshot = {
    status: "loading",
    member: null,
    busy: false,
  };
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let generation = 0;
  let storageQueue: Promise<unknown> = Promise.resolve();
  let initializeTask: Promise<void> | null = null;
  let loginTask: Promise<void> | null = null;
  let logoutTask: Promise<void> | null = null;
  let refreshTask: { generation: number; task: Promise<void> } | null = null;
  const listeners = new Set<() => void>();
  const emit = (next: SessionSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };
  const check = (version: number) => {
    if (version !== generation) throw new SessionChangedError();
  };
  const stored = (action: () => Promise<void>) => {
    const task = storageQueue.then(action, action);
    storageQueue = task.catch(() => {});
    return task;
  };
  async function clear(version: number) {
    check(version);
    generation++;
    accessToken = refreshToken = null;
    resetSessionData();
    emit({ status: "loading", member: null, busy: false });
    try {
      await stored(() => storage.remove());
      emit({ status: "anonymous", member: null, busy: false });
    } catch {
      emit({ status: "error", member: null, busy: false });
      throw new Error("로그인 정보를 지우지 못했어요. 다시 시도해 주세요.");
    }
  }
  async function refresh(version: number) {
    check(version);
    if (logoutTask) throw new SessionChangedError();
    if (refreshTask?.generation === version) return refreshTask.task;
    const currentRefresh = refreshToken;
    const task = (async () => {
      try {
        if (!currentRefresh) throw new Error("Missing refresh token");
        const response = await transport<AuthResponse>("/api/auth/refresh", {
          method: "POST",
          body: { refreshToken: currentRefresh },
        });
        check(version);
        const nextAccess = token(response.data?.accessToken);
        const nextMember = member(response.data?.item);
        if (snapshot.status !== "authenticated") resetSessionData();
        accessToken = nextAccess;
        emit({ status: "authenticated", member: nextMember, busy: false });
      } catch (error) {
        if (version === generation) await clear(version);
        throw error;
      } finally {
        if (refreshTask?.generation === version) refreshTask = null;
      }
    })();
    refreshTask = { generation: version, task };
    return task;
  }
  async function initialize() {
    if (initializeTask) return initializeTask;
    if (snapshot.status !== "loading") return;
    const version = generation;
    initializeTask = (async () => {
      try {
        const saved = await storage.read();
        check(version);
        if (!saved) {
          emit({ status: "anonymous", member: null, busy: false });
          return;
        }
        refreshToken = saved;
        await refresh(version);
      } catch {
        // 재발급 실패는 clear에서 처리한다. 저장소 읽기 실패는 로그인으로 인정하지 않는다.
        if (version === generation)
          emit({ status: "error", member: null, busy: false });
      }
    })().finally(() => {
      initializeTask = null;
    });
    return initializeTask;
  }
  async function loginGuest() {
    if (loginTask) return loginTask;
    if (snapshot.status !== "anonymous")
      throw new Error("로그인 상태를 먼저 확인해 주세요.");
    const version = ++generation;
    emit({ status: "anonymous", member: null, busy: true });
    loginTask = (async () => {
      try {
        const response = await transport<AuthResponse>(
          "/api/auth/guest-login",
          { method: "POST" }
        );
        check(version);
        const nextAccess = token(response.data?.accessToken);
        const nextRefresh = token(response.data?.refreshToken);
        const nextMember = member(response.data?.item);
        if (!nextMember.profileCompleted)
          throw new Error("Invalid guest profile response");
        await stored(async () => {
          check(version);
          await storage.write(nextRefresh);
        });
        check(version);
        accessToken = nextAccess;
        refreshToken = nextRefresh;
        resetSessionData();
        emit({ status: "authenticated", member: nextMember, busy: false });
      } catch (error) {
        if (version === generation) await clear(version);
        throw error;
      } finally {
        loginTask = null;
      }
    })();
    return loginTask;
  }
  async function request<T>(
    path: string,
    options: Omit<RequestOptions, "token"> = {}
  ): Promise<T> {
    if (snapshot.status !== "authenticated" || logoutTask)
      throw new Error("로그인이 필요해요.");
    if (path.startsWith("/api/auth/"))
      throw new Error("Use session authentication actions");
    const version = generation,
      currentAccess = accessToken;
    try {
      const result = await transport<T>(path, {
        ...options,
        token: currentAccess,
      });
      check(version);
      return result;
    } catch (error) {
      check(version);
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      if (error.code === "401-4") {
        await clear(version);
        throw error;
      }
      if (error.code !== "401-5") throw error;
      // 늦게 도착한 옛 토큰의 실패는 이미 갱신된 access로 재시도한다.
      if (accessToken === currentAccess) await refresh(version);
      check(version);
      try {
        const result = await transport<T>(path, {
          ...options,
          token: accessToken,
        });
        check(version);
        return result;
      } catch (retryError) {
        check(version);
        if (retryError instanceof ApiError && retryError.status === 401)
          await clear(version);
        throw retryError;
      }
    }
  }
  async function logout() {
    if (logoutTask) return logoutTask;
    if (snapshot.status !== "authenticated") return;
    const version = ++generation;
    const currentAccess = accessToken,
      currentRefresh = refreshToken;
    emit({ ...snapshot, busy: true });
    logoutTask = (async () => {
      try {
        // access가 만료돼도 본문 refresh로 로그아웃할 수 있다. 재발급하지 않는다.
        await transport("/api/auth/logout", {
          method: "POST",
          token: currentAccess,
          body: { refreshToken: currentRefresh },
        });
        check(version);
        await clear(version);
      } catch (error) {
        if (version === generation) emit({ ...snapshot, busy: false });
        throw error;
      } finally {
        logoutTask = null;
      }
    })();
    return logoutTask;
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    initialize,
    loginGuest,
    logout,
    request,
    retryStorageCleanup: () => clear(generation),
  };
}
