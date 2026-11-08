import { Redirect } from 'expo-router';

import { ProfileSetupPreview } from '@/features/profile/ProfileSetupPreview';

export default function ProfileScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ProfileSetupPreview />;
}
