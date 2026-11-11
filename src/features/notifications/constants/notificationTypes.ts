export type NotificationCategory = "GROUP" | "FRIEND" | "TAG";
export type NotificationKind =
  | "writing"
  | "group"
  | "group-invite"
  | "friend"
  | "tag"
  | "tag-request";
// 개발 UI 모델이다. 새 서버 요청/응답 계약을 정의하는 타입이 아니다.
export type NotificationItem = {
  id: number;
  category: NotificationCategory | null;
  kind: NotificationKind;
  message: string;
  createdAt: number;
  isRead: boolean;
  invitation?: { groupName: string; leaderName: string; memberCount: number };
};
export const NOTIFICATION_FILTERS = [
  { label: "전체보기", value: null },
  { label: "그룹", value: "GROUP" },
  { label: "친구", value: "FRIEND" },
  { label: "태그", value: "TAG" },
] as const;
