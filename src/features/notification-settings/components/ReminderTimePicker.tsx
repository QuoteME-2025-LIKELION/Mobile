import { useRef, type ComponentRef } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import {
  HOURS,
  MINUTES,
  type ReminderTime,
} from "../constants/notificationOptions";
import { styles } from "./ReminderTimePicker.styles";
export function ReminderTimePicker({
  time,
  onChange,
  onClose,
  onDone,
}: {
  time: ReminderTime;
  onChange: (value: Partial<ReminderTime>) => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={[styles.overlay, { paddingTop: insets.top + 24 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="알림 시간 선택 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          accessibilityLabel="명언 알림 시간 선택"
          onAccessibilityEscape={onClose}
          style={[
            styles.sheet,
            { paddingBottom: Math.max(44, insets.bottom + 24) },
          ]}
        >
          <ScrollView bounces={false}>
            <View style={styles.columns}>
              <TimeColumn
                label="오전·오후"
                values={["오전", "오후"]}
                selected={time.meridiem}
                onSelect={(value) =>
                  onChange({ meridiem: value as ReminderTime["meridiem"] })
                }
                suffix=""
              />
              <TimeColumn
                label="시"
                values={HOURS}
                selected={time.hour}
                onSelect={(value) => onChange({ hour: Number(value) })}
                suffix="시"
              />
              <TimeColumn
                label="분"
                values={MINUTES}
                selected={time.minute}
                onSelect={(value) => onChange({ minute: Number(value) })}
                suffix="분"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onDone}
              style={styles.done}
            >
              <AppText style={styles.doneText}>완료</AppText>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
function TimeColumn({
  label,
  values,
  selected,
  onSelect,
  suffix,
}: {
  label: string;
  values: readonly (string | number)[];
  selected: string | number;
  onSelect: (value: string | number) => void;
  suffix: string;
}) {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const center = (value: string | number, animated = false) =>
    ref.current?.scrollTo({
      y: Math.max(0, values.indexOf(value)) * 44,
      animated,
    });
  return (
    <ScrollView
      ref={ref}
      nestedScrollEnabled
      style={styles.column}
      contentContainerStyle={styles.options}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => center(selected)}
      accessibilityLabel={label}
    >
      {values.map((value) => (
        <Pressable
          key={value}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === selected }}
          onPress={() => {
            onSelect(value);
            center(value, true);
          }}
          style={styles.option}
        >
          <AppText
            style={[styles.optionText, value === selected && styles.selected]}
          >
            {suffix === "분" ? String(value).padStart(2, "0") : value}
            {suffix}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}
