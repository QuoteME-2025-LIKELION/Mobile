import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "./AppText";
import { styles } from "./ToastMessage.styles";

// 0.3초 동안 나타나고, 0.9초 유지한 뒤 0.3초 동안 사라진다.
export function ToastMessage({
  message: actionMessage,
  errorMessage = "",
  onClose,
}: {
  message?: string;
  errorMessage?: string;
  onClose?: () => void;
}) {
  const [dismissedError, setDismissedError] = useState("");
  if (dismissedError && dismissedError !== errorMessage) setDismissedError("");
  const displayedError =
    !actionMessage && errorMessage !== dismissedError ? errorMessage : "";
  const message = actionMessage || displayedError;
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));
  const closeRef = useRef<() => void>(() => {});
  useEffect(() => {
    closeRef.current = onClose ?? (() => {});
  }, [onClose]);
  useEffect(() => {
    if (!message) return;
    let active = true;
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
      if (!active || !finished) return;
      if (displayedError) setDismissedError(displayedError);
      else closeRef.current();
    });
    return () => {
      active = false;
      animation.stop();
    };
  }, [displayedError, message, progress]);
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
