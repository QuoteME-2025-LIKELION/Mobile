import { Redirect } from "expo-router";
import { NoticesScreen } from "@/features/notices/screens/NoticesScreen";
export default function NoticesRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <NoticesScreen />;
}
