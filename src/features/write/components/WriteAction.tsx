import { Pressable } from "react-native";
import { AppText } from "@/components/AppText";
import { styles } from "./WriteAction.styles";
type Props = { title: string; onPress?: () => void; disabled?: boolean };

export function WriteAction({ title, onPress, disabled = false }: Props) {
  const inactive = disabled || !onPress;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        inactive && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <AppText style={[styles.label, inactive && styles.disabledLabel]}>
        {title}
      </AppText>
    </Pressable>
  );
}
