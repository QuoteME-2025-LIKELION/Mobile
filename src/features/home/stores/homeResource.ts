import { session } from "@/features/auth/services/session";
import { createHomeResource } from "../services/createHomeResource";
export const homeResource = createHomeResource(session.request);
let memberId: number | null = null;
session.subscribe(() => {
  const auth = session.getSnapshot();
  const next =
    auth.status === "authenticated" ? (auth.member?.id ?? null) : null;
  if (next !== memberId || next === null) homeResource.reset();
  memberId = next;
});
