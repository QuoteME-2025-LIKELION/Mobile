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

export function uploadProfileImage(image: ProfileImage) {
  const multipart = new FormData();
  const extension = image.fileName?.split(".").pop()?.toLowerCase();
  const type =
    image.mimeType ??
    (extension && extension !== "jpg" && extension !== "jpeg"
      ? `image/${extension}`
      : "image/jpeg");
  const file = {
    uri: image.uri,
    name: image.fileName ?? `profile.${type.split("/")[1]}`,
    type,
  };
  // React Native FormData accepts a native file descriptor.
  multipart.append("image", file as unknown as Blob);
  return session.request<Profile>("/api/profile", { method: "PUT", multipart });
}
