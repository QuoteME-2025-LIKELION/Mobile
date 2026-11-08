export const limitProfileText = (value: string, limit: number) => Array.from(value).slice(0, limit).join('');
export const sanitizeBirthYear = (value: string) => value.replace(/\D/g, '').slice(0, 4);
export const isValidBirthYear = (value: string, currentYear = new Date().getFullYear()) =>
  /^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= currentYear;

export type ProfileImage = { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number };

// 웹의 형식/5MB 검사를 재사용한다. 모바일은 크기 정보가 없으면 확인 불가로 처리한다.
export function validateProfileImage(image: ProfileImage): string | null {
  const allowed = image.mimeType
    ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'].includes(image.mimeType.toLowerCase())
    : /\.(jpe?g|png|webp|gif|heic)$/i.test(image.fileName ?? '');
  if (!allowed) return '이미지는 JPEG, PNG, WebP, GIF, HEIC 형식만 선택할 수 있어요.';
  if (image.fileSize === undefined || !Number.isFinite(image.fileSize) || image.fileSize <= 0) {
    return '이미지 크기를 확인하지 못했어요. 다른 이미지를 선택해 주세요.';
  }
  if (image.fileSize > 5 * 1024 * 1024) return '이미지는 5MB 이하로 선택해 주세요.';
  return null;
}
