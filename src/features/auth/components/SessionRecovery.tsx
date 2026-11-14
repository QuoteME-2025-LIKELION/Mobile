import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors } from "@/styles/theme";
import { session } from "../services/session";
import { useSession } from "../stores/useSession";
import { styles } from "./SessionRecovery.styles";
export function SessionRecovery() {
  const { status } = useSession();
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
