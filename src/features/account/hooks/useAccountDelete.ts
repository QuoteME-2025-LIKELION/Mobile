import { useState } from "react";
import { router } from "expo-router";
import type { DeleteReason } from "../constants/accountOptions";

export function useAccountDelete() {
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
  return {
    selectedReasons,
    otherReason,
    setOtherReason,
    otherSelected,
    validReasons,
    toggleReason,
    goBack: () =>
      router.canGoBack() ? router.back() : router.replace("/account-setting"),
    // 실제 계정 삭제 없이 완료 화면을 점검하는 개발 전용 진입.
    previewComplete: () => {
      if (__DEV__) router.push("/account-delete-complete");
    },
  };
}
