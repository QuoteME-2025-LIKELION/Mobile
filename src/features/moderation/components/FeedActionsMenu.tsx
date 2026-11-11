import { Image } from "expo-image";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import type { MenuAnchor } from "../hooks/useFeedModeration";
import { styles } from "./FeedActionsMenu.styles";
export function FeedActionsMenu({
  anchor,
  canReport,
  onReport,
  onBlock,
  onClose,
}: {
  anchor: MenuAnchor;
  canReport: boolean;
  onReport: () => void;
  onBlock: () => void;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const menuHeight = canReport ? 100 : 56;
  const left = Math.max(
    16,
    Math.min(anchor.x + anchor.width - 132, width - 148)
  );
  const top = Math.max(
    insets.top + 8,
    Math.min(
      anchor.y + anchor.height + 8,
      height - insets.bottom - menuHeight - 8
    )
  );
  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="명언 메뉴 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[styles.menu, { left, top }]}
        >
          {canReport && (
            <Pressable
              accessibilityRole="button"
              onPress={onReport}
              style={styles.item}
            >
              <Image
                source={require("@/assets/images/moderation/report.svg")}
                style={styles.icon}
                accessible={false}
              />
              <AppText style={styles.label}>신고하기</AppText>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onBlock}
            style={styles.item}
          >
            <Image
              source={require("@/assets/images/moderation/block.svg")}
              style={styles.icon}
              accessible={false}
            />
            <AppText style={styles.label}>차단하기</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
