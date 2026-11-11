import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { styles } from './EmptyInputCaret.styles';
// 빈 Android 입력의 위치는 첫 줄 중앙으로 고정돼 있어 별도 측정이 필요하지 않다.
// 입력한 글자는 기존 TextInput의 커서·선택 기능을 그대로 사용한다.
export function EmptyInputCaret() {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          delay: 500,
          duration: 0,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          delay: 500,
          duration: 0,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.caret, { opacity }]}
    />
  );
}
