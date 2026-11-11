import { Redirect } from 'expo-router';
import { AccountSettingsScreen } from '@/features/account/screens/AccountSettingsScreen';
export default function AccountRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <AccountSettingsScreen />;
}
