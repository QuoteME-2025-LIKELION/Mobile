import { ApiError } from "@/api/createApiClient";
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
  createdAt: string;
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

export type GroupRequest = {
  requestId: number;
  groupId: number;
  groupName: string;
};
export type GroupInvitation = GroupRequest & { inviterNickname: string };

export type GroupManagedRequest = {
  requestId: number;
  requesterId: number;
  requesterNickname: string;
  requesterProfileImage?: string | null;
  requesterIntroduction?: string | null;
};

const get = <T>(path: string, signal?: AbortSignal) =>
  session.request<T>(path, { signal });

const change = (
  path: string,
  method: "POST" | "DELETE" | "PATCH",
  body?: unknown
) => session.request(path, { method, body, ignoreResponseBody: true });

async function getLeaderRequests(path: string, signal: AbortSignal) {
  try {
    return await get<GroupManagedRequest[]>(path, signal);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return null;
    throw error;
  }
}

export const JOIN_REQUEST_PENDING_MESSAGE = "이미 가입 요청 중인 그룹입니다.";

export function getJoinRequestErrorMessage(error: unknown) {
  return error instanceof ApiError &&
    error.status === 400 &&
    error.code === "400-4"
    ? JOIN_REQUEST_PENDING_MESSAGE
    : "그룹 가입 요청에 실패했습니다.";
}

export const friendGroupApi = {
  friends: (signal: AbortSignal) =>
    get<Member[]>("/api/settings/friends-list", signal),
  async lists(signal: AbortSignal) {
    const [members, groups] = await Promise.all([
      get<Member[]>("/api/settings/friends-list", signal),
      get<Group[]>("/api/groups/me", signal),
    ]);
    return { members, groups };
  },
  friendRequests: (signal: AbortSignal) =>
    get<FriendRequest[]>("/api/friends/requests", signal),
  groupInvitations: (signal: AbortSignal) =>
    get<GroupInvitation[]>("/api/groups/invitations", signal),
  sentJoinRequests: (signal: AbortSignal) =>
    get<GroupRequest[]>("/api/groups/join-requests/sent", signal),
  search(keyword: string, signal?: AbortSignal) {
    const encoded = encodeURIComponent(keyword).replace(/\./g, "%2E");
    return get<{ members: Member[]; groups: Group[] }>(
      `/api/settings/search?keyword=${encoded}`,
      signal
    );
  },
  detail: (id: number, signal: AbortSignal) =>
    get<GroupDetail>(`/api/groups/${id}`, signal),
  groupJoinRequests: (id: number, signal: AbortSignal) =>
    getLeaderRequests(`/api/groups/${id}/join-requests`, signal),
  groupSentInvitations: (id: number, signal: AbortSignal) =>
    getLeaderRequests(`/api/groups/${id}/invitations/sent`, signal),
  respondGroupJoin: (requestId: number, answer: "accept" | "reject") =>
    change(`/api/groups/join-requests/${requestId}/${answer}`, "POST"),
  cancelGroupInvitation: (id: number, requestId: number) =>
    change(`/api/groups/${id}/invitations/${requestId}`, "DELETE"),
  updateGroupMotto: (id: number, motto: string) =>
    change(`/api/groups/${id}/motto`, "PATCH", { motto }),
  removeGroupMember: (id: number, memberId: number) =>
    change(`/api/groups/${id}/members/${memberId}`, "DELETE"),
  deleteGroup: (id: number) => change(`/api/groups/${id}`, "DELETE"),
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
    session.request<Group>("/api/groups", {
      method: "POST",
      body: { name, motto },
    }),
  inviteMember: (groupId: number, memberId: number) =>
    change(`/api/groups/${groupId}/invite/${memberId}`, "POST"),
};
