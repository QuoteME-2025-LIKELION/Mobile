import { useRef, useState } from "react";
import { router, usePreventRemove } from "expo-router";
import { session } from "@/features/auth/services/session";
import type { DeleteReason } from "../constants/accountOptions";

export function useAccountDelete() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submitting = useRef(false);
  usePreventRemove(pending, () => {});
  const [selectedReasons, setSelectedReasons] = useState<DeleteReason[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const otherSelected = selectedReasons.includes("기타");
  const validReasons =
    selectedReasons.length > 0 &&
    (!otherSelected || otherReason.trim().length > 0);
  const toggleReason = (reason: DeleteReason) =>
    setSelectedReasons((current) =>
      current.includes(reason)
        ? current.filter((item) => item !== reason)
        : [...current, reason]
    );
  const confirmDelete = async () => {
    if (!validReasons || submitting.current) return;
    submitting.current = true;
    setConfirmOpen(false);
    setPending(true);
    setError("");
    try {
      await session.deleteAccount();
    } catch {
      setError("계정을 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };
  return {
    pending,
    error,
    confirmOpen,
    openConfirm: () => {
      if (validReasons && !submitting.current) setConfirmOpen(true);
    },
    closeConfirm: () => setConfirmOpen(false),
    confirmDelete,
    selectedReasons,
    otherReason,
    setOtherReason,
    otherSelected,
    validReasons,
    toggleReason,
    goBack: () => {
      if (submitting.current) return;
      if (router.canGoBack()) router.back();
      else router.replace("/account-setting");
    },
  };
}
