import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import {
  ArchiveArrow,
  ArchiveCalendar,
  ArchiveMonthBar,
  ArchiveMonthPicker,
} from '../components/ArchiveCalendar';
import { type ArchiveTab } from '../fixtures/archiveFixtures';
import { ArchiveQuoteCard } from '../components/ArchiveQuoteCard';
import { styles } from './ArchiveScreen.styles';
import { useArchive } from '../hooks/useArchive';

const TABS: { id: ArchiveTab; label: string }[] = [
  { id: 'all', label: '전체보기' },
  { id: 'mine', label: '나의 명언' },
  { id: 'bookmarks', label: '북마크' },
];

export function ArchiveScreen() {
  const {
    insets,
    selection,
    pickerOpen,
    tab,
    scrollRef,
    quotes,
    emptyMessage,
    moveMonth,
    selectDate,
    moveYear,
    selectMonth,
    goBack,
    openMonthPicker,
    closeMonthPicker,
    selectTab,
  } = useArchive();
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <ArchiveArrow label="홈으로 돌아가기" onPress={goBack} />
        <AppText accessibilityRole="header" style={styles.title}>
          아카이브
        </AppText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {tab === 'all' ? (
          <ArchiveCalendar
            month={selection.month}
            selectedDate={selection.date}
            onMoveMonth={moveMonth}
            onSelectDate={selectDate}
            onOpenPicker={openMonthPicker}
          />
        ) : (
          <ArchiveMonthBar
            month={selection.month}
            onMoveMonth={moveMonth}
            onOpenPicker={openMonthPicker}
          />
        )}
        <View style={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
          <View style={styles.tabs}>
            {TABS.map(({ id, label }) => (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === id }}
                onPress={() => selectTab(id)}
                style={[styles.tab, tab === id && styles.activeTab]}
              >
                <AppText
                  style={[styles.tabText, tab === id && styles.activeText]}
                >
                  {label}
                </AppText>
              </Pressable>
            ))}
          </View>
          {quotes.length ? (
            quotes.map((quote) => (
              <ArchiveQuoteCard
                key={quote.id}
                quote={quote}
                showOriginalContent={tab === 'mine'}
              />
            ))
          ) : (
            <AppText style={styles.empty}>{emptyMessage}</AppText>
          )}
        </View>
      </ScrollView>
      <ArchiveMonthPicker
        visible={pickerOpen}
        month={selection.month}
        onClose={closeMonthPicker}
        onMoveYear={moveYear}
        onSelectMonth={selectMonth}
      />
    </SafeAreaView>
  );
}
