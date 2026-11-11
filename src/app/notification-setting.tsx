import { Redirect } from "expo-router";
import { NotificationSettingsScreen } from "@/features/notification-settings/screens/NotificationSettingsScreen";
export default function NotificationSettingsRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <NotificationSettingsScreen />;
}
