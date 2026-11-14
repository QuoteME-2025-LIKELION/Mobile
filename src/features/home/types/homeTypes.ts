export type FeedItem = {
  id: number;
  memberId?: number;
  nickname: string;
  introduction?: string;
  profileImage?: string;
  content: string | null;
  tags: string[];
  timeAgo?: string;
  isAiGenerated?: boolean;
};
export type FeedGroup = { id: number; name: string };
export type MyQuote = {
  id: number;
  content: string;
  nickname: string;
  birthYear: string | null;
  tags: string[];
};
export type MyProfile = {
  id: number;
  nickname: string;
  introduction: string;
  profileImage: string | null;
  profileCompleted: boolean;
};
export type HomeData = {
  profile: MyProfile;
  groups: FeedGroup[];
  myQuote: MyQuote | null;
  items: FeedItem[];
  unreadCount: number | null;
};
