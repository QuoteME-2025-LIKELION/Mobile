import { useSyncExternalStore } from "react";
import { notificationFixtures } from "../fixtures/notificationFixtures";
import type { NotificationItem } from "../constants/notificationTypes";
const EMPTY: NotificationItem[] = [];
let snapshot = notificationFixtures.map((item) => ({ ...item }));
const listeners = new Set<() => void>();
export function markFixtureNotificationRead(id: number) {
  if (!__DEV__ || !snapshot.some((item) => item.id === id && !item.isRead))
    return false;
  snapshot = snapshot.map((item) =>
    item.id === id ? { ...item, isRead: true } : item
  );
  listeners.forEach((listener) => listener());
  return true;
}
export const getNotificationSnapshot = () => (__DEV__ ? snapshot : EMPTY);
export const subscribeNotifications = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function useNotificationItems() {
  return useSyncExternalStore(
    subscribeNotifications,
    getNotificationSnapshot,
    () => EMPTY
  );
}
