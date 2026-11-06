import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {
  // 클라이언트 여부는 변하지 않으므로 별도 이벤트 구독이 필요 없다.
};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** 정적 HTML과 hydration 첫 렌더는 light, 이후에는 실제 기기 테마를 사용한다. */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
