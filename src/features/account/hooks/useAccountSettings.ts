import { useModerationState } from "@/features/moderation/stores/moderationStore";
import { session } from "@/features/auth/services/session";
import { useSession } from "@/features/auth/stores/useSession";
import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { getAccount, updateAccount } from "../services/accountApi";
import { getBirthYears, type Gender } from "../constants/accountOptions";

type Sheet = "gender" | "birth" | null;
export function useAccountSettings() {
  const [account, setAccount] = useState<Awaited<
    ReturnType<typeof getAccount>
  > | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const gender = account?.gender ?? null;
  const birthYear = account?.birthYear ? Number(account.birthYear) : null;
  const [sheet, setSheet] = useState<Sheet>(null);
  const [draftGender, setDraftGender] = useState<Gender | null>(null);
  const [draftBirthYear, setDraftBirthYear] = useState<number | null>(null);
  const [logoutError, setLogoutError] = useState("");
  const [logoutPending, setLogoutPending] = useState(false);
  const logoutRef = useRef(false);
  const auth = useSession();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { blocked } = useModerationState();
  const years = getBirthYears();
  async function load() {
    setLoadError(false);
    try {
      setAccount(await getAccount());
    } catch {
      setLoadError(true);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const openSheet = (next: Exclude<Sheet, null>) => {
    if (!account || savingRef.current) return;
    if (sheet === null) {
      setDraftGender(gender);
      setDraftBirthYear(birthYear);
    }
    setSaveError("");
    setSheet(next);
  };
  const finishSheet = async () => {
    if (!account || !sheet || savingRef.current) return;
    if (sheet === "gender" && !draftGender) return;
    if (sheet === "birth" && !draftBirthYear) return;
    if (!draftGender || !draftBirthYear) {
      setSheet(draftGender ? "birth" : "gender");
      return;
    }
    if (draftGender === gender && draftBirthYear === birthYear) {
      setSheet(null);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    const body = {
      email: account.email,
      gender: draftGender,
      birthYear: String(draftBirthYear),
    };
    try {
      await updateAccount(body);
      setAccount({ ...account, ...body });
      setSheet(null);
    } catch {
      setSaveError("계정 정보를 저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
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
    loading: !account && !loadError,
    loadError,
    retry: load,
    saving,
    saveError,
    linkedProviders: account
      ? [
          account.provider,
          ...account.linkedAccounts.map(({ provider }) => provider),
        ]
      : null,
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
    closeSheet: () => {
      if (!savingRef.current) setSheet(null);
    },
    openLogout: () => setLogoutOpen(true),
    closeLogout: () => setLogoutOpen(false),
    goBack: () =>
      router.canGoBack() ? router.back() : router.replace("/home"),
    openDelete: () => router.push("/account-delete"),
  };
}
