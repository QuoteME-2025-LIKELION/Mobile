import { useEffect, useState, useSyncExternalStore } from "react";
import { createAiResource } from "../services/createAiResource";
import { aiApi } from "../services/aiApi";
export function useAiRecommendations() {
  const [resource] = useState(() => createAiResource(aiApi));
  const state = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot
  );
  useEffect(() => {
    void resource.loadUsage();
    return () => resource.dispose();
  }, [resource]);
  return {
    ...state,
    generate: resource.generate,
    loadUsage: resource.loadUsage,
  };
}
