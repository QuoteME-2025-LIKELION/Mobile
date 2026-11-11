import { Image, type ImageSource } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, fonts } from '@/constants/theme';

import { FeedCard } from './FeedCard';
import { previewFeed } from './homePreviewData';
import { TodayQuote } from './TodayQuote';

// /home은 개발 빌드 전용. 월 길게 누르기: 작성 전 → 작성 후 → 친구 없음.
export function HomePreview() {
  const [scenario, setScenario] = useState(0);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <HeaderButton label="아카이브" source={require('@/assets/images/home/archive.svg')} />
        <View style={styles.headerActions}>
          <HeaderButton label="알림" source={require('@/assets/images/home/notification.svg')} />
          <HeaderButton label="메뉴" source={require('@/assets/images/home/menu.svg')} />
        </View>
      </View>
      <ScrollView onScrollBeginDrag={() => setTagMenuOpen(false)} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <TodayQuote tagMenuOpen={tagMenuOpen} onTagMenuChange={setTagMenuOpen} posted={scenario === 1} onNextScenario={() => setScenario(value => (value + 1) % 3)} />
        <View style={styles.feed} onTouchStart={() => setTagMenuOpen(false)}>
          <View style={styles.filterRow}>
            <Image source={require('@/assets/images/home/funnel.svg')} style={styles.filterIcon} contentFit="contain" accessible={false} />
            <AppText style={styles.filter}>전체보기</AppText>
          </View>
          {scenario === 2 ? <View style={styles.empty}>
            <AppText style={styles.emptyText}>친구를 추가하면 매일 피드에서{'\n'}명언을 확인할 수 있어요</AppText>
            <Pressable accessibilityRole="button" disabled accessibilityState={{ disabled: true }} style={styles.addFriend}>
              <AppText style={styles.addFriendText}>친구 추가</AppText>
            </Pressable>
          </View> : previewFeed.map(item => <FeedCard key={item.id} item={item} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeaderButton({ label, source }: { label: string; source: ImageSource }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled accessibilityState={{ disabled: true }} style={styles.headerButton}>
      <Image source={source} style={styles.headerIcon} contentFit="contain" accessible={false} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 60 },
  headerActions: { flexDirection: 'row' },
  headerButton: { minWidth: 40, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  headerIcon: { width: 20, height: 22 },
  scroll: { flex: 1, backgroundColor: colors.secondary },
  scrollContent: { flexGrow: 1 },
  feed: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, gap: 20 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterIcon: { width: 16, height: 16 },
  filter: { color: colors.black, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  empty: { marginTop: 176, alignItems: 'center', gap: 12 },
  emptyText: { fontFamily: fonts.quote, color: colors.territory, textAlign: 'center', fontSize: 16, lineHeight: 28.8, letterSpacing: -0.28 },
  addFriend: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  addFriendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
