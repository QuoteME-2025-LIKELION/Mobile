import { useModerationState } from "@/features/moderation/stores/moderationStore";
import { session } from "@/features/auth/services/session";
import { useSession } from "@/features/auth/stores/useSession";
import { useRef, useState } from "react";
import { router } from "expo-router";
import { accountFixture } from "../fixtures/accountFixture";
import { getBirthYears, type Gender } from "../constants/accountOptions";

type Sheet = "gender" | "birth" | null;
export function useAccountSettings() {
  const [gender, setGender] = useState<Gender>(accountFixture.gender);
  const [birthYear, setBirthYear] = useState<number>(accountFixture.birthYear);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [draftGender, setDraftGender] = useState<Gender>(gender);
  const [draftBirthYear, setDraftBirthYear] = useState(birthYear);
  const [logoutError, setLogoutError] = useState("");
  const [logoutPending, setLogoutPending] = useState(false);
  const logoutRef = useRef(false);
  const auth = useSession();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { blocked } = useModerationState();
  const years = getBirthYears();
  const openSheet = (next: Exclude<Sheet, null>) => {
    setDraftGender(gender);
    setDraftBirthYear(birthYear);
    setSheet(next);
  };
  const finishSheet = () => {
    // 화면 내 임시 선택만 변경한다. API 저장이나 성공 알림은 수행하지 않는다.
    if (sheet === "gender") setGender(draftGender);
    if (sheet === "birth") setBirthYear(draftBirthYear);
    setSheet(null);
  };
  const confirmLogout = async () => {
    if (logoutRef.current || auth.status !== "authenticated") return;
    logoutRef.current = true;
    setLogoutPending(true);
    setLogoutOpen(false);
    setLogoutError("");
    try {
      await session.logout();
    } catch {
      setLogoutError(
        "로그아웃하지 못했어요. 연결을 확인하고 다시 시도해 주세요."
      );
    } finally {
      logoutRef.current = false;
      setLogoutPending(false);
    }
  };
  return {
    logoutError,
    logoutPending,
    canLogout: auth.status === "authenticated" && !auth.busy && !logoutPending,
    confirmLogout,
    blockedCount: blocked.length,
    openBlocked: () => router.push("/blocked-members"),
    gender,
    birthYear,
    sheet,
    draftGender,
    draftBirthYear,
    years,
    logoutOpen,
    openSheet,
    finishSheet,
    setDraftGender,
    setDraftBirthYear,
    closeSheet: () => setSheet(null),
    openLogout: () => setLogoutOpen(true),
    closeLogout: () => setLogoutOpen(false),
    goBack: () =>
      router.canGoBack() ? router.back() : router.replace("/home"),
    openDelete: () => router.push("/account-delete"),
  };
}
