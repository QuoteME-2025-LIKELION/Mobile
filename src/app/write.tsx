import { Redirect } from "expo-router";

import { WriteScreen } from "@/features/write/screens/WriteScreen";

export default function WriteRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <WriteScreen />;
}
