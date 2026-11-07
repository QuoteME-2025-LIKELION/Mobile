import { Redirect } from 'expo-router';

import { WritePreview } from '@/features/write/WritePreview';

export default function WriteScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <WritePreview />;
}
