export const GENDER_OPTIONS = [
  { value: 'FEMALE', label: '여성' },
  { value: 'MALE', label: '남성' },
  { value: 'ETC', label: '선택 안 함' },
] as const;
export type Gender = (typeof GENDER_OPTIONS)[number]['value'];
export const MIN_BIRTH_YEAR = 1900;
export function getBirthYears(currentYear = new Date().getFullYear()) {
  return Array.from(
    { length: currentYear - MIN_BIRTH_YEAR + 1 },
    (_, index) => currentYear - index,
  );
}
export const DELETE_REASONS = [
  '더이상 사용하지 않아서',
  '사용이 불편해서',
  '알림이 불필요하게 많아서',
  '비슷한 앱을 찾아서',
  '기타',
] as const;
export type DeleteReason = (typeof DELETE_REASONS)[number];
