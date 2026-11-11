import { Redirect } from "expo-router";

import { ProfileSetupScreen } from "@/features/profile/screens/ProfileSetupScreen";

export default function ProfileRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ProfileSetupScreen />;
}
