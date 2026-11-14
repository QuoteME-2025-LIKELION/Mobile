import { useRef, useState } from "react";
import { Alert } from "react-native";
import { session } from "../services/session";
import { useSession } from "../stores/useSession";

export function useStart() {
  const [loginOpen, setLoginOpen] = useState(false);
  const { busy } = useSession();
  const submitting = useRef(false);
  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);
  const loginGuest = async () => {
    if (!__DEV__ || submitting.current || busy) return;
    submitting.current = true;
    try {
      await session.loginGuest();
    } catch {
      Alert.alert(
        "게스트 로그인 실패",
        "게스트 로그인에 실패했어요. 서버 주소와 연결을 확인하고 다시 시도해 주세요."
      );
    } finally {
      submitting.current = false;
    }
  };
  const openGuestLogin = () => {
    if (!__DEV__ || submitting.current || busy) return;
    Alert.alert("개발용 게스트 로그인", "게스트로 로그인할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그인",
        onPress: () => {
          void loginGuest();
        },
      },
    ]);
  };
  return { loginOpen, openLogin, closeLogin, openGuestLogin };
}
