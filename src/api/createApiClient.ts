export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string
  ) {
    super(`API request failed (${status})`);
    this.name = "ApiError";
  }
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

/** 쿠키를 사용하지 않는 앱 전용 JSON 전송. 토큰/서버 본문을 오류에 담지 않는다. */
export function createApiClient(
  getBaseUrl: () => string,
  fetcher: typeof fetch = fetch,
  timeoutMs = 15_000
) {
  return async function request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    if (!path.startsWith("/api/") || path.includes(".."))
      throw new Error("Invalid API path");
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) controller.abort();
    const timer = setTimeout(abort, timeoutMs);
    try {
      const response = await fetcher(`${getBaseUrl()}${path}`, {
        method: options.method ?? "GET",
        credentials: "omit",
        headers: {
          Accept: "application/json",
          "X-Client-Type": "app",
          ...(options.body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
          ...(options.token
            ? { Authorization: `Bearer ${options.token}` }
            : {}),
        },
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
      const text = await response.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch {
        if (response.ok) throw new Error("Invalid API response");
      }
      if (!response.ok) {
        const error = data as
          | { resultCode?: unknown; message?: unknown }
          | undefined;
        const resultCode =
          typeof error?.resultCode === "string" ? error.resultCode : undefined;
        const messageCode =
          typeof error?.message === "string"
            ? error.message.match(/^\d{3}-\d+(?=\D|$)/)?.[0]
            : undefined;
        throw new ApiError(response.status, messageCode ?? resultCode);
      }
      return data as T;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
    }
  };
}
