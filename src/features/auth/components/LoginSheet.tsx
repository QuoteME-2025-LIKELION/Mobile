import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SocialButtons,
  type AuthMode,
  type SocialProvider,
} from './SocialButtons';
import { styles } from './LoginSheet.styles';
type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect?: (provider: SocialProvider, mode: AuthMode) => void;
};

export function LoginSheet({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="로그인 방법 선택 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          accessibilityLabel="로그인 방법 선택"
          onAccessibilityEscape={onClose}
          style={[styles.sheet, { maxHeight: height - insets.top }]}
        >
          <ScrollView
            style={styles.scroll}
            bounces={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: 68 + insets.bottom },
            ]}
          >
            <SocialButtons mode="login" gap={24} onSelect={onSelect} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
