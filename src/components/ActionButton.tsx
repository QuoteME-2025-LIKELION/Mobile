import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors } from '@/constants/theme';

type Props = {
  title: string;
  onPress?: () => void;
  backgroundColor?: string;
  icon?: ReactNode;
  bordered?: boolean;
};

export function ActionButton({ title, onPress, icon, bordered = false, backgroundColor = colors.white }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !onPress }} disabled={!onPress} onPress={onPress} hitSlop={2}
      style={({ pressed }) => [styles.button, { backgroundColor }, bordered && styles.bordered, pressed && styles.pressed]}>
      {icon && <View accessible={false}>{icon}</View>}
      <AppText style={styles.label}>{title}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44, flexShrink: 0, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  label: { fontSize: 14, lineHeight: 21, letterSpacing: -0.28, fontWeight: '500', textAlign: 'center' },
  bordered: { borderWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.7 },
});
