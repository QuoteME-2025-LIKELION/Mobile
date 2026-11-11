import { StyleSheet } from 'react-native';
import { colors, overlays } from '@/styles/theme';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: overlays.loginBackdrop,
  },
  sheet: {
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
  },
  // ScrollView의 기본 flexGrow로 시트가 늘어나거나 내용이 잘리지 않도록 제한한다.
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingHorizontal: 24, paddingTop: 36 },
});
