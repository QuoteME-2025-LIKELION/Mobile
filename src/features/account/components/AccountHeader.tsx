import { Pressable, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { styles } from './AccountHeader.styles';
export function AccountHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로"
        onPress={onBack}
        hitSlop={10}
        style={styles.backButton}
      >
        <View style={styles.chevron} />
      </Pressable>
      <AppText accessibilityRole="header" style={styles.title}>
        계정 관리
      </AppText>
      <View style={styles.spacer} />
    </View>
  );
}
