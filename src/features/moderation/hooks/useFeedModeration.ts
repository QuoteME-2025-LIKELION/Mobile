import { useState } from "react";
export type ModerationTarget = {
  memberId?: number;
  quoteId?: number;
  nickname: string;
  introduction?: string;
  content: string | null;
  isAiGenerated?: boolean;
};
export type MenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export function useFeedModeration() {
  const [menu, setMenu] = useState<{
    target: ModerationTarget;
    anchor: MenuAnchor;
  } | null>(null);
  const [dialog, setDialog] = useState<{
    kind: "report" | "block";
    target: ModerationTarget;
  } | null>(null);
  const [toast, setToast] = useState("");
  const choose = (kind: "report" | "block") => {
    if (!menu || (kind === "report" && menu.target.content === null)) return;
    setDialog({ kind, target: menu.target });
    setMenu(null);
  };
  const confirm = () => {
    if (!dialog || !__DEV__) return;
    setToast(
      dialog.kind === "report"
        ? "신고 기능을 준비 중이에요."
        : "차단 기능을 준비 중이에요."
    );
    setDialog(null);
  };
  return {
    menu,
    dialog,
    toast,
    choose,
    confirm,
    openMenu: (target: ModerationTarget, anchor: MenuAnchor) => {
      if (__DEV__) setMenu({ target, anchor });
    },
    closeMenu: () => setMenu(null),
    closeDialog: () => setDialog(null),
    closeToast: () => setToast(""),
  };
}
