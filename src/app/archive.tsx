import { Redirect } from 'expo-router';

import { ArchiveScreen } from '@/features/archive/screens/ArchiveScreen';

export default function ArchiveRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ArchiveScreen />;
}
