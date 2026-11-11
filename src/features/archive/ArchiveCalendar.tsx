import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { archiveColors, colors, fonts, withOpacity } from '@/constants/theme';

import { archiveDateKey, getCalendarDates, isFutureArchiveDate, isFutureArchiveMonth } from './archiveDate';

type Props = {
  month: Date;
  selectedDate: Date;
  onMoveMonth: (amount: number) => void;
  onSelectDate: (date: Date) => void;
  onOpenPicker: () => void;
};

export function ArchiveCalendar({ month, selectedDate, onMoveMonth, onSelectDate, onOpenPicker }: Props) {
  const today = new Date();
  const selectedKey = archiveDateKey(selectedDate);
  const todayKey = archiveDateKey(today);
  return <View style={styles.calendar}>
    <ArchiveMonthBar month={month} onMoveMonth={onMoveMonth} onOpenPicker={onOpenPicker} />
    <View style={styles.grid}>
      {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => <View key={day} style={styles.column}>
        <AppText style={[styles.weekday, index === 0 && styles.accent]}>{day}</AppText>
      </View>)}
      {getCalendarDates(month).map(date => {
        const key = archiveDateKey(date);
        const selected = key === selectedKey;
        const isToday = key === todayKey;
        const outside = date.getMonth() !== month.getMonth();
        const disabled = isFutureArchiveDate(date, today);
        return <View key={key} style={styles.column}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일${isToday ? ', 오늘' : ''}`}
            accessibilityState={{ selected, disabled }} disabled={disabled}
            onPress={() => { if (!isFutureArchiveDate(date)) onSelectDate(date); }}
            style={[styles.day, isToday && styles.today, selected && styles.selectedDay]}>
            <AppText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
              style={[styles.dayText, outside && styles.outside, isToday && styles.accent, selected && styles.selectedText, disabled && styles.outside]}>{date.getDate()}</AppText>
          </Pressable>
        </View>;
      })}
    </View>
  </View>;
}

export function ArchiveMonthBar({ month, onMoveMonth, onOpenPicker }: Pick<Props, 'month' | 'onMoveMonth' | 'onOpenPicker'>) {
  const today = new Date();
  return (
    <View style={styles.monthBar}>
      <ArchiveArrow label="이전 달" onPress={() => onMoveMonth(-1)} />
      <Pressable accessibilityRole="button" accessibilityLabel="연월 선택" onPress={onOpenPicker} hitSlop={8}>
        <AppText style={styles.monthText}>{month.getFullYear()}.{String(month.getMonth() + 1).padStart(2, '0')}</AppText>
      </Pressable>
      <ArchiveArrow label="다음 달" next disabled={isFutureArchiveMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1), today)} onPress={() => onMoveMonth(1)} />
      <Pressable accessibilityRole="button" accessibilityLabel="월 선택" onPress={onOpenPicker} style={styles.iconButton} hitSlop={8}>
        <Image source={require('@/assets/images/archive/calendar.svg')} style={styles.icon} accessible={false} />
      </Pressable>
    </View>
  );
}

export function ArchiveArrow({ label, onPress, next = false, disabled = false }: { label: string; onPress: () => void; next?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} hitSlop={8} style={[styles.iconButton, disabled && styles.disabled]}>
    <Image source={require('@/assets/images/archive/chevron.svg')} style={[styles.icon, next && styles.rotate]} accessible={false} />
  </Pressable>;
}

type PickerProps = { visible: boolean; month: Date; onClose: () => void; onMoveYear: (amount: number) => void; onSelectMonth: (month: number) => void };
export function ArchiveMonthPicker({ visible, month, onClose, onMoveYear, onSelectMonth }: PickerProps) {
  const insets = useSafeAreaInsets();
  const today = new Date();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
    <View style={[styles.overlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="월 선택 닫기" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View accessibilityViewIsModal accessibilityLabel="월 선택" onAccessibilityEscape={onClose} style={styles.picker}>
        <ScrollView bounces={false} contentContainerStyle={styles.pickerContent}>
          <View style={styles.pickerHeader}>
            <ArchiveArrow label="이전 해" onPress={() => onMoveYear(-1)} />
            <AppText accessibilityLiveRegion="polite" style={styles.monthText}>{month.getFullYear()}</AppText>
            <ArchiveArrow label="다음 해" next disabled={month.getFullYear() >= today.getFullYear()} onPress={() => onMoveYear(1)} />
          </View>
          <View style={styles.monthGrid}>
            {Array.from({ length: 12 }, (_, index) => index).map(index => {
              const disabled = isFutureArchiveMonth(new Date(month.getFullYear(), index, 1), today);
              const selected = index === month.getMonth();
              return <View key={index} style={styles.monthColumn}>
                <Pressable accessibilityRole="button" accessibilityLabel={`${index + 1}월`} accessibilityState={{ selected, disabled }} disabled={disabled}
                  onPress={() => { if (!disabled) onSelectMonth(index); }} style={[styles.monthOption, selected && styles.selectedDay]}>
                  <AppText style={[styles.monthOptionText, selected && styles.selectedText, disabled && styles.outside]}>{index + 1}월</AppText>
                </Pressable>
              </View>;
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  calendar: { backgroundColor: colors.secondary },
  monthBar: { backgroundColor: colors.secondary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 },
  iconButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 24, height: 24 },
  rotate: { transform: [{ rotate: '180deg' }] },
  disabled: { opacity: 0.35 },
  monthText: { paddingHorizontal: 4, fontFamily: fonts.quote, color: colors.black, fontSize: 20, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, paddingHorizontal: 24, paddingBottom: 20 },
  column: { width: '14.285714%', alignItems: 'center' },
  weekday: { color: colors.black, fontSize: 14, fontWeight: '500', lineHeight: 32, textAlign: 'center' },
  accent: { color: archiveColors.calendarAccent },
  day: { width: 44, maxWidth: '100%', height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  today: { backgroundColor: colors.white, borderWidth: 1, borderColor: archiveColors.calendarAccent },
  selectedDay: { backgroundColor: colors.primary, borderWidth: 0 },
  dayText: { color: colors.black, fontSize: 16, lineHeight: 24, fontWeight: '500', textAlign: 'center', paddingHorizontal: 2 },
  outside: { color: colors['grey-200'] },
  selectedText: { color: colors.white },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, backgroundColor: withOpacity(colors.black, 0.38) },
  picker: { width: 298, maxWidth: '100%', maxHeight: '100%', backgroundColor: colors.secondary, borderRadius: 4 },
  pickerContent: { paddingTop: 24, paddingHorizontal: 28, paddingBottom: 16 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 24 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  monthColumn: { width: '25%', paddingHorizontal: 4 },
  monthOption: { minHeight: 44, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  monthOptionText: { color: colors.black, fontSize: 14, lineHeight: 20, fontWeight: '500', textAlign: 'center' },
});
