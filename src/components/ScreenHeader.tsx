import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { styles } from "./ScreenHeader.styles";
export function ScreenHeader({
  onBack,
  title,
  light = false,
}: {
  onBack: () => void;
  title: string;
  light?: boolean;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로"
        onPress={onBack}
        hitSlop={10}
        style={styles.backButton}
      >
        <View style={[styles.chevron, light && styles.lightChevron]} />
      </Pressable>
      <AppText
        accessibilityRole="header"
        style={[styles.title, light && styles.lightTitle]}
      >
        {title}
      </AppText>
      <View style={styles.spacer} />
    </View>
  );
}
