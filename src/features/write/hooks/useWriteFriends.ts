import { useEffect, useState, useSyncExternalStore } from "react";
import { useSession } from "@/features/auth/stores/useSession";
import { createFriendsResource } from "../services/createFriendsResource";
import { writeApi } from "../services/writeApi";
export function useWriteFriends(enabled: boolean) {
  const { member } = useSession();
  const [resource] = useState(() => createFriendsResource(writeApi.getFriends));
  const snapshot = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot
  );
  useEffect(() => {
    if (enabled) void resource.load();
  }, [enabled, resource]);
  useEffect(() => () => resource.dispose(), [resource]);
  return {
    ...snapshot,
    items: snapshot.items.filter((friend) => friend.id !== member?.id),
    memberId: member?.id,
    refresh: resource.load,
  };
}
