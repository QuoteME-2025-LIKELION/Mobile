import { Redirect } from "expo-router";
import { BlockedMembersScreen } from "@/features/moderation/screens/BlockedMembersScreen";
export default function BlockedMembersRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <BlockedMembersScreen />;
}
