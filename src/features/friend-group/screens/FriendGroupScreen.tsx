import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ToastMessage } from "@/components/ToastMessage";
import { colors } from "@/styles/theme";
import { FeedActionsMenu } from "@/features/moderation/components/FeedActionsMenu";
import type { MenuAnchor } from "@/features/moderation/hooks/useFeedModeration";
import {
  FriendMoreButton,
  ListRow,
  RowAction,
} from "../components/FriendGroupRows";
import {
  useFriendGroupActions,
  useFriendGroupData,
  useFriendGroupSearch,
} from "../hooks/useFriendGroupData";
import {
  friendGroupApi,
  getJoinRequestErrorMessage,
  JOIN_REQUEST_PENDING_MESSAGE,
  type Member,
} from "../services/friendGroupApi";
import { FriendGroupRequests } from "../components/FriendGroupRequests";
import { styles } from "./FriendGroupScreen.styles";

import type { RequestConfirmation } from "../components/FriendGroupRequests";

export function FriendGroupScreen({ adding = false }: { adding?: boolean }) {
  const [keyword, setKeyword] = useState("");
  const [friendMenu, setFriendMenu] = useState<{
    member: Member;
    anchor: MenuAnchor;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState<RequestConfirmation | null>(
    null
  );
  const query = useFriendGroupSearch(keyword);
  const searching = Boolean(keyword.trim());
  const loadSearch = useCallback(
    (signal: AbortSignal) =>
      friendGroupApi.search(query, signal).then((data) => ({ query, ...data })),
    [query]
  );
  const lists = useFriendGroupData(friendGroupApi.lists);
  const friendRequests = useFriendGroupData(
    friendGroupApi.friendRequests,
    adding
  );
  const groupInvitations = useFriendGroupData(
    friendGroupApi.groupInvitations,
    adding
  );
  const sentJoinRequests = useFriendGroupData(friendGroupApi.sentJoinRequests);
  const results = useFriendGroupData(loadSearch, Boolean(query));
  const { busy, toast, run, closeToast } = useFriendGroupActions(() => {
    lists.reload();
    friendRequests.reload();
    groupInvitations.reload();
    sentJoinRequests.reload();
    results.reload();
  });

  const currentResults =
    query && results.data?.query === query ? results.data : undefined;
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace(adding ? "/friend-group" : "/home");
  };
  const goToGroup = (id: number) =>
    router.push({ pathname: "/friend-group/detail", params: { id } });
  const members = searching
    ? (currentResults?.members ?? [])
    : (lists.data?.members ?? []);
  const groups = searching
    ? (currentResults?.groups ?? [])
    : (lists.data?.groups ?? []);
  const friendIds = new Set(lists.data?.members.map(({ id }) => id));
  const groupIds = new Set(lists.data?.groups.map(({ id }) => id));
  const requestStatuses = [
    friendRequests.status,
    groupInvitations.status,
    sentJoinRequests.status,
  ];
  const lookupLoading = searching
    ? !query || results.status === "loading"
    : adding
      ? requestStatuses.includes("loading")
      : lists.status === "loading";
  const lookupError =
    lists.status === "error" ||
    (searching && Boolean(query) && results.status === "error") ||
    (adding && !searching && requestStatuses.includes("error"));

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <ScreenHeader
          title={adding ? "친구 및 그룹 추가" : "친구 및 그룹"}
          onBack={back}
          rightElement={
            adding ? undefined : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="친구 및 그룹 추가"
                onPress={() => router.push("/friend-group/add")}
                hitSlop={10}
                style={styles.addIcon}
              >
                <Image
                  source={require("@/assets/images/friend-group/add-member.svg")}
                  style={styles.addIcon}
                />
              </Pressable>
            )
          }
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.search}>
          <Image
            source={require("@/assets/images/write/search.svg")}
            style={styles.searchIcon}
          />
          <TextInput
            accessibilityLabel="친구 및 그룹 검색"
            value={keyword}
            onChangeText={(value) => {
              setFriendMenu(null);
              setKeyword(value);
            }}
            placeholder="검색어를 입력해 주세요"
            placeholderTextColor={colors["grey-400"]}
            autoCorrect={false}
            style={styles.input}
          />
          {keyword ? (
            <RowAction
              label="×"
              accessibilityLabel="검색어 지우기"
              onPress={() => setKeyword("")}
            />
          ) : null}
        </View>
        {!searching && adding && (
          <>
            <View style={styles.guide}>
              <AppText style={styles.message}>
                닉네임이나 그룹 이름을 검색하여{"\n"}친구를 추가하거나 그룹에
                가입해 보세요
              </AppText>
            </View>
            <FriendGroupRequests
              requests={{
                friends: friendRequests.data ?? [],
                invitations: groupInvitations.data ?? [],
                sentGroups: sentJoinRequests.data ?? [],
              }}
              busy={busy}
              confirm={setConfirmation}
              run={run}
            />
          </>
        )}
        {(searching || !adding) && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText
                  accessibilityRole="header"
                  numberOfLines={1}
                  style={[styles.title, styles.groupSectionTitle]}
                >
                  {searching ? "그룹" : "나의 그룹"}
                </AppText>
                {!searching && (
                  <RowAction
                    label="그룹 만들기"
                    onPress={() => router.push("/friend-group/create")}
                  />
                )}
              </View>
              {groups.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cards}
                  keyboardShouldPersistTaps="handled"
                >
                  {groups.map((group) => (
                    <Pressable
                      key={group.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${group.name}, 멤버 ${group.memberCount}명`}
                      disabled={busy || (searching && !lists.data)}
                      onPress={() => {
                        if (!searching || groupIds.has(group.id)) {
                          goToGroup(group.id);
                          return;
                        }
                        if (
                          sentJoinRequests.data?.some(
                            (request) => request.groupId === group.id
                          )
                        ) {
                          setNotice(JOIN_REQUEST_PENDING_MESSAGE);
                          return;
                        }
                        setConfirmation({
                          title: `${group.name} 그룹에\n가입 요청을 보내시겠어요?`,
                          label: "보내기",
                          confirmTone: "primary",
                          action: () =>
                            void run(
                              () => friendGroupApi.joinGroup(group.id),
                              "가입 요청을 보냈습니다.",
                              getJoinRequestErrorMessage
                            ),
                        });
                      }}
                      style={styles.card}
                    >
                      <AppText style={styles.groupCount}>
                        {group.memberCount}
                      </AppText>
                      <AppText numberOfLines={2} style={styles.groupName}>
                        {group.name}
                      </AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {(searching ? currentResults : lists.data) && !groups.length && (
                <View style={styles.emptyState}>
                  <AppText style={styles.emptyTitle}>
                    {searching
                      ? "검색 결과가 없습니다."
                      : "참여한 그룹이 없습니다."}
                  </AppText>
                  {!searching && (
                    <AppText style={styles.emptyDescription}>
                      그룹에 참여해 보세요.
                    </AppText>
                  )}
                </View>
              )}
            </View>
            <View style={styles.section}>
              <AppText accessibilityRole="header" style={styles.title}>
                {searching ? "사용자" : "친구"}
              </AppText>
              {members.map((member, index) => (
                <View
                  key={member.id}
                  style={index < members.length - 1 && styles.divider}
                >
                  <ListRow
                    name={member.nickname}
                    subtitle={member.introduction}
                    image={member.profileImage}
                  >
                    {searching && lists.data && !friendIds.has(member.id) && (
                      <RowAction
                        label="추가"
                        disabled={busy}
                        onPress={() =>
                          setConfirmation({
                            title: `${member.nickname}님에게\n친구 신청을 보내시겠어요?`,
                            label: "보내기",
                            confirmTone: "primary",
                            action: () =>
                              void run(
                                () => friendGroupApi.sendFriend(member.id),
                                "친구 신청을 보냈습니다.",
                                "친구 요청 전송에 실패했습니다."
                              ),
                          })
                        }
                      />
                    )}
                    {!searching && (
                      <FriendMoreButton
                        name={member.nickname}
                        disabled={busy}
                        onOpen={(anchor) => setFriendMenu({ member, anchor })}
                      />
                    )}
                  </ListRow>
                </View>
              ))}
              {(searching ? currentResults : lists.data) && !members.length && (
                <View style={styles.emptyState}>
                  <AppText style={styles.emptyTitle}>
                    {searching
                      ? "검색 결과가 없습니다."
                      : "추가된 친구가 없습니다."}
                  </AppText>
                  {!searching && (
                    <AppText style={styles.emptyDescription}>
                      친구를 추가해 보세요.
                    </AppText>
                  )}
                </View>
              )}
            </View>
          </>
        )}
        {lookupLoading && (
          <AppText accessibilityLiveRegion="polite" style={styles.message}>
            불러오는 중…
          </AppText>
        )}
      </ScrollView>
      {friendMenu && (
        <FeedActionsMenu
          anchor={friendMenu.anchor}
          canReport={false}
          onClose={() => setFriendMenu(null)}
          onDelete={() => {
            const { member } = friendMenu;
            setFriendMenu(null);
            setConfirmation({
              title: `${member.nickname}님을 친구 목록에서\n삭제하시겠어요?`,
              label: "삭제",
              action: () =>
                void run(
                  () => friendGroupApi.deleteFriend(member.id),
                  "친구를 삭제했습니다.",
                  "친구 삭제에 실패했습니다."
                ),
            });
          }}
          onBlock={() => {
            const { member } = friendMenu;
            setFriendMenu(null);
            setConfirmation({
              title: `${member.nickname}님을\n차단하시겠어요?`,
              description:
                "차단하면 친구 관계가 해제되며,\n차단 목록은 계정 관리에서 확인할 수 있습니다",
              label: "차단",
              action: () => setNotice("차단 기능을 준비 중이에요."),
            });
          }}
        />
      )}
      {confirmation && (
        <ConfirmDialog
          visible
          title={confirmation.title}
          description={confirmation.description ?? ""}
          cancelLabel="돌아가기"
          confirmLabel={confirmation.label}
          confirmTone={confirmation.confirmTone}
          confirmDisabled={busy}
          onClose={() => setConfirmation(null)}
          onConfirm={() => {
            setConfirmation(null);
            confirmation.action();
          }}
        />
      )}
      <ToastMessage
        message={notice || toast}
        errorMessage={lookupError ? "목록을 불러오지 못했어요." : ""}
        onClose={() => {
          setNotice("");
          closeToast();
        }}
      />
    </SafeAreaView>
  );
}
