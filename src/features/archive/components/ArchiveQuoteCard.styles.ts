import { StyleSheet } from 'react-native';
import { colors, fonts, withOpacity } from '@/styles/theme';

export const styles = StyleSheet.create({
  card: { width: '100%', paddingTop: 18, gap: 16 },
  author: {
    paddingHorizontal: 4,
    fontFamily: fonts.quote,
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: -0.28,
  },
  original: {
    alignSelf: 'stretch',
    paddingHorizontal: 4,
    color: colors.white,
    fontSize: 13,
    lineHeight: 20.15,
    fontWeight: '500',
    letterSpacing: -0.26,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: withOpacity(colors.white, 0.62),
  },
  tags: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  names: { flexShrink: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.24,
  },
  buttons: { flexDirection: 'row', gap: 10 },
  icon: { width: 16, height: 16 },
});
