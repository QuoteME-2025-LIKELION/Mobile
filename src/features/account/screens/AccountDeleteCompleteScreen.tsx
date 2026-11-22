import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { styles } from "./AccountDeleteCompleteScreen.styles";
export function AccountDeleteCompleteScreen({
  onDone,
}: {
  onDone: () => void;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <AppText accessibilityRole="header" style={styles.title}>
          계정이 삭제되었습니다.
        </AppText>
        <AppText style={styles.description}>
          {
            "그동안 쿼트미를 이용해 주셔서 감사합니다.\n더 나은 서비스로 다시 만날 수 있기를 바랍니다."
          }
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onDone}
        style={styles.button}
      >
        <AppText style={styles.buttonText}>처음으로</AppText>
      </Pressable>
    </SafeAreaView>
  );
}
