import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, fonts, withOpacity } from '@/constants/theme';

type Props = { visible: boolean; onClose: () => void; onConfirm: () => void; title?: string; description?: string; dismissLabel?: string };

export function ConfirmDialog({ visible, onClose, onConfirm, title = '저장하지 않고 나가시겠어요?', description = '작성한 글은 저장되지 않습니다.', dismissLabel = '계속 작성하기' }: Props) {
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));
  const closing = useRef(false);

  useEffect(() => {
    if (visible) {
      closing.current = false;
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: 300, useNativeDriver: true, isInteraction: false }).start();
    }
    return () => progress.stopAnimation();
  }, [progress, visible]);

  const dismiss = (action: () => void) => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true, isInteraction: false })
      .start(({ finished }) => {
        closing.current = false;
        if (finished) action();
      });
  };
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={() => dismiss(onClose)}
      statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.overlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={dismissLabel} onPress={() => dismiss(onClose)} style={StyleSheet.absoluteFill} />
        <Animated.View accessibilityViewIsModal onAccessibilityEscape={() => dismiss(onClose)}
          style={[styles.card, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <ScrollView contentContainerStyle={styles.content} bounces={false}>
            <AppText accessibilityRole="header" style={styles.title}>{title}</AppText>
            <AppText style={styles.description}>{description}</AppText>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={() => dismiss(onClose)} style={styles.button}>
                <AppText>돌아가기</AppText>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => dismiss(onConfirm)} style={styles.button}>
                <AppText style={styles.confirm}>나가기</AppText>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: withOpacity(colors.black, 0.55) },
  card: { width: 280, maxWidth: '100%', maxHeight: '100%', backgroundColor: colors.secondary, borderRadius: 4, elevation: 5 },
  content: { paddingTop: 26, paddingHorizontal: 24, paddingBottom: 12, gap: 12 },
  title: { fontFamily: fonts.quote, fontSize: 16, lineHeight: 25, fontWeight: '700', textAlign: 'center' },
  description: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  confirm: { color: colors.red },
});
