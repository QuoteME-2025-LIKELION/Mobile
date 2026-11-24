import { useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
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
    const subscription = AppState.addEventListener("change", (appState) => {
      if (
        appState === "active" &&
        resource.getSnapshot().usageStatus === "error"
      )
        void resource.loadUsage();
    });
    return () => {
      subscription.remove();
      resource.dispose();
    };
  }, [resource]);
  return {
    ...state,
    generate: resource.generate,
    loadUsage: resource.loadUsage,
  };
}
