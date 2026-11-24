import { useEffect } from "react";
import { ActivityIndicator, AppState, Pressable, View } from "react-native";
import { ToastMessage } from "@/components/ToastMessage";
import { AppText } from "@/components/AppText";
import { colors } from "@/styles/theme";
import { session } from "../services/session";
import { useSession } from "../stores/useSession";
import { styles } from "./SessionRecovery.styles";
export function SessionRecovery() {
  const { status, retryable } = useSession();
  useEffect(() => {
    if (status !== "error" || !retryable) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void session.initialize().catch(() => {});
    });
    return () => subscription.remove();
  }, [status, retryable]);

  return (
    <View style={styles.container}>
      {status === "error" ? (
        <>
          {!retryable && (
            <Pressable
              style={styles.button}
              accessibilityRole="button"
              onPress={() => void session.retryStorageCleanup().catch(() => {})}
            >
              <AppText style={styles.text}>
                로그인 정보 초기화 후 다시 시작
              </AppText>
            </Pressable>
          )}
          <ToastMessage errorMessage="로그인 정보를 확인하지 못했어요." />
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
