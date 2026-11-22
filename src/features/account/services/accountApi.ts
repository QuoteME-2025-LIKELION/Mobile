import { session } from "@/features/auth/services/session";
import type { Gender } from "../constants/accountOptions";

type AccountInfo = {
  email: string;
  birthYear: string | null;
  gender: Gender | null;
  provider: string | null;
  linkedAccounts: { provider: string }[];
};

export const getAccount = () =>
  session.request<AccountInfo>("/api/profile/account");

export const updateAccount = (body: {
  email: string;
  birthYear: string;
  gender: Gender;
}) =>
  session.request<void>("/api/profile/account", {
    method: "PUT",
    body,
    ignoreResponseBody: true,
  });
