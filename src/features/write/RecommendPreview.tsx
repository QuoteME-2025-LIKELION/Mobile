import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, fonts } from '@/constants/theme';

import type { RecommendationStatus } from './recommendationPreview';
import { WriteAction } from './WriteAction';

type Props = {
  status: RecommendationStatus;
  recommendations: readonly string[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onRefresh: () => void;
  onBack: () => void;
  onNext: () => void;
};

const messages: Partial<Record<RecommendationStatus, string>> = {
  loading: 'AI 추천을 불러오는 중입니다.',
  empty: '추천 결과가 없어요. 사용 횟수는 차감되지 않았으니 다시 시도해 주세요.',
  error: 'AI 추천을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  exhausted: '오늘 AI 추천 횟수를 모두 사용했어요.',
};

export function RecommendPreview({ status, recommendations, selectedIndex, onSelect, onRefresh, onBack, onNext }: Props) {
  const busy = status === 'loading';
  const refreshDisabled = busy || status === 'exhausted';
  const canContinue = status === 'success' && selectedIndex !== null && recommendations[selectedIndex] !== undefined;
  return (
    <View style={styles.container}>
      <AppText accessibilityRole="header" style={styles.title}>AI 명언 추천</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={status === 'exhausted' ? '오늘 AI 추천 횟수 소진' : 'AI 추천 다시 받기'}
        accessibilityState={{ disabled: refreshDisabled, busy }} disabled={refreshDisabled}
        onPress={onRefresh} style={[styles.refresh, refreshDisabled && styles.disabled]}>
        <Image source={require('@/assets/images/write/refresh.svg')} style={styles.refreshIcon} accessible={false} />
        <AppText style={styles.usage}>-/-</AppText>
      </Pressable>
      {messages[status] && <View accessibilityLiveRegion="polite" style={styles.status}>
        {busy && <ActivityIndicator color={colors.primary} />}
        <AppText style={styles.statusText}>{messages[status]}</AppText>
      </View>}
      {status === 'success' && recommendations.map((text, index) => {
        const selected = selectedIndex === index;
        return <Pressable key={text} accessibilityRole="button" accessibilityLabel={text}
          accessibilityState={{ selected }} onPress={() => onSelect(index)}
          style={({ pressed }) => [styles.card, selected && styles.selectedCard, pressed && !selected && styles.pressedCard]}>
          <Image source={require('@/assets/images/write/quote-open.svg')} accessible={false}
            tintColor={selected ? colors.white : colors.black} style={styles.quoteIcon} />
          <AppText style={[styles.quote, selected && styles.selectedText]}>{text}</AppText>
          <Image source={require('@/assets/images/write/quote-close.svg')} accessible={false}
            tintColor={selected ? colors.white : colors.black} style={styles.quoteIcon} />
        </Pressable>;
      })}
      <View style={styles.actions}>
        <WriteAction title="뒤로가기" onPress={onBack} />
        <WriteAction title="다음으로" disabled={!canContinue} onPress={() => { if (canContinue) onNext(); }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: 14 },
  title: { fontFamily: fonts.quote, fontSize: 20, lineHeight: 24, textAlign: 'center', marginBottom: 4 },
  refresh: { flexDirection: 'row', gap: 6, minWidth: 64, minHeight: 44, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  refreshIcon: { width: 16, height: 16 },
  usage: { fontSize: 12, lineHeight: 17, color: colors.primary, fontWeight: '500' },
  disabled: { opacity: 0.5 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 2, borderWidth: 1, borderColor: colors.white, backgroundColor: colors.white },
  selectedCard: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressedCard: { backgroundColor: colors['grey-100'] },
  quoteIcon: { width: 11, height: 10, flexShrink: 0, transform: [{ translateY: -2 }] },
  quote: { flex: 1, fontFamily: fonts.quote, fontSize: 15, lineHeight: 21, textAlign: 'center', color: colors.black },
  selectedText: { color: colors.white },
  status: { minHeight: 100, paddingVertical: 16, gap: 12, justifyContent: 'center' },
  statusText: { fontFamily: fonts.quote, fontSize: 14, lineHeight: 21, textAlign: 'center', color: colors.territory },
  actions: { flexDirection: 'row', gap: 12, marginTop: 'auto', paddingTop: 10 },
});
