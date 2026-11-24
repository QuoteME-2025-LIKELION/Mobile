import { useRef, useState } from "react";
import { session } from "../services/session";
import { useSession } from "../stores/useSession";
export function useTestLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const { busy } = useSession();
  const submit = async () => {
    if (!__DEV__ || submitting.current || busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    submitting.current = true;
    setError("");
    try {
      await session.login({ email: email.trim(), password });
    } catch {
      setPassword("");
      setError("로그인에 실패했습니다.");
    } finally {
      submitting.current = false;
    }
  };
  return { email, password, setEmail, setPassword, error, busy, submit };
}
