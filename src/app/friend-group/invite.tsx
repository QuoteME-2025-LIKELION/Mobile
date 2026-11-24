import { useLocalSearchParams } from "expo-router";
import { GroupInviteScreen } from "@/features/friend-group/screens/GroupInviteScreen";

export default function GroupInviteRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GroupInviteScreen key={id} id={Number(id)} />;
}
