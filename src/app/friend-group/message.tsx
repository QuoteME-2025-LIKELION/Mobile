import { useLocalSearchParams } from "expo-router";
import { GroupMessageScreen } from "@/features/friend-group/screens/GroupMessageScreen";

export default function GroupMessageRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GroupMessageScreen key={id} id={Number(id)} />;
}
