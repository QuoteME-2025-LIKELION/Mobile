import { Redirect } from "expo-router";

import { ProfileCenterScreen } from "@/features/profile/screens/ProfileCenterScreen";

export default function ProfileCenterRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ProfileCenterScreen />;
}
