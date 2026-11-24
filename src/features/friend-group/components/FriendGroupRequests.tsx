import { ListRow, RequestTabs, RowAction } from "./FriendGroupRows";
import {
  friendGroupApi,
  type FriendRequest,
  type GroupInvitation,
  type GroupRequest,
} from "../services/friendGroupApi";
import type { useFriendGroupActions } from "../hooks/useFriendGroupData";

export type RequestConfirmation = {
  title: string;
  label: string;
  description?: string;
  confirmTone?: "primary";
  action: () => void;
};

export function FriendGroupRequests({
  requests,
  busy,
  confirm,
  run,
}: {
  requests: {
    friends: FriendRequest[];
    invitations: GroupInvitation[];
    sentGroups: GroupRequest[];
  };
  busy: boolean;
  confirm: (confirmation: RequestConfirmation) => void;
  run: ReturnType<typeof useFriendGroupActions>["run"];
}) {
  return (
    <>
      <RequestTabs
        receivedLabel="받은 그룹 초대"
        sentLabel="보낸 그룹 요청"
        received={requests.invitations.map((item) => (
          <ListRow
            key={item.requestId}
            name={item.groupName}
            subtitle={`${item.inviterNickname}님의 초대`}
          >
            <RowAction
              label="승인"
              disabled={busy}
              onPress={() =>
                void run(
                  () =>
                    friendGroupApi.respondInvitation(item.requestId, "accept"),
                  "그룹 초대를 승인했습니다.",
                  "그룹 초대 승인에 실패했습니다."
                )
              }
            />
            <RowAction
              label="거절"
              tone="danger"
              disabled={busy}
              onPress={() =>
                confirm({
                  title: `${item.groupName} 그룹의 초대를\n거절하시겠어요?`,
                  label: "거절",
                  action: () =>
                    void run(
                      () =>
                        friendGroupApi.respondInvitation(
                          item.requestId,
                          "reject"
                        ),
                      "그룹 초대를 거절했습니다.",
                      "그룹 초대 거절에 실패했습니다."
                    ),
                })
              }
            />
          </ListRow>
        ))}
        sent={requests.sentGroups.map((item) => (
          <ListRow key={item.requestId} name={item.groupName}>
            <RowAction
              label="취소"
              accessibilityLabel={`${item.groupName} 그룹 가입 신청 취소`}
              disabled={busy}
              onPress={() =>
                confirm({
                  title: `${item.groupName} 그룹에 보낸\n가입 요청을 취소하시겠어요?`,
                  label: "요청 취소",
                  action: () =>
                    void run(
                      () => friendGroupApi.cancelJoin(item.requestId),
                      "그룹 가입 신청을 취소했어요",
                      "그룹 가입 신청 취소에 실패했어요."
                    ),
                })
              }
            />
          </ListRow>
        ))}
      />
      <RequestTabs
        receivedLabel="받은 친구 요청"
        sentLabel="보낸 친구 요청"
        received={requests.friends
          .filter((item) => item.direction !== "SENT")
          .map((item) => (
            <ListRow
              key={item.requestId}
              name={item.senderNickname}
              subtitle={item.senderIntroduction}
              image={item.senderProfileImage}
            >
              <RowAction
                label="승인"
                disabled={busy}
                onPress={() =>
                  void run(
                    () =>
                      friendGroupApi.respondFriend(item.requestId, "accept"),
                    "친구 신청을 승인했습니다.",
                    "친구 요청 수락에 실패했습니다."
                  )
                }
              />
              <RowAction
                label="거절"
                tone="danger"
                disabled={busy}
                onPress={() =>
                  confirm({
                    title: `${item.senderNickname}님의 친구 요청을\n거절하시겠어요?`,
                    label: "거절",
                    action: () =>
                      void run(
                        () =>
                          friendGroupApi.respondFriend(
                            item.requestId,
                            "reject"
                          ),
                        "친구 신청을 거절했습니다.",
                        "친구 요청 거절에 실패했습니다."
                      ),
                  })
                }
              />
            </ListRow>
          ))}
        sent={requests.friends
          .filter((item) => item.direction === "SENT")
          .map((item) => (
            <ListRow
              key={item.requestId}
              name={item.receiverNickname ?? "사용자"}
              subtitle={item.receiverIntroduction}
              image={item.receiverProfileImage}
            >
              {item.receiverId != null && (
                <RowAction
                  label="취소"
                  accessibilityLabel={`${item.receiverNickname ?? "사용자"}에게 보낸 친구 요청 취소`}
                  disabled={busy}
                  onPress={() => {
                    const id = item.receiverId;
                    if (id == null) return;
                    confirm({
                      title: `${item.receiverNickname ?? "사용자"}님에게 보낸\n친구 요청을 취소하시겠어요?`,
                      label: "요청 취소",
                      action: () =>
                        void run(
                          () => friendGroupApi.cancelFriend(id),
                          "친구 요청을 취소했어요",
                          "친구 요청 취소에 실패했어요."
                        ),
                    });
                  }}
                />
              )}
            </ListRow>
          ))}
      />
    </>
  );
}
