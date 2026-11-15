import { useSyncExternalStore } from "react";
import { homeResource } from "./homeResource";
export function useHomeData() {
  return useSyncExternalStore(
    homeResource.subscribe,
    homeResource.getSnapshot,
    homeResource.getSnapshot
  );
}
