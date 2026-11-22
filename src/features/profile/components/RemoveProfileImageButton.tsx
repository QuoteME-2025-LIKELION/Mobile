import { Pressable, View } from "react-native";
import { styles } from "./RemoveProfileImageButton.styles";

export function RemoveProfileImageButton({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="프로필 이미지 제거"
      disabled={disabled}
      onPress={onPress}
      hitSlop={12}
      style={styles.removeImage}
    >
      <View style={styles.removeCross} pointerEvents="none">
        <View style={[styles.removeStroke, styles.removeForward]} />
        <View style={[styles.removeStroke, styles.removeBackward]} />
      </View>
    </Pressable>
  );
}
