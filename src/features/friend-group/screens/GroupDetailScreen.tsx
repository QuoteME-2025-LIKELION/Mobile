import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { QuoteText } from "@/components/QuoteText";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ToastMessage } from "@/components/ToastMessage";
import { colors, withOpacity } from "@/styles/theme";
import { ListRow, RequestTabs, RowAction } from "../components/FriendGroupRows";
import { GroupRequestRow } from "../components/GroupRequestRow";
import { useFriendGroupActions } from "../hooks/useFriendGroupData";
import {
  closeGroupDetail,
  useGroupDetail,
  useGroupRequests,
  useGroupScreenFocus,
} from "../hooks/useGroupDetail";
import { friendGroupApi, type GroupDetail } from "../services/friendGroupApi";
import { styles } from "./GroupDetailScreen.styles";

type Confirmation = {
  title: string;
  label: string;
  description?: string;
  cancelLabel?: string;
  action: () => void;
};

function GroupSummary({ group }: { group: GroupDetail }) {
  return (
    <View style={[styles.hero, styles.summary]}>
      <View aria-hidden pointerEvents="none" style={styles.countBackground}>
        <Text style={styles.count}>{group.memberCount}</Text>
      </View>
      <View style={styles.summaryTop}>
        <AppText
          accessibilityRole="header"
          style={[styles.heroTitle, styles.groupName]}
        >
          {group.name}
        </AppText>
        <AppText style={styles.heroTitle}>
          Since {group.createdAt?.slice(0, 4) ?? "2025"}
        </AppText>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <AppText style={[styles.statText, styles.statLabel]}>멤버 수</AppText>
          <AppText style={styles.statText}>{group.memberCount}명</AppText>
        </View>
        <View style={styles.stat}>
          <AppText style={[styles.statText, styles.statLabel]}>
            작성된 명언
          </AppText>
          <AppText style={styles.statText}>{group.totalQuoteCount}개</AppText>
        </View>
      </View>
    </View>
  );
}

