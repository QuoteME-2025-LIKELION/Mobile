// 웹 Frontend/src/styles/theme.ts의 색상 키와 값을 동일하게 유지한다.
export const colors = {
  primary: '#143858',
  secondary: '#e9eaec',
  territory: '#959595',
  red: '#de1c1c',
  'grey-00': '#fafafa',
  'grey-50': '#e9eaec',
  'grey-100': '#dadbde',
  'grey-200': '#c3c5c9',
  'grey-300': '#abaeb5',
  'grey-400': '#9599a1',
  'grey-500': '#7d828c',
  'grey-600': '#71757f',
  'grey-700': '#575c67',
  'grey-800': '#444954',
  'grey-900': '#323740',
  'grey-950': '#21242b',
  'indigo-50': '#edf2f7',
  'indigo-100': '#cedae5',
  'indigo-200': '#aec2d4',
  'indigo-300': '#8cabc6',
  'indigo-400': '#6a93b7',
  'indigo-500': '#4a7ba6',
  'indigo-600': '#396b96',
  'indigo-700': '#2c5a83',
  'indigo-800': '#20496d',
  'indigo-900': '#143858',
  'indigo-950': '#0d283f',
  'red-50': '#f9ebed',
  'red-100': '#efc4c9',
  'red-200': '#e79ca4',
  'red-300': '#e0727f',
  'red-400': '#da4657',
  'red-500': '#cc2438',
  'red-600': '#b6192b',
  'red-700': '#9f1020',
  'red-800': '#850917',
  'red-900': '#6a030f',
  'red-950': '#4d0009',
  white: '#ffffff',
  black: '#000000',
} as const;

/** 6자리 HEX 테마색에 투명도를 더한다. */
export function withOpacity(color: `#${string}`, opacity: number): string {
  const rgb = Number.parseInt(color.slice(1), 16);
  return `rgba(${(rgb >> 16) & 255},${(rgb >> 8) & 255},${rgb & 255},${opacity})`;
}

// 웹 팔레트에 없는 제공자 브랜드 색상과 로그인 시트 배경은 별도로 관리한다.
export const brandColors = {
  google: '#F2F2F2',
  kakao: '#FEE500',
} as const;
export const overlays = {
  loginBackdrop: 'rgba(12,31,49,0.28)',
} as const;

export const fonts = {
  body: 'Pretendard',
  quote: 'KoPubWorldBatang-Medium',
  date: 'HSBombaram',
} as const;

// 기존 개발 앱에서도 사용할 수 있도록 config plugin 대신 런타임에 로드한다.
export const fontSources = {
  [fonts.body]: require('@/assets/fonts/PretendardVariable.ttf'),
  [fonts.quote]: require('@/assets/fonts/KoPubWorld-Batang-Medium.ttf'),
  [fonts.date]: require('@/assets/fonts/HSBombaram5.0-Bold.ttf'),
};
