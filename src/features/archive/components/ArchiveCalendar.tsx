import { Image } from "expo-image";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import {
  archiveDateKey,
  getCalendarDates,
  isFutureArchiveDate,
  isFutureArchiveMonth,
} from "../utils/archiveDate";
import { styles } from "./ArchiveCalendar.styles";
type Props = {
  month: Date;
  selectedDate: Date;
  onMoveMonth: (amount: number) => void;
  onSelectDate: (date: Date) => void;
  onOpenPicker: () => void;
};

export function ArchiveCalendar({
  month,
  selectedDate,
  onMoveMonth,
  onSelectDate,
  onOpenPicker,
}: Props) {
  const today = new Date();
  const selectedKey = archiveDateKey(selectedDate);
  const todayKey = archiveDateKey(today);
  return (
    <View style={styles.calendar}>
      <ArchiveMonthBar
        month={month}
        onMoveMonth={onMoveMonth}
        onOpenPicker={onOpenPicker}
      />
      <View style={styles.grid}>
        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
          <View key={day} style={styles.column}>
            <AppText style={[styles.weekday, index === 0 && styles.accent]}>
              {day}
            </AppText>
          </View>
        ))}
        {getCalendarDates(month).map((date) => {
          const key = archiveDateKey(date);
          const selected = key === selectedKey;
          const isToday = key === todayKey;
          const outside = date.getMonth() !== month.getMonth();
          const disabled = isFutureArchiveDate(date, today);
          return (
            <View key={key} style={styles.column}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일${isToday ? ", 오늘" : ""}`}
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={() => {
                  if (!isFutureArchiveDate(date)) onSelectDate(date);
                }}
                style={[
                  styles.day,
                  isToday && styles.today,
                  selected && styles.selectedDay,
                ]}
              >
                <AppText
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  style={[
                    styles.dayText,
                    outside && styles.outside,
                    isToday && styles.accent,
                    selected && styles.selectedText,
                    disabled && styles.outside,
                  ]}
                >
                  {date.getDate()}
                </AppText>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function ArchiveMonthBar({
  month,
  onMoveMonth,
  onOpenPicker,
}: Pick<Props, "month" | "onMoveMonth" | "onOpenPicker">) {
  const today = new Date();
  return (
    <View style={styles.monthBar}>
      <ArchiveArrow label="이전 달" onPress={() => onMoveMonth(-1)} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="연월 선택"
        onPress={onOpenPicker}
        hitSlop={8}
      >
        <AppText style={styles.monthText}>
          {month.getFullYear()}.{String(month.getMonth() + 1).padStart(2, "0")}
        </AppText>
      </Pressable>
      <ArchiveArrow
        label="다음 달"
        next
        disabled={isFutureArchiveMonth(
          new Date(month.getFullYear(), month.getMonth() + 1, 1),
          today
        )}
        onPress={() => onMoveMonth(1)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="월 선택"
        onPress={onOpenPicker}
        style={styles.iconButton}
        hitSlop={8}
      >
        <Image
          source={require("@/assets/images/archive/calendar.svg")}
          style={styles.icon}
          accessible={false}
        />
      </Pressable>
    </View>
  );
}

export function ArchiveArrow({
  label,
  onPress,
  next = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  next?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={[styles.iconButton, disabled && styles.disabled]}
    >
      <Image
        source={require("@/assets/images/archive/chevron.svg")}
        style={[styles.icon, next && styles.rotate]}
        accessible={false}
      />
    </Pressable>
  );
}

type PickerProps = {
  visible: boolean;
  month: Date;
  onClose: () => void;
  onMoveYear: (amount: number) => void;
  onSelectMonth: (month: number) => void;
};

export function ArchiveMonthPicker({
  visible,
  month,
  onClose,
  onMoveYear,
  onSelectMonth,
}: PickerProps) {
  const insets = useSafeAreaInsets();
  const today = new Date();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="월 선택 닫기"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          accessibilityLabel="월 선택"
          onAccessibilityEscape={onClose}
          style={styles.picker}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.pickerContent}
          >
            <View style={styles.pickerHeader}>
              <ArchiveArrow label="이전 해" onPress={() => onMoveYear(-1)} />
              <AppText
                accessibilityLiveRegion="polite"
                style={styles.monthText}
              >
                {month.getFullYear()}
              </AppText>
              <ArchiveArrow
                label="다음 해"
                next
                disabled={month.getFullYear() >= today.getFullYear()}
                onPress={() => onMoveYear(1)}
              />
            </View>
            <View style={styles.monthGrid}>
              {Array.from({ length: 12 }, (_, index) => index).map((index) => {
                const disabled = isFutureArchiveMonth(
                  new Date(month.getFullYear(), index, 1),
                  today
                );
                const selected = index === month.getMonth();
                return (
                  <View key={index} style={styles.monthColumn}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${index + 1}월`}
                      accessibilityState={{ selected, disabled }}
                      disabled={disabled}
                      onPress={() => {
                        if (!disabled) onSelectMonth(index);
                      }}
                      style={[
                        styles.monthOption,
                        selected && styles.selectedDay,
                      ]}
                    >
                      <AppText
                        style={[
                          styles.monthOptionText,
                          selected && styles.selectedText,
                          disabled && styles.outside,
                        ]}
                      >
                        {index + 1}월
                      </AppText>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
