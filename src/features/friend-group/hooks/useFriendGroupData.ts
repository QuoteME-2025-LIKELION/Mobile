import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

type Result<T> =
  | { status: "loading" | "error"; data?: undefined }
  | { status: "ready"; data: T };

export function useFriendGroupData<T>(
  load: (signal: AbortSignal) => Promise<T>,
  enabled = true
) {
  const [version, setVersion] = useState(0);
  const [response, setResponse] = useState<{
    load: typeof load;
    version: number;
    result: Result<T>;
  }>();
  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      const controller = new AbortController();
      load(controller.signal).then(
        (data) => {
          if (!controller.signal.aborted)
            setResponse({ load, version, result: { status: "ready", data } });
        },
        () => {
          if (!controller.signal.aborted)
            setResponse({ load, version, result: { status: "error" } });
        }
      );
      return () => controller.abort();
    }, [enabled, load, version])
  );

  const result: Result<T> =
    response &&
    response.load === load &&
    (response.version === version || response.result.status === "ready")
      ? response.result
      : { status: "loading" };
  return { ...result, reload };
}

export function useFriendGroupSearch(keyword: string) {
  const [debounced, setDebounced] = useState("");
  const normalized = keyword.trim();
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(normalized), 350);
    return () => clearTimeout(timer);
  }, [normalized]);
  return normalized && normalized === debounced ? debounced : "";
}

export function useFriendGroupActions(refresh: () => void) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const run = async (
    action: () => Promise<unknown>,
    success: string,
    failure: string
  ) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await action();
      refresh();
      setToast(success);
    } catch {
      refresh();
      setToast(failure);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return { busy, toast, closeToast: () => setToast(""), run };
}
