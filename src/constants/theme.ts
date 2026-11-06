// Frontend/src/styles/theme.ts와 같은 색상·서체를 사용한다.
export const colors = {
  primary: '#143858',
  background: '#e9eaec',
  white: '#ffffff',
  black: '#000000',
  border: '#c3c5c9',
  muted: '#575c67',
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
