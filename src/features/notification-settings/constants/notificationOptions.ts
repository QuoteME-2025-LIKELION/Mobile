export const NOTIFICATION_ITEMS = [
  {
    key: "reminder",
    title: "오늘의 명언 남기기 알림",
    description: "명언을 작성하지 않았을 때 알림을 보내요",
  },
  {
    key: "group",
    title: "그룹 알림 받기",
    description: "그룹 참여 요청, 그룹 메시지가 변경되었을 때 알림을 보내요",
  },
  {
    key: "tag",
    title: "태그 알림 받기",
    description: "누군가 나를 태그했을 때, 태그요청을 받았을 때 알림을 보내요",
  },
  {
    key: "friend",
    title: "친구 알림 받기",
    description: "친구가 명언을 올렸을 때 알림을 보내요",
  },
  { key: "marketing", title: "마케팅 정보 수신", description: "" },
] as const;
export type NotificationKey = (typeof NOTIFICATION_ITEMS)[number]["key"];
export type ReminderTime = {
  meridiem: "오전" | "오후";
  hour: number;
  minute: number;
};
export const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
export const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
export function formatReminderTime(time: ReminderTime) {
  return `${time.meridiem} ${time.hour}:${String(time.minute).padStart(2, "0")}`;
}
