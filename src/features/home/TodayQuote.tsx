import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, fonts, withOpacity } from '@/constants/theme';

import { FeedIcon } from './FeedCard';
import { previewMyQuote, splitHomeQuote } from './homePreviewData';

type Props = { posted: boolean; onNextScenario: () => void; tagMenuOpen: boolean; onTagMenuChange: (open: boolean) => void };

export function TodayQuote({ posted, onNextScenario, tagMenuOpen, onTagMenuChange }: Props) {
  const today = new Date();
  const lines = posted ? splitHomeQuote(previewMyQuote.content) : ['오늘 있었던 일을 바탕으로', '명언을 남겨보세요'];
  const closeTags = () => onTagMenuChange(false);

  return <View style={styles.card}>
    <Pressable accessibilityLabel="월 표시, 길게 눌러 개발 화면 전환" accessibilityRole="button"
      onPress={closeTags} onLongPress={() => { closeTags(); onNextScenario(); }}>
      <AppText style={styles.month}>{today.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()}</AppText>
    </Pressable>
    <AppText style={styles.weekday}>{today.toLocaleDateString('ko-KR', { weekday: 'long' })}</AppText>
    <Pressable accessibilityRole="button" accessibilityLabel={posted ? '오늘의 명언' : '오늘의 명언 작성'}
      disabled={posted} accessibilityState={{ disabled: posted }}
      onPress={() => router.push('/write')} style={styles.quoteRow}>
      <AppText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.day}>{today.getDate()}</AppText>
      <View style={styles.lines}>{lines.map((line, index) => <View key={index} style={styles.line}>
        <AppText style={[styles.text, !posted && styles.placeholder]}>{line}</AppText>
      </View>)}</View>
    </Pressable>
    <View style={styles.bottom}>
      {posted && <>
        <Pressable accessibilityRole="button" accessibilityLabel={`태그된 친구 ${previewMyQuote.tags.length}명`}
          accessibilityState={{ expanded: tagMenuOpen }} onPress={() => onTagMenuChange(!tagMenuOpen)} style={styles.tagButton} hitSlop={8}>
          <Image source={require('@/assets/images/feed/own-user.svg')} style={styles.userIcon} accessible={false} />
          <AppText style={styles.tagCount}>{previewMyQuote.tags.length}</AppText>
        </Pressable>
        <View style={styles.author}>
          <View style={styles.divider} />
          <AppText numberOfLines={1} style={styles.authorText}>{previewMyQuote.nickname}({previewMyQuote.birthYear}~)</AppText>
        </View>
        <View style={styles.actions}>
          <FeedIcon label="내 명언 북마크" source={require('@/assets/images/feed/own-bookmark-outline.svg')} />
          <FeedIcon label="내 명언 공유하기" source={require('@/assets/images/feed/own-share.svg')} />
        </View>
      </>}
    </View>
    {posted && tagMenuOpen && <>
      <Pressable accessibilityRole="button" accessibilityLabel="태그 목록 닫기" style={styles.dismiss} onPress={closeTags} />
      <View style={styles.tagMenu}>
        {previewMyQuote.tags.map(name => <View key={name} style={styles.tagName}><AppText style={styles.tagNameText}>{name}</AppText></View>)}
        <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={styles.editTag}>
          <AppText style={styles.editText}>수정하기</AppText>
        </Pressable>
      </View>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20, zIndex: 2 },
  month: { fontFamily: fonts.date, color: colors.white, fontSize: 36, lineHeight: 36, letterSpacing: -0.72, textAlign: 'center' },
  weekday: { fontFamily: fonts.quote, color: withOpacity(colors.white, 0.6), fontSize: 12, lineHeight: 12, letterSpacing: -0.24, textAlign: 'center', marginTop: 8, marginBottom: 14 },
  quoteRow: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  day: { fontFamily: fonts.date, color: colors.white, fontSize: 75, lineHeight: 72, width: 66, flexShrink: 0, letterSpacing: -1.5, transform: [{ translateY: -7 }], textAlign: 'center' },
  lines: { flex: 1 },
  line: { minHeight: 40, borderTopWidth: 1, borderColor: colors.white, paddingHorizontal: 12, justifyContent: 'center', paddingVertical: 8 },
  text: { fontFamily: fonts.quote, color: colors.white, fontSize: 14, lineHeight: 24, textAlign: 'center' },
  placeholder: { color: withOpacity(colors.white, 0.7) },
  bottom: { minHeight: 36, borderTopWidth: 1, borderColor: colors.white, flexDirection: 'row', alignItems: 'center', paddingTop: 12, gap: 10 },
  tagButton: { flexDirection: 'row', gap: 6, alignItems: 'center', minWidth: 32 },
  userIcon: { width: 16, height: 16 },
  tagCount: { color: colors.white, fontSize: 12, fontWeight: '500' },
  author: { flex: 1, minWidth: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14 },
  divider: { width: 24, height: 1, backgroundColor: withOpacity(colors.white, 0.72) },
  authorText: { flexShrink: 1, fontFamily: fonts.quote, color: colors.white, fontSize: 13, letterSpacing: -0.26 },
  actions: { flexDirection: 'row', gap: 14 },
  dismiss: { ...StyleSheet.absoluteFill, zIndex: 3 },
  tagMenu: { position: 'absolute', bottom: -102, left: 24, width: 132, backgroundColor: colors.white, borderRadius: 4, overflow: 'hidden', zIndex: 4, elevation: 5, boxShadow: `0 4px 14px ${withOpacity(colors.black, 0.14)}` },
  tagName: { minHeight: 36, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderColor: colors['grey-100'], paddingHorizontal: 12 },
  tagNameText: { color: colors.territory, fontSize: 13, fontWeight: '500' },
  editTag: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  editText: { color: colors.black, fontSize: 13, fontWeight: '500' },
});
