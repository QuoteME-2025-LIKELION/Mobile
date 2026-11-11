import { useState } from "react";
import { router } from "expo-router";
import { noticeFixtures } from "../fixtures/noticeFixtures";
export function useNotices() {
  const [visibleCount, setVisibleCount] = useState(3);
  const [scenario, setScenario] = useState(0);
  const items = scenario === 1 ? [] : noticeFixtures;
  const important = items.filter((item) => item.important);
  const news = items.filter((item) => !item.important);
  return {
    important,
    news: news.slice(0, visibleCount),
    hasMore: visibleCount < news.length,
    loading: scenario === 2,
    error: scenario === 3,
    more: () => setVisibleCount((current) => current + 3),
    nextScenario: () => {
      if (__DEV__) {
        setScenario((current) => (current + 1) % 4);
        setVisibleCount(3);
      }
    },
    retry: () => setScenario(0),
    goBack: () =>
      router.canGoBack() ? router.back() : router.replace("/home"),
  };
}
