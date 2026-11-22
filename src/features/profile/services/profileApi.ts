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
  const json = JSON.stringify(data);
  // React Native sends string parts as text/plain unless a part header is set.
  const native = multipart as FormData & {
    getParts?: () => { fieldName: string; headers: Record<string, string> }[];
  };
  if (native.getParts) {
    const getParts = native.getParts.bind(native);
    native.getParts = () =>
      getParts().map((part) => {
        if (part.fieldName === "data")
          part.headers["content-type"] = "application/json";
        return part;
      });
    multipart.append("data", json);
  } else {
    multipart.append("data", new Blob([json], { type: "application/json" }));
  }
  if (image) appendImage(multipart, image);
  return session.request<Profile>("/api/profile", { method: "PUT", multipart });
}

export function uploadProfileImage(image: ProfileImage) {
  const multipart = new FormData();
  appendImage(multipart, image);
  return session.request<Profile>("/api/profile", { method: "PUT", multipart });
}

function appendImage(multipart: FormData, image: ProfileImage) {
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
}
