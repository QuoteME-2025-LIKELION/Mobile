import { useRef, useState } from "react";
import { ApiError } from "@/api/createApiClient";
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
    } catch (e) {
      setPassword("");
      setError(
        e instanceof ApiError && (e.status === 401 || e.status === 404)
          ? "이메일 또는 비밀번호를 확인해 주세요."
          : "로그인하지 못했어요."
      );
    } finally {
      submitting.current = false;
    }
  };
  return { email, password, setEmail, setPassword, error, busy, submit };
}
