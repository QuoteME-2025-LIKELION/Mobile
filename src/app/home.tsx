import { Redirect } from "expo-router";

import { HomeScreen } from "@/features/home/screens/HomeScreen";

export default function HomeRoute() {
  // 인증 연동 전에는 개발 빌드에서만 홈 UI를 확인한다.
  if (!__DEV__) return <Redirect href="/" />;
  return <HomeScreen />;
}
