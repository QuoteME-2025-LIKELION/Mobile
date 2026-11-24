import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { ToastMessage } from "@/components/ToastMessage";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ListRow } from "../components/FriendGroupRows";
import { useFriendGroupData } from "../hooks/useFriendGroupData";
import { friendGroupApi } from "../services/friendGroupApi";
import { styles } from "./FriendGroupScreen.styles";

export function GroupDetailScreen({ id }: { id: number }) {
  const load = useCallback(
    (signal: AbortSignal) => friendGroupApi.detail(id, signal),
    [id]
  );
  const valid = Number.isSafeInteger(id) && id > 0;
  const { data, status } = useFriendGroupData(load, valid);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={data?.name ?? "그룹"}
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/friend-group")
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {!valid ? (
          <AppText style={styles.message}>그룹을 찾을 수 없습니다.</AppText>
        ) : null}
        {valid && status === "loading" && (
          <AppText style={styles.message}>불러오는 중…</AppText>
        )}
        {data && (
          <>
            {data.motto ? (
              <AppText style={styles.message}>{data.motto}</AppText>
            ) : null}
            <AppText>
              그룹장 {data.leaderNickname} · 명언 {data.totalQuoteCount}개
            </AppText>
            <AppText accessibilityRole="header" style={styles.title}>
              멤버 {data.memberCount}명
            </AppText>
            {data.members.map((member) => (
              <ListRow
                key={member.id}
                name={member.nickname}
                subtitle={member.introduction}
                image={member.profileImage}
              />
            ))}
          </>
        )}
      </ScrollView>
      <ToastMessage
        errorMessage={status === "error" ? "그룹을 불러오지 못했어요." : ""}
      />
    </SafeAreaView>
  );
}
