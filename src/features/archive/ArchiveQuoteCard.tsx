import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { QuoteText } from '@/components/QuoteText';
import { colors, fonts, withOpacity } from '@/constants/theme';

import type { PreviewArchiveQuote } from './archivePreviewData';

export function ArchiveQuoteCard({ quote }: { quote: PreviewArchiveQuote }) {
  return <View style={styles.card}>
    <AppText style={styles.author}>{quote.nickname} ({quote.birthYear}~)</AppText>
    <QuoteText key={quote.content} content={quote.content} />
    <View style={styles.actions}>
      <View style={styles.tags}>
        <Image source={require('@/assets/images/feed/own-user.svg')} style={styles.icon} accessible={false} />
        <View style={styles.names}>
          {quote.tags.map(name => <AppText key={name} style={styles.tag}>{name}</AppText>)}
          {quote.tags.length > 0 && <AppText style={styles.tag}>+</AppText>}
        </View>
      </View>
      <View style={styles.buttons}>
        <Pressable disabled accessibilityRole="button" accessibilityLabel="북마크" accessibilityState={{ disabled: true }} hitSlop={8}>
          <Image source={require('@/assets/images/feed/own-bookmark-outline.svg')} style={styles.icon} accessible={false} />
        </Pressable>
        <Pressable disabled accessibilityRole="button" accessibilityLabel="공유하기" accessibilityState={{ disabled: true }} hitSlop={8}>
          <Image source={require('@/assets/images/feed/own-share.svg')} style={styles.icon} accessible={false} />
        </Pressable>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { width: '100%', paddingTop: 18, gap: 16 },
  author: { paddingHorizontal: 4, fontFamily: fonts.quote, color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: -0.28 },
  actions: { flexDirection: 'row', minHeight: 36, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 8, gap: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: withOpacity(colors.white, 0.62) },
  tags: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  names: { flexShrink: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { color: colors.white, fontSize: 12, lineHeight: 18, fontWeight: '500', letterSpacing: -0.24 },
  buttons: { flexDirection: 'row', gap: 10 },
  icon: { width: 16, height: 16 },
});
