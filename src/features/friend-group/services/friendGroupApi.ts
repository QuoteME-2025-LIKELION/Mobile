import { session } from "@/features/auth/services/session";

export type Member = {
  id: number;
  nickname: string;
  introduction?: string | null;
  profileImage?: string | null;
};

export type Group = {
  id: number;
  name: string;
  motto?: string | null;
  memberCount: number;
};

export type GroupDetail = Group & {
  leaderNickname: string;
  totalQuoteCount: number;
  members: Member[];
};

export type FriendRequest = {
  requestId: number;
  direction?: "SENT" | "RECEIVED";
  senderNickname: string;
  senderIntroduction?: string | null;
  senderProfileImage?: string | null;
  receiverId?: number;
  receiverNickname?: string;
  receiverIntroduction?: string | null;
  receiverProfileImage?: string | null;
};

export type GroupRequest = { requestId: number; groupName: string };
export type GroupInvitation = GroupRequest & { inviterNickname: string };

const get = <T>(path: string, signal: AbortSignal) =>
  session.request<T>(path, { signal });

const change = (path: string, method: "POST" | "DELETE", body?: unknown) =>
  session.request(path, { method, body, ignoreResponseBody: true });

export const friendGroupApi = {
  async lists(signal: AbortSignal) {
    const [members, groups] = await Promise.all([
      get<Member[]>("/api/settings/friends-list", signal),
      get<Group[]>("/api/groups/me", signal),
    ]);
    return { members, groups };
  },
  async requests(signal: AbortSignal) {
    const [friends, invitations, sentGroups] = await Promise.all([
      get<FriendRequest[]>("/api/friends/requests", signal),
      get<GroupInvitation[]>("/api/groups/invitations", signal),
      get<GroupRequest[]>("/api/groups/join-requests/sent", signal),
    ]);
    return { friends, invitations, sentGroups };
  },
  search(keyword: string, signal: AbortSignal) {
    const encoded = encodeURIComponent(keyword).replace(/\./g, "%2E");
    return get<{ members: Member[]; groups: Group[] }>(
      `/api/settings/search?keyword=${encoded}`,
      signal
    );
  },
  detail: (id: number, signal: AbortSignal) =>
    get<GroupDetail>(`/api/groups/${id}`, signal),
  sendFriend: (id: number) => change(`/api/friends/request/${id}`, "POST"),
  cancelFriend: (id: number) => change(`/api/friends/request/${id}`, "DELETE"),
  respondFriend: (id: number, answer: "accept" | "reject") =>
    change(`/api/friends/requests/${id}/${answer}`, "POST"),
  deleteFriend: (id: number) => change(`/api/friends/${id}`, "DELETE"),
  joinGroup: (id: number) => change(`/api/groups/${id}/join-request`, "POST"),
  cancelJoin: (id: number) =>
    change(`/api/groups/join-requests/${id}`, "DELETE"),
  respondInvitation: (id: number, answer: "accept" | "reject") =>
    change(`/api/groups/invitations/${id}/${answer}`, "POST"),
  createGroup: (name: string, motto: string) =>
    change("/api/groups", "POST", { name, motto }),
};
