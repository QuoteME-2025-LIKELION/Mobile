import { Redirect } from 'expo-router';

import { ProfileCenterPreview } from '@/features/profile/ProfileCenterPreview';

export default function ProfileCenterScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ProfileCenterPreview />;
}
