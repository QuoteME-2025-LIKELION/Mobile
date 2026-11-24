import { useLocalSearchParams } from "expo-router";
import { GroupDetailScreen } from "@/features/friend-group/screens/GroupDetailScreen";

export default function GroupDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GroupDetailScreen key={id} id={Number(id)} />;
}
