import type {
  NotificationKey,
  ReminderTime,
} from "../constants/notificationOptions";
// 최신 명세 기본값. OS 권한이나 서버 저장 결과를 나타내지 않는다.
export const notificationSettingsFixture: Record<NotificationKey, boolean> = {
  reminder: true,
  group: true,
  tag: true,
  friend: true,
  marketing: true,
};
export const reminderTimeFixture: ReminderTime = {
  meridiem: "오후",
  hour: 9,
  minute: 0,
};
