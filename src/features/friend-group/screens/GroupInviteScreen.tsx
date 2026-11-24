import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ToastMessage } from "@/components/ToastMessage";
import { colors } from "@/styles/theme";
import { ListRow, RowAction } from "../components/FriendGroupRows";
import { GroupRequestRow } from "../components/GroupRequestRow";
import {
  useFriendGroupActions,
  useFriendGroupData,
} from "../hooks/useFriendGroupData";
import { closeGroupSubpage, useGroupDetail } from "../hooks/useGroupDetail";
import { friendGroupApi, type Member } from "../services/friendGroupApi";
import { styles } from "./GroupInviteScreen.styles";

export function GroupInviteScreen({ id }: { id: number }) {
  const { group, valid, isMember } = useGroupDetail(id);
  const loadInvitations = useCallback(
    (signal: AbortSignal) => friendGroupApi.groupSentInvitations(id, signal),
    [id]
  );
  const invitations = useFriendGroupData(loadInvitations, Boolean(isMember));
  const isLeader = Boolean(isMember) && Array.isArray(invitations.data);
  const friends = useFriendGroupData(friendGroupApi.friends, isLeader);
  const [keyword, setKeyword] = useState("");
  const [target, setTarget] = useState<Member>();
  const [notice, setNotice] = useState("");
  const { busy, toast, closeToast, run } = useFriendGroupActions(() => {
    group.reload();
    invitations.reload();
  });
  const sent = isLeader ? (invitations.data ?? []) : [];
  const excludedIds = new Set([
    ...(group.data?.members ?? []).map((member) => member.id),
    ...sent.map((request) => request.requesterId),
  ]);
  const filter = keyword.trim().toLocaleLowerCase();
  const available = isLeader
    ? friends.data?.filter(
        (friend) =>
          !excludedIds.has(friend.id) &&
          friend.nickname.toLocaleLowerCase().includes(filter)
      )
    : undefined;
  const full = (group.data?.memberCount ?? 0) >= 5;
  const error =
    !valid || group.status === "error"
      ? "그룹을 불러오지 못했어요."
      : (group.data && !isMember) || invitations.data === null
        ? "그룹장만 멤버를 초대할 수 있어요."
        : invitations.status === "error" || friends.status === "error"
          ? "목록을 불러오지 못했어요."
          : "";

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="멤버 초대하기"
        close
        onBack={() => closeGroupSubpage(id)}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.search}>
          <Image
            source={require("@/assets/images/write/search.svg")}
            style={styles.searchIcon}
            accessible={false}
          />
          <TextInput
            accessibilityLabel="그룹에 초대할 친구 검색"
            placeholder="검색어를 입력해 주세요"
            placeholderTextColor={colors["grey-400"]}
            value={keyword}
            onChangeText={setKeyword}
            style={styles.searchInput}
          />
          {keyword !== "" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="검색어 지우기"
              onPress={() => setKeyword("")}
              style={styles.clear}
            >
              <AppText>×</AppText>
            </Pressable>
          )}
        </View>
        {available?.length === 0 && (
          <AppText style={styles.guide}>
            {filter
              ? "검색 결과가 없습니다."
              : "초대할 수 있는 친구가 없습니다."}
          </AppText>
        )}
        {!!available?.length && (
          <View>
            {available.map((friend) => (
              <ListRow
                key={friend.id}
                name={friend.nickname}
                subtitle={friend.introduction}
                image={friend.profileImage}
              >
                <RowAction
                  label="초대"
                  tone="primary"
                  disabled={busy}
                  onPress={() => {
                    if (full) setNotice("최대 인원 5명이 찼어요.");
                    else setTarget(friend);
                  }}
                />
              </ListRow>
            ))}
          </View>
        )}
        {sent.length > 0 && (
          <View style={styles.pending}>
            <AppText accessibilityRole="header" style={styles.title}>
              초대 대기
            </AppText>
            <View>
              {sent.map((request) => (
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
            </View>
          </View>
        )}
      </ScrollView>
      {isLeader && (
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setNotice("아직 구현되지 않은 기능이에요")}
            style={styles.link}
          >
            <AppText style={styles.linkText}>링크로 초대하기</AppText>
          </Pressable>
        </View>
      )}
      {target && isLeader && (
        <ConfirmDialog
          visible
          title={`${target.nickname}님을 그룹에\n초대할까요?`}
          description=""
          confirmTone="primary"
          confirmLabel="초대하기"
          confirmDisabled={busy}
          onClose={() => setTarget(undefined)}
          onConfirm={() => {
            setTarget(undefined);
            if (full) {
              setNotice("최대 인원 5명이 찼어요.");
              return;
            }
            void run(
              () => friendGroupApi.inviteMember(id, target.id),
              "초대 요청을 보냈어요.",
              "초대 요청 전송에 실패했어요."
            );
          }}
        />
      )}
      <ToastMessage
        message={notice || toast}
        errorMessage={error}
        onClose={() => {
          if (notice) setNotice("");
          else closeToast();
        }}
      />
    </SafeAreaView>
  );
}
