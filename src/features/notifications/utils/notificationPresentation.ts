import type { NotificationItem } from "../constants/notificationTypes";
export function getNotificationCategory(item: NotificationItem) {
  return item.category === "GROUP"
    ? "그룹"
    : item.category === "TAG"
      ? "태그"
      : item.category === null
        ? "명언"
        : "친구";
}
export function formatNotificationTime(createdAt: number, now = Date.now()) {
  if (!Number.isFinite(createdAt) || !Number.isFinite(now)) return "";
  const seconds = Math.max(0, Math.floor((now - createdAt) / 1000));
  if (seconds < 60) return "방금 전";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.max(1, Math.floor(days / 365))}년 전`;
}
