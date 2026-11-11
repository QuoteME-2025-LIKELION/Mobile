import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ToastMessage } from "@/components/ToastMessage";
import {
  NOTIFICATION_ITEMS,
  formatReminderTime,
} from "../constants/notificationOptions";
import { ReminderTimePicker } from "../components/ReminderTimePicker";
import { useNotificationSettings } from "../hooks/useNotificationSettings";
import { styles } from "./NotificationSettingsScreen.styles";
export function NotificationSettingsScreen() {
  const form = useNotificationSettings();
  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title="알림 설정" onBack={form.goBack} />
      <ScrollView contentContainerStyle={styles.list}>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="전체 알림 허용"
          accessibilityState={{ checked: form.allEnabled }}
          onPress={form.toggleAll}
          style={styles.master}
        >
          <AppText style={styles.title}>전체 알림 허용</AppText>
          <AppText style={[styles.value, form.allEnabled && styles.active]}>
            {form.allEnabled ? "On" : "Off"}
          </AppText>
        </Pressable>
        {NOTIFICATION_ITEMS.map((item) => {
          const active = form.allEnabled && form.settings[item.key];
          return (
            <Pressable
              key={item.key}
              accessibilityRole={item.key === "reminder" ? "button" : "switch"}
              accessibilityLabel={item.title}
              accessibilityState={{
                disabled: !form.allEnabled,
                ...(item.key === "reminder"
                  ? { expanded: form.pickerOpen }
                  : { checked: active }),
              }}
              onPress={() => form.selectItem(item.key)}
              style={styles.row}
            >
              <View style={styles.textBox}>
                <AppText
                  style={[styles.title, !form.allEnabled && styles.disabled]}
                >
                  {item.title}
                </AppText>
                {item.description ? (
                  <AppText
                    style={[
                      styles.description,
                      !form.allEnabled && styles.disabled,
                    ]}
                  >
                    {item.description}
                  </AppText>
                ) : null}
              </View>
              <AppText
                style={[
                  styles.value,
                  active && styles.active,
                  !form.allEnabled && styles.disabled,
                ]}
              >
                {active
                  ? item.key === "reminder"
                    ? formatReminderTime(form.reminderTime)
                    : "On"
                  : "Off"}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      {form.pickerOpen && (
        <ReminderTimePicker
          time={form.draftTime}
          onChange={form.updateTime}
          onClose={form.cancelPicker}
          onDone={form.finishPicker}
        />
      )}
      <ToastMessage message={form.toast} onClose={form.closeToast} />
    </SafeAreaView>
  );
}
