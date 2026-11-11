import type { ProfileImage } from "../utils/profileInput";

export async function pickProfileImage(): Promise<ProfileImage | null> {
  // 기존 개발 앱에서도 입력 화면은 열 수 있도록 네이티브 모듈은 선택 시 로드한다.
  const picker = await import("expo-image-picker");
  const result = await picker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    allowsMultipleSelection: false,
    quality: 1,
  });
  return result.canceled ? null : (result.assets[0] ?? null);
}
