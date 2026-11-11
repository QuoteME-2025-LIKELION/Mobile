import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, fonts, withOpacity } from '@/constants/theme';

import { ArchiveArrow, ArchiveCalendar, ArchiveMonthPicker } from './ArchiveCalendar';
import { getArchiveDateInMonth, getArchiveMonthInYear, isFutureArchiveDate, isFutureArchiveMonth } from './archiveDate';
import { getPreviewArchives } from './archivePreviewData';
import { ArchiveQuoteCard } from './ArchiveQuoteCard';

export function ArchivePreview() {
  const insets = useSafeAreaInsets();
  const [selection, setSelection] = useState(() => {
    const today = new Date();
    return { month: new Date(today.getFullYear(), today.getMonth(), 1), date: today };
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const quotes = getPreviewArchives(selection.date);

  const moveMonth = (amount: number) => setSelection(prev => {
    const month = new Date(prev.month.getFullYear(), prev.month.getMonth() + amount, 1);
    if (isFutureArchiveMonth(month)) return prev;
    return { month, date: getArchiveDateInMonth(prev.date, month.getFullYear(), month.getMonth()) };
  });
  const selectDate = (date: Date) => {
    if (isFutureArchiveDate(date)) return;
    setSelection({ date, month: new Date(date.getFullYear(), date.getMonth(), 1) });
  };
  const moveYear = (amount: number) => setSelection(prev => {
    const month = getArchiveMonthInYear(prev.month, prev.month.getFullYear() + amount);
    if (!month) return prev;
    return { month, date: getArchiveDateInMonth(prev.date, month.getFullYear(), month.getMonth()) };
  });
  const selectMonth = (index: number) => {
    const month = new Date(selection.month.getFullYear(), index, 1);
    if (isFutureArchiveMonth(month)) return;
    setSelection(prev => ({ month, date: getArchiveDateInMonth(prev.date, month.getFullYear(), index) }));
    setPickerOpen(false);
  };

  return <SafeAreaView edges={['top']} style={styles.screen}>
    <StatusBar style="dark" />
    <View style={styles.header}>
      <ArchiveArrow label="홈으로 돌아가기" onPress={() => router.canGoBack() ? router.back() : router.replace('/home')} />
      <AppText accessibilityRole="header" style={styles.title}>아카이브</AppText>
      <View style={styles.headerSpacer} />
    </View>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <ArchiveCalendar month={selection.month} selectedDate={selection.date} onMoveMonth={moveMonth} onSelectDate={selectDate} onOpenPicker={() => setPickerOpen(true)} />
      <View style={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        <View style={styles.tabs}>
          {['전체보기', '나의 명언', '북마크'].map((label, index) => <Pressable key={label} accessibilityRole="tab"
            accessibilityState={{ selected: index === 0, disabled: index !== 0 }} disabled={index !== 0}
            style={[styles.tab, index === 0 && styles.activeTab]}>
            <AppText style={[styles.tabText, index === 0 && styles.activeText]}>{label}</AppText>
          </Pressable>)}
        </View>
        {quotes.length ? quotes.map(quote => <ArchiveQuoteCard key={quote.id} quote={quote} />)
          : <AppText style={styles.empty}>이날 작성된 명언이 없어요</AppText>}
      </View>
    </ScrollView>
    <ArchiveMonthPicker visible={pickerOpen} month={selection.month} onClose={() => setPickerOpen(false)} onMoveYear={moveYear} onSelectMonth={selectMonth} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  header: { minHeight: 60, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { flex: 1, paddingHorizontal: 4, textAlign: 'center', fontFamily: fonts.quote, color: colors.black, fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.36 },
  headerSpacer: { width: 28 },
  scroll: { flex: 1, backgroundColor: colors.primary },
  scrollContent: { flexGrow: 1 },
  content: { flexGrow: 1, backgroundColor: colors.primary, paddingHorizontal: 24 },
  tabs: { flexDirection: 'row', gap: 8, paddingTop: 14 },
  tab: { flex: 1, minWidth: 0, minHeight: 46, paddingVertical: 5, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'transparent' },
  activeTab: { borderColor: withOpacity(colors.white, 0.62) },
  tabText: { alignSelf: 'stretch', paddingHorizontal: 4, fontFamily: fonts.quote, color: withOpacity(colors.white, 0.55), fontSize: 16, lineHeight: 22, fontWeight: '700', letterSpacing: -0.32, textAlign: 'center' },
  activeText: { color: colors.white },
  empty: { marginTop: 128, paddingHorizontal: 4, color: colors.white, fontFamily: fonts.quote, fontSize: 16, lineHeight: 24, fontWeight: '500', letterSpacing: -0.32, textAlign: 'center' },
});
