import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { colors } from '@/styles/theme';
import { styles } from './ActionButton.styles';
type Props = {
  title: string;
  onPress?: () => void;
  backgroundColor?: string;
  icon?: ReactNode;
  bordered?: boolean;
};

export function ActionButton({
  title,
  onPress,
  icon,
  bordered = false,
  backgroundColor = colors.white,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      hitSlop={2}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        bordered && styles.bordered,
        pressed && styles.pressed,
      ]}
    >
      {icon && <View accessible={false}>{icon}</View>}
      <AppText style={styles.label}>{title}</AppText>
    </Pressable>
  );
}
