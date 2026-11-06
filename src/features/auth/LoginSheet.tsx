import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { SocialButtons, type AuthMode, type SocialProvider } from './SocialButtons';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect?: (provider: SocialProvider, mode: AuthMode) => void;
};

export function LoginSheet({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}
      statusBarTranslucent navigationBarTranslucent>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="로그인 방법 선택 닫기"
          onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal accessibilityLabel="로그인 방법 선택" onAccessibilityEscape={onClose}
          style={[styles.sheet, { maxHeight: height - insets.top }]}>
          <ScrollView style={styles.scroll} bounces={false}
            contentContainerStyle={[styles.content, { paddingBottom: 68 + insets.bottom }]}>
            <SocialButtons mode="login" gap={24} onSelect={onSelect} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,31,49,0.28)' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden' },
  // ScrollView의 기본 flexGrow로 시트가 늘어나거나 내용이 잘리지 않도록 제한한다.
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingHorizontal: 24, paddingTop: 36 },
});
