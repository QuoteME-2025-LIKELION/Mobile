import { Image, type ImageSource } from 'expo-image';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, fonts } from '@/constants/theme';

import { FeedCard } from './FeedCard';
import { HomeDrawer } from './HomeDrawer';
import { filterPreviewFeed, previewFeed, previewGroups } from './homePreviewData';
import { GroupFilter } from './GroupFilter';
import { TodayQuote } from './TodayQuote';

// /home은 개발 빌드 전용. 월 길게 누르기: 작성 전 → 작성 후 → 친구 없음.
export function HomePreview() {
  const [scenario, setScenario] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const groups = scenario === 2 ? [] : previewGroups;
  const items = filterPreviewFeed(scenario === 2 ? [] : previewFeed, groups, selectedGroupId);
  const closeMenus = () => { setFilterOpen(false); setTagMenuOpen(false); };
  const nextScenario = () => {
    closeMenus();
    setSelectedGroupId(null);
    setScenario(value => (value + 1) % 3);
  };
  useEffect(() => {
    if (!filterOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setFilterOpen(false);
      return true;
    });
    return () => subscription.remove();
  }, [filterOpen]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header} onTouchStart={closeMenus}>
        <HeaderButton label="아카이브" source={require('@/assets/images/home/archive.svg')} />
        <View style={styles.headerActions}>
          <HeaderButton label="알림" source={require('@/assets/images/home/notification.svg')} />
          <HeaderButton label="메뉴" source={require('@/assets/images/home/menu.svg')} onPress={() => { closeMenus(); setDrawerOpen(true); }} />
        </View>
      </View>
      <ScrollView onScrollBeginDrag={closeMenus} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={{ zIndex: tagMenuOpen ? 4 : 0 }} onTouchStart={() => setFilterOpen(false)}>
          <TodayQuote tagMenuOpen={tagMenuOpen} onTagMenuChange={setTagMenuOpen}
            posted={scenario === 1} onNextScenario={nextScenario} />
        </View>
        <View style={styles.feed} onTouchStart={() => setTagMenuOpen(false)}>
          {filterOpen && <Pressable accessibilityRole="button" accessibilityLabel="그룹 필터 닫기" style={styles.dismissFilter} onPress={() => setFilterOpen(false)} />}
          <GroupFilter groups={groups} selectedId={selectedGroupId} open={filterOpen}
            onToggle={() => { setTagMenuOpen(false); setFilterOpen(value => !value); }}
            onSelect={id => { setSelectedGroupId(id); setFilterOpen(false); }} />
          {items.length === 0 ? <View style={styles.empty}>
            <AppText style={styles.emptyText}>{selectedGroupId === null ? '친구를 추가하면 매일 피드에서\n명언을 확인할 수 있어요' : '아직 함께 볼 그룹 멤버가 없어요.'}</AppText>
            {selectedGroupId === null ? <Pressable accessibilityRole="button" disabled accessibilityState={{ disabled: true }} style={styles.addFriend}>
              <AppText style={styles.addFriendText}>친구 추가</AppText>
            </Pressable> : <AppText style={styles.emptySubText}>다른 멤버가 참여하면 서로의 명언을 이곳에서 볼 수 있어요.</AppText>}
          </View> : items.map(item => <FeedCard key={item.id} item={item} />)}
        </View>
      </ScrollView>
      <HomeDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

function HeaderButton({ label, source, onPress }: { label: string; source: ImageSource; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={!onPress} accessibilityState={{ disabled: !onPress }} style={styles.headerButton}>
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
  feed: { zIndex: 3, flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, gap: 20 },
  dismissFilter: { ...StyleSheet.absoluteFill, zIndex: 1 },
  emptySubText: { color: colors['grey-400'], fontSize: 14, lineHeight: 21, textAlign: 'center', letterSpacing: -0.28 },
  empty: { marginTop: 176, alignItems: 'center', gap: 12 },
  emptyText: { fontFamily: fonts.quote, color: colors.territory, textAlign: 'center', fontSize: 16, lineHeight: 28.8, letterSpacing: -0.28 },
  addFriend: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  addFriendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
