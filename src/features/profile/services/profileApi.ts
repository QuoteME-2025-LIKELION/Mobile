import { File } from "expo-file-system";
import { session } from "@/features/auth/services/session";
import type { ProfileImage } from "../utils/profileInput";

export type Profile = {
  id: number;
  nickname: string;
  introduction: string | null;
  profileImage: string | null;
  profileCompleted: boolean;
};

export const setupProfile = (body: {
  nickname: string;
  introduction: string;
  birthYear: string;
}) => session.request<Profile>("/api/profile/setup", { method: "PUT", body });

export const getProfile = () => session.request<Profile>("/api/profile");

export function updateProfile(
  data: { nickname?: string; introduction?: string; profileImage?: "" },
  image?: ProfileImage
) {
  const multipart = new FormData();
  multipart.append(
    "data",
    new Blob([JSON.stringify(data)], { type: "application/json" })
  );
  if (image) appendImage(multipart, image);
  return session.request<Profile>("/api/profile", { method: "PUT", multipart });
}

export function uploadProfileImage(image: ProfileImage) {
  const multipart = new FormData();
  appendImage(multipart, image);
  return session.request<Profile>("/api/profile", { method: "PUT", multipart });
}

function appendImage(multipart: FormData, image: ProfileImage) {
  multipart.append("image", image.file ?? new File(image.uri));
}
