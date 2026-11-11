import { Redirect } from 'expo-router';

import { ArchivePreview } from '@/features/archive/ArchivePreview';

export default function ArchiveScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ArchivePreview />;
}
