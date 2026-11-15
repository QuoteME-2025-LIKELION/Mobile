import { useState } from "react";
import { useSession } from "../stores/useSession";
export function useStart() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [testLoginOpen, setTestLoginOpen] = useState(false);
  const { busy } = useSession();
  return {
    loginOpen,
    openLogin: () => setLoginOpen(true),
    closeLogin: () => setLoginOpen(false),
    testLoginOpen,
    openTestLogin: () => {
      if (__DEV__ && !busy) setTestLoginOpen(true);
    },
    closeTestLogin: () => {
      if (!busy) setTestLoginOpen(false);
    },
  };
}
