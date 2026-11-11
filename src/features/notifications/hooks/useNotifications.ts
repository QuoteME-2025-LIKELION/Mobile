import { useState } from "react";
import { router } from "expo-router";
import {
  markFixtureNotificationRead,
  useNotificationItems,
} from "../stores/notificationStore";
import type {
  NotificationCategory,
  NotificationItem,
} from "../constants/notificationTypes";
export function useNotifications({
  hasWrittenToday = false,
}: { hasWrittenToday?: boolean } = {}) {
  const items = useNotificationItems();
  const [filter, setFilter] = useState<NotificationCategory | null>(null);
  const [scenario, setScenario] = useState(0);
  const [toast, setToast] = useState("");
  const [invitation, setInvitation] = useState<
    NotificationItem["invitation"] | null
  >(null);
  const notifications = (scenario === 1 ? [] : items)
    .filter((item) => filter === null || item.category === filter)
    .sort((a, b) => b.createdAt - a.createdAt);
  const openItem = (item: NotificationItem) => {
    if (!__DEV__) return;
    markFixtureNotificationRead(item.id);
    if (item.kind === "writing") {
      if (hasWrittenToday) {
        setToast("작성한 명언의 태그 수정은 준비 중이에요.");
        return;
      }
      router.push("/write");
      return;
    }
    if (item.kind === "group-invite" && item.invitation) {
      if (item.invitation.memberCount >= 5)
        setToast("최대 인원 5명이 가득 차 들어갈 수 없어요");
      else setInvitation(item.invitation);
      return;
    }
    setToast(
      item.category === "GROUP" || item.category === "FRIEND"
        ? "친구 및 그룹 관리는 준비 중이에요."
        : item.kind === "tag-request"
          ? "태그 요청 확인은 준비 중이에요."
          : "해당 날짜의 명언 보기는 준비 중이에요."
    );
  };
  return {
    filter,
    notifications,
    invitation,
    toast,
    loading: scenario === 2,
    error: scenario === 3,
    selectFilter: (value: NotificationCategory | null) =>
      setFilter((current) => (current === value ? null : value)),
    openItem,
    closeInvitation: () => setInvitation(null),
    closeToast: () => setToast(""),
    close: () => (router.canGoBack() ? router.back() : router.replace("/home")),
    nextScenario: () => {
      if (__DEV__) {
        setScenario((current) => (current + 1) % 4);
        setFilter(null);
      }
    },
    retry: () => setScenario(0),
  };
}
