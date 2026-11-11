import assert from "node:assert/strict";
import test from "node:test";
import {
  load,
  harness,
  nodes,
  text,
  imports,
  url,
} from "./helpers/settingsHarness.mjs";

const { useNotificationSettings } = await load(
  "features/notification-settings/hooks/useNotificationSettings.ts"
);
const { NotificationSettingsScreen } = await load(
  "features/notification-settings/screens/NotificationSettingsScreen.tsx"
);
const { ReminderTimePicker } = await load(
  "features/notification-settings/components/ReminderTimePicker.tsx"
);
const { formatReminderTime } = await load(
  "features/notification-settings/constants/notificationOptions.ts"
);

test("notification defaults follow the latest specification: all On and 9 PM", () => {
  const { render } = harness(useNotificationSettings);
  const form = render();
  assert.equal(form.allEnabled, true);
  assert.ok(Object.values(form.settings).every(Boolean));
  assert.equal(formatReminderTime(form.reminderTime), "오후 9:00");
});
test("master Off blocks every child including marketing and displays an explanation without changing settings", () => {
  const { render } = harness(useNotificationSettings);
  let form = render();
  form.toggleAll();
  form = render();
  assert.equal(form.allEnabled, false);
  assert.ok(Object.values(form.settings).every((value) => !value));
  form.selectItem("marketing");
  form.selectItem("reminder");
  form = render();
  assert.equal(form.settings.marketing, false);
  assert.equal(form.pickerOpen, false);
  assert.equal(form.toast, "전체 알림이 꺼져있어요.");
  form.toggleAll();
  form = render();
  assert.ok(Object.values(form.settings).every(Boolean));
  form.selectItem("group");
  form = render();
  assert.equal(form.settings.group, false);
  assert.equal(form.settings.friend, true);
});
test("reminder picker discards cancel, commits Done, and formats noon/midnight labels", () => {
  const { render } = harness(useNotificationSettings);
  let form = render();
  form.selectItem("reminder");
  form = render();
  form.updateTime({ meridiem: "오전", hour: 12, minute: 35 });
  form = render();
  form.cancelPicker();
  form = render();
  assert.equal(formatReminderTime(form.reminderTime), "오후 9:00");
  form.selectItem("reminder");
  form = render();
  assert.equal(formatReminderTime(form.draftTime), "오후 9:00");
  form.updateTime({ meridiem: "오전", hour: 12, minute: 0 });
  form = render();
  form.finishPicker();
  form = render();
  assert.equal(form.pickerOpen, false);
  assert.equal(formatReminderTime(form.reminderTime), "오전 12:00");
  assert.equal(
    formatReminderTime({ meridiem: "오후", hour: 12, minute: 5 }),
    "오후 12:05"
  );
});
test("notification screen exposes five child settings, locks marketing too, and opens a picker from the reminder row", () => {
  const { render } = harness(NotificationSettingsScreen);
  let tree = render();
  assert.match(text(tree), /오후 9:00/);
  assert.equal(nodes(tree).filter((n) => n.type === "Pressable").length, 6);
  nodes(tree)
    .find((n) => n.props.accessibilityLabel === "오늘의 명언 남기기 알림")
    .props.onPress();
  tree = render();
  assert.equal(
    nodes(tree).find((n) => n.type === "ReminderTimePicker").props.time.hour,
    9
  );
  nodes(tree)
    .find((n) => n.type === "ReminderTimePicker")
    .props.onClose();
  tree = render();
  nodes(tree)
    .find((n) => n.props.accessibilityLabel === "전체 알림 허용")
    .props.onPress();
  tree = render();
  assert.equal(
    nodes(tree).find((n) => n.props.accessibilityLabel === "마케팅 정보 수신")
      .props.accessibilityState.disabled,
    true
  );
});
test("time picker closes via Android back and outside, and Done is separate", () => {
  let cancelled = 0,
    done = 0;
  const { render } = harness(ReminderTimePicker, {
    time: { meridiem: "오후", hour: 9, minute: 0 },
    onChange: () => {},
    onClose: () => cancelled++,
    onDone: () => done++,
  });
  const tree = render();
  tree.props.onRequestClose();
  nodes(tree)
    .find((n) => n.props.accessibilityLabel === "알림 시간 선택 닫기")
    .props.onPress();
  assert.equal(cancelled, 2);
  nodes(tree)
    .find((n) => n.type === "Pressable" && text(n) === "완료")
    .props.onPress();
  assert.equal(done, 1);
});
test("notification settings route stays gated outside development", async () => {
  imports[
    "@/features/notification-settings/screens/NotificationSettingsScreen"
  ] = url(
    "export const NotificationSettingsScreen='NotificationSettingsScreen';"
  );
  const { default: Route } = await load("app/notification-setting.tsx");
  globalThis.__DEV__ = false;
  assert.equal(Route().type, "Redirect");
  assert.equal(Route().props.href, "/");
  globalThis.__DEV__ = true;
  assert.equal(Route().type, "NotificationSettingsScreen");
});
