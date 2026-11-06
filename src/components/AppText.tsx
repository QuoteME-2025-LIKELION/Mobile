import type { TextProps } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/constants/theme';

export function AppText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.text, style]} />;
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.body, color: colors.black, fontSize: 14, lineHeight: 22 },
});
