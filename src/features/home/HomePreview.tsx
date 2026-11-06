import { Image, type ImageSource } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, fonts } from '@/constants/theme';

// API 결과가 아닌 화면 개발용 빈 상태. 계정·인증·서버 데이터를 만들지 않는다.
export function HomePreview() {
  const today = new Date();
  const month = today.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
  const weekday = today.toLocaleDateString('ko-KR', { weekday: 'long' });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <HeaderButton label="아카이브" source={require('@/assets/images/home/archive.svg')} />
        <View style={styles.headerActions}>
          <HeaderButton label="알림" source={require('@/assets/images/home/notification.svg')} />
          <HeaderButton label="메뉴" source={require('@/assets/images/home/menu.svg')} />
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.quoteCard}>
          <AppText style={styles.month}>{month}</AppText>
          <AppText style={styles.weekday}>{weekday}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="오늘의 명언 작성"
            disabled accessibilityState={{ disabled: true }} style={styles.quoteRow}>
            <AppText style={styles.day}>{today.getDate()}</AppText>
            <View style={styles.quoteLines}>
              <AppText style={styles.quoteLine}>오늘 있었던 일을 바탕으로</AppText>
              <AppText style={styles.quoteLine}>나만의 명언을 남겨보세요.</AppText>
            </View>
          </Pressable>
          <View style={styles.rule} />
        </View>
        <View style={styles.feed}>
          <View style={styles.filterRow}>
            <Image source={require('@/assets/images/home/funnel.svg')} style={styles.filterIcon} contentFit="contain" accessible={false} />
            <AppText style={styles.filter}>전체보기</AppText>
          </View>
          <View style={styles.empty}>
            <AppText style={styles.emptyText}>친구를 추가하면 매일 피드에서{'\n'}명언을 확인할 수 있어요</AppText>
            <Pressable accessibilityRole="button" disabled accessibilityState={{ disabled: true }} style={styles.addFriend}>
              <AppText style={styles.addFriendText}>친구 추가</AppText>
            </Pressable>
          </View>
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
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  quoteCard: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
  month: { fontFamily: fonts.date, color: colors.white, fontSize: 36, lineHeight: 36, letterSpacing: -0.72, textAlign: 'center' },
  weekday: { fontFamily: fonts.quote, color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 12, letterSpacing: -0.24, textAlign: 'center', marginTop: 8, marginBottom: 14 },
  quoteRow: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  day: { fontFamily: fonts.date, color: colors.white, fontSize: 75, lineHeight: 72, width: 66, letterSpacing: -1.5, transform: [{ translateY: -7 }], textAlign: 'center' },
  quoteLines: { flex: 1 },
  quoteLine: { fontFamily: fonts.quote, color: 'rgba(255,255,255,0.7)', textAlign: 'center', borderTopWidth: 1, borderColor: colors.white, paddingVertical: 9, paddingHorizontal: 12, minHeight: 40, fontSize: 14, lineHeight: 21 },
  rule: { borderTopWidth: 1, borderColor: colors.white, minHeight: 36 },
  feed: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, gap: 20 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterIcon: { width: 16, height: 16 },
  filter: { color: colors.black, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  empty: { marginTop: 176, alignItems: 'center', gap: 12 },
  emptyText: { fontFamily: fonts.quote, color: '#959595', textAlign: 'center', fontSize: 16, lineHeight: 28.8, letterSpacing: -0.28 },
  addFriend: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  addFriendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
