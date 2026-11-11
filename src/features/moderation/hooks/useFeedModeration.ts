import { useState } from "react";
import {
  blockFixtureMember,
  type ModerationMember,
} from "../stores/moderationStore";
export type ModerationTarget = ModerationMember & {
  quoteId?: number;
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
    if (blockFixtureMember(dialog.target))
      setToast(dialog.kind === "report" ? "신고가 접수됐어요" : "차단했어요.");
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
