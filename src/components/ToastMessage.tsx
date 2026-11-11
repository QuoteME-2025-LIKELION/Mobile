import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "./AppText";
import { styles } from "./ToastMessage.styles";

// Frontend ToastModal의 기본 snackbar: 0.3초 등장 + 0.9초 유지 + 0.3초 퇴장.
export function ToastMessage({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!message) return;
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: 300,
        easing: Easing.bezier(0, 0, 0.58, 1),
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.delay(900),
      Animated.timing(progress, {
        toValue: 0,
        duration: 300,
        easing: Easing.bezier(0.42, 0, 1, 1),
        useNativeDriver: true,
        isInteraction: false,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) closeRef.current();
    });
    return () => animation.stop();
  }, [message, progress]);
  if (!message) return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.overlay, { paddingBottom: insets.bottom + 72 }]}
    >
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: progress,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <AppText accessibilityLiveRegion="polite" style={styles.text}>
          {message}
        </AppText>
      </Animated.View>
    </View>
  );
}
