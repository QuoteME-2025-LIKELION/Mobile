import { useState } from "react";
import { router } from "expo-router";
import {
  notificationSettingsFixture,
  reminderTimeFixture,
} from "../fixtures/notificationSettingsFixture";
import {
  type NotificationKey,
  type ReminderTime,
} from "../constants/notificationOptions";
export function useNotificationSettings() {
  const [allEnabled, setAllEnabled] = useState(true);
  const [settings, setSettings] = useState({ ...notificationSettingsFixture });
  const [reminderTime, setReminderTime] = useState({ ...reminderTimeFixture });
  const [draftTime, setDraftTime] = useState({ ...reminderTimeFixture });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toggleAll = () => {
    const next = !allEnabled;
    setAllEnabled(next);
    setSettings({
      reminder: next,
      group: next,
      tag: next,
      friend: next,
      marketing: next,
    });
  };
  const selectItem = (key: NotificationKey) => {
    if (!allEnabled) {
      setToast("전체 알림이 꺼져있어요.");
      return;
    }
    if (key === "reminder") {
      setDraftTime({ ...reminderTime });
      setPickerOpen(true);
    } else setSettings((current) => ({ ...current, [key]: !current[key] }));
  };
  return {
    allEnabled,
    settings,
    reminderTime,
    draftTime,
    pickerOpen,
    toast,
    toggleAll,
    selectItem,
    updateTime: (value: Partial<ReminderTime>) =>
      setDraftTime((current) => ({ ...current, ...value })),
    cancelPicker: () => setPickerOpen(false),
    finishPicker: () => {
      setReminderTime({ ...draftTime });
      setSettings((current) => ({ ...current, reminder: true }));
      setPickerOpen(false);
    },
    closeToast: () => setToast(""),
    goBack: () =>
      router.canGoBack() ? router.back() : router.replace("/home"),
  };
}
