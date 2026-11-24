import type { ReactNode } from "react";
import type { GroupManagedRequest } from "../services/friendGroupApi";
import { ListRow } from "./FriendGroupRows";

export function GroupRequestRow({
  request,
  children,
}: {
  request: GroupManagedRequest;
  children: ReactNode;
}) {
  return (
    <ListRow
      name={request.requesterNickname}
      subtitle={request.requesterIntroduction}
      image={request.requesterProfileImage}
    >
      {children}
    </ListRow>
  );
}
