import { Redirect, useLocalSearchParams } from "expo-router";
import { NotificationsScreen } from "@/features/notifications/screens/NotificationsScreen";
export default function NotificationsRoute() {
  const { written } = useLocalSearchParams<{ written?: string }>();
  if (!__DEV__) return <Redirect href="/" />;
  return <NotificationsScreen hasWrittenToday={written === "1"} />;
}
