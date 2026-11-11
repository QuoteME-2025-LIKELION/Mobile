import { Image, View } from "react-native";
import { ActionButton } from "@/components/ActionButton";
import { brandColors } from "@/styles/theme";
import { styles } from "./SocialButtons.styles";
export type SocialProvider = "google" | "kakao";

export type AuthMode = "signup" | "login";

type Props = {
  mode: AuthMode;
  gap?: number;
  onSelect?: (provider: SocialProvider, mode: AuthMode) => void;
};

export function SocialButtons({ mode, onSelect, gap = 14 }: Props) {
  const action = mode === "signup" ? "회원가입" : "로그인";
  return (
    <View style={[styles.buttons, { gap }]}>
      <ActionButton
        title={`구글로 ${action}`}
        backgroundColor={brandColors.google}
        bordered
        icon={
          <Image
            source={require("@/assets/images/auth/google.png")}
            style={styles.icon}
          />
        }
        onPress={onSelect ? () => onSelect("google", mode) : undefined}
      />
      <ActionButton
        title={`카카오로 ${action}`}
        backgroundColor={brandColors.kakao}
        icon={
          <Image
            source={require("@/assets/images/auth/kakao.png")}
            style={styles.icon}
          />
        }
        onPress={onSelect ? () => onSelect("kakao", mode) : undefined}
      />
    </View>
  );
}
