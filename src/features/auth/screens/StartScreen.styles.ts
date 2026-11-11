import { StyleSheet } from 'react-native';
import { colors, fonts } from '@/styles/theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 76 },
  brand: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 0,
  },
  // 공통 본문 줄 높이를 해제하고 글꼴 고유 높이로 Q의 아래 꼬리까지 표시한다.
  logo: {
    fontFamily: fonts.quote,
    fontSize: 48,
    lineHeight: undefined,
    includeFontPadding: true,
    color: colors.white,
  },
  tagline: { color: colors.white, textAlign: 'center', fontWeight: '500' },
  actions: { gap: 14 },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22,
  },
  textButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  login: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
});
