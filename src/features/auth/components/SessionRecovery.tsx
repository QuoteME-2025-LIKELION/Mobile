import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors } from "@/styles/theme";
import { session } from "../services/session";
import { useSession } from "../stores/useSession";
import { styles } from "./SessionRecovery.styles";
export function SessionRecovery() {
  const { status, member, busy } = useSession();
  const [error, setError] = useState("");
  if (status === "authenticated" && member?.profileCompleted === false)
    return (
      <View style={styles.container}>
        <AppText style={styles.text}>
          프로필 설정이 필요한 계정이에요. 앱의 설정 저장은 준비 중이므로,
          설정을 완료한 기존 계정으로 테스트해 주세요.
        </AppText>
        {error ? (
          <AppText style={styles.text} accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          style={styles.button}
          onPress={() => {
            void session
              .logout()
              .catch(() =>
                setError("로그아웃하지 못했어요. 다시 시도해 주세요.")
              );
          }}
        >
          <AppText style={styles.text}>로그아웃</AppText>
        </Pressable>
      </View>
    );
  return (
    <View style={styles.container}>
      {status === "error" ? (
        <>
          <AppText style={styles.text} accessibilityRole="alert">
            로그인 정보를 확인하지 못했어요. 다시 시도해 주세요.
          </AppText>
          <Pressable
            style={styles.button}
            accessibilityRole="button"
            onPress={() => {
              void session.retryStorageCleanup().catch(() => {});
            }}
          >
            <AppText style={styles.text}>
              로그인 정보 초기화 후 다시 시작
            </AppText>
          </Pressable>
        </>
      ) : (
        <ActivityIndicator
          color={colors.white}
          accessibilityLabel="로그인 상태 확인 중"
        />
      )}
    </View>
  );
}
