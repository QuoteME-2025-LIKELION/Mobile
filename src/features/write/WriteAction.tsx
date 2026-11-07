import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, withOpacity } from '@/constants/theme';

type Props = { title: string; onPress?: () => void; disabled?: boolean };

export function WriteAction({ title, onPress, disabled = false }: Props) {
  const inactive = disabled || !onPress;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: inactive }} disabled={inactive}
      onPress={onPress} style={({ pressed }) => [styles.button, inactive && styles.disabled, pressed && styles.pressed]}>
      <AppText style={[styles.label, inactive && styles.disabledLabel]}>{title}</AppText>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: colors.primary, paddingHorizontal: 8, paddingVertical: 10 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500', textAlign: 'center' },
  disabled: { borderColor: colors['grey-100'] },
  disabledLabel: { color: colors['grey-200'] },
  pressed: { backgroundColor: withOpacity(colors.primary, 0.08) },
});
