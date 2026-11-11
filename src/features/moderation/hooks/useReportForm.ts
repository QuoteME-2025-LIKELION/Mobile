import { useState } from "react";
import { REPORT_REASONS, type ReportReason } from "../constants/reportReasons";
export function useReportForm(isAiGenerated: boolean, onSubmit: () => void) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const reasons = REPORT_REASONS.filter(
    (item) => item.id !== "ai" || isAiGenerated
  );
  const canSubmit =
    reason !== null &&
    reasons.some((item) => item.id === reason) &&
    (reason !== "other" || details.trim().length > 0);
  return {
    reason,
    details,
    setDetails,
    reasons,
    canSubmit,
    select: (value: ReportReason) =>
      setReason((current) => (current === value ? null : value)),
    submit: () => {
      if (canSubmit) onSubmit();
    },
  };
}
