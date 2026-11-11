import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ToastMessage } from "@/components/ToastMessage";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  useModerationState,
  unblockFixtureMember,
  type ModerationMember,
} from "../stores/moderationStore";
import { styles } from "./BlockedMembersScreen.styles";
export function BlockedMembersScreen() {
  const { blocked } = useModerationState();
  const [target, setTarget] = useState<ModerationMember | null>(null);
  const [toast, setToast] = useState("");
  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader
        title="차단 목록"
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace("/account-setting")
        }
      />
      <ScrollView contentContainerStyle={styles.list}>
        {blocked.length === 0 ? (
          <AppText style={styles.empty}>차단한 사용자가 없어요</AppText>
        ) : (
          blocked.map((member) => (
            <View key={member.id} style={styles.row}>
              <Image
                source={require("@/assets/images/profile/default-profile.png")}
                style={styles.avatar}
                accessible={false}
              />
              <View style={styles.info}>
                <AppText style={styles.name}>{member.nickname}</AppText>
                {member.introduction ? (
                  <AppText style={styles.bio}>{member.introduction}</AppText>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${member.nickname} 차단 해제`}
                onPress={() => setTarget(member)}
                style={styles.action}
              >
                <AppText style={styles.actionText}>차단 해제</AppText>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
      <ConfirmDialog
        visible={target !== null}
        title={`${target?.nickname ?? ""}님의 차단을 해제할까요?`}
        description={"차단을 해제해도 친구 관계는\n복구되지 않습니다"}
        dismissLabel="돌아가기"
        confirmLabel="해제"
        onClose={() => setTarget(null)}
        onConfirm={() => {
          if (target && unblockFixtureMember(target.id))
            setToast("차단을 해제했어요");
          setTarget(null);
        }}
      />
      <ToastMessage message={toast} onClose={() => setToast("")} />
    </SafeAreaView>
  );
}