export function GroupDetailScreen({ id }: { id: number }) {
  const { group, valid, isMember, myId } = useGroupDetail(id);
  const { joinRequests, invitations, isLeader, isRegularMember, hasError } =
    useGroupRequests(id, Boolean(isMember));
  const focused = useGroupScreenFocus();
  const [confirm, setConfirm] = useState<Confirmation>();
  const [notice, setNotice] = useState("");
  const { busy, toast, closeToast, run } = useFriendGroupActions(() => {
    if (!focused.current) return;
    group.reload();
    joinRequests.reload();
    invitations.reload();
  });
  const data = group.data;
  const full = (data?.memberCount ?? 0) >= 5;

  const showGroupAction = () => {
    if (myId === undefined) return;
    const label = isLeader ? "해체하기" : "탈퇴하기";
    setConfirm({
      title: isLeader ? "그룹을\n해체하시겠어요?" : "그룹에서\n탈퇴하시겠어요?",
      description: isLeader
        ? undefined
        : "탈퇴해도 재가입 요청을 보낼 수 있어요.",
      label,
      action: () =>
        void run(
          async () => {
            if (isLeader) await friendGroupApi.deleteGroup(id);
            else await friendGroupApi.removeGroupMember(id, myId);
            if (focused.current) {
              router.dismissTo({
                pathname: "/friend-group",
                params: { groupAction: isLeader ? "disbanded" : "left" },
              });
            }
          },
          "",
          isLeader ? "그룹 해체에 실패했어요." : "그룹 탈퇴에 실패했어요."
        ),
    });
  };

  const loadError =
    !valid || group.status === "error"
      ? "그룹을 불러오지 못했어요."
      : data && !isMember
        ? "가입한 그룹만 볼 수 있어요."
        : hasError
          ? "요청 목록을 불러오지 못했어요."
          : "";

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, styles.hero]}
    >
      <StatusBar style="light" />
      <ScreenHeader title="" light onBack={closeGroupDetail} />
      {data && isMember && <GroupSummary group={data} />}
      <SafeAreaView edges={["bottom"]} style={styles.screen}>
        <ScrollView style={styles.body} contentContainerStyle={styles.content}>
          {data && isMember && (
            <>
              <View style={styles.section}>
                <AppText accessibilityRole="header" style={styles.title}>
                  그룹 메시지
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    data.motto
                      ? `그룹 메시지 수정: ${data.motto}`
                      : "그룹 메시지 입력"
                  }
                  onPress={() =>
                    router.push({
                      pathname: "/friend-group/message",
                      params: { id },
                    })
                  }
                  style={styles.mottoBox}
                >
                  <QuoteText
                    content={data.motto || "메시지를 입력하세요"}
                    variant="groupMessage"
                    contentColor={
                      data.motto ? undefined : withOpacity(colors.white, 0.5)
                    }
                  />
                </Pressable>
              </View>
              <View style={styles.section}>
                <AppText accessibilityRole="header" style={styles.title}>
                  멤버
                </AppText>
                <View>
                  {data.members.map((member) => (
                    <ListRow
                      key={member.id}
                      name={member.nickname}
                      subtitle={member.introduction}
                      image={member.profileImage}
                    >
                      {isLeader && member.id !== myId && (
                        <RowAction
                          label="탈퇴"
                          tone="danger"
                          disabled={busy}
                          accessibilityLabel={`${member.nickname} 그룹에서 탈퇴시키기`}
                          onPress={() =>
                            setConfirm({
                              title: `${member.nickname}님을 그룹에서\n탈퇴시키겠어요?`,
                              label: "탈퇴시키기",
                              action: () =>
                                void run(
                                  () =>
                                    friendGroupApi.removeGroupMember(
                                      id,
                                      member.id
                                    ),
                                  `${member.nickname}님을 탈퇴시켰어요.`,
                                  "멤버를 탈퇴시키지 못했어요."
                                ),
                            })
                          }
                        />
                      )}
                    </ListRow>
                  ))}
                </View>
              </View>
              {isLeader && (
                <RequestTabs
                  receivedLabel="초대 대기"
                  sentLabel="가입 요청"
                  received={(invitations.data ?? []).map((request) => (
                    <GroupRequestRow key={request.requestId} request={request}>
                      <RowAction
                        label="취소"
                        disabled={busy}
                        accessibilityLabel={`${request.requesterNickname} 그룹 초대 취소`}
                        onPress={() =>
                          void run(
                            () =>
                              friendGroupApi.cancelGroupInvitation(
                                id,
                                request.requestId
                              ),
                            "그룹 초대를 취소했어요.",
                            "그룹 초대 취소에 실패했어요."
                          )
                        }
                      />
                    </GroupRequestRow>
                  ))}
                  sent={(joinRequests.data ?? []).map((request) => (
                    <GroupRequestRow key={request.requestId} request={request}>
                      <RowAction
                        label="승인"
                        tone="primary"
                        disabled={busy}
                        onPress={() => {
                          if (full) setNotice("그룹 정원이 가득 찼어요.");
                          else
                            void run(
                              () =>
                                friendGroupApi.respondGroupJoin(
                                  request.requestId,
                                  "accept"
                                ),
                              `${request.requesterNickname}님을 그룹에 추가했어요.`,
                              "가입 요청 승인에 실패했어요."
                            );
                        }}
                      />
                      <RowAction
                        label="거절"
                        tone="danger"
                        disabled={busy}
                        onPress={() =>
                          setConfirm({
                            title: `${request.requesterNickname}님의 가입 요청을\n거절하시겠어요?`,
                            label: "거절",
                            cancelLabel: "취소",
                            action: () =>
                              void run(
                                () =>
                                  friendGroupApi.respondGroupJoin(
                                    request.requestId,
                                    "reject"
                                  ),
                                "가입 요청을 거절했어요.",
                                "가입 요청 거절에 실패했어요."
                              ),
                          })
                        }
                      />
                    </GroupRequestRow>
                  ))}
                />
              )}
              <View style={styles.actions}>
                {isLeader && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => {
                      if (full) setNotice("그룹 정원이 가득 찼어요.");
                      else
                        router.push({
                          pathname: "/friend-group/invite",
                          params: { id },
                        });
                    }}
                  >
                    <AppText style={[styles.buttonText, full && styles.muted]}>
                      멤버 초대하기
                    </AppText>
                  </Pressable>
                )}
                {(isLeader || isRegularMember) && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={showGroupAction}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <AppText style={[styles.buttonText, styles.danger]}>
                      {isLeader ? "그룹 해체하기" : "그룹 탈퇴하기"}
                    </AppText>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      {confirm && (
        <ConfirmDialog
          visible
          title={confirm.title}
          description={confirm.description ?? ""}
          cancelLabel={confirm.cancelLabel ?? "돌아가기"}
          confirmLabel={confirm.label}
          confirmDisabled={busy}
          onClose={() => setConfirm(undefined)}
          onConfirm={() => {
            setConfirm(undefined);
            confirm.action();
          }}
        />
      )}
      <ToastMessage
        message={notice || toast}
        errorMessage={loadError}
        onClose={() => {
          if (notice) setNotice("");
          else closeToast();
        }}
      />
    </SafeAreaView>
  );
}
